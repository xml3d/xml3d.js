var DataNode = require("../../xflow/interface/graph.js").DataNode;
var dispatchCustomEvent = require("../../utils/misc.js").dispatchCustomEvent;
var NodeAdapter = require("../../base/adapter.js").NodeAdapter;
var createClass = XML3D.createClass;
var AdapterHandle = require("../../base/adapterhandle.js");
var InputNode = require("../../xflow/interface/graph.js").InputNode;
var BufferEntry = require("../../xflow/interface/data.js").BufferEntry;
var XC = require("../../xflow/interface/constants.js");


var XML3DDataAdapter= function (factory, node) {
    NodeAdapter.call(this, factory, node);
    this.xflowDataNode = null; //System parameters
};
createClass(XML3DDataAdapter, NodeAdapter);

XML3DDataAdapter.prototype.init = function()
{
	this.xflowDataNode = new DataNode(false);
    this.xflowDataNode.addLoadListener(this.onXflowLoadEvent.bind(this));
    this.xflowDataNode.userData = this.node;
	this.setDefaultValues();
    
    this.xflowDataNode.setPlatform(this.node.getAttribute("platform"));

    this.updateAdapterHandle("src", this.node.getAttribute("src"));
    if(!this.assetData){
        this.xflowDataNode.setFilter(this.node.getAttribute("filter"));
    }
   
	
};

XML3DDataAdapter.prototype.setDefaultValues = function(){
	var inputNode = new InputNode();
    inputNode.name="_system_time";
    inputNode.data = new BufferEntry(XC.DATA_TYPE.FLOAT, new Float32Array([0.0]));
    this.xflowDataNode.appendChild(inputNode);
}

XML3DDataAdapter.prototype.updateAdapterHandle = function(key, url) {
    var oldAdapterHandle = this.getConnectedAdapterHandle(key);

    var adapterHandle = this.getAdapterHandle(url),
        status = (adapterHandle && adapterHandle.status);

    if(oldAdapterHandle == adapterHandle)
        return;
    if (status === AdapterHandle.STATUS.NOT_FOUND) {
        XML3D.debug.logError("Could not find element of url '" + adapterHandle.url + "' for " + key, this.node);
    }
    this.connectAdapterHandle(key, adapterHandle);
    this.connectedAdapterChanged(key, adapterHandle ? adapterHandle.getAdapter() : null, status);
};

XML3DDataAdapter.prototype.onXflowLoadEvent = function(node, newLevel, oldLevel){
    if(newLevel == Infinity){
        dispatchCustomEvent(this.node, 'load', false, true, null);
    }
    else if(newLevel > oldLevel){
        dispatchCustomEvent(this.node, 'progress', false, true, null);
    }
};
XML3DDataAdapter.prototype.getDataComplete = function(){
    return this.xflowDataNode.getProgressLevel() == Infinity;
};
XML3DDataAdapter.prototype.getDataProgressLevel = function(){
    return this.xflowDataNode.getProgressLevel();
};



module.exports = XML3DDataAdapter;
