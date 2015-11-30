
require("whatwg-fetch");
var URI = require("../utils/uri.js").URI;
var Options = require("../utils/options.js");

//var OPTION_RESOURCE_CORS = "resource-crossorigin-attribute";
//Options.register(OPTION_RESOURCE_CORS, "anonymous");

var MAX_CONCURRENT_REQUESTS = 100;  // Maximum number of requests awaiting a response

var c_requestHooks = [];    // Request hooks called for each outgoing request
var c_formatHandlers = [];  // All registered FormatHandler plugins
var c_requestQueue = [];    // Requests that haven't been sent out yet
var c_openRequests = 0;     // Number of requests that are currently waiting on a response
window.c_cachedDocuments = {}; //TODO: Currently global during refactoring, make local when ResourceManager is refactored

var RequestAbortedException = function(url) {
    this.message = "Request was aborted.";
    this.url = url;
    this.toString = function() {
        return "Failed to load "+this.url+": "+this.message;
    }
};

var ResponseBodyUsedException = function(response) {
    this.message = "The body of the Response was read prematurely.";
    this.url = response.url;
    this.toString = function() {
        return "Failed to process "+this.url+": "+this.message;
    }
};

var RequestFailedException = function(response) {
    this.message = "The request failed with status code "+response.status;
    this.response = response;
    this.toString = function() {
        return this.message;
    }
};

var registerFormat = function(formatHandler) {
    if (formatHandler)
        c_formatHandlers.push(formatHandler);
};

var Resource = {};
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
            reject : reject,
            timestamp : Date.now()
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
    return new Promise(function(resolve, reject) {
        Resource.fetch(urlString, opt)
            .then(function(response) {
                if (!response.ok) {
                    throw new RequestFailedException(response);
                }
                response.originalURL = urlString;
                var cache;
                if (cache = c_cachedDocuments[urlString]) {
                    return cache.pending ? cache.pending : cache.document;
                } else {
                    cache = c_cachedDocuments[urlString] = { fragments : [] };
                    cache.pending = Resource.parseResponse(response);
                    return cache.pending;
                }
            }).then(function(doc) {
                doc._documentURL = urlString;
                var cache = c_cachedDocuments[urlString];
                cache.document = doc;
                delete cache.pending;
                resolve(doc);
            }).catch(function(exception) {
                c_cachedDocuments[urlString] && delete c_cachedDocuments[urlString].pending;
                reject(exception);
            });

    });
};

Resource.parseResponse = function(response) {
    return new Promise(function(resolve, reject) {
        for (var ind in c_formatHandlers) {
            var fh = c_formatHandlers[ind];
            var isSupported = fh.isFormatSupported(response);

            if (response.bodyUsed) {
                XML3D.debug.logError("FormatHandlers should not access the response body in the isFormatSupported function without first cloning the response object!");
                reject(ResponseBodyUsedException(response));
            }

            if (isSupported) {
                c_cachedDocuments[response.originalURL].handler = fh;
                fh.getFormatData(response, resolve);
                break;
            }
        }
    })
};

Resource.onRequest = function(callback) {
    c_requestHooks.push(callback);
};

var scheduleRequest = function(obj) {
    if (!c_requestQueue.length) {
        // The request queue was empty before so we're waking up from an idle state
        window.requestAnimationFrame(tickWorkWindow);
    }
    c_requestQueue.push(obj);
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
    return opt;
};

// Add a hook to check for file:// requests to warn the user that a server is needed to use XML3D
Resource.onRequest(function(uri, opt) {
    if (uri.toString().match(/(file:)\/+([A-z]:\/)/)) {
        XML3D.debug.logError("Encountered a filesystem request: '" + uri + "'. A local server is needed to use XML3D. More " +
            "information can be found at https://github.com/xml3d/xml3d.js/issues/162");
        opt.abort = true;
    }
});

module.exports = {
    Resource : Resource,
    registerFormat: registerFormat
};
