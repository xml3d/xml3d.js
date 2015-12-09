
var AdapterHandle = require("../base/adapterhandle.js");
var URI = require("../utils/uri.js").URI;
var URIResolver = require("../utils/uri.js").URIResolver;
var Options = require("../utils/options.js");
var ResourceCounter = require("./counter.js");
var getDocumentCache = require("./fetcher.js").getDocumentCache;

var OPTION_RESOURCE_CORS = "resource-crossorigin-attribute";
Options.register(OPTION_RESOURCE_CORS, "anonymous");

// Proxy adapters that provide the connections between elements (eg. "src" -> "id")
var c_cachedAdapterHandles = {};

var Resource = {};

/**
 * This function is called when an id of an element changes or if that element is now reachable
 * or not reachable anymore. It will update all AdapterHandles connected to the element.
 * @param {Element} node Element of which id has changed
 * @param {string} previousId Previous id of element
 * @param {string} newId New id of element
 */
Resource.notifyNodeIdChange = function(node, previousId, newId) {
    var uri = new URI();
    if (previousId) {
        uri.fragment = previousId;
        clearHandles(uri);
    }
    if (newId) {
        uri.fragment = newId;
        updateMissingHandles(uri, XML3D.xml3dFormatHandler, node);
    }
};

/**
 * This function is called to notify an AdapterHandler about a change (can be triggered through adapters)
 * Note that this function only works with nodes inside window.document
 * @param {Element} element Element of AdapterHandler. Must be from window.document
 * @param {Object} adapterType Type/Aspect of AdapterHandler (e.g. XML3D.data or XML3D.webgl)
 * @param {number} canvasId GLCanvasHandler id of AdapterHandler, 0 if not depending on GLCanvasHandler
 * @param {number} type Type of Notification. Usually Events.ADAPTER_HANDLE_CHANGED
 */
Resource.notifyNodeAdapterChange = function(element, adapterType, canvasId, type) {
    canvasId = canvasId || 0;
    var uri = "#" + element.id;
    if (c_cachedAdapterHandles[uri] && c_cachedAdapterHandles[uri][adapterType] &&
        c_cachedAdapterHandles[uri][adapterType][canvasId]) {
        c_cachedAdapterHandles[uri][adapterType][canvasId].notifyListeners(type);
    }
};

/**
 * Remove the adapter of all AdapterHandles corresponding to the given URL.
 * This is called e.g. when a node is remove from the document, or an id changes
 * @param {URI} uri The URL of all AdapterHandles to be cleared.
 */
function clearHandles(uri) {
    var url = uri.toString();
    for (var adapterType in c_cachedAdapterHandles[url]) {
        for (var canvasId in c_cachedAdapterHandles[url][adapterType]) {
            var handle = c_cachedAdapterHandles[url][adapterType][canvasId];
            if (handle.hasAdapter()) {
                handle.setAdapter(null, AdapterHandle.STATUS.NOT_FOUND);
            }
        }
    }
}

/**
 * Gets (or creates) the requested adapter for the given element and canvasId.
 *
 * @param {HTMLElement} node - The element the adapter is for
 * @param {String} aspect - The aspect of the adapter, usually 'scene' or 'data'
 * @param {?Number} canvasId - The canvasId of the XML3D element that this adapter will belong to
 * @returns {Adapter|?XML3D.base.Adapter}
 */
Resource.getAdapter = function(node, aspect, canvasId) {
    return XML3D.xml3dFormatHandler.getAdapter(node, aspect, canvasId);
};


/**
 * Get any adapter, internal or external.
 * This function will trigger the loading of documents, if required.
 * An AdapterHandle will be always be returned, expect when an invalid (empty) uri is passed.
 *
 * @param {String} baseURI - the base URI from which to look up the reference
 * @param {URI} uri - The URI used to find the referred AdapterHandle. Can be relative
 * @param {Object} aspect The type of adapter required (e.g. XML3D.data or XML3D.webgl)
 * @param {number=} canvasId Id of GLCanvasHandler handler this adapter depends on, 0 if not depending on any GLCanvasHandler
 * @returns {?AdapterHandle} The requested AdapterHandler. Note: might be null
 */
Resource.getAdapterHandle = function(baseURI, uri, aspect, canvasId) {
    canvasId = canvasId || 0;
    uri = XML3D.resource.getAbsoluteURI(baseURI, uri);

    if (!uri)
        return null;

    if (!c_cachedAdapterHandles[uri])
        c_cachedAdapterHandles[uri] = {};

    if (!c_cachedAdapterHandles[uri][aspect]) {
        c_cachedAdapterHandles[uri][aspect] = {};
    }

    var handle = c_cachedAdapterHandles[uri][aspect][canvasId];
    if (handle)
        return handle;

    return createAdapterHandle(uri, aspect, canvasId);
};

var createAdapterHandle = function(uri, aspect, canvasId) {
    var url = uri.toString();
    var handle = new AdapterHandle(url);
    c_cachedAdapterHandles[url][aspect][canvasId] = handle;

    if (uri.isLocal()) {
        var node = URIResolver.resolveLocal(uri);
        if (node)
            updateHandle(handle, aspect, canvasId, XML3D.xml3dFormatHandler, node);
        else
            handle.setAdapter(null, AdapterHandle.STATUS.NOT_FOUND);
    }
    else {
        ResourceCounter.addPendingResource(uri, canvasId);

        var docURI = uri.toStringWithoutFragment();
        var docData = getDocumentCache(docURI);
        if (docData && docData.document) {
            updateExternalHandles(uri, docData);
        } else {
            var priority = aspect === "scene" ? 1 : 0; //Give materials a higher priority
            XML3D.resource.getDocument(docURI, {priority : priority}).then(function(doc) {
                if (doc) {
                    docData = getDocumentCache(docURI);
                    docData.fragments.push(uri.fragment);
                    updateDocumentHandles(docURI);
                } else {
                    invalidateDocumentHandles(uri);
                }
            }).catch(function(e) {
                XML3D.debug.logError(e.toString());
                invalidateDocumentHandles(uri);
            });
        }
    }
    return handle;
};

/**
 * Update a specific AdapterHandle with the provided data.
 * Internally an adapter will be created with 'data' and added to 'handle'
 * All other argument are required to find the correct factory
 * @param {AdapterHandle} handle The AdapterHandle to be updated
 * @param {Object} adapterType The type / aspect of the adapter (e.g. XML3D.data or XML3D.webgl)
 * @param {number} canvasId Id of corresponding canvas handler. 0 if not dependent of canvas handler
 * @param {FormatHandler} format Format handler of the corresponding document
 * @param {Object} data Data for this handle. Possibly a DOM element
 */
function updateHandle(handle, adapterType, canvasId, format, data) {
    var adapter = format.getAdapter(data, adapterType, canvasId);
    if (adapter) {
        handle.setAdapter(adapter, AdapterHandle.STATUS.READY);
    }
}

/**
 * Update all handles of a part from an external document
 * @param {URI} uri The URI of the document
 * @param {Object} docCache The entry in the c_documentCache for the external document
 */
function updateExternalHandles(uri, docCache) {
    // get part of the resource represented by the fragment
    var data = docCache.handler.getFragmentData(docCache.document, uri.fragment);
    if (data) {
        updateMissingHandles(uri, docCache.handler, data);
    } else {
        invalidateHandles(uri);
    }
}

/**
 * Update all AdapterHandles without adapters of a certain url
 * @param {URI} uri The complete url + fragment
 * @param {FormatHandler} formatHandler Format handler
 * @param {Object} data Data of the document corresponding to the url. Possibly a DOM element
 */
function updateMissingHandles(uri, formatHandler, data) {
    var url = uri.toString();
    for (var adapterType in c_cachedAdapterHandles[url]) {
        for (var canvasId in c_cachedAdapterHandles[url][adapterType]) {
            var handle = c_cachedAdapterHandles[url][adapterType][canvasId];
            if (!handle.hasAdapter()) {
                updateHandle(handle, adapterType, +canvasId, formatHandler, data);
                if(!uri.isLocal())
                    ResourceCounter.resolvePendingResource(uri, canvasId);
            }
        }
    }
}

/**
 * Invalidate all AdapterHandles without adapters of a certain url
 * @param {URI} uri The complete url + fragment
 */
function invalidateHandles(uri) {
    var url = uri.toString();
    for (var adapterType in c_cachedAdapterHandles[url]) {
        for (var canvasId in c_cachedAdapterHandles[url][adapterType]) {
            var handle = c_cachedAdapterHandles[url][adapterType][canvasId];
            handle.setAdapter(null, AdapterHandle.STATUS.NOT_FOUND);
            ResourceCounter.resolvePendingResource(uri, canvasId);
        }
    }
}

/**
 * Invalidate all handles of a document, that could not be loaded.
 * @param {URI} uri The URI of the document
 */
function invalidateDocumentHandles(uri) {
    var url = uri.toStringWithoutFragment();
    var docCache = getDocumentCache(url);
    if (!docCache) {
        // The document was never loaded
        invalidateHandles(uri);
        return;
    }
    var fragments = docCache.fragments;
    docCache.fragments = [];
    for (var i = 0; i < fragments.length; ++i) {
        invalidateHandles(uri);
    }
}

/**
 * Update all existing handles of a received document
 * @param {URI} uri The URI of the document
 */
function updateDocumentHandles(uri) {
    var url = uri.toString();
    var docCache = getDocumentCache(url);
    var fragments = docCache.fragments;
    docCache.fragments = [];
    var tempUri = new URI(uri);
    for (var i = 0; i < fragments.length; ++i) {
        tempUri.fragment = fragments[i];
        updateExternalHandles(tempUri, docCache);
    }
}


/**
 * This function is called to load an Image.
 *
 * @param {URI} uri Image URI
 * @param {function(Event, HTMLImageElement)} loadListener Function called when image was successfully loaded.
 *                                It will be called with event as the first and image as the second parameter.
 * @param {function(Event, HTMLImageElement)} errorListener Function called when image could not be loaded.
 *                                 It will be called with event as the first and image as the second parameter.
 * @return {HTMLImageElement}
 */
Resource.getImage = function(uri, loadListener, errorListener) {
    // we use canvasId 0 to represent images loaded in a document
    ResourceCounter.addPendingResource(uri, 0);

    var image = new Image();
    if(!uri.hasSameOrigin(document.location.href)) {
        image.crossOrigin = Options.getValue(OPTION_RESOURCE_CORS);
    }

    image.onload = function(e) {
        loadListener(e, image);
        ResourceCounter.resolvePendingResource(uri, 0);
    };
    image.onerror = function(e) {
        if (image.crossOrigin) {
            XML3D.debug.logIssue("May have attempted to use a cross-origin texture without proper cross-origin handling.", 164);
        }
        errorListener(e, image);
        ResourceCounter.resolvePendingResource(uri, 0);
    };

    image.src = uri.toString(); // here loading starts
    return image;
};

/**
 * This function is called to load a Video.
 *
 * @param {URI} uri Video URI
 * @param {boolean} autoplay
 * @param {boolean} loop
 * @param {Object} listeners  Dictionary of all listeners to register with video element.
 *                            Listeners will be called with event as the first and video as the second parameter.
 * @return {HTMLVideoElement}
 */
Resource.getVideo = function(uri, autoplay, loop, muted, listeners) {
    // we use canvasId 0 to represent videos loaded in a document
    ResourceCounter.addPendingResource(uri, 0);

    // FIXME: In HTML, we create a configured video, play/pause won't work
    var video = document.createElement("video");
    if (!uri.hasSameOrigin(document.location.href)) {
        video.crossOrigin = Options.getValue(OPTION_RESOURCE_CORS);
    }

    var loadCompleteCallback = function(event) {
        if (video.crossOrigin && event.type === "error") {
            XML3D.debug.logIssue("May have attempted to use a cross-origin texture without proper cross-origin handling.", 164);
        }
        ResourceCounter.resolvePendingResource(uri, 0);
        video.removeEventListener("canplay", loadCompleteCallback, true);
        video.removeEventListener("error", loadCompleteCallback, true);
    };


    video.autoplay = autoplay;
    video.loop = loop;
    video.muted = muted;

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
};


module.exports = Resource;
