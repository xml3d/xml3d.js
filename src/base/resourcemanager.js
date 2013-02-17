(function() {
    "use strict";

    var c_cachedDocuments = {};
    var c_factories = {};
    var c_cachedAdapterHandles = {};
    var c_canvasIdCounters = {};

    /**
     * Register a factory with the resource manager
     * @param {XML3D.base.AdapterFactory} factory - the factory to be registered
     */
    XML3D.base.registerFactory = function(factory) {
        var canvasId = factory.canvasId;
        if(!c_factories[canvasId])
            c_factories[canvasId] = [];
        c_factories[canvasId].push(factory);
    };

    /**
     * @constructor
     */
    var ResourceManager = function() {};

    ResourceManager.prototype.getCanvasIdCounters = function () {
        return c_canvasIdCounters;
    };

    function getCounterObject(canvasId) {
        return c_canvasIdCounters[canvasId];
    }

    function getOrCreateCounterObject(canvasId) {
        var counterObject = c_canvasIdCounters[canvasId];
        if (!counterObject) {
            counterObject = {counter: 0, listeners : new Array()};
            c_canvasIdCounters[canvasId] = counterObject;
        }
        return counterObject;
    }

    function notifyLoadCompleteListeners(counterObject) {
        var listeners = counterObject.listeners;
        counterObject.listeners = new Array();
        var i = listeners.length;
        while (i--) {
            listeners[i](this);
        }
    }

    function loadComplete(canvasId, url) {
        // notify all load complete listeners
        var counterObject = getCounterObject(canvasId);
        if (counterObject) {
            XML3D.debug.assert(counterObject.counter > 0, "counter must be > 0");
            counterObject.counter--;
            if (counterObject.counter == 0) {
                notifyLoadCompleteListeners(counterObject);
            }
        }
    }

    /*
     * Register listener that will be fired when all resources for specified canvasId are loaded.
     * Listener is fired only once.
     *
     * @param {number} canvasId
     * @param {EventListener} listener
     */
    ResourceManager.prototype.addLoadCompleteListener = function(canvasId, listener) {
        var counterObject = getCounterObject(canvasId);

        // when counter is 0 we can fire event immediately
        if (counterObject === undefined || counterObject.counter == 0) {
            listener(canvasId);
            return;
        }

        var idx = counterObject.listeners.indexOf(listener);
        if (idx == -1) {
            counterObject.listeners.push(listener);
        }
    };

    ResourceManager.prototype.removeLoadCompleteListener = function(canvasId, listener) {
        var counterObject = getCounterObject(canvasId);
        if (counterObject) {
            var idx = counterObject.listeners.indexOf(listener);
            if (idx != -1)
                counterObject.listeners.splice(idx, 1);
        }
    };

    var binaryContentTypes = ["application/octet-stream", "text/plain; charset=x-user-defined"];

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
            xmlHttp._contentChecked = false;
            xmlHttp.open('GET', url, true);

            xmlHttp.onreadystatechange = function() {
                if (xmlHttp._aborted) // This check is possibly not needed
                    return;
                if (!xmlHttp._contentChecked &&
                    // 2 - HEADERS_RECEIVED, 3 - LOADING, 4 - DONE
                    ((xmlHttp.readyState == 2 || xmlHttp.readyState == 3 ||xmlHttp.readyState == 4) &&
                        xmlHttp.status == 200)) {
                    // check if we need to enforce binary mode
                    var contentType = xmlHttp.getResponseHeader("content-type");
                    if (contentType) {
                        var requestBinaryData = false;
                        for (var i in binaryContentTypes) {
                            if (contentType == binaryContentTypes[i]) {
                                requestBinaryData = true;
                                break;
                            }
                        }
                        if (requestBinaryData) {
                            xmlHttp._aborted = true;
                            var cb = xmlHttp.onreadystatechange;
                            xmlHttp.onreadystatechange = null;
                            var url = xmlHttp._url;
                            xmlHttp.abort();

                            // Note: We do not recycle XMLHttpRequest !
                            //       This does work only when responseType is changed to "arraybuffer",
                            //       however the size of the xmlHttp.response buffer is then wrong !
                            //       It does not work at all (at least in Chrome) when we use overrideMimeType
                            //       with "text/plain; charset=x-user-defined" argument.
                            //       The latter mode require creation of the fresh XMLHttpRequest.

                            xmlHttp = new XMLHttpRequest(); // uncomment for use with overrideMimeType
                            xmlHttp._url = url;
                            xmlHttp._contentChecked = true;
                            xmlHttp.open('GET', url, true);
                            xmlHttp.overrideMimeType("text/plain; charset=x-user-defined"); // not needed when responseType is arraybuffer
                            xmlHttp.responseType = "arraybuffer";
                            xmlHttp.onreadystatechange = cb;
                            xmlHttp.send(null);
                        }
                    }
                }
                else if (xmlHttp.readyState == 4) {
                    if(xmlHttp.status == 200){
                        XML3D.debug.logDebug("Loaded: " + url);
                        XML3D.xmlHttpCallback && XML3D.xmlHttpCallback(xmlHttp);
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

        if (req.responseType == "arraybuffer") {
            docCache.response = req.response;
        } else if (mimetype == "application/json") {
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
        } else if (mimetype == "application/octet-stream" || mimetype == "text/plain; charset=x-user-defined") {
            // for backwards compatibility
            var buf = new ArrayBuffer(req.responseText.length);
            var view = new Uint8Array(buf);
            for (var i = 0; i < req.responseText.length; ++i) {
                view[i] = req.responseText.charCodeAt(i) & 0xff;
            }
            docCache.response = buf;
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

        var fullUrl = url + (fragment ? "#" + fragment : "");
        if (!response) {
            // In the case the loaded document is not supported we still need to decrement counter object
            invalidateHandles(fullUrl);
            return;
        }

        var data = null;
        if (mimetype == "application/json") {
            // TODO: Select subset of data according to fragment
            data = response;
        } else if (mimetype == "application/xml" || mimetype == "text/xml") {
            data = response.querySelectorAll("*[id="+fragment+"]")[0];
        } else {
            data = response; // for "application/octet-stream" and "text/plain; charset=x-user-defined"
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
                if (!handle.hasAdapter()) {
                    updateHandle(handle, adapterType, canvasId, mimetype, data);
                    loadComplete(canvasId, url);
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
                loadComplete(canvasId, url);
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

        for ( var i = 0; i < factories.length; ++i) {
            var fac = factories[i];
            if (fac.aspect == adapterType && fac.supportsMimetype(mimetype)) {
                var adapter = fac.getAdapter ? fac.getAdapter(data, mimetype) : fac.createAdapter(data, mimetype);
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
        else {
            var counterObject = getOrCreateCounterObject(canvasId);
            counterObject.counter++;

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

    /**
     * This function is called to load an Image.
     *
     * @param {string} uri Image URI
     * @param {function} loadListener Function called when image was successfully loaded.
     *                                It will be called with event as the first and image as the second parameter.
     * @param {function} errorListener Function called when image could not be loaded.
     *                                 It will be called with event as the first and image as the second parameter.
     * @return {Image}
     */
    ResourceManager.prototype.getImage = function(uri, loadListener, errorListener) {
        // we use canvasId 0 to represent images loaded in a document
        getOrCreateCounterObject(0).counter++;

        var image = new Image();
        image.onload = function(e) {
            loadComplete(0, uri);
            loadListener(e, image);
        };
        image.onerror = function(e) {
            loadComplete(0, uri);
            errorListener(e, image);
        };
        image.crossOrigin = "anonymous";

        image.src = uri; // here loading starts
        return image;
    }


    /**
     * This function is called to load a Video.
     *
     * @param {string} uri Video URI
     * @param {boolean} autoplay
     * @param {Object} listeners  Dictionary of all listeners to register with video element.
     *                            Listeners will be called with event as the first and video as the second parameter.
     * @return {Image}
     */
    ResourceManager.prototype.getVideo = function(uri, autoplay, listeners) {
        // we use canvasId 0 to represent videos loaded in a document
        getOrCreateCounterObject(0).counter++;

        var video = document.createElement("video");

        function loadCompleteCallback(event) {
            loadComplete(0, uri);
        }

        video.addEventListener("canplay", loadCompleteCallback, true);
        video.addEventListener("error", loadCompleteCallback, true);
        video.crossorigin = "anonymous";
        video.autoplay = autoplay;

        function createCallback(listener) {
            return function(event) {
                listener(event, video);
            };
        }

        for (var eventName in listeners) {
            video.addEventListener(eventName, createCallback(listeners[eventName]), true);
        }

        video.src = uri; // here loading starts
        return video;
    }

    XML3D.base.resourceManager = new ResourceManager();

})();
