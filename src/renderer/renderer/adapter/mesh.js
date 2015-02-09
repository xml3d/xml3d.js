var TransformableAdapter = require("./transformable.js");

/**
 * @constructor
 */
var MeshRenderAdapter = function (factory, node) {
    TransformableAdapter.call(this, factory, node, true, true);
    this.createRenderNode();
};

XML3D.createClass(MeshRenderAdapter, TransformableAdapter, {

    createRenderNode: function () {
        var dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, XML3D.data);

        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode && parent.getRenderNode();

        this.renderNode = this.getScene().createRenderObject({
            parent: parentNode, node: this.node, object: {
                data: dataAdapter.getXflowNode(), type: this.getMeshType()
            }, name: this.node.id, visible: !this.node.visible ? false : undefined
        });
        this.updateLocalMatrix();
    },

    getMeshType: function () {
        return this.node.hasAttribute("type") ? this.node.getAttribute("type") : "triangles";
    },

    /**
     * @param {XML3D.events.Notification} evt
     */
    notifyChanged: function (evt) {
        TransformableAdapter.prototype.notifyChanged.call(this, evt);
        switch (evt.type) {
            case  XML3D.events.NODE_INSERTED:
                return;
            case XML3D.events.THIS_REMOVED:
                this.dispose();
                return;
            case XML3D.events.NODE_REMOVED:
                // this.createPerObjectData();
                return;
            case XML3D.events.VALUE_MODIFIED:
                this.valueChanged(evt.mutation);
        }
    }, /**
     * @param {MutationEvent} evt
     */
    valueChanged: function (mutation) {
        var target = mutation.attributeName;
        switch (target) {
            case "src":
                // Handled by data component
                break;

            case "type":
                this.renderNode.setType(mutation.target.getAttribute("type"));
                break;
        }

    }, dispose: function () {
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
     * @return {Window.XML3DMatrix}
     */
    getWorldMatrix: function () {
        var m = new window.XML3DMatrix(), obj = this.renderNode;
        if (obj) {
            obj.getWorldMatrix(m._data);
        }
        return m;
    }
});

// Export
module.exports = MeshRenderAdapter;

