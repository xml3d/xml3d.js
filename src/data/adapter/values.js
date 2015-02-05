var NodeAdapter = XML3D.base.NodeAdapter;
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

ValueDataAdapter.prototype.init = function () {
    var config = this.node._configured, value;
    if (this.node.textContent == XML3D.scriptValueLabel) {
        value = config.scriptValue;
    } else {
        delete config.scriptValue;
        value = this.node.value;
    }

    var type = XML3D.data.BUFFER_TYPE_TABLE[this.node.localName];
    var buffer = new Xflow.BufferEntry(type, value);

    this.xflowInputNode = this.factory.graph.createInputNode();
    this.xflowInputNode.name = this.node.name;
    this.xflowInputNode.data = buffer;
    this.xflowInputNode.key = this.node.key;
    this.xflowInputNode.paramName = this.node.param ? this.node.name : null;
};

ValueDataAdapter.prototype.getXflowNode = function () {
    return this.xflowInputNode;
};

/**
 *
 */
ValueDataAdapter.prototype.notifyChanged = function (evt) {
    if (evt.type == XML3D.events.VALUE_MODIFIED) {
        var attr = evt.wrapped.attrName;
        if (!attr) {
            delete this.node._configured.scriptValue;
            this.xflowInputNode.data.setValue(this.node.value);
        } else if (attr == "name") {
            this.xflowInputNode.name = this.node.name;
        } else if (attr == "key") {
            this.xflowInputNode.key = this.node.key;
        } else if (attr == "param") {
            this.xflowInputNode.paramName = this.node.param ? this.node.name : null;
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

// Export
module.exports = ValueDataAdapter;
