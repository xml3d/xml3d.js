var TransformableAdapter = require("./transformable.js");

var GroupRenderAdapter = function (factory, node) {
    TransformableAdapter.call(this, factory, node, true, true);
    this.factory = factory;
    this.createRenderNode();
};

XML3D.createClass(GroupRenderAdapter, TransformableAdapter);

var p = GroupRenderAdapter.prototype;

p.createRenderNode = function () {
    //TODO: Shouldn't have to go through the renderer...
    var parent = this.getParentRenderAdapter();
    var parentNode = parent.getRenderNode && parent.getRenderNode();
    this.renderNode = this.getScene().createRenderGroup({
        parent: parentNode, shaderHandle: this.getShaderHandle(), visible: this.node.visible, name: this.node.id
    });
    this.updateLocalMatrix();
    var bbox = XML3D.math.bbox.create();
    this.renderNode.setWorldSpaceBoundingBox(bbox);
};

p.notifyChanged = function (evt) {
    TransformableAdapter.prototype.notifyChanged.call(this, evt);
    if (evt.type !== XML3D.events.VALUE_MODIFIED) {
        return this.handleConnectedAdapterEvent(evt);
    }
};

p.handleConnectedAdapterEvent = function (evt) {
    switch (evt.type) {
        case XML3D.events.NODE_INSERTED:
            // This also initializes the children
            this.initElement(evt.mutation.target);
            break;
        case XML3D.events.THIS_REMOVED:
            this.dispose();
            break;
        case XML3D.events.ADAPTER_HANDLE_CHANGED:
            break;
        case XML3D.events.NODE_REMOVED:
            break;
        default:
            XML3D.debug.logWarning("Unhandled connected adapter event for " + evt.key + " in shader adapter");
    }
};

p.dispose = function () {
    // Dispose all children as well
    this.traverse(function (adapter) {
        if (adapter && adapter.destroy)
            adapter.dispose();
    });
    this.getRenderNode().remove();
    this.clearAdapterHandles();
};

/* Interface methods */
p.getWorldBoundingBox = function () {
    var bbox = XML3D.math.bbox.create();
    this.renderNode.getWorldSpaceBoundingBox(bbox);
    return XML3D.math.bbox.asXML3DBox(bbox);
};

//TODO: improve efficiency of this function once XML3D types are overhauled
p.getLocalBoundingBox = (function () {
    var localMat = XML3D.math.mat4.create();

    return function() {
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
})();

p.getLocalMatrix = function () {
    var m = new window.XML3DMatrix();
    this.renderNode.getLocalMatrix(m._data);
    return m;
};

p.getWorldMatrix = function () {
    var m = new window.XML3DMatrix();
    this.renderNode.getWorldMatrix(m._data);
    return m;
};

module.exports = GroupRenderAdapter;
