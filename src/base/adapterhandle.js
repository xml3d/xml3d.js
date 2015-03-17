var Events = require("../interface/notification.js");

"use strict";
/**
 * An adapter handle is a connection piece for an adapter that is referred through a uri (e.g. id reference)
 * AdapterHandles are always fetched from the Resource object
 * @constructor
 */
var AdapterHandle = function(url) {
    this.url = url;
    this.adapter = null;
    this.listeners = [];
    this.status = 0; // STATUS.LOADING
};

/**
 * Enumaeration of states for the adapter handle
 * @enum {number}
 */
AdapterHandle.STATUS = {
    LOADING: 0,
    NOT_FOUND: 1,
    READY: 2
};

/**
 * @returns {Boolean} true iff an adapter is available
 */
AdapterHandle.prototype.hasAdapter = function() {
    return this.adapter != null;
};

/**
 * @returns {?XML3D.base.Adapter} the adapter connected to the handle. Can be null
 */
AdapterHandle.prototype.getAdapter = function() {
    return this.adapter;
};

/**
 * Note: this function should only be called by Resource
 * @param {XML3D.base.Adapter} adapter The adapter connected to the AdapterHandler
 * @param {AdapterHandle.STATUS} status
 */
AdapterHandle.prototype.setAdapter = function(adapter, status) {
    this.adapter = adapter;
    this.status = status;
    this.notifyListeners(Events.ADAPTER_HANDLE_CHANGED);
};

/**
 * This function is called to notify all listeners of this AdapterHandle about some change.
 * @param {number} type A type number with the type of change (usually Events.ADAPTER_HANDLE_CHANGED)
 */
AdapterHandle.prototype.notifyListeners = function(type) {
    var event = new Events.AdapterHandleNotification(this, type);
    var i = this.listeners.length;
    while (i--) {
        this.listeners[i](event);
    }
};

/**
 * Add a listener to the AdapterHandle that is notified about changes.
 * Listeners cannot be inserted twice.
 * @param {Function} listener - Function to be called when something concering the adapter changes
 */
AdapterHandle.prototype.addListener = function(listener) {
    var idx = this.listeners.indexOf(listener);
    if (idx == -1)
        this.listeners.push(listener);
};

/**
 * Remove a listener from the AdapterHandle
 * @param {Function} listener
 */
AdapterHandle.prototype.removeListener = function(listener) {
    var idx = this.listeners.indexOf(listener);
    if (idx != -1)
        this.listeners.splice(idx, 1);
};

module.exports = AdapterHandle;