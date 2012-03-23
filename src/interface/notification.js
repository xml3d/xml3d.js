(function() {

    var events = {
            NODE_INSERTED: 0,
            VALUE_MODIFIED:  1,
            NODE_REMOVED: 2,
            DANGLING_REFERENCE: 3,
            VALID_REFERENCE: 4,
            THIS_REMOVED: 5
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
  events.NotificationWrapper = function(evt, type) {
      this.wrapped = evt;
      this.type = type;
  };
  var NWp = events.NotificationWrapper.prototype;

  NWp.toString = function() {
      return "NotificationWrapper (type:" + this.type + ", wrapped: "+ this.wrapped +")";
  };

  events.ReferenceNotification = function(element, attribute, uri) {
      this.relatedNode = element;
      this.attrName = attribute;
      this.value = null;

      if (typeof uri == 'string') {
          uri = new XML3D.URI(uri);
      }
      if (uri && uri.valid) {
          this.value = XML3D.URIResolver.resolve(uri);
          XML3D.debug.logDebug("Resolved node: " + this.value);
      }
      this.type = this.value ? events.VALID_REFERENCE : events.DANGLING_REFERENCE;
  };
  var RNp = events.ReferenceNotification.prototype;

  RNp.toString = function() {
      return "ReferenceNotification (type:" + this.type + ", value: "+ this.value +")";
  };


  XML3D.createClass(events.NotificationWrapper, events.Notification);

  XML3D.events = XML3D.events || {};
  XML3D.extend(XML3D.events, events);

}());