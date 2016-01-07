var SceneElementAdapter = require("./scene-element.js");
var CameraConfiguration = require("../scene/configuration.js");
var Resource = require("../../../resource");

var DEFAULT_CAMERA_MODEL = "urn:xml3d:view:perspective";

/**
 * Adapter for <view>
 * @param {RenderAdapterFactory} factory
 * @param {Element} node
 * @extends SceneElementAdapter
 * @constructor
 */
var ViewRenderAdapter = function (factory, node) {
    SceneElementAdapter.call(this, factory, node, false, false);
    this.dataAdapter = Resource.getAdapter(node, "data");
    this.createRenderNode();
};
XML3D.createClass(ViewRenderAdapter, SceneElementAdapter, {

    createRenderNode: function () {
        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode ? parent.getRenderNode() : this.factory.renderer.scene.createRootNode();
        this.renderNode = this.factory.renderer.scene.createRenderView({
            camera: this.createCameraConfiguration(), parent: parentNode
        });
        this.updateLocalMatrix();
    },

    createCameraConfiguration: function () {
        var model = this.node.hasAttribute("model") ? this.node.getAttribute("model") : DEFAULT_CAMERA_MODEL;
        return new CameraConfiguration(model, this.dataAdapter.getXflowNode(), {name: this.node.id});
    },


    /* Interface method */
    getViewMatrix: function () {
        var m = new XML3D.Mat4();
        this.renderNode.getWorldToViewMatrix(m.data);
        return m;
    },

    /**
     * returns view2world matrix
     * @return {mat4}
     */
    getWorldMatrix: function () {
        var m = new XML3D.Mat4();
        this.renderNode.getViewToWorldMatrix(m.data);
        return m;
    },

    getProjectionMatrix: function () {
        var m = new XML3D.Mat4();
        this.renderNode.getProjectionMatrix(m.data);
        return m;
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        SceneElementAdapter.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
        switch (name) {
            case "model":
                this.renderNode.remove();
                this.createRenderNode();
                break;
        }
    }
});

// Export
module.exports = ViewRenderAdapter;
