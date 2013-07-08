// Adapter for <group>
(function() {

    var GroupRenderAdapter = function(factory, node) {
        XML3D.webgl.TransformableAdapter.call(this, factory, node);
        this.initializeEventAttributes();
        this.factory = factory;
        this.updateTransformAdapter();
        this.createRenderNode();
    };

    XML3D.createClass(GroupRenderAdapter, XML3D.webgl.TransformableAdapter);

    var p = GroupRenderAdapter.prototype;

    p.createRenderNode = function() {
        //TODO: Shouldn't have to go through the renderer...
        var parent = this.factory.getAdapter(this.node.parentElement, XML3D.webgl.RenderAdapter);
        var parentNode = parent.getRenderNode ? parent.getRenderNode() : this.factory.renderer.scene.rootNode;
        this.renderNode = this.factory.renderer.scene.createRenderGroup({parent: parentNode, shaderHandle: this.getShaderHandle(), visible: this.node.visible});
        this.updateLocalMatrix();
    };

    p.updateLocalMatrix = (function () {
        var IDENTITY = XML3D.math.mat4.create();
        return function () {
            var cssMatrix = XML3D.css.getCSSMatrix(this.node);
            var result = IDENTITY;
            if (cssMatrix) {
                result = XML3D.css.convertCssToMat4(cssMatrix);
            } else {
                var handle = this.getConnectedAdapter("transform");
                if (handle) {
                    result = handle.getMatrix("transform");
                }
            }
            this.renderNode.setLocalMatrix(result);
        };
    }());

    p.updateTransformAdapter = function() {
        var transformHref = this.node.transform;
        this.connectAdapterHandle("transform", this.getAdapterHandle(transformHref));
    };

    p.notifyChanged = function(evt) {
        if (evt.type !== XML3D.events.VALUE_MODIFIED) {
            return this.handleConnectedAdapterEvent(evt);
        }
        var target = evt.attrName || evt.wrapped.attrName;

        switch (target) {
        case "shader":
            this.disconnectAdapterHandle("shader");
            this.renderNode.setLocalShaderHandle(this.getShaderHandle());
            this.factory.renderer.requestRedraw("Group shader changed.", false);
            break;

        case "transform":
            //This group is now linked to a different transform node. We need to notify all
            //of its children with the new transformation matrix
            this.updateTransformAdapter();
            this.updateLocalMatrix();
            break;

        case "visible":
            this.renderNode.setLocalVisible(evt.wrapped.newValue === "true");
            this.factory.renderer.requestRedraw("Group visibility changed.", true);
            break;

        default:
            XML3D.debug.logWarning("Unhandled mutation event in group adapter for parameter '"+target+"'");
            break;
        };
    };

    p.handleConnectedAdapterEvent = function(evt) {
        switch(evt.type) {
            case XML3D.events.NODE_INSERTED:
                this.factory.renderer.sceneTreeAddition(evt);
                break;
            case XML3D.events.NODE_REMOVED:
                this.factory.renderer.sceneTreeRemoval(evt);
                break;
            case XML3D.events.THIS_REMOVED:
                this.clearAdapterHandles();
                break;
            case XML3D.events.ADAPTER_HANDLE_CHANGED:
                if (evt.key === "transform") {
                    this.updateTransformAdapter();
                    this.updateLocalMatrix();
                } else if (evt.key === "shader") {
                    var handle = this.getShaderHandle();
                    this.renderNode.setLocalShaderHandle(handle);
                }
                break;
            default:
                XML3D.debug.logWarning("Unhandled connected adapter event for "+evt.key+" in shader adapter");
        }
    };

    p.notifyChildren = function(evt) {
        var child = this.node.firstElementChild;
        while (child) {
            var adapter = this.factory.getAdapter(child);
            adapter && adapter.notifyChanged(evt);
            child = child.nextElementSibling;
        }
    };

    p.getShaderHandle = function()
    {
        var shaderHref = this.node.shader;
        if(shaderHref == "")
        {
            var styleValue = this.node.getAttribute('style');
            if(styleValue) {
                var pattern    = /shader\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
                var result = pattern.exec(styleValue);
                if(result)
                    shaderHref = result[1];
            }
        }
        if(shaderHref) {
            this.connectAdapterHandle("shader", this.getAdapterHandle(shaderHref));
            return this.getConnectedAdapterHandle("shader");
        }
    };

    p.destroy = function() {
        var child = this.node.firstElementChild;
        while (child) {
            var adapter = this.factory.getAdapter(child);
            if (adapter && adapter.destroy)
                adapter.destroy();
            child = child.nextElementSibling;
        }
        this.clearAdapterHandles();
    };

    /* Interface methods */
    p.getBoundingBox = function() {
        var bbox = new window.XML3DBox();
        Array.prototype.forEach.call(this.node.childNodes, function(c) {
            if(c.getBoundingBox)
                bbox.extend(c.getBoundingBox());
        });
        var matrix = XML3D.math.mat4.create();
        this.renderNode.getLocalMatrix(matrix);
        XML3D.webgl.transformAABB(bbox, matrix);
        return bbox;
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

    XML3D.webgl.GroupRenderAdapter = GroupRenderAdapter;
}());
