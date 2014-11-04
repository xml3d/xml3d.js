(function() {
    "use strict";

    var OPTION_RESOURCE_CORS = "resource-crossorigin-attribute";
    XML3D.options.register(OPTION_RESOURCE_CORS, "anonymous");

    var c_cachedDocuments = {};
    var c_factories = {};
    var c_cachedAdapterHandles = {};
    var c_canvasIdCounters = {};
    var c_formatHandlers = [];

    var c_binaryContentTypes = ["application/octet-stream", "text/plain; charset=x-user-defined"];
    var c_binaryExtensions = [".bin", ".bson"];

    /**
     * Register a factory with the resource manager
     * @param {XML3D.base.AdapterFactory} factory - the factory to be registered
     */
    XML3D.base.registerFactory = function(factory) {
        var canvasId = factory.canvasId;
        if (!c_factories[canvasId])
            c_factories[canvasId] = [];
        c_factories[canvasId].push(factory);
    };

    XML3D.base.registerFormat = function(formatHandler) {
        if (formatHandler)
            c_formatHandlers.push(formatHandler);
    }

    XML3D.base.findFormat = function(response, responseType, mimetype) {
        for (var i = 0; i < c_formatHandlers.length; ++i) {
            var formatHandler = c_formatHandlers[i];
            if (c_formatHandlers[i].isFormatSupported(response, responseType, mimetype)) {
                return formatHandler;
            }
        }
        return null;
    }

    /**
     * @constructor
     */
    var ResourceManager = function() {
    };

    function getCounterObject(canvasId) {
        return c_canvasIdCounters[canvasId];
    }

    function getOrCreateCounterObject(canvasId) {
        var counterObject = c_canvasIdCounters[canvasId];
        if (!counterObject) {
            counterObject = {counter: 0, listeners: new Array()};
            c_canvasIdCounters[canvasId] = counterObject;
        }
        return counterObject;
    }

    function notifyLoadCompleteListeners(counterObject) {
        var listeners = counterObject.listeners;
        //counterObject.listeners = new Array();
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

    ResourceManager.prototype.isLoadComplete = function(canvasId) {
        var counterObject = getCounterObject(canvasId);
        return !counterObject || counterObject.counter == 0;
    }

    /*
     * Register listener that will be fired when all resources for specified canvasId are loaded.
     * Listener is fired only once.
     *
     * @param {number} canvasId
     * @param {EventListener} listener
     */
    ResourceManager.prototype.addLoadCompleteListener = function(canvasId, listener) {
        var counterObject = getOrCreateCounterObject(canvasId);

        /*
        if (counterObject === undefined || counterObject.counter == 0) {
            listener(canvasId);
            return;
        }
        */

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


    function stringEndsWithSuffix(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    ResourceManager.prototype.addBinaryContentType = function(type) {
        if (c_binaryContentTypes.indexOf(type) == -1)
            c_binaryContentTypes.push(type);
    };

    ResourceManager.prototype.removeBinaryContentType = function(type) {
        var idx = c_binaryContentTypes.indexOf(type);
        if (idx != -1)
            c_binaryContentTypes.splice(idx, 1);
    };

    function isBinaryContentType(contentType) {
        for (var i in c_binaryContentTypes) {
            if (contentType == c_binaryContentTypes[i]) {
                return true;
            }
        }
        return false;
    }

    ResourceManager.prototype.addBinaryExtension = function(extension) {
        if (c_binaryExtensions.indexOf(extension) == -1)
            c_binaryExtensions.push(extension);
    };

    ResourceManager.prototype.removeBinaryExtension = function(extension) {
        var idx = c_binaryExtensions.indexOf(extension);
        if (idx != -1)
            c_binaryExtensions.splice(idx, 1);
    };

    function isBinaryExtension(url) {
        for (var i in c_binaryExtensions) {
            if (stringEndsWithSuffix(url, c_binaryExtensions[i]))
                return true;
        }
        return false;
    }

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
            if (isBinaryExtension(url))
                xmlHttp.responseType = "arraybuffer";

            xmlHttp.onreadystatechange = function() {
                if (xmlHttp._aborted) // This check is possibly not needed
                    return;
                // check compatibility between content and request mode
                if (!xmlHttp._contentChecked &&
                    // 2 - HEADERS_RECEIVED, 3 - LOADING, 4 - DONE
                    ((xmlHttp.readyState == 2 || xmlHttp.readyState == 3 || xmlHttp.readyState == 4) &&
                        xmlHttp.status == 200)) {
                    xmlHttp._contentChecked = true; // we check only once
                    // check if we need to change request mode
                    var contentType = xmlHttp.getResponseHeader("content-type");
                    if (contentType) {
                        var binaryContent = isBinaryContentType(contentType);
                        var binaryRequest = (xmlHttp.responseType == "arraybuffer");
                        // When content is not the same as request, we need to repeat request
                        if (binaryContent != binaryRequest) {
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

                            xmlHttp = new XMLHttpRequest();
                            xmlHttp._url = url;
                            xmlHttp._contentChecked = true;
                            xmlHttp.open('GET', url, true);
                            if (binaryContent)
                                xmlHttp.responseType = "arraybuffer";
                            xmlHttp.onreadystatechange = cb;
                            xmlHttp.send(null);
                            return;
                        }
                    }
                }
                // Request mode and content type are compatible here (both binary or both text)
                if (xmlHttp.readyState == 4) {
                    if (xmlHttp.status == 200) {
                        XML3D.debug.logDebug("Loaded: " + xmlHttp._url);
                        XML3D.xmlHttpCallback && XML3D.xmlHttpCallback(xmlHttp);
                        processResponse(xmlHttp);
                    }
                    else {
                        XML3D.debug.logError("Could not load external document '" + xmlHttp._url +
                            "': " + xmlHttp.status + " - " + xmlHttp.statusText);
                        invalidateDocumentHandles(xmlHttp._url);
                    }
                }
            };
            xmlHttp.send(null);
        }
    };

    /**
     * Process response of ajax request from loadDocument()
     * @private
     * @param {XMLHttpRequest} httpRequest
     */
    function processResponse(httpRequest) {
        var mimetype = httpRequest.getResponseHeader("content-type");
        setDocumentData(httpRequest, httpRequest._url, mimetype);
    };

    /**
     * Initialize data of a received document
     * @private
     * @param {XMLHttpRequest} httpRequest The XMLHttpRequest of the loaded document
     * @param {string} url URL of the loaded document
     * @param {string} mimetype The mimetype of the loaded document
     */
    function setDocumentData(httpRequest, url, mimetype) {
        var docCache = c_cachedDocuments[url];
        docCache.mimetype = mimetype;

        var cleanedMimetype = mimetype;

        if (mimetype.indexOf(';') > 0)
            cleanedMimetype = mimetype.substr(0, mimetype.indexOf(';'));

        var response = null;
        if (httpRequest.responseType == "arraybuffer") {
            response = httpRequest.response;
        } else if (cleanedMimetype == "application/json") {
            response = JSON.parse(httpRequest.responseText);
        } else if (cleanedMimetype == "application/xml" || cleanedMimetype == "text/xml") {
            response = httpRequest.responseXML;
            if (!response) {
                XML3D.debug.logError("Invalid external XML document '" + httpRequest._url +
                    "': XML Syntax error");
                return;
            }
        } else if (cleanedMimetype == "application/octet-stream" || mimetype == "text/plain; charset=x-user-defined") {
            XML3D.debug.logError("Possibly wrong loading of resource " + url + ". Mimetype is " + mimetype + " but response is not an ArrayBuffer");
            response = httpRequest.response;
        } else {
            XML3D.debug.logError("Unidentified response type (response = '" + httpRequest.response + "', responseType = '" + httpRequest.responseType + "')");
            response = httpRequest.response;
        }

        var formatHandler = XML3D.base.findFormat(response, httpRequest.responseType, cleanedMimetype);
        if (!formatHandler) {
            XML3D.debug.logError("No format handler for resource (response = '" + response + "', responseType = '" + httpRequest.responseType + "')");
            return;
        }
        docCache.format = formatHandler;
        formatHandler.getFormatData(response, httpRequest.responseType, cleanedMimetype, function(success, result){
            if(success){
                docCache.response = result;
                updateDocumentHandles(url)
            }
            else{
                invalidateDocumentHandles(url);
            }
        } );

    }

    /**
     * Update all existing handles of a received document
     * @param {string} url The URL of the document
     */
    function updateDocumentHandles(url) {
        var docCache = c_cachedDocuments[url];
        var fragments = docCache.fragments;
        docCache.fragments = [];
        for (var i = 0; i < fragments.length; ++i) {
            updateExternalHandles(url, fragments[i]);
        }
    }

    /**
     * Invalidate all handles of a document, that could not be loaded.
     * @param {string} url The URL of the document
     */
    function invalidateDocumentHandles(url) {
        var docCache = c_cachedDocuments[url];
        var fragments = docCache.fragments;
        docCache.fragments = [];
        for (var i = 0; i < fragments.length; ++i) {
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
        var format = c_cachedDocuments[url].format;

        var fullUrl = url + (fragment ? "#" + fragment : "");
        if (!response) {
            // In the case the loaded document is not supported we still need to decrement counter object
            invalidateHandles(fullUrl);
            return;
        }

        // get part of the resource represented by the fragment
        var data = format.getFragmentData(response, fragment);

        if (data) {
            updateMissingHandles(fullUrl, format, data);
        }
        else {
            invalidateHandles(fullUrl);
        }
    }


    /**
     * Update all AdapterHandles without adapters of a certain url
     * @param {string} url The complete url + fragment
     * @param {FormatHandler} formatHandler Format handler
     * @param {Object} data Data of the document corresponding to the url. Possibily a DOM element
     */
    function updateMissingHandles(url, formatHandler, data) {
        for (var adapterType in c_cachedAdapterHandles[url]) {
            for (var canvasId in c_cachedAdapterHandles[url][adapterType]) {
                var handle = c_cachedAdapterHandles[url][adapterType][canvasId];
                if (!handle.hasAdapter()) {
                    updateHandle(handle, adapterType, canvasId, formatHandler, data);
                    loadComplete(canvasId, url);
                }
            }
        }
    }

    /**
     * Invalidate all AdapterHandles without adapters of a certain url
     * @param {string} url The complete url + fragment
     */
    function invalidateHandles(url) {
        for (var adapterType in c_cachedAdapterHandles[url]) {
            for (var canvasId in c_cachedAdapterHandles[url][adapterType]) {
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
     * @param {FormatHandler} format Format handler of the corresponding document
     * @param {Object} data Data for this handle. Possibily a DOM element
     */
    function updateHandle(handle, adapterType, canvasId, format, data) {

        var factory = format.getFactory(adapterType, canvasId);

        if(!factory) {
            XML3D.debug.logError("Format does not support adapterType " + adapterType);
            return;
        }

        var adapter = factory.getAdapter ? factory.getAdapter(data) : factory.createAdapter(data);
        if (adapter) {
            handle.setAdapter(adapter, XML3D.base.AdapterHandle.STATUS.READY);
        }


    }

    /**
     * Remove the adapter of all AdapterHandles corresponding to the given URL.
     * This is called e.g. when a node is remove from the document, or an id changes
     * @param {string} url The URL of all AdapterHandles to be cleared.
     */
    function clearHandles(url) {
        for (var adapterType in c_cachedAdapterHandles[url]) {
            for (var canvasId in c_cachedAdapterHandles[url][adapterType]) {
                var handle = c_cachedAdapterHandles[url][adapterType][canvasId];
                if (handle.hasAdapter()) {
                    handle.setAdapter(null, XML3D.base.AdapterHandle.STATUS.NOT_FOUND);
                }
            }
        }
    }

    /**
     * This methods returns an absolute URI compatible with the resource manager.
     * This means: Any reference from an external document will be absolute and any id reference from the current
     * document will remain an id reference.
     * @param {Document} baseDocument - the document from which to look up the reference
     * @param {XML3D.URI} uri - The URI used to find the referred AdapterHandle. Can be relative
     * @returns {XML3D.URI} The (sometimes) absolute URI
     */
    ResourceManager.prototype.getAbsoluteURI = function(baseDocument, uri){
        if (!uri)
            return null;

        if (typeof uri == "string") uri = new XML3D.URI(uri);
        if (baseDocument != document || !uri.isLocal()) {
            uri = uri.getAbsoluteURI(baseDocument.documentURI);
        }
        return uri;
    }

    /**
     * Get any adapter, internal or external.
     * This function will trigger the loading of documents, if required.
     * An AdapterHandle will be always be returned, expect when an invalid (empty) uri is passed.
     *
     * @param {Document} baseDocument - the document from which to look up the reference
     * @param {XML3D.URI} uri - The URI used to find the referred AdapterHandle. Can be relative
     * @param {Object} adapterType The type of adapter required (e.g. XML3D.data or XML3D.webgl)
     * @param {number=} canvasId Id of canvashandle this adapter depends on, 0 if not depending on any canvashandler
     * @returns {?XML3D.base.AdapterHandle} The requested AdapterHandler. Note: might be null
     */
    ResourceManager.prototype.getAdapterHandle = function(baseDocument, uri, adapterType, canvasId) {
        canvasId = canvasId || 0;
        uri = this.getAbsoluteURI(baseDocument, uri);

        if (!uri)
            return null;

        if (!c_cachedAdapterHandles[uri])
            c_cachedAdapterHandles[uri] = {};

        if (!c_cachedAdapterHandles[uri][adapterType]) {
            c_cachedAdapterHandles[uri][adapterType] = {};
        }

        var handle = c_cachedAdapterHandles[uri][adapterType][canvasId];
        if (handle)
            return handle;

        var handle = new XML3D.base.AdapterHandle(uri);
        c_cachedAdapterHandles[uri][adapterType][canvasId] = handle;

        if (uri.isLocal()) {
            var node = XML3D.URIResolver.resolveLocal(uri);
            if (node)
                updateHandle(handle, adapterType, canvasId, XML3D.base.xml3dFormatHandler, node);
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
                        fragments: []
                    };
                }
                docData.fragments.push(uri.fragment);
            }
        }
        return handle;
    };

    /**
     * Get any adapter, internal or external.
     *
     * @param node
     * @param adapterType
     * @param canvasId
     * @return {XML3D.base.Adapter?}
     */
    ResourceManager.prototype.getAdapter = function(node, adapterType, canvasId) {
        var factory = XML3D.base.xml3dFormatHandler.getFactory(adapterType, canvasId);
        if (factory) {
            return factory.getAdapter(node);
        }
        return null;
    }

    /**
     * This function is called when an id of an element changes or if that element is now reachable
     * or not reachable anymore. It will update all AdapterHandles connected to the element.
     * @param {Element} node Element of which id has changed
     * @param {string} previousId Previous id of element
     * @param {string} newId New id of element
     */
    ResourceManager.prototype.notifyNodeIdChange = function(node, previousId, newId) {
        var parent = node;
        while (parent.parentNode) parent = parent.parentNode;
        if (parent != window.document)
            return;

        // clear cached adapters of previous id"
        if (previousId) {
            clearHandles("#" + previousId);
        }
        if (newId) {
            updateMissingHandles("#" + newId, XML3D.base.xml3dFormatHandler, node);
        }
    }

    /**
     * This function is called to notify an AdapterHandler about a change (can be triggered through adapters)
     * Note that this function only works with nodes inside window.document
     * @param {Element} element Element of AdapterHandler. Must be from window.document
     * @param {Object} adapterType Type/Aspect of AdapterHandler (e.g. XML3D.data or XML3D.webgl)
     * @param {number} canvasId CanvasHandler id of AdapterHandler, 0 if not depending on CanvasHandler
     * @param {number} type Type of Notification. Usually XML3D.events.ADAPTER_HANDLE_CHANGED
     */
    ResourceManager.prototype.notifyNodeAdapterChange = function(element, adapterType, canvasId, type) {
        canvasId = canvasId || 0;
        var uri = "#" + element.id;
        if (c_cachedAdapterHandles[uri] && c_cachedAdapterHandles[uri][adapterType] &&
            c_cachedAdapterHandles[uri][adapterType][canvasId]) {
            c_cachedAdapterHandles[uri][adapterType][canvasId].notifyListeners(type);
        }
    }


    /**
     * Load data via XMLHttpRequest
     * @private
     * @param {string} url URL of the document
     * @param {function(object)} loadListener Gets the response of the XHR
     * @param {function(XMLHttpRequest)} errorListener Get the XHR object for further analyzis
     */
    ResourceManager.prototype.loadData = function(url, loadListener, errorListener) {
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
            if (isBinaryExtension(url))
                xmlHttp.responseType = "arraybuffer";

            xmlHttp.onreadystatechange = function() {
                if (xmlHttp._aborted) // This check is possibly not needed
                    return;
                // check compatibility between content and request mode
                if (!xmlHttp._contentChecked &&
                    // 2 - HEADERS_RECEIVED, 3 - LOADING, 4 - DONE
                    ((xmlHttp.readyState == 2 || xmlHttp.readyState == 3 || xmlHttp.readyState == 4) &&
                        xmlHttp.status == 200)) {
                    xmlHttp._contentChecked = true; // we check only once
                    // check if we need to change request mode
                    var contentType = xmlHttp.getResponseHeader("content-type");
                    if (contentType) {
                        var binaryContent = isBinaryContentType(contentType);
                        var binaryRequest = (xmlHttp.responseType == "arraybuffer");
                        // When content is not the same as request, we need to repeat request
                        if (binaryContent != binaryRequest) {
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

                            xmlHttp = new XMLHttpRequest();
                            xmlHttp._url = url;
                            xmlHttp._contentChecked = true;
                            xmlHttp.open('GET', url, true);
                            if (binaryContent)
                                xmlHttp.responseType = "arraybuffer";
                            xmlHttp.onreadystatechange = cb;
                            xmlHttp.send(null);
                            return;
                        }
                    }
                }
                // Request mode and content type are compatible here (both binary or both text)
                if (xmlHttp.readyState == 4) {
                    if (xmlHttp.status == 200) {
                        XML3D.debug.logDebug("Loaded: " + xmlHttp._url);

                        var mimetype = xmlHttp.getResponseHeader("content-type");
                        var response = null;

                        if (xmlHttp.responseType == "arraybuffer") {
                            response = xmlHttp.response;
                        } else if (mimetype == "application/json") {
                            response = JSON.parse(xmlHttp.responseText);
                        } else if (mimetype == "application/xml" || mimetype == "text/xml") {
                            response = xmlHttp.responseXML;
                        } else if (mimetype == "application/octet-stream" || mimetype == "text/plain; charset=x-user-defined") {
                            XML3D.debug.logError("Possibly wrong loading of resource " + url + ". Mimetype is " + mimetype + " but response is not an ArrayBuffer");
                            response = xmlHttp.responseText; // FIXME is this correct ?
                        }
                        if (loadListener)
                            loadListener(response);
                    }
                    else {
                        XML3D.debug.logError("Could not load external document '" + xmlHttp._url +
                            "': " + xmlHttp.status + " - " + xmlHttp.statusText);
                        if (errorListener)
                            errorListener(xmlHttp);
                    }
                }
            };
            xmlHttp.send(null);
        }
    };

    /**
     * This function is called to load an Image.
     *
     * @param {XML3D.URI} uri Image URI
     * @param {function(Event, HTMLImageElement)} loadListener Function called when image was successfully loaded.
     *                                It will be called with event as the first and image as the second parameter.
     * @param {function(Event, HTMLImageElement)} errorListener Function called when image could not be loaded.
     *                                 It will be called with event as the first and image as the second parameter.
     * @return {HTMLImageElement}
     */
    ResourceManager.prototype.getImage = function(uri, loadListener, errorListener) {
        // we use canvasId 0 to represent images loaded in a document
        getOrCreateCounterObject(0).counter++;

        var image = new Image();
        image.onload = function(e) {
            loadListener(e, image);
            loadComplete(0, uri);
        };
        image.onerror = function(e) {
            errorListener(e, image);
            loadComplete(0, uri);
        };
        if(!uri.hasSameOrigin(document.location.href)) {
            image.crossOrigin = XML3D.options.getValue(OPTION_RESOURCE_CORS);
            XML3D.debug.logWarning("You are using an cross-origin image as texture. This might cause troubles cause the canvas is 'tainted'.")
        }

        image.src = uri.toString(); // here loading starts
        return image;
    };


    /**
     * This function is called to load a Video.
     *
     * @param {XML3D.URI} uri Video URI
     * @param {boolean} autoplay
     * @param {Object} listeners  Dictionary of all listeners to register with video element.
     *                            Listeners will be called with event as the first and video as the second parameter.
     * @return {HTMLVideoElement}
     */
    ResourceManager.prototype.getVideo = function(uri, autoplay, listeners) {
        // we use canvasId 0 to represent videos loaded in a document
        getOrCreateCounterObject(0).counter++;

        var video = document.createElement("video");

        function loadCompleteCallback(event) {
            loadComplete(0, uri);
        }

        if (!uri.hasSameOrigin(document.location.href)) {
            video.crossOrigin = XML3D.options.getValue(OPTION_RESOURCE_CORS);
            XML3D.debug.logWarning("You are using an cross-origin video as texture. This might cause troubles cause the canvas is 'tainted'.", uri)
        }

        video.autoplay = autoplay;

        function createCallback(listener) {
            return function(event) {
                listener(event, video);
            };
        }

        for (var eventName in listeners) {
            video.addEventListener(eventName, createCallback(listeners[eventName]), true);
        }

        video.addEventListener("canplay", loadCompleteCallback, true);
        video.addEventListener("error", loadCompleteCallback, true);

        video.src = uri.toString(); // here loading starts
        return video;
    }

    XML3D.base.resourceManager = new ResourceManager();

})();
