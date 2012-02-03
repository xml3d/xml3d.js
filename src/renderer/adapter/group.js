
// Adapter for <group>
org.xml3d.webgl.XML3DGroupRenderAdapter = function(factory, node) {
    org.xml3d.webgl.RenderAdapter.call(this, factory, node);
    this.processListeners();
    this.factory = factory;
    this.parentTransform = null;
    this._parentShader = null;
    this.isValid = true;
    
    this._updateTransformAdapter();
};
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DGroupRenderAdapter;
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.applyTransformMatrix = function(
		transform) {
	var ret = transform;
	
	if (this.parentTransform !== null)
		ret = mat4.multiply(ret, this.parentTransform, mat4.create());
	
	if (this._transformAdapter)
		ret = mat4.multiply(ret, this._transformAdapter.getMatrix(), mat4.create());
	
	return ret;
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.processListeners  = function() {
    var attributes = this.node.attributes;
    for (var index in attributes) {
        var att = attributes[index];
        if (!att.name)
            continue;

        var type = att.name;
        if (type.match(/onmouse/) || type == "onclick") {
            var eventType = type.substring(2);
            this.node.addEventListener(eventType, new Function("evt", att.value), false);
        }
    }
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.notifyChanged = function(evt) {
	
	if (evt.eventType == MutationEvent.ADDITION) {
		this.factory.renderer.sceneTreeAddition(evt); 
		return;
	}
	else if (evt.eventType == MutationEvent.REMOVAL) {
		this.factory.renderer.sceneTreeRemoval(evt);
		return;
	}
	
	var downstreamValue = null;
	var me = this;
	var ievent = new XML3D_InternalMutationEvent();
	
	var targets = {};
	targets["shader"] = function() {
		//Update this group node's shader then propagate the change down to its children
		me.shader = me.getShader();      
        downstreamValue = me.shader == null ? me._parentShader : me.shader;	
        
        ievent.source = "group";
        ievent.type = "shader";
        ievent.parameter = "shader";
        ievent.newValue = downstreamValue;
        me.notifyChildren(ievent);
		
        me.factory.renderer.requestRedraw("Group shader changed.", false);
	};
	
	targets["transform"] = function() {
		//This group is now linked to a different transform node. We need to notify all 
		//of its children with the new transformation matrix

		me._updateTransformAdapter();
		if (me._transformAdapter) 
			downstreamValue = me._transformAdapter.getMatrix(); 
		else if (me.parentTransform)
			downstreamValue = mat4.identity(mat4.create());
		else
			downstreamValue = null;
		
		if(me.parentTransform)
			downstreamValue = mat4.multiply(downstreamValue, me.parentTransform);
        
		ievent.source = "group";
        ievent.type = "transform";
        ievent.newValue = downstreamValue;
        me.notifyChildren(ievent);
		me.factory.renderer.requestRedraw("Group transform changed.");
	};
	
	targets["visible"] = function() {
		ievent.source = "group";
        ievent.type = "visible";
        ievent.newValue = downstreamValue;
        
        me.notifyChildren(ievent);
		me.factory.renderer.requestRedraw("Group visibility changed.");
	};
	
	targets["internal:shader"] = function() {
		if (!me.shader) { // This node's shader would override parent shaders
			evt.source = "group";
			me._parentShader = evt.newValue;
			me.notifyChildren(evt);
		}
	};
	
	targets["internal:transform"] = function() {
		downstreamValue = evt.newValue;
		if (me.parentTransform)
			downstreamValue = mat4.multiply(downstreamValue, me.parentTransform);
		
		evt.source = "group";
		evt.newValue = downstreamValue;
		me.notifyChildren(evt);
		me.factory.renderer.requestRedraw("Transform node was changed.");
	};
	
	targets["internal:visible"] = function() {
        me.notifyChildren(evt);
		me.factory.renderer.requestRedraw("Group visibility changed.");
	};
	
	var target;
	if (evt instanceof XML3D_InternalMutationEvent)
		target = "internal:"+evt.type;
	else
		target = evt.attrName;
	
	if (targets[target]) {
		targets[target]();
	} else {
		org.xml3d.debug.logWarning("Unhandled event in group adapter: "+evt.eventType + " for attribute "+evt.attribute);
	}

};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.notifyChildren = function(evt) {	
	var child = this.node.firstElementChild;
	while (child) {
		var adapter = this.factory.getAdapter(child);
		adapter.notifyChanged(evt);
		child = child.nextElementSibling;
	}
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.getShader = function()
{
	var shader = this.node.shader;

	// if no shader attribute is specified, try to get a shader from the style attribute
	if(shader == "")
	{
		var styleValue = this.node.getAttribute('style');
		if(!styleValue)
			return null;
		var pattern    = /shader\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
		var result = pattern.exec(styleValue);
		if (result)
			shader = this.node.xml3ddocument.resolve(result[1]);
	} else {
		shader = org.xml3d.URIResolver.resolve(shader);
	}

	return this.factory.getAdapter(shader);
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.dispose = function() {
	for (var child in this.node.childNodes) {
		var adapter = this.factory.getAdapter(this.node.childNodes[child]);
		if (adapter)
			adapter.dispose();
	}
	this.isValid = false;
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype._updateTransformAdapter = function() { 

	// deregister in old adapter
	if(this._transformAdapter)
	{
		var l = this._transformAdapter.listeners; 
		var i = l.indexOf(this); 
		if(i > -1)
			l.splice(i,1);
	}
	
	// setup new and register listener
	var tname = this.node.transform;
	var tnode = org.xml3d.URIResolver.resolve(tname);
	this._transformAdapter = this.factory.getAdapter(tnode);
	
	if (this._transformAdapter)
		this._transformAdapter.listeners.push(this);
};
