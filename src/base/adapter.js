//-----------------------------------------------------------------------------
// Adapter and Adapter factory
//-----------------------------------------------------------------------------

org.xml3d.data = org.xml3d.data || {};

org.xml3d.data.Adapter = function(factory, node) {
    this.factory = factory; // optional
    this.node = node; // optional
    this.init = function() {
        // Init is called by the factory after adding the adapter to the node
    };
};

org.xml3d.data.Adapter.prototype.notifyChanged = function(e) {
    // Notification from the data structure. e is of type
    // org.xml3d.Notification.
};
org.xml3d.data.Adapter.prototype.isAdapterFor = function(aType) {
    return false; // Needs to be overwritten
};

org.xml3d.data.AdapterFactory = function() {
};

org.xml3d.data.AdapterFactory.prototype.getAdapter = function(node, atype) {
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

org.xml3d.data.AdapterFactory.prototype.createAdapter = function(node) {
    return null;
};
