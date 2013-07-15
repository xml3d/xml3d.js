(function() {

    /**
     * Types of change events
     * @enum {number}
     */
  var events = {
          NODE_INSERTED: 0,
          VALUE_MODIFIED:  1,
          NODE_REMOVED: 2,
          DANGLING_REFERENCE: 3,
          VALID_REFERENCE: 4,
          THIS_REMOVED: 5,
          ADAPTER_HANDLE_CHANGED: 6,
          ADAPTER_VALUE_CHANGED: 7
  };

  //-----------------------------------------------------------------------------
  //Class Notification
  //-----------------------------------------------------------------------------
  events.Notification = function(type) {
      this.type = type;
  };
  var Np = events.Notification.prototype;
  Np.toString = function() {
    return "Notification (type:" + this.type + ")";
  };
  //-----------------------------------------------------------------------------
  events.NotificationWrapper = function(evt, type) {
      this.wrapped = evt;
      this.type = type;
  };
  XML3D.createClass(events.NotificationWrapper, events.Notification);
  var NWp = events.NotificationWrapper.prototype;
  NWp.toString = function() {
      return "NotificationWrapper (type:" + this.type + ", wrapped: "+ this.wrapped +")";
  };

  //-----------------------------------------------------------------------------

  events.AdapterHandleNotification = function(handle, type) {
    this.adapterHandle = handle;
    this.type = type;
  };
  XML3D.createClass(events.AdapterHandleNotification, events.Notification);
  events.AdapterHandleNotification.prototype.toString = function() {
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

  XML3D.events = XML3D.events || {};
  XML3D.extend(XML3D.events, events);

}());