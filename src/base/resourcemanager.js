(function() {
    "use strict";

    var c_cachedDocuments = {};
    var c_factories = {};
    var c_cachedAdapterHandles = {};

    /**
     * Register a factory with the resource manager
     * @param {XML3D.base.AdapterFactory} factory - the factory to be registered
     */
    XML3D.base.registerFactory = function(factory) {
        var canvasId = factory.canvasId;
        var mimetype = factory.mimetype;
        if(!c_factories[canvasId])
            c_factories[canvasId] = {};
        if (!c_factories[canvasId][mimetype])
            c_factories[canvasId][mimetype] = [];
        c_factories[canvasId][mimetype].push(factory);
    };

    /**
     * @constructor
     */
    var ResourceManager = function() {};

    /**
     * Load a document via XMLHttpRequest
     * @private
     * @param {string} url URL of the document
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
     * Process response of ajax request from loadDocument()
     * @private
     * @param {XMLHttpRequest} req
     */
    function processResponse(req) {
        var mimetype = req.getResponseHeader("content-type");
        setDocumentData(req, req._url, mimetype);
        updateDocumentHandles(req._url);
    };

    /**
     * Show errors of ajax request from loadDocument()
     * @param {XMLHttpRequest} req
     */
    function showError(req) {
        XML3D.debug.logError("Could not load external document '" + req._url +
            "': " + req.status + " - " + req.statusText);
        invalidateDocumentHandles(req._url);
    };

    /**
     * Initialize data of a received document
     * @private
     * @param {XMLHttpRequest} req The XMLHttpRequest of the loaded document
     * @param {string} url URL of the loaded document
     * @param {string} mimetype The mimetype of the loaded document
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

    /**
     * Update all existing handles of a received document
     * @param {string} url The URL of the document
     */
    function updateDocumentHandles(url){
        var docCache = c_cachedDocuments[url];
        var fragments = docCache.fragments;
        docCache.fragments = [];
        for ( var i = 0; i < fragments.length; ++i) {
            updateExternalHandles(url, fragments[i]);
        }
    }

    /**
     * Invalidate all handles of a document, that could not be loaded.
     * @param {string} url The URL of the document
     */
    function invalidateDocumentHandles(url){
        var docCache = c_cachedDocuments[url];
        var fragments = docCache.fragments;
        docCache.fragments = [];
        for ( var i = 0; i < fragments.length; ++i) {
            var fullUrl = url + (fragments[i] ? "#" + fragments[i] : "");
            invalidateHandles(fullUrl);
        }
    }

    /**
     * Update all handles of a part from an external document
     * @param {string} url The URL of the document
     * @param {string} fragment Fragment without pound key which defines the part of the document
     */
    function updateExternalHandles(url, fragment) {

        var response = c_cachedDocuments[url].response;
        var mimetype = c_cachedDocuments[url].mimetype;

        if(!response) return;

        var fullUrl = url + (fragment ? "#" + fragment : "");
        var data = null;
        if (mimetype == "application/json") {
            // TODO: Select subset of data according to fragment
            data = response;
        } else if (mimetype == "application/xml" || mimetype == "text/xml") {
            data = response.querySelectorAll("*[id="+fragment+"]")[0];
        }

        if (data) {
            updateMissingHandles(fullUrl, mimetype, data);
        }
        else{
            invalidateHandles(fullUrl);
        }
    }


    /**
     * Update all AdapterHandles without adapters of a certain url
     * @param {string} url The complete url + fragment
     * @param {string} mimetype Mimetype of the document
     * @param {Object} data Data of the document corresponding to the url. Possibily a DOM element
     */
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

    /**
     * Invalidate all AdapterHandles without adapters of a certain url
     * @param {string} url The complete url + fragment
     */
    function invalidateHandles(url){
        for ( var adapterType in c_cachedAdapterHandles[url]) {
            for ( var canvasId in c_cachedAdapterHandles[url][adapterType]) {
                var handle = c_cachedAdapterHandles[url][adapterType][canvasId];
                handle.setAdapter(null, XML3D.base.AdapterHandle.STATUS.NOT_FOUND);
            }
        }
    }

    /**
     * Update a specific AdapterHandle with the provided data.
     * Internally an adapter will be created with 'data' and added to 'handle'
     * All other argument are required to finde the correct factory
     * @param {XML3D.base.AdapterHandle} handle The AdapterHandle to be updated
     * @param {Object} adapterType The type / aspect of the adapter (e.g. XML3D.data or XML3D.webgl)
     * @param {number} canvasId Id of corresponding canvas handler. 0 if not dependent of canvas handler
     * @param {mimetype} mimetype Mimetype of the corresponding document
     * @param {Object} data Data for this handle. Possibily a DOM element
     */
    function updateHandle(handle, adapterType, canvasId, mimetype, data){
        var factories = c_factories[canvasId];
        for ( var i = 0; i < factories[mimetype].length; ++i) {
            var fac = factories[mimetype][i];
            if (fac.aspect == adapterType) {
                var adapter = fac.getAdapter ? fac.getAdapter(data) : fac.createAdapter(data);
                if (adapter) {
                    handle.setAdapter(adapter, XML3D.base.AdapterHandle.STATUS.READY);
                }
            }
        }
    }

    /**
     * Remove the adapter of all AdapterHandles corresponding to the given URL.
     * This is called e.g. when a node is remove from the document, or an id changes
     * @param {string} url The URL of all AdapterHandles to be cleared.
     */
    function clearHandles(url){
        for ( var adapterType in c_cachedAdapterHandles[url]) {
            for ( var canvasId in c_cachedAdapterHandles[url][adapterType]) {
                var handle = c_cachedAdapterHandles[url][adapterType][canvasId];
                if (handle.hasAdapter()) {
                    handle.setAdapter(null, XML3D.base.AdapterHandle.STATUS.NOT_FOUND);
                }
            }
        }
    }

    /**
     * Get any adapter, internal or external.
     * This function will trigger the loading of documents, if required.
     * An AdapterHandle will be always be returned, expect when an invalid (empty) uri is passed.
     *
     * @param {Document} doc - the document from which to look up the reference
     * @param {XML3D.URI} uri - The URI used to find the referred AdapterHandle. Can be relative
     * @param {Object} adapterType The type of adapter required (e.g. XML3D.data or XML3D.webgl)
     * @param {number} canvasId Id of canvashandle this adapter depends on, 0 if not depending on any canvashandler
     * @returns {XML3D.base.AdapterHandle=} The requested AdapterHandler. Note: might not contain any adapter.
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

        var handle = new XML3D.base.AdapterHandle(uri);
        c_cachedAdapterHandles[uri][adapterType][canvasId] = handle;

        if(uri.isLocal()){
            var node = XML3D.URIResolver.resolveLocal(uri);
            if(node)
                updateHandle(handle, adapterType, canvasId, "application/xml", node);
            else
                handle.setAdapter(null, XML3D.base.AdapterHandle.STATUS.NOT_FOUND);
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

    /**
     * This function is called when an id of an element changes or if that element is now reachable
     * or not reachable anymore. It will update all AdapterHandles connected to the element.
     * @param {Element} node Element of which id has changed
     * @param {string} previousId Previous id of element
     * @param {string} newId New id of element
     */
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

    /**
     * This function is called to notify an AdapterHandler about a change (can be triggered through adapters)
     * Note that this function only works with nodes inside window.document
     * @param {Element} node Node of AdapterHandler. Must be from window.document
     * @param {Object} adapterType Type/Aspect of AdapterHandler (e.g. XML3D.data or XML3D.webgl)
     * @param {number} canvasId CanvasHandler id of AdapterHandler, 0 if not depending on CanvasHandler
     * @param {number} type Type of Notification. Usually XML3D.events.ADAPTER_HANDLE_CHANGED
     */
    ResourceManager.prototype.notifyNodeAdapterChange = function(node, adapterType, canvasId, type){
        canvasId = canvasId || 0;
        var uri = "#" + node.id;
        if( c_cachedAdapterHandles[uri] && c_cachedAdapterHandles[uri][adapterType] &&
            c_cachedAdapterHandles[uri][adapterType][canvasId] ){
            c_cachedAdapterHandles[uri][adapterType][canvasId].notifyListeners(type);
        }
    }



    XML3D.base.resourceManager = new ResourceManager();

})();