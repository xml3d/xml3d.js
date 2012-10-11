(function() {

    /**
     * @constructor
     */
    var AdapterHandle = function() {
        this.adapter = null;
        this.listeners = [];
    };

    /**
     * @returns {Boolean}
     */
    AdapterHandle.prototype.hasAdapter = function() {
        return this.adapter != null;
    };

    /**
     * @returns {XML3D.base.Adapter}
     */
    AdapterHandle.prototype.getAdapter = function() {
        return this.adapter;
    };

    /**
     * @param {XML3D.base.Adapter}
     */
    AdapterHandle.prototype.setAdapter = function(adapter) {
        this.adapter = adapter;
        this.notifyListeners(XML3D.events.ADAPTER_HANDLE_CHANGED);
    };

    AdapterHandle.prototype.notifyListeners = function(type){
        var event = new XML3D.events.AdapterHandleNotification(this, type);
        var i = this.listeners.length;
        while (i--) {
            this.listeners[i](event);
        }
    }

    /**
     * @param {Object} listener
     */
    AdapterHandle.prototype.addListener = function(listener) {
        var idx = this.listeners.indexOf(listener);
        if (idx == -1)
            this.listeners.push(listener);
    };

    /**
     * @param {Object} listener
     */
    AdapterHandle.prototype.removeListener = function(listener) {
        var idx = this.listeners.indexOf(listener);
        if (idx != -1)
            this.listeners.splice(idx, 1);
    };

    // Export
    XML3D.base.AdapterHandle = AdapterHandle;

}());