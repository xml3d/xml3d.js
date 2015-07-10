var TransformableAdapter = require("./transformable.js");
var Events = require("../../../interface/notification.js");

var GroupRenderAdapter = function (factory, node) {
    TransformableAdapter.call(this, factory, node, true, true);
    this.style = window.getComputedStyle(node);
    this.createRenderNode();
};

XML3D.createClass(GroupRenderAdapter, TransformableAdapter, {

    createRenderNode: function () {
        //TODO: Shouldn't have to go through the renderer...
        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode && parent.getRenderNode();
        this.renderNode = this.getScene().createRenderGroup({
            parent: parentNode, name: this.node.id
        });
        this.updateLocalMatrix();
        this.updateMaterialHandler();
        var bbox = new XML3D.Box();
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

     styleChangedCallback: function() {
        TransformableAdapter.prototype.styleChangedCallback.call();
        this.updateVisibility();
    },

    updateVisibility: function() {
        var none = this.style.getPropertyValue("display").trim() == "none";
        var hidden  = this.style.getPropertyValue("visibility").trim() == "hidden";
        this.renderNode.setLocalVisible(!(none || hidden));
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
        var bbox = new XML3D.Box();
        this.renderNode.getWorldSpaceBoundingBox(bbox);
        return bbox;
    },

    getLocalBoundingBox: (function () {
        var localMat = new XML3D.Mat4();
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
        this.renderNode.getLocalMatrix(m);
        return m;
    },

    getWorldMatrix: function () {
        var m = new XML3D.Mat4();
        this.renderNode.getWorldMatrix(m);
        return m;
    }
});

module.exports = GroupRenderAdapter;
