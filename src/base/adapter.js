//-----------------------------------------------------------------------------
// Adapter and Adapter factory
//-----------------------------------------------------------------------------

xml3d.data = xml3d.data || {};

xml3d.data.Adapter = function(factory, node) {
    this.factory = factory; // optional
    this.node = node; // optional
    this.init = function() {
        // Init is called by the factory after adding the adapter to the node
    };
};

xml3d.data.Adapter.prototype.notifyChanged = function(e) {
    // Notification from the data structure. e is of type
    // xml3d.Notification.
};
xml3d.data.Adapter.prototype.isAdapterFor = function(aType) {
    return false; // Needs to be overwritten
};

xml3d.data.AdapterFactory = function() {
};

xml3d.data.AdapterFactory.prototype.getAdapter = function(node, atype) {
    if (!node || node._configured === undefined)
        return null;
    var elemHandler = node._configured;
    var realType = atype || this.name;
    var adapter = elemHandler.adapters[realType];
    if(adapter !== undefined)
        return adapter;
    
    // No adapter found, try to create one
    adapter = this.createAdapter(node);
    if (adapter) {
        elemHandler.adapters[realType] = adapter;
        adapter.init();
    }
    return adapter;
};

xml3d.data.AdapterFactory.prototype.createAdapter = function(node) {
    return null;
};
