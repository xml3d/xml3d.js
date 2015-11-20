
require("whatwg-fetch");
var URI = require("../utils/uri.js").URI;
var Options = require("../utils/options.js");

//var OPTION_RESOURCE_CORS = "resource-crossorigin-attribute";
//Options.register(OPTION_RESOURCE_CORS, "anonymous");

var c_requestHooks = [];

var Resource = {};

Resource.fetch = function(uri, opt) {
    opt = initOptions(opt);

    for (var i=0; i < c_requestHooks.length; i++) {
        var hook = c_requestHooks[i];
        if (uri.match(hook.pattern)) {
            hook.callback(uri, opt);
        }
    }

    var result = new Promise(function(resolve, reject) {
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
    opt.headers = opt.headers || {};
    return opt;
};


module.exports = Resource;
