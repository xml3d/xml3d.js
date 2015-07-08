var TransformableAdapter = require("./transformable.js");
var Events = require("../../../interface/notification.js");
var Resource = require("../../../base/resourcemanager.js").Resource;

/**
 * @constructor
 */
var MeshRenderAdapter = function (factory, node) {
    TransformableAdapter.call(this, factory, node, true, true);
    this.style = window.getComputedStyle(node);
    this.createRenderNode();

};

XML3D.createClass(MeshRenderAdapter, TransformableAdapter, {

    createRenderNode: function () {
        var dataAdapter = Resource.getAdapter(this.node, "data");

        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode && parent.getRenderNode();

        this.renderNode = this.getScene().createRenderObject({
            parent: parentNode, node: this.node, object: {
                data: dataAdapter.getXflowNode(), type: this.getMeshType()
            }, name: this.node.id
        });
        this.updateVisibility();
        this.updateLocalMatrix();
        this.updateMaterialHandler();
    },

    getMeshType: function () {
        return this.node.hasAttribute("type") ? this.node.getAttribute("type") : "triangles";
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        TransformableAdapter.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
        if (name == "type") {
            this.renderNode.setType(newValue);
        }
    },

    styleChangedCallback: function() {
        TransformableAdapter.prototype.styleChangedCallback.call();
        this.updateVisibility();
    },

    updateVisibility: function() {
        var none = this.style.getPropertyValue("display").trim() == "none";
        var hidden  = this.style.getPropertyValue("visibility").trim() == "hidden";
        this.renderNode.setLocalVisible(!(none || hidden));
        this.renderNode.setPickable(!none);
    },

    /**
     * @param {Events.Notification} evt
     */
    notifyChanged: function (evt) {
        TransformableAdapter.prototype.notifyChanged.call(this, evt);
        switch (evt.type) {
            case  Events.NODE_INSERTED:
                return;
            case Events.THIS_REMOVED:
                this.dispose();
                return;
            case Events.NODE_REMOVED:
                // this.createPerObjectData();
                return;
        }
    },

    dispose: function () {
        this.getRenderNode().remove();
        this.clearAdapterHandles();
    },


    // Interface methods

    /**
     * @return {XML3D.math.bbox}
     */
    getLocalBoundingBox: function () {
        var bbox = new XML3D.math.bbox.create();
        if (this.renderNode && this.renderNode.visible) {
            this.renderNode.getObjectSpaceBoundingBox(bbox);
        }
        return bbox;
    },

    /**
     * @return {XML3D.math.bbox}
     */
    getWorldBoundingBox: function () {
        var bbox = new XML3D.math.bbox.create();
        if (this.renderNode && this.renderNode.visible) {
            this.renderNode.getWorldSpaceBoundingBox(bbox);
        }
        return bbox;
    },

    /**
     * @return {mat4}
     */
    getWorldMatrix: function () {
        var m = XML3D.math.mat4.create(), obj = this.renderNode;
        if (obj) {
            obj.getWorldMatrix(m);
        }
        return m;
    }
});

// Export
module.exports = MeshRenderAdapter;

