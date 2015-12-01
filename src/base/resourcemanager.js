"use strict";

var AdapterHandle = require("./adapterhandle.js");
var URIResolver = require("../utils/uri.js").URIResolver;
var URI = require("../utils/uri.js").URI;
var Options = require("../utils/options.js");

var OPTION_RESOURCE_CORS = "resource-crossorigin-attribute";
Options.register(OPTION_RESOURCE_CORS, "anonymous");

var c_cachedAdapterHandles = {};
var c_canvasIdCounters = {};


/**
 * @constructor
 */
var Resource = {};

function getCounterObject(canvasId) {
    return c_canvasIdCounters[canvasId];
}

function getOrCreateCounterObject(canvasId) {
    var counterObject = c_canvasIdCounters[canvasId];
    if (!counterObject) {
        counterObject = {counter: 0, listeners: []};
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

function loadComplete(canvasId) {
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

Resource.isLoadComplete = function(canvasId) {
    var counterObject = getCounterObject(canvasId);
    return !counterObject || counterObject.counter == 0;
};

/*
 * Register listener that will be fired when all resources for specified canvasId are loaded.
 * Listener is fired only once.
 *
 * @param {number} canvasId
 * @param {EventListener} listener
 */
Resource.addLoadCompleteListener = function(canvasId, listener) {
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

//noinspection JSUnusedGlobalSymbols
/**
 *
 * @param {number} canvasId
 * @param {function} listener
 */
Resource.removeLoadCompleteListener = function(canvasId, listener) {
    var counterObject = getCounterObject(canvasId);
    if (counterObject) {
        var idx = counterObject.listeners.indexOf(listener);
        if (idx != -1)
            counterObject.listeners.splice(idx, 1);
    }
};

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
    if (!docCache) {
        // The document was never loaded
        invalidateHandles(url);
        return;
    }
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

    var response = c_cachedDocuments[url].document;
    var format = c_cachedDocuments[url].handler;

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
 * @param {Object} data Data of the document corresponding to the url. Possibly a DOM element
 * @param {boolean?} localChange If true, then this is about a local id change. do not call loadComplete
 */
function updateMissingHandles(url, formatHandler, data, localChange) {
    for (var adapterType in c_cachedAdapterHandles[url]) {
        for (var canvasId in c_cachedAdapterHandles[url][adapterType]) {
            var handle = c_cachedAdapterHandles[url][adapterType][canvasId];
            if (!handle.hasAdapter()) {
                updateHandle(handle, adapterType, +canvasId, formatHandler, data);
                if(!localChange) loadComplete(canvasId);
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
            handle.setAdapter(null, AdapterHandle.STATUS.NOT_FOUND);
            loadComplete(canvasId);
        }
    }
}

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
 * Remove the adapter of all AdapterHandles corresponding to the given URL.
 * This is called e.g. when a node is remove from the document, or an id changes
 * @param {string} url The URL of all AdapterHandles to be cleared.
 */
function clearHandles(url) {
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
 * Get any adapter, internal or external.
 * This function will trigger the loading of documents, if required.
 * An AdapterHandle will be always be returned, expect when an invalid (empty) uri is passed.
 *
 * @param {String} baseURI - the base URI from which to look up the reference
 * @param {URI} uri - The URI used to find the referred AdapterHandle. Can be relative
 * @param {string} nodeName The tag name of the element referencing this adapter handle
 * @param {Object} adapterType The type of adapter required (e.g. XML3D.data or XML3D.webgl)
 * @param {number=} canvasId Id of GLCanvasHandler handler this adapter depends on, 0 if not depending on any GLCanvasHandler
 * @returns {?AdapterHandle} The requested AdapterHandler. Note: might be null
 */
Resource.getAdapterHandle = function(baseURI, uri, adapterType, canvasId, nodeName) {
    canvasId = canvasId || 0;
    uri = Resource.getAbsoluteURI(baseURI, uri);

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

    handle = new AdapterHandle(uri);
    c_cachedAdapterHandles[uri][adapterType][canvasId] = handle;

    if (uri.isLocal()) {
        var node = URIResolver.resolveLocal(uri);
        if (node)
            updateHandle(handle, adapterType, canvasId, XML3D.xml3dFormatHandler, node);
        else
            handle.setAdapter(null, AdapterHandle.STATUS.NOT_FOUND);
    }
    else {
        var counterObject = getOrCreateCounterObject(canvasId);
        counterObject.counter++;

        var docURI = uri.toStringWithoutFragment();
        var docData = c_cachedDocuments[docURI];
        if (docData && docData.document) {
            updateExternalHandles(docURI, uri.fragment);
        } else {
            if (!docData) {
                var acceptType = getAcceptTypeForNode(nodeName, docURI);
                var priority = adapterType === "scene" ? 1 : 0; //Give materials a higher priority
                //TODO: We need to ensure we pass the full original uri here. Right now we trim the fragment and this leads
                // to inconsistencies in the document cache
                XML3D.resource.getDocument(docURI, {"Accept" : acceptType, priority : priority}).then(function(doc) {
                    if (doc) {
                        docData = c_cachedDocuments[docURI];
                        docData.fragments.push(uri.fragment);
                        updateDocumentHandles(docURI);
                    } else {
                        invalidateDocumentHandles(uri.toString()); //URL with fragment
                    }
                }).catch(function(e) {
                    XML3D.debug.logError(e.toString());
                    invalidateDocumentHandles(uri.toString());
                });

            }

        }
    }
    return handle;
};

function getAcceptTypeForNode(nodeName, uri) {
    nodeName = nodeName || "";
    switch(nodeName.toLowerCase()) {
        case "model":
            return "model/vnd.xml3d.model+xml";
        case "mesh":
        case "data":
            if (uri.path && uri.path.match(/\.json/)) {
                return "model/vnd.xml3d.mesh+json";
            } else {
                return "model/vnd.xml3d.mesh+xml";
            }
        default:
            return "model/vnd.xml3d.mesh+xml";
    }
}

/**
 * Get any adapter, internal or external.
 *
 * @param node
 * @param adapterType
 * @param canvasId
 * @return {?XML3D.base.Adapter}
 */
Resource.getAdapter = function(node, adapterType, canvasId) {
    return XML3D.xml3dFormatHandler.getAdapter(node, adapterType, canvasId);
};

/**
 * This function is called when an id of an element changes or if that element is now reachable
 * or not reachable anymore. It will update all AdapterHandles connected to the element.
 * @param {Element} node Element of which id has changed
 * @param {string} previousId Previous id of element
 * @param {string} newId New id of element
 */
Resource.notifyNodeIdChange = function(node, previousId, newId) {
    var parent = node;
    while (parent.parentNode) parent = parent.parentNode;
    if (parent != window.document)
        return;

    // clear cached adapters of previous id"
    if (previousId) {
        clearHandles("#" + previousId);
    }
    if (newId) {
        updateMissingHandles("#" + newId, XML3D.xml3dFormatHandler, node, true);
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
    getOrCreateCounterObject(0).counter++;

    var image = new Image();
    image.onload = function(e) {
        loadListener(e, image);
        loadComplete(0);
    };
    image.onerror = function(e) {
        errorListener(e, image);
        loadComplete(0);
    };
    if(!uri.hasSameOrigin(document.location.href)) {
        image.crossOrigin = Options.getValue(OPTION_RESOURCE_CORS);
        XML3D.debug.logWarning("You are using an cross-origin image as texture. This might cause troubles cause the canvas is 'tainted'.")
    }

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
    getOrCreateCounterObject(0).counter++;

    // FIXME: In HTML, we create a configured video, play/pause won't work
    var video = document.createElement("video");

    var loadCompleteCallback = function(event) {
        loadComplete(0);
        video.removeEventListener("canplay", loadCompleteCallback, true);
        video.removeEventListener("error", loadCompleteCallback, true);
    };

    if (!uri.hasSameOrigin(document.location.href)) {
        video.crossOrigin = Options.getValue(OPTION_RESOURCE_CORS);
        XML3D.debug.logWarning("You are using an cross-origin video as texture. This might cause troubles cause the canvas is 'tainted'.", uri)
    }

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

module.exports = {
    Resource: Resource
};
