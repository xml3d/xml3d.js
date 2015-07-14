var SceneElementAdapter = require("./scene-element.js");
var DOMTransformFetcher = require("../../../data/transform-fetcher.js");
var Events = require("../../../interface/notification.js");

var ViewRenderAdapter = function (factory, node) {
    SceneElementAdapter.call(this, factory, node, false, false);
    this.projectionFetcher = new DOMTransformFetcher(this, "projection", "projection", true);
    this.createRenderNode();
};
XML3D.createClass(ViewRenderAdapter, SceneElementAdapter, {

    createRenderNode: function () {
        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode ? parent.getRenderNode() : this.factory.renderer.scene.createRootNode();
        this.renderNode = this.factory.renderer.scene.createRenderGroup({
            parent: parentNode
        });
        this.updateLocalMatrix();
        this.updateIntrinsicCameraParameters();
    },

    updateIntrinsicCameraParameters: function() {
        this.projectionFetcher.update();
        var fieldOfView = +this.node.getAttribute("fieldofview");
        this.renderNode.fieldOfView = fieldOfView;
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

    attributeChangedCallback: function (name, oldValue, newValue) {
        SceneElementAdapter.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
        switch (name) {
            case "projection":
            case "fieldofview":
                this.updateIntrinsicCameraParameters();
                break;
        }
    },

    notifyChanged: function (evt) {
        SceneElementAdapter.prototype.notifyChanged.call(this, evt);
        switch (evt.type) {
            case Events.THIS_REMOVED:
                this.dispose();
                break;
        }
        this.factory.getRenderer().requestRedraw("View changed");
    },

    onTransformChange: function (attrName, matrix) {
        SceneElementAdapter.prototype.onTransformChange.call(this, attrName, matrix);
        if (attrName == "projection") {
            this.renderNode.setProjectionOverride(matrix);
        }
    },

    dispose: function () {


        this.projectionFetcher.clear();
        this.getRenderNode().remove();
        this.clearAdapterHandles();
    }
});

// Export
module.exports = ViewRenderAdapter;

