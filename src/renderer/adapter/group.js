// Adapter for <group>
(function() {

    var GroupRenderAdapter = function(factory, node) {
        XML3D.webgl.TransformableAdapter.call(this, factory, node);
        this.initializeEventAttributes();
        this.factory = factory;
        this.isValid = true;
        this.updateTransformAdapter();
    };

    XML3D.createClass(GroupRenderAdapter, XML3D.webgl.TransformableAdapter);

    var p = GroupRenderAdapter.prototype;

    p.createRenderNode = function() {
        //TODO: Shouldn't have to go through the renderer...
        var renderNode = this.factory.renderer.scene.createRenderGroup({shader: this.getShaderHandle(), visible: this.node.visible});
        var parent = this.factory.getAdapter(this.node.parentElement, XML3D.webgl.RenderAdapter);
        if (parent.getRenderNode) {
            renderNode.setParent(parent.getRenderNode());
        } else {
            var root = this.factory.renderer.scene.createRootNode();
            renderNode.setParent(root);
        }
        this.renderNode = renderNode;
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
                this.renderNode.setLocalMatrix(result);
            }
        };
    }());

    p.updateTransformAdapter = function() {
        var transformHref = this.node.transform;
        this.connectAdapterHandle("transform", this.getAdapterHandle(transformHref));
    };

    p.notifyChanged = function(evt) {
        if (evt.type == XML3D.events.NODE_INSERTED) {
            this.factory.renderer.sceneTreeAddition(evt);
            return;
        }
        else if (evt.type == XML3D.events.NODE_REMOVED) {
            this.factory.renderer.sceneTreeRemoval(evt);
            return;
        } else if (evt.type == XML3D.events.THIS_REMOVED) {
            //Clear all references to shader and transform adapters
            this.clearAdapterHandles();
            return;
        }
        else if( (evt.type == XML3D.events.ADAPTER_HANDLE_CHANGED) && !evt.internalType){
            // The connected transform node changed;
            this.propagateTransform(evt);
            return;
        }

        var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

        switch (target) {
        case "shader":
            evt.internalType = "parentshader";
            evt.newValue = this.getShaderHandle();
            this.notifyChildren(evt);
            this.factory.renderer.requestRedraw("Group shader changed.", false);
            break;

        case "parentshader":
            this.parentShaderHandle = null;
            if (!this.getShaderHandle()) { // This node's shader would override parent shaders
                this.notifyChildren(evt);
            }
            this.parentShaderHandle = evt.newValue;
            break;

        case "transform":
            //This group is now linked to a different transform node. We need to notify all
            //of its children with the new transformation matrix
            this.updateTransformAdapter();

            this.propagateTransform(evt);

            break;

//        //TODO: this will change once the wrapped events are sent to all listeners of a node
//        case "parenttransform":
//            var parentValue = downstreamValue = evt.newValue;
//            this.parentTransform = evt.newValue;
//
//            var downstreamValue;
//            var matrix = this.getLocalMatrixInternal();
//            if (matrix)
//                downstreamValue = XML3D.math.mat4.multiply(XML3D.math.mat4.create(), parentValue, matrix);
//
//            evt.newValue = downstreamValue;
//            this.notifyChildren(evt);
//            // Reset event value
//            evt.newValue = parentValue;
//            break;

        case "visible":
            //TODO: improve visibility handling
            this.renderNode.setLocalVisible(evt.wrapped.newValue === "true");
            this.factory.renderer.requestRedraw("Group visibility changed.", true);

            //If this node is set visible=false then it overrides the parent node
//            if (this.parentVisible == false)
//                break;
//            else {
//                evt.internalType = "parentvisible";
//                evt.newValue = evt.wrapped.newValue == "true";
//                this.notifyChildren(evt);
//                delete evt.internalType;
//                delete evt.newValue;
//                this.factory.renderer.requestRedraw("Group visibility changed.", true);
//            }
            break;

//        case "parentvisible":
//            this.parentVisible = evt.newValue;
//            //If this node is set visible=false then it overrides the parent node
//            if (this.node.visible == false)
//                break;
//            else
//                this.notifyChildren(evt);
//
//            break;

        default:
            XML3D.debug.logWarning("Unhandled mutation event in group adapter for parameter '"+target+"'");
            break;
        };

    };

    p.notifyChildren = function(evt) {
        var child = this.node.firstElementChild;
        while (child) {
            var adapter = this.factory.getAdapter(child);
            adapter && adapter.notifyChanged(evt);
            child = child.nextElementSibling;
        }
    };

    p.propagateTransform = function(evt){
//        var downstreamValue;
//        var matrix = this.getLocalMatrixInternal();
//        if (matrix)
//            downstreamValue = matrix;
//        else if (this.parentTransform)
//            downstreamValue = XML3D.math.mat4.identity(XML3D.math.mat4.create());
//        else
//            downstreamValue = null;
//
//        if(this.parentTransform)
//            downstreamValue = XML3D.math.mat4.multiply(XML3D.math.mat4.create(), this.parentTransform, downstreamValue);
//
//        evt.internalType = "parenttransform";
//        evt.newValue = downstreamValue;
//
//        this.notifyChildren(evt);
//        delete evt.internalType;
//        delete evt.newValue;
//        this.factory.renderer.requestRedraw("Group transform changed.", true);
    }

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
        if(shaderHref)
            return this.getAdapterHandle(shaderHref);
        else
            return this.parentShaderHandle;

    };

    p.destroy = function() {
        var child = this.node.firstElementChild;
        while (child) {
            var adapter = this.factory.getAdapter(child);
            if (adapter && adapter.destroy)
                adapter.destroy();
            child = child.nextElementSibling;
        }

        this.isValid = false;
    };

    /* Interface methods */
    p.getBoundingBox = function() {
        var bbox = new window.XML3DBox();
        Array.prototype.forEach.call(this.node.childNodes, function(c) {
            if(c.getBoundingBox)
                bbox.extend(c.getBoundingBox());
        });
        var matrix = this.getLocalMatrixInternal();
        if (matrix) {
            XML3D.webgl.transformAABB(bbox, matrix);
        }
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
