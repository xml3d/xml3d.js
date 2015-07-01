var TransformableAdapter = require("./transformable.js");
var DOMTransformFetcher = require("../../../data/transform-fetcher.js");
var Events = require("../../../interface/notification.js");

var ViewRenderAdapter = function (factory, node) {
    TransformableAdapter.call(this, factory, node, false, false);
    this.projectionFetcher = new DOMTransformFetcher(this, "projection", "projection", true);
    this.createRenderNode();
};
XML3D.createClass(ViewRenderAdapter, TransformableAdapter, {

    createRenderNode: function () {
        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode ? parent.getRenderNode() : this.factory.renderer.scene.createRootNode();
        var m = XML3D.math.mat4.create();
        var axisAngle = this.node.orientation;
        XML3D.math.mat4.fromRotation(m, axisAngle[3], axisAngle);
        this.renderNode = this.factory.renderer.scene.createRenderView({
            position: this.node.position,
            orientation: m,
            fieldOfView: this.node.fieldOfView,
            parent: parentNode
        });
        this.projectionFetcher.update();
    },

    /* Interface method */
    getViewMatrix: function () {
        var m = XML3D.math.mat4.create();
        this.renderNode.getWorldToViewMatrix(m);
        return m;
    },

    /**
     * returns view2world matrix
     * @return {mat4}
     */
    getWorldMatrix: function () {
        var m = XML3D.math.mat4.create();
        this.renderNode.getViewToWorldMatrix(m);
        return m;
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        TransformableAdapter.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
        switch (name) {
            case "orientation":
                var m = XML3D.math.mat4.create();
                var axisAngle = this.node.orientation;
                XML3D.math.mat4.fromRotation(m, axisAngle[3], axisAngle);
                this.renderNode.updateOrientation(m);
                break;
            case "position":
                this.renderNode.updatePosition(this.node.position);
                break;
            case "projection":
                this.projectionFetcher.update();
                break;
            case "fieldofview":
                this.renderNode.updateFieldOfView(this.node.fieldOfView);
                break;
            default:
                XML3D.debug.logWarning("Unhandled value changed event in view adapter for attribute:" + target);
        }
    },

    notifyChanged: function (evt) {
        switch (evt.type) {
            case Events.THIS_REMOVED:
                this.dispose();
                break;
        }
        this.factory.getRenderer().requestRedraw("View changed");
    },

    onTransformChange: function (attrName, matrix) {
        TransformableAdapter.prototype.onTransformChange.call(this, attrName, matrix);
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

