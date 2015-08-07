var DataNode = require("../../xflow/interface/graph.js").DataNode;
var dispatchCustomEvent = require("../../utils/misc.js").dispatchCustomEvent;
var URIResolver = require("../../utils/uri.js").URIResolver;
var NodeAdapter = require("../../base/adapter.js").NodeAdapter;
var createClass = XML3D.createClass;
var AdapterHandle = require("../../base/adapterhandle.js");
var InputNode = require("../../xflow/interface/graph.js").InputNode;
var BufferEntry = require("../../xflow/interface/data.js").BufferEntry;
var XC = require("../../xflow/interface/constants.js");
var Events = require("../../interface/notification.js");

// FIXME: Remove copied code! Rename to xml3d.js
/**
*
* @param {XML3DDataAdapterFactory} factory
* @param node
*/

var XML3DDataAdapter= function (factory, node) {
    NodeAdapter.call(this, factory, node);
    this.xflowDataNode = null; //System parameters
};
createClass(XML3DDataAdapter, NodeAdapter);

XML3DDataAdapter.prototype.init = function(){
    /**
     <data>
        <data src="#sys">
        <data src="#user">
     </data>
     */
	this.xflowDataNode = new DataNode(false);// This is higher level data node which contains both user and system data nodes
    this.xflowDataNode.addLoadListener(this.onXflowLoadEvent.bind(this));
    this.xflowDataNode.userData = this.node;
	this.setDefaultValues();

	var systemDataNodeURI = this.node.getAttribute("sys");
	if (systemDataNodeURI){
		this.addUserDefinedSystemNode(systemDataNodeURI);
	}
	
};

/**
 * @return {DataNode}
 */
XML3DDataAdapter.prototype.getUserDefinedSystemNode = function(){
	return this.xflowDataNode._children[1];
};


/**
 * @return {DataNode}
 */
XML3DDataAdapter.prototype.getSystemDefinedSystemNode = function(){
	return this.xflowDataNode._children[0];
};

/**
*
*/
XML3DDataAdapter.prototype.notifyChanged = function (evt) {
   if (evt.type == Events.VALUE_MODIFIED) {
       var attr = evt.mutation.attributeName;
       if (!attr) {
           delete this.node._configured.scriptValue;
           this.xflowInputNode.data.setValue(this.node.value);
       }
   }
};


XML3DDataAdapter.prototype.attributeChangedCallback = function (name, oldValue, newValue) {
	if (name == "sys"){
		if (newValue){
			this.addUserDefinedSystemNode(newValue);
		}else{
			if (this.xflowDataNode._children.length == 2){
			  var oldUserDefinedSystemNode = this.getUserDefinedSystemNode();
				this.xflowDataNode.removeChild(oldUserDefinedSystemNode);
				oldUserDefinedSystemNode.appendChild(this.xflowDataNode);
			}
		}
  }

};

XML3DDataAdapter.prototype.addUserDefinedSystemNode = function (URI) {  //Here we create separately an adapter for
	var node = URIResolver.resolveLocal(URI);                             //userDefined systemNode
	
	if (!node){
		 XML3D.debug.logWarning("Requested system node \""+URI+"\" does not exist!");
		 if (this.xflowDataNode._children.length == 2){                     //if the requested node doesn't exists we remove
			 this.xflowDataNode.removeChild(this.getUserDefinedSystemNode()); //the old user defined system node
		 }
		 return;
	}
	
	if(node && node._configured === undefined)
        config.element(node);
    if (!node || node._configured === undefined)
        return null;

    var adapter = this.factory.getAdapter(node);
    //
    //var elemHandler = node._configured;
    //var key = this.factory.aspect + "_" + this.factory.canvasId;
    //var adapter = elemHandler.adapters[key];
    //if (adapter == undefined){
    //
	 //   //adapter = this.factory.createAdapter(node);
		//
	 //   if (adapter) {
	 //       elemHandler.adapters[key] = adapter;
	 //   }
	 //
	 //   var xflowDataNode = new DataNode(false); // Higher level dataNode to contain the actual Nodes
	 //   adapter.xflowDataNode = new DataNode(false);
	 //   adapter.xflowDataNode.addLoadListener(adapter.onXflowLoadEvent.bind(adapter));
	 //   adapter.xflowDataNode.userData = adapter.node;
	 //
	 //   // Setting platform and node type information for a data sequence
	 //   adapter.xflowDataNode.setPlatform(adapter.node.getAttribute("platform"));
    //
	 //   adapter.updateAdapterHandle{("src", adapter.node.getAttribute("src"));
	 //   if(!adapter.assetData)
	 //   	adapter.xflowDataNode.setFilter(adapter.node.getAttribute("filter"));
	 //       updateCompute(adapter);
	 //   }
	 //
	 //   for (var child = adapter.node.firstElementChild; child !== null; child = child.nextElementSibling) {
	 //   	var subadapter = adapter.factory.getAdapter(child);
	 //   	if (subadapter.getXflowNode){
    ////        	adapter.xflowDataNode.appendChild(subadapter.getXflowNode());
	 //   		xflowDataNode.appendChild(subadapter.getXflowNode());
	 //   	}
	 //   }
	 //   adapter.xflowDataNode.appendChild(xflowDataNode);
	 //
	 //   if (adapter.xflowDataNode._platform !== null) {
	 //       recursiveDataNodeAttrInit(adapter.getXflowNode());
	 //   }
    //}else{

    adapter.xflowDataNode.removeChild(adapter.xflowDataNode._children[1]);
    //}
    
    if (this.xflowDataNode._children.length == 2){
    	var oldUserSystemNode = this.getUserDefinedSystemNode();
    	this.xflowDataNode.removeChild(oldUserSystemNode);
    	this.xflowDataNode.appendChild(adapter.xflowDataNode); //We add the new user defined system data node
    	oldUserSystemNode.appendChild(this.xflowDataNode);     //We remove whole system data node from the old user defined node
    }else{
    	this.xflowDataNode.appendChild(adapter.xflowDataNode);
    }
    
};

XML3DDataAdapter.prototype.setDefaultValues = function(){
	var xflowDataNode = new DataNode(false); // system data node
    
    var inputNode = new InputNode();
    inputNode.name="time";
    inputNode.data = new BufferEntry(XC.DATA_TYPE.FLOAT, new Float32Array([0.0]));
    xflowDataNode.appendChild(inputNode);
    
    inputNode = new InputNode();
    inputNode.name="test";
    inputNode.data = new BufferEntry(XC.DATA_TYPE.FLOAT, new Float32Array([5.0]));
    xflowDataNode.appendChild(inputNode);
    
    this.xflowDataNode.appendChild(xflowDataNode);
    
    
};

XML3DDataAdapter.prototype.onXflowLoadEvent = function(node, newLevel, oldLevel){
    if(newLevel == Infinity){
        dispatchCustomEvent(this.node, 'load', false, true, null);
    }
    else if(newLevel > oldLevel){
        dispatchCustomEvent(this.node, 'progress', false, true, null);
    }
};

function updateCompute(dataAdapter) {
    var xflowNode = dataAdapter.xflowDataNode;
    xflowNode.setCompute(dataAdapter.node.getAttribute("compute"));
    if (xflowNode.computeDataflowUrl) {
        dataAdapter.updateAdapterHandle("dataflow", xflowNode.computeDataflowUrl);
    }
    else {
        dataAdapter.disconnectAdapterHandle("dataflow");
        updateLoadState(dataAdapter);
    }
};

function updateLoadState(dataAdpater) {
    var loading = false, handle;

    handle = dataAdpater.getConnectedAdapterHandle("src");
    if (handle && handle.status === AdapterHandle.STATUS.LOADING) {
        loading = true;
    }

    handle = dataAdpater.getConnectedAdapterHandle("dataflow");
    if (handle && handle.status === AdapterHandle.STATUS.LOADING) {
        loading = true;
    }

    for (var name in dataAdpater.externalScripts) {
        handle = dataAdpater.getConnectedAdapterHandle(name);
        if (handle && handle.status === AdapterHandle.STATUS.LOADING) {
            loading = true;
        }
    }

    dataAdpater.xflowDataNode.setLoading(loading);
}


module.exports = XML3DDataAdapter;
