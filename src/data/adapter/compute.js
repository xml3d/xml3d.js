/**
 * DataAdapter handling a <compute> element
 * @param {AdapterFactory} factory
 * @param {Element} node
 * @constructor
 */
var ComputeDataAdapter = function (factory, node) {
    XML3D.base.NodeAdapter.call(this, factory, node);
};
XML3D.createClass(ComputeDataAdapter, XML3D.base.NodeAdapter);

ComputeDataAdapter.prototype.getComputeCode = function () {
    return this.node.value;
};

/**
 * @param evt notification of type XML3D.Notification
 */
ComputeDataAdapter.prototype.notifyChanged = function (evt) {
    switch (evt.type) {
        case XML3D.events.VALUE_MODIFIED:
        case XML3D.events.NODE_INSERTED:
        case XML3D.events.NODE_REMOVED:
            var parent = this.node.parentNode;
            if (parent) {
                var parentAdapter = this.factory.getAdapter(parent);
                parentAdapter && parentAdapter.updateXflowNode();
            }
    }
};

module.exports = ComputeDataAdapter;
