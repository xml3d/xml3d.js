// Adapter for <group>
(function() {

    var GroupRenderAdapter = function(factory, node) {
        XML3D.webgl.TransformableAdapter.call(this, factory, node, true);
        this.initializeEventAttributes();
        this.factory = factory;
        this.createRenderNode();
    };

    XML3D.createClass(GroupRenderAdapter, XML3D.webgl.TransformableAdapter);

    var p = GroupRenderAdapter.prototype;

    p.createRenderNode = function() {
        //TODO: Shouldn't have to go through the renderer...
        var parent = this.getParentRenderAdapter();
        var parentNode = parent.getRenderNode && parent.getRenderNode();
        this.renderNode = this.getScene().createRenderGroup({
            parent: parentNode,
            shaderHandle: this.getShaderHandle(),
            visible: this.node.visible,
            name: this.node.id
        });
        this.updateLocalMatrix();
        var bbox = XML3D.math.bbox.create();
        this.renderNode.setWorldSpaceBoundingBox(bbox);
    };

    p.notifyChanged = function(evt) {
        XML3D.webgl.TransformableAdapter.prototype.notifyChanged.call(this, evt);
        if (evt.type !== XML3D.events.VALUE_MODIFIED) {
            return this.handleConnectedAdapterEvent(evt);
        }
    };

    p.handleConnectedAdapterEvent = function(evt) {
        switch(evt.type) {
            case XML3D.events.NODE_INSERTED:
                this.initElement(evt.wrapped.target);
                this.initChildElements(evt.wrapped.target);
                break;
            case XML3D.events.THIS_REMOVED:
                this.dispose();
                break;
            case XML3D.events.ADAPTER_HANDLE_CHANGED:
                break;
            default:
                XML3D.debug.logWarning("Unhandled connected adapter event for "+evt.key+" in shader adapter");
        }
    };

    p.dispose = function() {
        // Dispose all children as well
        this.traverse(function(adapter) {
            if (adapter && adapter.destroy)
                adapter.dispose();
        });
        this.getRenderNode().remove();
        this.clearAdapterHandles();
    };

    /* Interface methods */
    p.getBoundingBox = function() {
        var bbox = XML3D.math.bbox.create();
        this.renderNode.getWorldSpaceBoundingBox(bbox);
        return XML3D.math.bbox.asXML3DBox(bbox);
    };

    p.getLocalMatrix = function() {
        var m = new window.XML3DMatrix();
        this.renderNode.getLocalMatrix(m._data);
        return m;
    };

    var tmpIdMat = XML3D.math.mat4.create();

    p.getWorldMatrix = function() {
        var m = new window.XML3DMatrix();
        this.renderNode.getWorldMatrix(m._data);
        return m;
    };

    p.setWorldSpaceBoundingBox = function(bboxNew) {
        if (bboxNew instanceof XML3DBox) {
            var bb = XML3D.math.bbox.fromXML3DBox(bboxNew);
            this.renderNode.setBoundingBoxDirty();
            this.renderNode.setWorldSpaceBoundingBox(bb);
            this.renderNode.boundingBoxDirty = false;
            this.getScene().requestRedraw("A world space bounding box was changed");
        } else {
            console.error("Input to setWorldSpaceBoundingBox must be an XML3DBox object!");
        }
    }

    XML3D.webgl.GroupRenderAdapter = GroupRenderAdapter;
}());
