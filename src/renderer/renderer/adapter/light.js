var TransformableAdapter = require("./transformable.js");
var Events = require("../../../interface/notification.js");
var Resource = require("../../../base/resourcemanager.js").Resource;
var LightConfiguration = require("../scene/light-configuration.js");

var DEFAULT_LIGHT_MODEL = "urn:xml3d:light:directional";
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

XML3D.createClass(LightRenderAdapter, TransformableAdapter, {

    createRenderNode: function () {
        var parentAdapter = this.getParentRenderAdapter();
        var parentNode = parentAdapter.getRenderNode && parentAdapter.getRenderNode();
        this.renderNode = this.factory.getScene().createRenderLight({
            configuration: this.createLightConfiguration(),
            parent: parentNode,
            visible: !this.node.visible ? false : undefined
        });
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        switch (name) {
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
    },

    notifyChanged: function (evt) {
        switch (evt.type) {
            case Events.NODE_REMOVED:
                return;
            case Events.THIS_REMOVED:
                this.dispose();
                return;
        }
    },

    createLightConfiguration: function () {
        var model = this.node.hasAttribute("model") ? this.node.getAttribute("model") : DEFAULT_LIGHT_MODEL;
        var opt = {
            name: this.node.id
        };
        return new LightConfiguration(model, this.dataAdapter.getXflowNode(), opt);
    },

    dispose: function () {
        this.getRenderNode().remove();
        this.clearAdapterHandles();
    },

    /**
     * @return {mat4}
     */
    getWorldMatrix: function () {
        var m = XML3D.math.mat4.create();
        this.renderNode.getWorldMatrix(m);
        return m;
    }
});

// Export
module.exports = LightRenderAdapter;

