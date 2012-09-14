(function() {
    "use strict";

    var c_cachedDocuments = {};
    var c_factories = {};
    var c_cachedAdapterHandles = {};

    XML3D.base.registerFactory = function(minetype, factory) {
        if (!c_factories[minetype])
            c_factories[minetype] = [];
        c_factories[minetype].push(factory);
    };

    /**
     * @constructor
     */
    var ResourceManager = function() {};

    /**
     * @private
     * @param {string} url
     */
    function loadDocument(url) {
        var xmlHttp = null;
        try {
            xmlHttp = new XMLHttpRequest();
        } catch (e) {
            xmlHttp = null;
        }
        if (xmlHttp) {
            xmlHttp._url = url;
            xmlHttp.open('GET', url, true);
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState == 4) {
                    if(xmlHttp.status == 200){
                        XML3D.debug.logDebug("Loaded: " + url);
                        XML3D.xmlHttpCallback && XML3D.xmlHttpCallback();
                        processResponse(xmlHttp);
                    }
                    else
                        showError(xmlHttp);
                }
            };
            xmlHttp.send(null);
        }
    };

    /**
     * @param {XMLHttpRequest} req
     */
    function processResponse(req) {
        var mimetype = req.getResponseHeader("content-type");
        updateAdapterHandles(req, req._url, mimetype);
    };

    /**
     * @param {XMLHttpRequest} req
     */
    function showError(req) {
        XML3D.debug.logError("Could not load external document '" + req._url +
            "': " + req.status + " - " + req.statusText);
    };

    /**
     * @param {XMLHttpRequest} req
     * @param {string} url
     * @param {string} mimetype
     */
    function updateAdapterHandles(req, url, mimetype) {
        var docCache = c_cachedDocuments[url];
        docCache.mimetype = mimetype;

        if (mimetype == "application/json") {
            docCache.response = JSON.parse(req.responseText);
        } else if (mimetype == "application/xml" || mimetype == "text/xml") {
            docCache.response = req.responseXML;
        }

        var fragments = docCache.fragments;
        docCache.fragments = [];
        for ( var i = 0; i < fragments.length; ++i) {
            updateAdapterHandlesForFragment(url, fragments[i]);
        }
    }

    /**
     * @param {string} url
     * @param {string} fragment Fragment without pound key
     */
    function updateAdapterHandlesForFragment(url, fragment) {

        var response = c_cachedDocuments[url].response;
        var mimetype = c_cachedDocuments[url].mimetype;

        var fullUrl = url + (fragment ? "#" + fragment : "");
        var data = null;
        if (mimetype == "application/json") {
            data = response;
        } else if (mimetype == "application/xml" || mimetype == "text/xml") {
            data = response;
        }

        if (data) {
            for ( var adapterType in c_cachedAdapterHandles[fullUrl]) {
                var handle = c_cachedAdapterHandles[fullUrl][adapterType];
                if (!handle.hasAdapter() && c_factories[mimetype]) {
                    for ( var i = 0; i < c_factories[mimetype].length; ++i) {
                        var fac = c_factories[mimetype][i];
                        if (fac.isFactoryFor(adapterType)) {
                            var a = fac.createAdapter(data);
                            if (a) {
                                handle.setAdapter(a);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     *
     * @param {XML3D.URI} uri
     * @param {Object} type
     * @returns {XML3D.base.AdapterHandle}
     */
    ResourceManager.prototype.getExternalAdapter = function(uri, type) {

        if (!c_cachedAdapterHandles[uri])
            c_cachedAdapterHandles[uri] = {};

        var a = c_cachedAdapterHandles[uri][type];
        if (a)
            return a;

        var a = new XML3D.base.AdapterHandle();
        c_cachedAdapterHandles[uri][type] = a;

        var docURI = uri.toStringWithoutFragment();
        var docData = c_cachedDocuments[docURI];
        if (docData && docData.response) {
            updateAdapterHandlesForFragment(docURI, uri.fragment);
        } else {
            if (!docData) {
                loadDocument(docURI);
                c_cachedDocuments[docURI] = docData = {
                    fragments : []
                };
            }
            docData.fragments.push(uri.fragment);
        }

        return a;
    };

    XML3D.base.ResourceManager = ResourceManager;

})();