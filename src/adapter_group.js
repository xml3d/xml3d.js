
// Adapter for <group>
org.xml3d.webgl.XML3DGroupRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.listeners = new Array();
	this.parentTransform = null;
	this._parentShader = null;
	this._eventListeners = [];
	this.isValid = true;
	//this._transformAdapter = this.factory.getAdapter(this.node.getTransformNode(), org.xml3d.webgl.Renderer.prototype);
	//if (this._transformAdapter)
	//	this._transformAdapter.listeners.push(this);
	this._updateTransformAdapter(); 
};
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DGroupRenderAdapter;
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.applyTransformMatrix = function(
		transform) {
	var ret = transform;
	
	if (this.parentTransform !== null)
		ret = this.parentTransform.multiply(ret);
	
	if (this._transformAdapter)
		ret = this._transformAdapter.getMatrix().multiply(ret);
	
	return ret;
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.evalOnclick = function(evtMethod) {
	if (evtMethod)
		eval(evtMethod);
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.addEventListener = function(itype, ilistener, icapture) {
	var evl = {
		type : itype,
		listener : ilistener,
		capture : icapture
	};	
	this._eventListeners.push(evl);
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.removeEventListener = function(itype, ilistener, icapture) {
	for (var i=0; i < this._eventListeners.length; i++) {
		var evl = this._eventListeners[i];
		if (evl.type == itype && evl.listener == ilistener) {
			this._eventListeners.splice(i, 1);
			i--;
		}
	}
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.dispatchEvent = function(evt) {
	for (var i=0; i<this._eventListeners.length; i++) {
		var evl = this._eventListeners[i];
		if (evl.type == evt.type) {
			evl.listener.call(this.node, evt);
		}
	}
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.notifyChanged = function(evt) {
	var downstreamValue = null;
	if (evt.eventType == MutationEvent.ADDITION)
		this.factory.renderer.sceneTreeAddition(evt); 
	else if (evt.eventType == MutationEvent.REMOVAL) {
		this.factory.renderer.sceneTreeRemoval(evt);
	}
	else if (evt.attribute == "shader") {
		//Update this group node's shader then propagate the change down to its children
		this.shader = this.getShader();
		if (this.shader == null)
			downstreamValue = this._parentShader;
		else
			downstreamValue = this.shader;
		this.notifyListeners(evt.attribute, downstreamValue);
		
		this.factory.renderer.requestRedraw("Group shader changed.", false);
	}
	else if (evt.attribute == "transform") {
		//This group is now linked to a different transform node. We need to notify all 
		//of its children with the new transformation matrix
		//var adapter = this.factory.getAdapter(this.node.getTransformNode(), org.xml3d.webgl.Renderer.prototype);
		//downstreamValue = adapter.getMatrix();
		this._updateTransformAdapter();
		if (this._transformAdapter) 
			downstreamValue = this._transformAdapter.getMatrix(); 
		else if (this.parentTransform)
			downstreamValue = new XML3DMatrix();
		else
			downstreamValue = null;
		
		if(this.parentTransform)
			downstreamValue = downstreamValue.multiply(this.parentTransform);
		
		this.notifyListeners("parenttransform", downstreamValue);
		this.factory.renderer.requestRedraw("Group transform changed.");
	}
	else if (evt.attribute == "visible") {		
		this.notifyListeners("visible", evt.newValue);
		this.factory.renderer.requestRedraw("Group visibility changed.");
	}
};

/**
 * Notify this node that changes were made to its parent, then propagate these changes further down
 * to its children. The changes will eventually end at the 'leaf' nodes, which are normally meshes.
 * 
 * @param what
 * @param newValue
 * @return
 */
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.internalNotifyChanged = function(what, newValue) {
	var downstreamValue = null;
	
	if (what == "parenttransform") {
		//This change came from a parent group node, we need to update the parentTransform and pass
		//the updated transformation matrix down to the children
		this.parentTransform = newValue;
		var adapter = this.factory.getAdapter(this.node.getTransformNode(), org.xml3d.webgl.Renderer.prototype);
		if (adapter)
			downstreamValue = adapter.getMatrix().multiply(this.parentTransform);
		else
			downstreamValue = this.parentTransform;
		
	} else if (what == "transform") {
		//This was a change to the <transform> node tied to this adapter
		if (this.parentTransform)
			downstreamValue = newValue.multiply(this.parentTransform);	
		else
			downstreamValue = newValue;
		what = "parenttransform";
		
	} else if (what == "shader") {
		this._parentShader = newValue;
		if (this.shader)
			return; //this group node's shader overrides the parent shader for all its children, so we're done
	} else if (what == "visible") {
		downstreamValue = newValue;
	}
	
	this.notifyListeners(what, downstreamValue);
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.notifyListeners = function(what, newValue) {
	for (var i=0; i<this.listeners.length; i++) {
			if (this.listeners[i].isValid)
				this.listeners[i].internalNotifyChanged(what, newValue);
			else {
				this.listeners.splice(i, 1);
				i--;
			}
		}
};


org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.getShader = function()
{
	var shader = this.node.getShaderNode();

	// if no shader attribute is specified, try to get a shader from the style attribute
	if(shader == null)
	{
		var styleValue = this.node.getAttribute('style');
		if(!styleValue)
			return null;
		var pattern    = /shader\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
		var result = pattern.exec(styleValue);
		if (result)
			shader = this.node.xml3ddocument.resolve(result[1]);
	}

	return this.factory.getAdapter(shader, org.xml3d.webgl.Renderer.prototype);
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.dispose = function() {
	for (var child in this.node.childNodes) {
		var adapter = this.factory.getAdapter(this.node.childNodes[child], org.xml3d.webgl.Renderer.prototype);
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
	this._transformAdapter = this.factory.getAdapter(this.node.getTransformNode(), org.xml3d.webgl.Renderer.prototype);
	if (this._transformAdapter)
		this._transformAdapter.listeners.push(this);
};
