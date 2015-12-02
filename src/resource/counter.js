
// External resources that haven't been fetched yet, per canvasId. When this reaches 0 the "load" event is dispatched
var c_pendingResources = {};

var ResourceCounter = {};

ResourceCounter.addPendingResource = function(uri, canvasId) {
    ResourceCounter.getOrCreatePendingResources(canvasId).entries.push(uri.toString());
};

ResourceCounter.resolvePendingResource = function(uri, canvasId) {
    // notify all load complete listeners
    var url = uri.toString();
    var pendingResources = c_pendingResources[canvasId];
    if (pendingResources) {
        Array.erase(pendingResources.entries, url);
        if (pendingResources.entries.length == 0) {
            ResourceCounter.notifyLoadCompleteListeners(pendingResources);
        }
    }
};

ResourceCounter.getOrCreatePendingResources = function(canvasId) {
    var pendingResources = c_pendingResources[canvasId];
    if (!pendingResources) {
        pendingResources = {entries: [], listeners: []};
        c_pendingResources[canvasId] = pendingResources;
    }
    return pendingResources;
};

ResourceCounter.notifyLoadCompleteListeners = function(pendingResources) {
    var listeners = pendingResources.listeners;
    var i = listeners.length;
    while (i--) {
        listeners[i](this);
    }
};

ResourceCounter.isLoadComplete = function(canvasId) {
    return !c_pendingResources[canvasId] || c_pendingResources[canvasId].entries.length == 0;
};

/*
 * Register listener that will be fired when all resources for specified canvasId are loaded.
 * Listener is fired only once.
 *
 * @param {number} canvasId
 * @param {EventListener} listener
 */
ResourceCounter.addLoadCompleteListener = function(canvasId, listener) {
    var pendingResources = ResourceCounter.getOrCreatePendingResources(canvasId);
    var idx = pendingResources.listeners.indexOf(listener);
    if (idx == -1) {
        pendingResources.listeners.push(listener);
    }
};

/**
 *
 * @param {number} canvasId
 * @param {function} listener
 */
ResourceCounter.removeLoadCompleteListener = function(canvasId, listener) {
    var pendingResources = c_pendingResources[canvasId];
    if (pendingResources) {
        var idx = pendingResources.listeners.indexOf(listener);
        if (idx != -1)
            pendingResources.listeners.splice(idx, 1);
    }
};

module.exports = ResourceCounter;

