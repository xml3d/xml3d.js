
/**
 * Types of change events
 * @enum {number}
 */
var events = {
      NODE_INSERTED: 0,
      VALUE_MODIFIED:  1,
      NODE_REMOVED: 2,
      THIS_REMOVED: 3,
      ADAPTER_HANDLE_CHANGED: 4,
      ADAPTER_VALUE_CHANGED: 5
};

//-----------------------------------------------------------------------------
//Class Notification
//-----------------------------------------------------------------------------
events.Notification = function(type) {
    this.type = type;
};
events.Notification.prototype.toString = function() {
    return "Notification (type:" + this.type + ")";
};
//-----------------------------------------------------------------------------
events.NotificationWrapper = function(evt, type) {
  this.wrapped = evt;
  this.type = type;
};
XML3D.createClass(events.NotificationWrapper, events.Notification);
events.NotificationWrapper.prototype.toString = function() {
    return "NotificationWrapper (type:" + this.type + ", wrapped: "+ this.wrapped +")";
};

//-----------------------------------------------------------------------------

/**
 * @param {AdapterHandle} handle
 * @param {int} type
 * @constructor
 */
events.AdapterHandleNotification = function (handle, type) {
    this.adapterHandle = handle;
    this.type = type;
};
XML3D.createClass(events.AdapterHandleNotification, events.Notification);
events.AdapterHandleNotification.prototype.toString = function () {
    return "AdapterHandleNotification (type:" + this.type + ")";
};
//-----------------------------------------------------------------------------

events.ConnectedAdapterNotification = function(adapterHandleNotification, key) {
    this.adapter = adapterHandleNotification.adapterHandle.getAdapter();
    this.key = key;
    this.url = adapterHandleNotification.adapterHandle.url;
    this.type = adapterHandleNotification.type;
    this.handleStatus = adapterHandleNotification.adapterHandle.status;
};
XML3D.createClass(events.ConnectedAdapterNotification, events.Notification);
events.ConnectedAdapterNotification.prototype.toString = function() {
    return "ConnectedAdapterNotification (type:" + this.type + ", key: " + this.key + ")";
};

module.exports = events;