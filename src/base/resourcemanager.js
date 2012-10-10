(function() {
    "use strict";

    var c_cachedDocuments = {};
    var c_factories = {};
    var c_cachedAdapterHandles = {};

    XML3D.base.registerFactory = function(minetype, factory, canvasId) {
        canvasId = canvasId || 0;
        if(!c_factories[canvasId])
            c_factories[canvasId] = {};
        if (!c_factories[canvasId][minetype])
            c_factories[canvasId][minetype] = [];
        c_factories[canvasId][minetype].push(factory);
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
        setDocumentData(req, req._url, mimetype);
        updateDocumentHandles(req._url);
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
    function setDocumentData(req, url, mimetype) {
        var docCache = c_cachedDocuments[url];
        docCache.mimetype = mimetype;

        if (mimetype == "application/json") {
            docCache.response = JSON.parse(req.responseText);
        } else if (mimetype == "application/xml" || mimetype == "text/xml") {
            docCache.response = req.responseXML;

            if(!docCache.response){
                XML3D.debug.logError("Invalid external XML document '" + req._url +
                "': XML Syntax error");
                return;
            }

            // Configure all xml3d elements:
            var xml3dElements = docCache.response.querySelectorAll("xml3d");
            for(var i = 0; i < xml3dElements.length; ++i){
                XML3D.config.element(xml3dElements[i]);
            }
        }
    }

    function updateDocumentHandles(url){
        var docCache = c_cachedDocuments[url];
        var fragments = docCache.fragments;
        docCache.fragments = [];
        for ( var i = 0; i < fragments.length; ++i) {
            updateExternalHandles(url, fragments[i]);
        }
    }

    /**
     * @param {string} url
     * @param {string} fragment Fragment without pound key
     */
    function updateExternalHandles(url, fragment) {

        var response = c_cachedDocuments[url].response;
        var mimetype = c_cachedDocuments[url].mimetype;

        if(!response) return;

        var fullUrl = url + (fragment ? "#" + fragment : "");
        var data = null;
        if (mimetype == "application/json") {
            data = response;
        } else if (mimetype == "application/xml" || mimetype == "text/xml") {
            data = response.querySelectorAll("*[id="+fragment+"]")[0];
        }

        if (data) {
            updateMissingHandles(fullUrl, mimetype, data);
        }
    }
    function updateMissingHandles(url, mimetype, data){
        for ( var adapterType in c_cachedAdapterHandles[url]) {
            for ( var canvasId in c_cachedAdapterHandles[url][adapterType]) {
                var handle = c_cachedAdapterHandles[url][adapterType][canvasId];
                var factories = c_factories[canvasId];
                if (!handle.hasAdapter() && factories[mimetype]) {
                    updateHandle(handle, adapterType, canvasId, mimetype, data);
                }
            }
        }
    }

    function updateHandle(handle, adapterType, canvasId, mimetype, data){
        var factories = c_factories[canvasId];
        for ( var i = 0; i < factories[mimetype].length; ++i) {
            var fac = factories[mimetype][i];
            if (fac.aspect == adapterType) {
                var adapter = fac.getAdapter ? fac.getAdapter(data) : fac.createAdapter(data);
                if (adapter) {
                    handle.setAdapter(adapter);
                }
            }
        }
    }

    function clearHandles(url){
        for ( var adapterType in c_cachedAdapterHandles[url]) {
            for ( var canvasId in c_cachedAdapterHandles[url][adapterType]) {
                var handle = c_cachedAdapterHandles[url][adapterType][canvasId];
                if (handle.hasAdapter()) {
                    handle.setAdapter(null);
                }
            }
        }
    }

    /**
     * Get any adapter, internal or external
     * @param {Document} doc - the document from which to look up the reference
     * @param {XML3D.URI} uri
     * @param {Object} type
     * @returns {XML3D.base.AdapterHandle}
     */
    ResourceManager.prototype.getAdapterHandle = function(doc, uri, adapterType, canvasId) {
        if(!uri)
            return null;

        if(typeof uri == "string") uri = new XML3D.URI(uri);

        canvasId = canvasId || 0;
        if(document != doc || !uri.isLocal()){
            uri = uri.getAbsoluteURI(doc.documentURI);
        }

        if (!c_cachedAdapterHandles[uri])
            c_cachedAdapterHandles[uri] = {};

        if(!c_cachedAdapterHandles[uri][adapterType]){
            c_cachedAdapterHandles[uri][adapterType] = {};
        }

        var handle = c_cachedAdapterHandles[uri][adapterType][canvasId];
        if (handle)
            return handle;

        var handle = new XML3D.base.AdapterHandle();
        c_cachedAdapterHandles[uri][adapterType][canvasId] = handle;

        var factories = c_factories[canvasId];

        if(uri.isLocal()){
            var node = XML3D.URIResolver.resolveLocal(uri);
            updateHandle(handle, adapterType, canvasId, "application/xml", node);
        }
        else{
            var docURI = uri.toStringWithoutFragment();
            var docData = c_cachedDocuments[docURI];
            if (docData && docData.response) {
                updateExternalHandles(docURI, uri.fragment);
            } else {
                if (!docData) {
                    loadDocument(docURI);
                    c_cachedDocuments[docURI] = docData = {
                        fragments : []
                    };
                }
                docData.fragments.push(uri.fragment);
            }
        }
        return handle;
    };

    ResourceManager.prototype.notifyNodeIdChange = function(node, previousId, newId){
        var parent = node;
        while(parent.parentNode) parent = parent.parentNode;
        if(parent != window.document)
            return;

        // clear cached adapters of previous id"
        if(previousId){
            clearHandles("#" + previousId);
        }
        if(newId){
            updateMissingHandles("#" + newId, "application/xml", node);
        }
    }

    ResourceManager.prototype.notifyNodeAdapterChange = function(node, adapterType, canvasId){
        canvasId = canvasId || 0;
        var uri = "#" + node.id;
        if( c_cachedAdapterHandles[uri] && c_cachedAdapterHandles[uri][adapterType] &&
            c_cachedAdapterHandles[uri][adapterType][canvasId] ){
            c_cachedAdapterHandles[uri][adapterType][canvasId].notifyListeners();
        }
    }



    XML3D.base.resourceManager = new ResourceManager();

})();