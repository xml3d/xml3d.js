// Adapter for <group>
(function() {

	var XML3DGroupRenderAdapter = function(factory, node) {
	    xml3d.webgl.RenderAdapter.call(this, factory, node);
	    this.processListeners();
	    this.factory = factory;
	    this.parentTransform = null;
	    this._parentShader = null;
	    this.isValid = true;
	    
	    this._updateTransformAdapter();
	};
	xml3d.createClass(XML3DGroupRenderAdapter, xml3d.webgl.RenderAdapter);

	XML3DGroupRenderAdapter.prototype.applyTransformMatrix = function(
			transform) {
		var ret = transform;
		
		if (this.parentTransform !== null)
			ret = mat4.multiply(ret, this.parentTransform, mat4.create());
		
		if (this._transformAdapter)
			ret = mat4.multiply(ret, this._transformAdapter.getMatrix(), mat4.create());
		
		return ret;
	};
	
	XML3DGroupRenderAdapter.prototype.processListeners  = function() {
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
	
	
	// NotifyChanged functions
	var targets = {};
	targets["shader"] = function() {
		//Update this group node's shader then propagate the change down to its children
		this.shader = this.getShader();      
        var downstreamValue = this.shader == null ? this._parentShader : this.shader;	
       
        var ievent = new xml3d.webgl.InternalMutationEvent();
        ievent.source = "group";
        ievent.type = "shader";
        ievent.parameter = "shader";
        ievent.newValue = downstreamValue;
        this.notifyChildren(ievent);
		
        this.factory.renderer.requestRedraw("Group shader changed.", false);
	};
	
	targets["transform"] = function() {
		//This group is now linked to a different transform node. We need to notify all 
		//of its children with the new transformation matrix

		this._updateTransformAdapter();
		
		var downstreamValue;
		if (this._transformAdapter) 
			downstreamValue = this._transformAdapter.getMatrix(); 
		else if (this.parentTransform)
			downstreamValue = mat4.identity(mat4.create());
		else
			downstreamValue = null;
		
		if(this.parentTransform)
			downstreamValue = mat4.multiply(downstreamValue, this.parentTransform);
        
		var ievent = new xml3d.webgl.InternalMutationEvent();
		ievent.source = "group";
        ievent.type = "transform";
        ievent.newValue = downstreamValue;
        this.notifyChildren(ievent);
		this.factory.renderer.requestRedraw("Group transform changed.");
	};
	
	targets["visible"] = function(evt) {
		var ievent = new xml3d.webgl.InternalMutationEvent();
		ievent.source = "group";
        ievent.type = "visible";
        ievent.newValue = evt.newValue;
        
        this.notifyChildren(ievent);
		this.factory.renderer.requestRedraw("Group visibility changed.");
	};
	
	targets["internal:shader"] = function(evt) {
		if (!this.shader) { // This node's shader would override parent shaders
			evt.source = "group";
			this._parentShader = evt.newValue;
			this.notifyChildren(evt);
		}
	};
	
	targets["internal:transform"] = function(evt) {
		var downstreamValue = evt.newValue;
		if (this.parentTransform)
			downstreamValue = mat4.multiply(downstreamValue, this.parentTransform);
		
		evt.source = "group";
		evt.newValue = downstreamValue;
		this.notifyChildren(evt);
		this.factory.renderer.requestRedraw("Transform node was changed.");
	};
	
	targets["internal:visible"] = function(evt) {
        this.notifyChildren(evt);
		this.factory.renderer.requestRedraw("Group visibility changed.");
	};
	
	XML3DGroupRenderAdapter.prototype.notifyChanged = function(evt) {
		
		if (evt.eventType == MutationEvent.ADDITION) {
			this.factory.renderer.sceneTreeAddition(evt); 
			return;
		}
		else if (evt.eventType == MutationEvent.REMOVAL) {
			this.factory.renderer.sceneTreeRemoval(evt);
			return;
		}

		var target = evt.attrName || "internal:"+evt.type;
		if (targets[target]) {
			targets[target].call(this, evt);
		} else {
			xml3d.debug.logWarning("Unhandled event in group adapter: "+evt.eventType + " for attribute "+evt.attribute);
		}
	
	};
	
	
	XML3DGroupRenderAdapter.prototype.notifyChildren = function(evt) {	
		var child = this.node.firstElementChild;
		while (child) {
			var adapter = this.factory.getAdapter(child);
			adapter.notifyChanged(evt);
			child = child.nextElementSibling;
		}
	};
	
	XML3DGroupRenderAdapter.prototype.getShader = function()
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
			shader = xml3d.URIResolver.resolve(shader);
		}
	
		return this.factory.getAdapter(shader);
	};
	
	XML3DGroupRenderAdapter.prototype.dispose = function(evt) {
		var child = this.node.firstElementChild;
		while (child) {
			var adapter = this.factory.getAdapter(child);
			if (adapter && adapter.dispose)
				adapter.dispose(evt);
			child = child.nextElementSibling;
		}
		if(this._transformAdapter)
		{
			var l = this._transformAdapter.listeners; 
			var i = l.indexOf(this); 
			if(i > -1)
				l.splice(i,1);
		}
		this.isValid = false;
	};
	
	XML3DGroupRenderAdapter.prototype._updateTransformAdapter = function() { 
	
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
		var tnode = xml3d.URIResolver.resolve(tname);
		this._transformAdapter = this.factory.getAdapter(tnode);
		
		if (this._transformAdapter)
			this._transformAdapter.listeners.push(this);
	};

	xml3d.webgl.XML3DGroupRenderAdapter = XML3DGroupRenderAdapter;
}());
