var BufferEntry = require("../../xflow/interface/data.js").BufferEntry;
var InputNode = require("../../xflow/interface/graph.js").InputNode;
var XC = require("../../xflow/interface/constants.js");
var Events = require("../../interface/notification.js");
var NodeAdapter = require("../../base/adapter.js").NodeAdapter;

/**
 * Constructor of XML3D.data.ValueDataAdapter
 *
 * @extends XML3D.data.DataAdapter
 * @constructor
 *
 * @param factory
 * @param {Element} node
 */
var ValueDataAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
    this.xflowInputNode = null;
};
XML3D.createClass(ValueDataAdapter, NodeAdapter);

// TODO(ksons): In a first step, name-mangle every value element that has the
// sys flag set
ValueDataAdapter.prototype.init = function()
{
    var config = this.node._configured, value;

    if(this.node.textContent == "[value set by script]"){
        value = config.scriptValue;
    }
    else{
        delete config.scriptValue;
        value = this.node.value;
    }

    var type = XC.DATA_TYPE.fromString(this.node.localName);
    var buffer = new BufferEntry(type, value);

    this.xflowInputNode = new InputNode(null);
    this.xflowInputNode.name = this.node.name;
    this.xflowInputNode.data = buffer;
    this.xflowInputNode.key = this.node.key;
    this.xflowInputNode.paramName = this.node.param ? this.node.name : null;
    this.checkForImproperNesting();
};

ValueDataAdapter.prototype.getXflowNode = function () {
    return this.xflowInputNode;
};

/**
 *
 */
ValueDataAdapter.prototype.notifyChanged = function (evt) {
    if (evt.type == Events.VALUE_MODIFIED) {
        var attr = evt.mutation.attributeName;
        if (!attr) {
            delete this.node._configured.scriptValue;
            this.xflowInputNode.data.setValue(this.node.value);
        }
    }
};

ValueDataAdapter.prototype.attributeChangedCallback = function (name, oldValue, newValue) {
    if (name == "name") {
        this.xflowInputNode.name = newValue;
    } else if (name == "key") {
        this.xflowInputNode.key = newValue;
    } else if (name == "param") {
        this.xflowInputNode.paramName = newValue ? this.node.name : null;
    }else if (name == "sys"){
    	var parentDataAdapter = this.factory.getAdapter(this.node.parentNode);
    	var filterMapping = parentDataAdapter.getXflowNode()._children[0]._children[1]._filterMapping;
    	if (!this.node.attributes["sys"]){
    		//If the sys flag is removed we update the filter in system data node
	    	filterMapping.removeName(filterMapping._names.indexOf(this.node.name));
    	}else {
    		//If sys flag is set
    		filterMapping.setName(filterMapping.length,this.node.name);
    	}
    }
};


ValueDataAdapter.prototype.setScriptValue = function (value) {
    // TODO: Add Type check
    this.xflowInputNode.data.setValue(value);
};

/**
 * Returns String representation of this DataAdapter
 */
ValueDataAdapter.prototype.toString = function () {
    return "XML3D.data.ValueDataAdapter";
};

ValueDataAdapter.prototype.checkForImproperNesting = function() {
    for (var i=0; i < this.node.childNodes.length; i++) {
        if (XC.DATA_TYPE.fromString(this.node.childNodes[i].localName)) {
            XML3D.debug.logError("Parsing error: Value elements cannot be nested!", this.node);
        }
    }
};

// Export
module.exports = ValueDataAdapter;
