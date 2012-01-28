
// Adapter for <group>
org.xml3d.webgl.XML3DGroupRenderAdapter = function(factory, node) {
    org.xml3d.webgl.RenderAdapter.call(this, factory, node);
    this.listeners = new Array();
    this.processListeners();
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

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.dispatchEvent = function(evt) {
    var res = this.node.dispatchEvent(evt);
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
        downstreamValue = this.shader == null ? this._parentShader : this.shader;		
        evt.newValue = downstreamValue;
		this.notifyListeners(evt);
		
		this.factory.renderer.requestRedraw("Group shader changed.", false);
	}
	else if (evt.attribute == "transform") {
		//This group is now linked to a different transform node. We need to notify all 
		//of its children with the new transformation matrix

		this._updateTransformAdapter();
		if (this._transformAdapter) 
			downstreamValue = this._transformAdapter.getMatrix(); 
		else if (this.parentTransform)
			downstreamValue = new XML3DMatrix();
		else
			downstreamValue = null;
		
		if(this.parentTransform)
			downstreamValue = downstreamValue.multiply(this.parentTransform);
        
        //Set secondary flag to let subsequent adapters know this change was not directed at them
        evt.secondary = true;        
        evt.newValue = downstreamValue;
		this.notifyListeners(evt);
		this.factory.renderer.requestRedraw("Group transform changed.");
	}
	else if (evt.attribute == "visible") {
		this.notifyListeners(evt);
		this.factory.renderer.requestRedraw("Group visibility changed.");
	}
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.notifyListeners = function(evt) {
	for (var i=0; i<this.listeners.length; i++) {
			if (this.listeners[i].isValid)
				this.listeners[i].notifyChanged(evt);
			else {
				this.listeners.splice(i, 1);
				i--;
			}
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
