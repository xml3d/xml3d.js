var TransformableAdapter = require("./transformable.js");
var Events = require("../../../interface/notification.js");
var Resource = require("../../../base/resourcemanager.js").Resource;

/**
 * Adapter for <light>
 * @constructor
 * @param {RenderAdapterFactory} factory
 * @param {Element} node
 */
var LightRenderAdapter = function (factory, node) {
    TransformableAdapter.call(this, factory, node, false, true);
    this.dataAdapter = Resource.getAdapter(node, "data");
    this.createRenderNode();
};
XML3D.createClass(LightRenderAdapter, TransformableAdapter);

LightRenderAdapter.prototype.createRenderNode = function () {
    var parentAdapter = this.getParentRenderAdapter();
    var parentNode = parentAdapter.getRenderNode && parentAdapter.getRenderNode();
    this.renderNode = this.factory.getScene().createRenderLight({
        light: {
            model: this.node.getAttribute("model") || "urn:xml3d:light:directional",
            data: this.dataAdapter.getXflowNode()
        },
        parent: parentNode,
        visible: !this.node.visible ? false : undefined,
        localIntensity: this.node.intensity
    });
};

LightRenderAdapter.prototype.notifyChanged = function (evt) {
    switch (evt.type) {
            case Events.NODE_REMOVED:
            return;
        case Events.THIS_REMOVED:
            this.dispose();
            return;
        case Events.ADAPTER_HANDLE_CHANGED:
            break;
        case Events.VALUE_MODIFIED:
            this.valueModified(evt.mutation);
            break;
        case Events.ADAPTER_VALUE_CHANGED:
            this.renderNode.setLightType(this.getLightModel(), evt.adapter.getDataNode());
    }
};

LightRenderAdapter.prototype.valueModified = function (mutation) {
    var newValue = mutation.target.getAttribute(mutation.attributeName);
    switch (mutation.attributeName) {
        case "visible":
            this.renderNode.setLocalVisible(newValue && (newValue.toLowerCase() !== "false"));
            break;
        case "intensity": // TODO(ksons): remove in 5.1
            XML3D.debug.logWarning("The <light> attribute intensity is deprecated in XML3D 5.0.", this.node);
            break;
        case "model":
            this.renderNode.remove();
            this.createRenderNode();
            break;
    }
};


LightRenderAdapter.prototype.getLightModel = function () {
    return ;
};

LightRenderAdapter.prototype.dispose = function () {
    this.getRenderNode().remove();
    this.clearAdapterHandles();
};

/**
 * @return {XML3DMatrix}
 */
LightRenderAdapter.prototype.getWorldMatrix = function () {
    var m = new window.XML3DMatrix();
    this.renderNode.getWorldMatrix(m._data);
    return m;
};

// Export
module.exports = LightRenderAdapter;

