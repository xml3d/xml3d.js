
require("whatwg-fetch");
var URI = require("../utils/uri.js").URI;
var Options = require("../utils/options.js");

//var OPTION_RESOURCE_CORS = "resource-crossorigin-attribute";
//Options.register(OPTION_RESOURCE_CORS, "anonymous");

var c_requestHooks = [];

var RequestAbortedException = function(url) {
    this.message = "Request was aborted.";
    this.url = url;
    this.toString = function() {
        return "Failed to load "+url+": "+this.message;
    }
};

var Resource = {};
Resource.fetch = function(uri, opt) {
    opt = initOptions(opt);

    var result = new Promise(function(resolve, reject) {
        for (var i=0; i < c_requestHooks.length; i++) {
            var hook = c_requestHooks[i];
            if (uri.match(hook.pattern)) {
                hook.callback(uri, opt);
            }
        }

        if (opt.abort) {
            reject(new RequestAbortedException(uri));
            return;
        }

        fetch(uri, opt)
        .then(function(response) {
            resolve(response);
        }).catch(function (exception) {
            XML3D.debug.logError("Could not retrieve document at '"+uri.toString()+"'. Reason: "+exception);
            reject(exception);
        });
    });

    return result;
};

Resource.onRequest = function(pattern, callback) {
    var hook = {
        pattern : pattern,
        callback : callback
    };
    c_requestHooks.push(hook);
};



var initOptions = function(opt) {
    opt = opt || {};
    opt.headers = opt.headers || {};
    return opt;
};

// Add a hook to check for file:// requests to warn the user that a server is needed to use XML3D
Resource.onRequest(/(file:)\/+([A-Z]:\/)/, function(url, opt) {
    XML3D.debug.logError("Encountered a filesystem request: '"+url+"'. A local server is needed to use XML3D. More " +
        "information can be found at https://github.com/xml3d/xml3d.js/issues/162");
    opt.abort = true;
});

module.exports = Resource;
