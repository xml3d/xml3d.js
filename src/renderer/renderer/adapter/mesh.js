var TransformableAdapter = require("./transformable.js");
var Events = require("../../../interface/notification.js");
var Resource = require("../../../base/resourcemanager.js").Resource;

/**
 * @constructor
 */
var MeshRenderAdapter = function (factory, node) {
    TransformableAdapter.call(this, factory, node, true, true);
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
            }, name: this.node.id, visible: !this.node.visible ? false : undefined
        });
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
    }
});


// Interface methods

XML3D.extend(MeshRenderAdapter.prototype, {
    /**
     * @return {Window.XML3DBox}
     */
    getLocalBoundingBox: function () {
        if (this.renderNode) {
            var bbox = new XML3D.math.bbox.create();
            this.renderNode.getObjectSpaceBoundingBox(bbox);
            return XML3D.math.bbox.asXML3DBox(bbox);
        }

        return new window.XML3DBox();
    },

    /**
     * @return {Window.XML3DBox}
     */
    getWorldBoundingBox: function () {
        if (this.renderNode) {
            var bbox = new XML3D.math.bbox.create();
            this.renderNode.getWorldSpaceBoundingBox(bbox);
            return XML3D.math.bbox.asXML3DBox(bbox);
        }

        return new window.XML3DBox();
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

