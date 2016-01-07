
require("whatwg-fetch");
var URI = require("../utils/uri.js").URI;
var Options = require("../utils/options.js");

var MAX_CONCURRENT_REQUESTS = 100;  // Maximum number of requests awaiting a response

var c_requestHooks = [];    // Request hooks called for each outgoing request
var c_formatHandlers = [];  // All registered FormatHandler plugins
var c_requestQueue = [];    // Requests that haven't been sent out yet
var c_openRequests = 0;     // Number of requests that are currently waiting on a response
var c_cachedDocuments = new Map(); // Already received and processed resources, indexed by URL without the fragment

var Resource = {};

Resource.registerFormatHandler = function(formatHandler) {
    if (formatHandler)
        c_formatHandlers.push(formatHandler);
};

Resource.fetch = function(uriString, opt) {
    opt = initOptions(opt);
    var uri = new URI(uriString);

    return new Promise(function(resolve, reject) {
        for (var i=0; i < c_requestHooks.length; i++) {
            c_requestHooks[i](uri, opt);
        }
        if (opt.abort) {
            throw new RequestAbortedException(uri);
        }
        scheduleRequest({
            opt : opt,
            uri : uri,
            resolve : resolve,
            reject : reject
        });
    });
};

var popRequestQueue = function() {
    var request = c_requestQueue.shift();
    c_openRequests++;

    fetch(request.uri.toString(), request.opt)
        .then(function(response) {
            c_openRequests--;
            request.resolve(response);
        }).catch(function (exception) {
            XML3D.debug.logError("Could not retrieve document at '"+request.uri.toString()+"'. Reason: "+exception);
            c_openRequests--;
            request.reject(exception);
        });
};

Resource.getDocument = function(urlString, opt) {
    return Resource.fetch(urlString, opt)
        .then(function(response) {
            if (!response.ok) {
                throw new RequestFailedException(response);
            }
            response.originalURL = urlString;
            var cache;
            if (cache = c_cachedDocuments.get(urlString)) {
                return cache.pending ? cache.pending : cache.document;
            } else {
                cache = { fragments : [] };
                c_cachedDocuments.set(urlString, cache); // Resource.parseResponse expects this entry to exist already
                cache.pending = Resource.parseResponse(response);
                return cache.pending;
            }
        }).then(function(doc) {
            doc._documentURL = urlString;
            var cache = c_cachedDocuments.get(urlString);
            cache.document = doc;
            delete cache.pending;
            return doc;
        }).catch(function(exception) {
            c_cachedDocuments.has(urlString) && delete c_cachedDocuments.get(urlString).pending;
            throw exception;
        });
};

Resource.parseResponse = function(response) {
    return new Promise(function(resolve, reject) {
        var handlerCandidates = c_formatHandlers.filter(function(handler) {
            return handler.isFormatSupported(response);
        });

        if (response.bodyUsed) {
            XML3D.debug.logError("FormatHandlers should not access the response body in the isFormatSupported function without first cloning the response object!");
            reject(new ResponseBodyUsedException(response));
        }

        if (handlerCandidates.length == 1) {
            //Special case to avoid unnecessary cloning of the response
            handlerCandidates[0].getFormatData(response).then(function(doc) {
                c_cachedDocuments.get(response.originalURL).handler = handlerCandidates[0];
                resolve(doc);
            });
        } else {
            tryFormatHandlers(handlerCandidates, response, function(fh, doc) {
                c_cachedDocuments.get(response.originalURL).handler = fh;
                resolve(doc);
            });
        }
    })
};

function tryFormatHandlers(candidates, response, callback) {
    (function tryNextHandler(index) {
        if (index >= candidates.length) {
            // Reached the end of the array
            throw new TypeError("No FormatHandler could be found for the document "+response.url);
        }
        var fh = candidates[index];
        fh.getFormatData(response.clone()).then(function(doc) {
            callback(fh, doc);
        }).catch(function(e) {
            tryNextHandler(++index);
        })
    })(0);
}

Resource.onRequest = function(callback) {
    c_requestHooks.push(callback);
};

var scheduleRequest = function(obj) {
    if (!c_requestQueue.length) {
        // The request queue was empty before so we're waking up from an idle state
        window.requestAnimationFrame(tickWorkWindow);
    }
    c_requestQueue.push(obj);
    if (obj.opt.priority > 0) {
        // 0 is lowest priority so pushing it to the back is enough, for all other priorities we should to resort the array
        c_requestQueue.sort(prioritySort);
    }
};

var prioritySort = function(a, b) {
    return b.opt.priority - a.opt.priority; //Sort descending, higher priority first
};

var tickWorkWindow = function() {
    // Both of these loops trigger asynchronous work through Promises so working through all queue items shouldn't block the thread for too long
    while (c_requestQueue.length > 0 && c_openRequests < MAX_CONCURRENT_REQUESTS) {
        popRequestQueue();
    }

    if (c_requestQueue.length) {
        // If there's more work to do schedule another call, otherwise idle until more work arrives in the scheduleWork function
        window.requestAnimationFrame(tickWorkWindow);
    }
};

var initOptions = function(opt) {
    opt = opt || {};
    opt.headers = opt.headers || {};
    opt.priority = opt.priority || 0;
    opt.abort = opt.abort || false;
    return opt;
};

// Add a hook to check for file:// requests to warn the user that a server is needed to use XML3D
Resource.onRequest(function(uri, opt) {
    if (uri.toString().match(/(file:)\/+([A-z]:\/)/)) {
        XML3D.debug.logIssue("Encountered a filesystem request: '" + uri + "'. A local server is needed to use XML3D.", 162);
        opt.abort = true;
    }
});


/**
 * This methods returns an absolute URI compatible with the resource manager.
 * This means: Any reference from an external document will be absolute and any id reference from the current
 * document will remain an id reference.
 * @param {String} baseURI - the base URI that the uri is relative to
 * @param {URI} uri - The URI used to find the referred AdapterHandle. Can be relative
 * @returns {URI} The (sometimes) absolute URI
 */
Resource.getAbsoluteURI = function(baseURI, uri){
    if (!uri)
        return null;

    if (typeof uri == "string") uri = new URI(uri);
    if (baseURI != document.URL || !uri.isLocal()) {
        uri = uri.getAbsoluteURI(baseURI);
    }
    return uri;
};

Resource.getDocumentCache = function(urlString) {
    return c_cachedDocuments.get(urlString);
};


function RequestAbortedException(url) {
    this.name = "RequestAbortedException";
    this.message = "Request was aborted by an onRequest listener: "+url;
    this.url = url;
    this.stack = (new Error()).stack;
}
RequestAbortedException.prototype = Object.create(Error.prototype);
RequestAbortedException.prototype.constructor = RequestAbortedException;

function ResponseBodyUsedException(response) {
    this.name = "ResponseBodyUsedException";
    this.message = "The body of the Response was read prematurely.";
    this.response = response;
    this.stack = (new Error()).stack;
}
ResponseBodyUsedException.prototype = Object.create(Error.prototype);
ResponseBodyUsedException.prototype.constructor = ResponseBodyUsedException;

function RequestFailedException(response) {
    this.name = "RequestFailedException";
    this.message = "The request failed with status code "+response.status;
    this.response = response;
    this.stack = (new Error()).stack;
}
RequestFailedException.prototype = Object.create(Error.prototype);
RequestFailedException.prototype.constructor = RequestFailedException;


module.exports = Resource;

