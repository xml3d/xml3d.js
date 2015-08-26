var SceneElementAdapter = require("./scene-element.js");
var DOMStringFetcher = require("../../../data/string-fetcher.js");

var Events = require("../../../interface/notification.js");
var Resource = require("../../../base/resourcemanager.js").Resource;

/**
 * @constructor
 */
var MeshRenderAdapter = function (factory, node) {
    SceneElementAdapter.call(this, factory, node, true, true);
    this.meshTypeFetcher = new DOMStringFetcher(this, "type", "type");
    this.createRenderNode();
};

XML3D.createClass(MeshRenderAdapter, SceneElementAdapter, {

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
        return this.meshTypeFetcher.getValue() || "triangles";
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        SceneElementAdapter.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
        if (name == "type") {
            this.meshTypeFetcher.update();
            this.renderNode.setType(this.getMeshType());
        }
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

