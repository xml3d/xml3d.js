//-----------------------------------------------------------------------------
// Adapter and Adapter factory
//-----------------------------------------------------------------------------
XML3D.base = {
    toString : function() {
        return "base";
    }
};

/**
 * @constructor
 * @param {XML3D.base.IFactory=} factory
 * @param {Object=} node
 */
XML3D.base.Adapter = function(factory, node) {
    this.factory = factory; // optional
    this.node = node; // optional
};

XML3D.base.Adapter.prototype.init = function() {
// Init is called by the factory after adding the adapter to the node
};

XML3D.base.Adapter.prototype.notifyChanged = function(e) {
// Notification from the data structure. e is of type
// XML3D.Notification.
};
XML3D.base.Adapter.prototype.isAdapterFor = function(aType) {
    return false; // Needs to be overwritten
};

/**
 * @interface
 */
XML3D.base.IFactory = function() {};
/**
 * @param {Object} obj
 * @returns {boolean}
 */
XML3D.base.IFactory.prototype.isFactoryFor = function(obj) {};
/** @type {string} */
XML3D.base.IFactory.prototype.type;

/**
 * @constructor
 * @implements {XML3D.base.IFactory}
 */
XML3D.base.AdapterFactory = function() {
    this.type = "";
};

XML3D.base.AdapterFactory.prototype.isFactoryFor = function(obj) {
    return false;
};

XML3D.base.AdapterFactory.prototype.getAdapter = function(node, atype) {
    if (!node || node._configured === undefined)
        return null;
    var elemHandler = node._configured;
    var realType = atype || this.type;
    var adapter = elemHandler.adapters[realType];
    if (adapter !== undefined)
        return adapter;

    // No adapter found, try to create one
    adapter = this.createAdapter(node);
    if (adapter) {
        elemHandler.adapters[realType] = adapter;
        adapter.init();
    }
    return adapter;
};

XML3D.base.AdapterFactory.prototype.createAdapter = function(node) {
    return null;
};
