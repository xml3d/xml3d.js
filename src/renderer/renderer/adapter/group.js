var SceneElementAdapter = require("./scene-element.js");
var Events = require("../../../interface/notification.js");

var GroupRenderAdapter = function (factory, node) {
    SceneElementAdapter.call(this, factory, node, true, true);
    this.createRenderNode();
};

XML3D.createClass(GroupRenderAdapter, SceneElementAdapter, {

    createRenderNode: function () {
        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode && parent.getRenderNode();
        this.renderNode = this.getScene().createRenderGroup({
            parent: parentNode, name: this.node.id
        });
        this.updateLocalMatrix();
        this.updateMaterialHandler();
        this.renderNode.setWorldSpaceBoundingBox(new XML3D.Box());
    },

    /* Interface methods */
    getWorldBoundingBox: function () {
        var bbox = new XML3D.Box();
        this.renderNode.getWorldSpaceBoundingBox(bbox);
        return bbox;
    },

    getLocalBoundingBox: (function () {
        var localMat = mat4.create();
        var childBB = new XML3D.Box();

        return function () {
            var bbox = new XML3D.Box();
            Array.prototype.forEach.call(this.node.childNodes, function (c) {
                if (c.getLocalBoundingBox) {
                    childBB = c.getLocalBoundingBox();
                    bbox.extend(childBB);
                }
            });
            this.renderNode.getLocalMatrix(localMat);
            bbox.transformAxisAligned(localMat);
            return bbox;
        }
    })(),

    getLocalMatrix: function () {
        var m = new XML3D.Mat4();
        this.renderNode.getLocalMatrix(m.data);
        return m;
    },

    getWorldMatrix: function () {
        var m = new XML3D.Mat4();
        this.renderNode.getWorldMatrix(m.data);
        return m;
    }
});

module.exports = GroupRenderAdapter;
