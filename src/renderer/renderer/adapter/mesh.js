var SceneElementAdapter = require("./scene-element.js");

var Events = require("../../../interface/notification.js");
var encodeZIndex = require("../../../utils/misc.js").encodeZIndex;
var Resource = require("../../../resource");

var DEFAULT_PRIMITIVE_TYPE = "triangles";

/**
 * @constructor
 */
var MeshRenderAdapter = function (factory, node) {
    SceneElementAdapter.call(this, factory, node, true, true);
    this.createRenderNode();
};

XML3D.createClass(MeshRenderAdapter, SceneElementAdapter, {

    createRenderNode: function () {
        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode && parent.getRenderNode();

        this.renderNode = this.getScene().createRenderObject({
            parent: parentNode,
            node: this.node,
            configuration: this.createMeshConfiguration(),
            name: this.node.id
        });
        this.updateZIndex();
        this.updateVisibility();
        this.updateLocalMatrix();
        this.updateMaterialHandler();
    },

    createMeshConfiguration: function () {
        return {
            data: Resource.getAdapter(this.node, "data").getXflowNode(),
            type: this.node.hasAttribute("type") ? this.node.getAttribute("type") : DEFAULT_PRIMITIVE_TYPE
        }
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        SceneElementAdapter.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
        if (name == "type") {
            this.renderNode.remove();
            this.createRenderNode();
        }
    },

    updateZIndex: function() {
        var zIndex = this.style.getPropertyValue("z-index");
        zIndex = encodeZIndex(zIndex, true);

        var parent = this.getParentRenderAdapter();
        while (parent) {
            if (parent.style) {
                var parentZ = parent.style.getPropertyValue("z-index");
                parentZ = encodeZIndex(parentZ, false);
                if (parentZ != "")
                    zIndex = parentZ + ":" + zIndex;
            }
            parent = parent.getParentRenderAdapter();
        }

        this.renderNode.setZIndex(zIndex);
    },

    /**
     * @param {Events.Notification} evt
     */
    notifyChanged: function (evt) {
        SceneElementAdapter.prototype.notifyChanged.call(this, evt);
    },

    // Interface methods

    /**
     * @return {XML3D.Box}
     */
    getLocalBoundingBox: function () {
        var bbox = new XML3D.Box();
        if (this.renderNode && this.renderNode.visible) {
            this.renderNode.getObjectSpaceBoundingBox(bbox);
        }
        return bbox;
    },

    /**
     * @return {XML3D.Box}
     */
    getWorldBoundingBox: function () {
        var bbox = new XML3D.Box();
        if (this.renderNode && this.renderNode.visible) {
            this.renderNode.getWorldSpaceBoundingBox(bbox);
        }
        return bbox;
    },

    /**
     * @return {mat4}
     */
    getWorldMatrix: function () {
        var m = new XML3D.Mat4(), obj = this.renderNode;
        if (obj) {
            obj.getWorldMatrix(m.data);
        }
        return m;
    }
});

// Export
module.exports = MeshRenderAdapter;

