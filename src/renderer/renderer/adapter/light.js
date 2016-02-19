var SceneElementAdapter = require("./scene-element.js");

var Events = require("../../../interface/notification.js");
var LightConfiguration = require("../scene/configuration.js");
var Resource = require("../../../resource");

var DEFAULT_LIGHT_MODEL = "urn:xml3d:light:directional";
/**
 * Adapter for <light>
 * @constructor
 * @param {RenderAdapterFactory} factory
 * @param {Element} node
 */
var LightRenderAdapter = function (factory, node) {
    SceneElementAdapter.call(this, factory, node, false, true);
    this.dataAdapter = Resource.getAdapter(node, "data");
    this.createRenderNode();
};

XML3D.createClass(LightRenderAdapter, SceneElementAdapter, {

    createRenderNode: function () {
        var parentAdapter = this.getParentRenderAdapter();
        var parentNode = parentAdapter.getRenderNode && parentAdapter.getRenderNode();
        this.renderNode = this.factory.getScene().createRenderLight({
            configuration: this.createLightConfiguration(),
            parent: parentNode
        });
        this.updateVisibility();
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        SceneElementAdapter.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);

        switch (name) {
            case "intensity": // TODO(ksons): remove in 5.1
                XML3D.debug.logWarning("The <light> attribute intensity is deprecated in XML3D 5.0.", this.node);
                break;
            case "model":
                this.renderNode.remove();
                this.createRenderNode();
                break;
        }
    },

    updateVisibility: function () {
        var none = this.style.getPropertyValue("display").trim() == "none";
        this.renderNode.setLocalVisible(!none);
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
     * @return {XML3D.Mat4}
     */
    getWorldMatrix: function () {
        var m = new XML3D.Mat4();
        this.renderNode.getWorldMatrix(m.data);
        return m;
    },

    /**
     * @return {XML3D.Mat4}
     */
    getLocalMatrix: function () {
        var m = new XML3D.Mat4();
        this.renderNode.getLocalMatrix(m.data);
        return m;
    }
});

// Export
module.exports = LightRenderAdapter;

