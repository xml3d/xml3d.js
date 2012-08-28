(function() {

    /**
     * @extends XML3D.data.Adapter
     * @implements {IDataAdapter}
     * @constructor
     */
    var ProxyAdapter = function() {
        XML3D.data.Adapter.call(this);
        this.parents = [];
        var empty = {};
        this.getOutputs = function() {
            return empty;
        };
    };
    XML3D.createClass(ProxyAdapter, XML3D.data.Adapter);

    ProxyAdapter.prototype.addParentAdapter = function(adapter) {
        this.parents.push(adapter);
    };

    /**
     * @param {IDataAdapter} adapter
     */
    ProxyAdapter.prototype.setRealAdapter = function(adapter) {
        var real = adapter;
        this.getOutputs = function() {
            return real.getOutputs();
        };
        for ( var i = 0, j = this.parents.length; i < j; i++) {
            this.parents[i].notifyChanged();
        }
    };
    // Export
    XML3D.data.ProxyAdapter = ProxyAdapter;

}());