(function() {

    /**
     * @constructor
     */
    var AdapterHandle = function() {
        this._adapter = null;
        this.listeners = [];
    };

    AdapterHandle.prototype.hasAdapter = function() {
        return this._adapter != null;
    }
    AdapterHandle.prototype.getAdapter = function() {
        return this._adapter;
    }
    AdapterHandle.prototype.setAdapter = function(adapter) {
        this._adapter = adapter;
        var i = this.listeners.length;
        while (i--) {
            this.listeners[i].referredAdapterChanged(this);
        }
    }

    AdapterHandle.prototype.addListener = function(adapter) {
        this.listeners.push(adapter);
    };

    AdapterHandle.prototype.removeListener = function(adapter) {
        var idx = this.listeners.indexOf(adapter);
        if (idx != -1)
            this.listeners.splice(idx, 1);
    };

    // Export
    XML3D.data.AdapterHandle = AdapterHandle;

}());