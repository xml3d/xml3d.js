(function() {


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
 * @param {XML3D.base.AdapterFactory} factory
 */
XML3D.base.Adapter = function(factory) {
    this.factory = factory;
};

/**
 * Connect an adapterHandle to a certain key.
 * This will enable the ConnectedAdapterNotifcations for notifyChanged.
 * @param {string} key - the key that will also be provided in connectAdapterChanged callback
 * @param {XML3D.base.AdapterHandle} adapterHandle handle of adapter to be added
 */
XML3D.base.Adapter.prototype.connectAdapterHandle = function(key, adapterHandle){
    if(!this.connectedAdapterHandles){
        this.connectedAdapterHandles = {};
        this._bindedAdapterHandleCallback = adapterHandleCallback.bind(this);
    }
    for(var i in this.connectedAdapterHandles){
        this.connectedAdapterHandles[i].removeListener(this._bindedAdapterHandleCallback);
    }
    if(adapterHandle)
        this.connectedAdapterHandles[key] = adapterHandle;
    else
        delete this.connectedAdapterHandles[key];
    for(var i in this.connectedAdapterHandles){
        this.connectedAdapterHandles[i].addListener(this._bindedAdapterHandleCallback);
    }
}

/**
* Get the connected AdapterHandle of a certain key.
* This will only return AdapterHandles previously added via connectAdapterHandle
* @param {string} key
* @return {XML3D.base.AdapterHandle=} the adapter of that key, or null if not available
*/
XML3D.base.Adapter.prototype.getConnectedAdapterHandle = function(key){
    return this.connectedAdapterHandles && this.connectedAdapterHandles[key];
}


/**
 * Get the connected adapter of a certain key.
 * This will only return adapters of AdapterHandles previously added via connectAdapter
 * @param {string} key
 * @return {XML3D.base.Adapter=} the adapter of that key, or null if not available
 */
XML3D.base.Adapter.prototype.getConnectedAdapter = function(key){
    var handle = this.getConnectedAdapterHandle(key);
    return handle && handle.getAdapter();
}



function adapterHandleCallback(evt){
    for(var key in this.connectedAdapterHandles){
        if(this.connectedAdapterHandles[key] == evt.adapterHandle){
            var subEvent = new XML3D.events.ConnectedAdapterNotification(key, evt)
            this.notifyChanged(subEvent);
        }
    }
}



/**
 * @constructor
 * @param {XML3D.base.IFactory=} factory
 * @param {Object=} node
 */
XML3D.base.NodeAdapter = function(factory, node) {
    XML3D.base.Adapter.call(this, factory)
    this.node = node; // optional
};
XML3D.createClass(XML3D.base.NodeAdapter, XML3D.base.Adapter);

XML3D.base.NodeAdapter.prototype.init = function() {
  // Init is called by the factory after adding the adapter to the node
};

XML3D.base.NodeAdapter.prototype.notifyChanged = function(e) {
    // Notification from the data structure. e is of type
    // XML3D.Notification.
};

/**
 * @param {string,XML3D.URI} uri Uri to referred adapterHandle
 * @returns an AdapterHandle to the referredAdapter of the same aspect and canvasId
 */
XML3D.base.NodeAdapter.prototype.getAdapterHandle = function(uri){
    return XML3D.base.resourceManager.getAdapterHandle(this.node.ownerDocument, uri,
        this.factory.aspect, this.factory.canvasId);
}
/**
 * notifies all adapter that refer to this adapter through AdapterHandles.
 * @param {number,string} hint with type of change
 */
XML3D.base.NodeAdapter.prototype.notifyOppositeAdapters = function(type){
    return XML3D.base.resourceManager.notifyNodeAdapterChange(this.node,
        this.factory.aspect, this.factory.canvasId, type);
}


/**
 * @interface
 */
XML3D.base.IFactory = function() {};

/** @type {string} */
XML3D.base.IFactory.prototype.aspect;
XML3D.base.IFactory.prototype.canvasId;


/**
 * @constructor
 * @implements {XML3D.base.IFactory}
 */
XML3D.base.AdapterFactory = function(aspect, mimetype, canvasId) {
    this.aspect = aspect;
    this.canvasId = canvasId || 0;
    this.mimetype = mimetype;

    XML3D.base.registerFactory(mimetype, this, canvasId);
};

XML3D.base.AdapterFactory.prototype.createAdapter = function(obj) {
    return null;
};

/**
 * @constructor
 * @implements {XML3D.base.AdapterFactory}
 */
XML3D.base.NodeAdapterFactory = function(aspect, canvasId) {
    XML3D.base.AdapterFactory.call(this, aspect, "application/xml", canvasId);
};
XML3D.createClass(XML3D.base.NodeAdapterFactory, XML3D.base.AdapterFactory);

XML3D.base.NodeAdapterFactory.prototype.getAdapter = function(node) {
    if (!node || node._configured === undefined)
        return null;
    var elemHandler = node._configured;
    var key = this.aspect + "_" + this.canvasId;
    var adapter = elemHandler.adapters[key];
    if (adapter !== undefined)
        return adapter;

    // No adapter found, try to create one
    adapter = this.createAdapter(node);
    if (adapter) {
        elemHandler.adapters[key] = adapter;
        adapter.init();
    }
    return adapter;
};

}());
