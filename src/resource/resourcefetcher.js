
require("whatwg-fetch");
var URI = require("../utils/uri.js").URI;
var Options = require("../utils/options.js");

//var OPTION_RESOURCE_CORS = "resource-crossorigin-attribute";
//Options.register(OPTION_RESOURCE_CORS, "anonymous");

var c_requestHooks = [];
var c_formatHandlers = [];
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

        fetch(uri.toString(), opt)
            .then(function(response) {
                resolve(response);
            }).catch(function (exception) {
                XML3D.debug.logError("Could not retrieve document at '"+uri.toString()+"'. Reason: "+exception);
                reject(exception);
            });
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
                if (c_cachedDocuments[urlString] && c_cachedDocuments[urlString].document) { //TODO: better handling of concurrent requests to same document before parsing is done
                    resolve(c_cachedDocuments[urlString].document);
                } else {
                    c_cachedDocuments[urlString] = { fragments : [] };
                    return Resource.parseResponse(response);
                }
            })
            .then(function(doc) {
                doc._documentURL = urlString;
                c_cachedDocuments[urlString].document = doc;
                resolve(doc);
            }).catch(function(exception) {
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
                XML3D.debug.logError("FormatHandlers should not access the response body in the isFormatSupported function!");
                throw new ResponseBodyUsedException(response);
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
