// Adapter for <group>
(function() {
    
	var eventTypes = {onclick:1, ondblclick:1,
			ondrop:1, ondragenter:1, ondragleave:1};
	
    var GroupRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.processListeners();
        this.factory = factory;
        this.parentTransform = null;
        this.parentShaderHandle = null;
        this.parentVisible = true;
        this.isValid = true;
        this.updateTransformAdapter();
    };

    XML3D.createClass(GroupRenderAdapter, XML3D.webgl.RenderAdapter);

    var p = GroupRenderAdapter.prototype;

    p.applyTransformMatrix = function(m) {
        if (this.parentTransform !== null)
            mat4.multiply(this.parentTransform, m,  m);

        if (this.transformAdapter)
            mat4.multiply(m, this.transformAdapter.getMatrix());

        return m;
    };
    
    p.updateTransformAdapter = function() {
        this.transformAdapter = null;
        var tNode = this.node.transform;
        if (tNode) {
            tNode = XML3D.URIResolver.resolveLocal(tNode);
            if (tNode)
                this.transformAdapter = this.factory.getAdapter(tNode);
        }
    };

    p.processListeners  = function() {
        var attributes = this.node.attributes;
        for (var index in attributes) {
            var att = attributes[index];
            if (!att.name)
                continue;

            var type = att.name;
	        if (type.match(/onmouse/) || eventTypes[type]) {
                var eventType = type.substring(2);
                this.node.addEventListener(eventType, new Function("evt", att.value), false);
            }
        }
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
            
        case "translation":
        case "rotation":
        case "scale":
            //This group adapter's transform node was changed
            var downstreamValue = this.transformAdapter.getMatrix();
            if (this.parentTransform)
                downstreamValue = mat4.multiply(this.parentTransform, downstreamValue, mat4.create());
            
            evt.internalType = "parenttransform";
            evt.newValue = downstreamValue;
            this.notifyChildren(evt);
            delete evt.internalType;
            delete evt.newValue;
            break;
            
        case "transform":
            //This group is now linked to a different transform node. We need to notify all
            //of its children with the new transformation matrix
            this.updateTransformAdapter(this);

            var downstreamValue;
            if (this.transformAdapter)
                downstreamValue = this.transformAdapter.getMatrix();
            else if (this.parentTransform)
                downstreamValue = mat4.identity(mat4.create());
            else
                downstreamValue = null;

            if(this.parentTransform)
                downstreamValue = mat4.multiply(this.parentTransform, downstreamValue, mat4.create());

            evt.internalType = "parenttransform";
            evt.newValue = downstreamValue;
            
            this.notifyChildren(evt);
            delete evt.internalType;
            delete evt.newValue;
            this.factory.renderer.requestRedraw("Group transform changed.", true);
            break;
        
        //TODO: this will change once the wrapped events are sent to all listeners of a node
        case "parenttransform":  
            var parentValue = downstreamValue = evt.newValue;
            this.parentTransform = evt.newValue;
            
            if (this.transformAdapter)
                downstreamValue = mat4.multiply(parentValue, this.transformAdapter.getMatrix(), mat4.create());
            
            evt.newValue = downstreamValue;
            this.notifyChildren(evt);
            // Reset event value
            evt.newValue = parentValue;
            break;
            
        case "visible":
            //TODO: improve visibility handling
            //If this node is set visible=false then it overrides the parent node 
            if (this.parentVisible == false)
                break;
            else {
                evt.internalType = "parentvisible";
                evt.newValue = evt.wrapped.newValue == "true";
                this.notifyChildren(evt);
                delete evt.internalType;
                delete evt.newValue;
                this.factory.renderer.requestRedraw("Group visibility changed.", true);    
            }
            break;
        
        case "parentvisible":
            this.parentVisible = evt.newValue;
            //If this node is set visible=false then it overrides the parent node 
            if (this.node.visible == false)
                break;
            else
                this.notifyChildren(evt);
            
            break;
            
        default:
            XML3D.debug.logWarning("Unhandled mutation event in group adapter for parameter '"+target+"'");
            break;
        };

    };

    p.notifyChildren = function(evt) {
        var child = this.node.firstElementChild;
        while (child) {
            var adapter = this.factory.getAdapter(child);
            adapter.notifyChanged(evt);
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
        if(shaderHref)
            return XML3D.base.resourceManager.getAdapterHandle(this.node.ownerDocument, shaderHref,
                XML3D.webgl, this.factory.handler.id);
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
        if (this.transformAdapter) {
            XML3D.webgl.transformAABB(bbox, this.transformAdapter.getMatrix());
        }
        return bbox;
    };
  
    p.getLocalMatrix = function() {
        var m = new window.XML3DMatrix();
        if (this.transformAdapter !== null)
            m._data.set(this.transformAdapter.getMatrix());
        return m;
    };
    
    p.getWorldMatrix = function() {
        var m = new window.XML3DMatrix();
        if (this.parentTransform)
            m._data.set(this.parentTransform);
        if (this.transformAdapter)
            mat4.multiply(m._data, this.transformAdapter.getMatrix());
        return m;
    };

    XML3D.webgl.GroupRenderAdapter = GroupRenderAdapter;
}());
