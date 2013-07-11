XML3D.data = XML3D.data || {};

(function() {


XML3D.data.xflowGraph = new Xflow.Graph();

/**
 * @interface
 */
var IDataAdapter = function() {
};
IDataAdapter.prototype.getOutputs = function() {
};
IDataAdapter.prototype.addParentAdapter = function(adapter) {
};

/**
 * Constructor of XML3D.data.DataAdapter The DataAdapter implements the
 * DataCollector concept and serves as basis of all DataAdapter classes. In
 * general, a DataAdapter is associated with an element node which uses
 * generic data and should be instantiated via
 * XML3D.data.XML3DDataAdapterFactory to ensure proper functionality.
 *
 * @extends XML3D.base.Adapter
 * @implements IDataAdapter
 * @constructor
 *
 * @param factory
 * @param node
 */
XML3D.data.DataAdapter = function(factory, node) {
    XML3D.base.NodeAdapter.call(this, factory, node);

    // Node handles for src and proto
    this.handles = {};
    this.xflowDataNode = null;
};
XML3D.createClass(XML3D.data.DataAdapter, XML3D.base.NodeAdapter);

XML3D.data.DataAdapter.prototype.init = function() {
    //var xflow = this.resolveScript();
    //if (xflow)
    //    this.scriptInstance = new XML3D.data.ScriptInstance(this, xflow);

    var protoNode = (this.node.localName == "proto");
    this.xflowDataNode = XML3D.data.xflowGraph.createDataNode(protoNode);

    this.updateHandle("src");
    this.updateHandle("proto");
    this.xflowDataNode.setFilter(this.node.getAttribute("filter"));
    this.xflowDataNode.setCompute(this.node.getAttribute("compute"));
    recursiveDataAdapterConstruction(this);

};

function recursiveDataAdapterConstruction(adapter){
    for ( var child = adapter.node.firstElementChild; child !== null; child = child.nextElementSibling) {
        var subadapter = adapter.factory.getAdapter(child);
        if(subadapter){
            adapter.xflowDataNode.appendChild(subadapter.getXflowNode());
        }
    }
}

XML3D.data.DataAdapter.prototype.getXflowNode = function(){
    return this.xflowDataNode;
}

XML3D.data.DataAdapter.prototype.getComputeRequest = function(filter, callback){
    return new Xflow.ComputeRequest(this.xflowDataNode, filter, callback);
}

XML3D.data.DataAdapter.prototype.getComputeResult = function(filter)
{
    var result = this.xflowDataNode._getResult(Xflow.RESULT_TYPE.COMPUTE, filter);
    return result;
}

XML3D.data.DataAdapter.prototype.getOutputNames = function()
{
    return this.xflowDataNode.getOutputNames();
}

XML3D.data.DataAdapter.prototype.getOutputChannelInfo = function(name)
{
    return this.xflowDataNode.getOutputChannelInfo(name);
}

/**
 * The notifyChanged() method is called by the XML3D data structure to
 * notify the DataAdapter about data changes (DOM mustation events) in its
 * associating node. When this method is called, all observers of the
 * DataAdapter are notified about data changes via their notifyDataChanged()
 * method.
 *
 * @param evt notification of type XML3D.Notification
 */
XML3D.data.DataAdapter.prototype.notifyChanged = function(evt) {
    if(evt.type == XML3D.events.ADAPTER_HANDLE_CHANGED){
        this.connectedAdapterChanged(evt.key, evt.adapter);
        if(evt.handleStatus == XML3D.base.AdapterHandle.STATUS.NOT_FOUND){
            XML3D.debug.logError("Could not find <data> element of url '" + evt.url + "' for " + evt.key);
        }
        return;
    }
    else if (evt.type == XML3D.events.NODE_INSERTED) {
        var insertedNode = evt.wrapped.target;
        var insertedXflowNode = this.factory.getAdapter(insertedNode).getXflowNode();
        var sibling = insertedNode, followUpAdapter = null;
        do{
            sibling = sibling.nextSibling;
        }while(sibling && !(followUpAdapter = this.factory.getAdapter(sibling)))
        if(followUpAdapter)
            this.xflowDataNode.insertBefore(insertedXflowNode, followUpAdapter.getXflowNode());
        else
            this.xflowDataNode.appendChild(insertedXflowNode);
        return;
    }
    else if (evt.type == XML3D.events.NODE_REMOVED) {
        var removedXflowNode = this.factory.getAdapter(evt.wrapped.target).getXflowNode();
        this.xflowDataNode.removeChild(removedXflowNode);
        return;
    } else if (evt.type == XML3D.events.VALUE_MODIFIED) {
        var attr = evt.wrapped.attrName;
        if(attr == "filter"){
            this.xflowDataNode.setFilter(this.node.getAttribute(attr))
        }
        else if(attr == "compute"){
            this.xflowDataNode.setCompute(this.node.getAttribute(attr))
        }
        else if(attr == "src" || attr == "proto"){
            this.updateHandle(attr);
        }
        return;
    } else if (evt.type == XML3D.events.THIS_REMOVED) {
        this.clearAdapterHandles();
    }
};

function updateLoadState(dataAdpater){
    var loading = false;
    var handle = dataAdpater.getAdapterHandle(dataAdpater.node.getAttribute("src"));
    if(handle && handle.status == XML3D.base.AdapterHandle.STATUS.LOADING){
        loading = true;
    }
    var handle = dataAdpater.getAdapterHandle(dataAdpater.node.getAttribute("proto"));
    if(handle && handle.status == XML3D.base.AdapterHandle.STATUS.LOADING){
        loading = true;
    }
    dataAdpater.xflowDataNode.setLoading(loading);
}

XML3D.data.DataAdapter.prototype.updateHandle = function(attributeName) {
    var adapterHandle = this.getAdapterHandle(this.node.getAttribute(attributeName));
    if(adapterHandle && adapterHandle.status == XML3D.base.AdapterHandle.STATUS.NOT_FOUND){
        XML3D.debug.logError("Could not find <data> element of url '" + adapterHandle.url + "' for " + attributeName);
    }

    this.connectAdapterHandle(attributeName, adapterHandle);
    this.connectedAdapterChanged(attributeName, adapterHandle ? adapterHandle.getAdapter() : null);
    updateLoadState(this);
};

XML3D.data.DataAdapter.prototype.connectedAdapterChanged = function(key, adapter) {
    if(key == "src"){
        this.xflowDataNode.sourceNode = adapter ? adapter.getXflowNode() : null;
    }
    if(key == "proto"){
        this.xflowDataNode.protoNode = adapter ? adapter.getXflowNode() : null;
    }
    updateLoadState(this);
};
/**
 * Returns String representation of this DataAdapter
 */
XML3D.data.DataAdapter.prototype.toString = function() {
    return "XML3D.data.DataAdapter";
};

}());
