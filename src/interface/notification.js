(function() {

    var events = {
            NODE_INSERTED: 0,
            VALUE_MODIFIED:  1,
            NODE_REMOVED: 2,
            DANGLING_REFERENCE: 3,
            VALID_REFERENCE: 4
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
          uri = new xml3d.URI(uri);
      }
      if (uri && uri.valid) {
          this.value = xml3d.URIResolver.resolve(uri);
          console.log("Resolved node: " + this.value);
      }
      this.type = this.value ? events.VALID_REFERENCE : events.DANGLING_REFERENCE;
  };
  var RNp = events.ReferenceNotification.prototype;

  RNp.toString = function() {
      return "ReferenceNotification (type:" + this.type + ", value: "+ this.value +")";
  };


  xml3d.createClass(events.NotificationWrapper, events.Notification);

  xml3d.events = xml3d.events || {};
  xml3d.extend(xml3d.events, events);

}());