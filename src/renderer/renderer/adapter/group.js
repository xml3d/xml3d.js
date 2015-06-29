var TransformableAdapter = require("./transformable.js");
var Events = require("../../../interface/notification.js");

var GroupRenderAdapter = function (factory, node) {
    TransformableAdapter.call(this, factory, node, true, true);
    this.createRenderNode();
};

XML3D.createClass(GroupRenderAdapter, TransformableAdapter, {

    createRenderNode: function () {
        //TODO: Shouldn't have to go through the renderer...
        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode && parent.getRenderNode();
        this.renderNode = this.getScene().createRenderGroup({
            parent: parentNode, visible: this.node.visible, name: this.node.id
        });
        this.updateLocalMatrix();
        this.updateMaterialHandler();
        var bbox = XML3D.math.bbox.create();
        this.renderNode.setWorldSpaceBoundingBox(bbox);
    },

    notifyChanged: function (evt) {
        TransformableAdapter.prototype.notifyChanged.call(this, evt);
        return this.handleConnectedAdapterEvent(evt);
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        TransformableAdapter.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
    },

    handleConnectedAdapterEvent: function (evt) {
        switch (evt.type) {
            case Events.NODE_INSERTED:
                // This also initializes the children
                this.initElement(evt.mutation.target);
                break;
            case Events.THIS_REMOVED:
                this.dispose();
                break;
            case Events.ADAPTER_HANDLE_CHANGED:
                break;
            case Events.NODE_REMOVED:
                break;
            default:
                XML3D.debug.logWarning("Unhandled connected adapter event for " + evt.key + " in group adapter");
        }
    },

    dispose: function () {
        // Dispose all children as well
        this.traverse(function (adapter) {
            if (adapter && adapter.destroy)
                adapter.dispose();
        });
        this.getRenderNode().remove();
        this.clearAdapterHandles();
    },

    /* Interface methods */
    getWorldBoundingBox: function () {
        var bbox = XML3D.math.bbox.create();
        this.renderNode.getWorldSpaceBoundingBox(bbox);
        return XML3D.math.bbox.asXML3DBox(bbox);
    },

//TODO: improve efficiency of this function once XML3D types are overhauled
    getLocalBoundingBox: (function () {
        var localMat = XML3D.math.mat4.create();

        return function () {
            var bbox = new window.XML3DBox();
            if (!this.renderNode.visible) {
                return bbox;
            }
            Array.prototype.forEach.call(this.node.childNodes, function (c) {
                if (c.getLocalBoundingBox && c.visible)
                    bbox.extend(c.getLocalBoundingBox());
            });
            this.renderNode.getLocalMatrix(localMat);
            var localBB = XML3D.math.bbox.fromXML3DBox(bbox);
            XML3D.math.bbox.transform(localBB, localMat, localBB);
            return XML3D.math.bbox.asXML3DBox(localBB);
        }
    })(),

    getLocalMatrix: function () {
        var m = XML3D.math.mat4.create();
        this.renderNode.getLocalMatrix(m);
        return m;
    },

    getWorldMatrix: function () {
        var m = XML3D.math.mat4.create();
        this.renderNode.getWorldMatrix(m);
        return m;
    }
});

module.exports = GroupRenderAdapter;
