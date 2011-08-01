
// Adapter for <light>
org.xml3d.webgl.XML3DLightRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.position = null;
	this.intensity = null;
	
	var intensityAttribute = node.getAttribute("intensity");
	if (intensityAttribute) {
		try {
			var flt = parseFloat(intensityAttribute);
			this.intensity = flt;
		} catch (e) {org.xml3d.debug.logWarning("Could not parse light intensity attribute ' "+intensityAttribute+" '"); }
	}
	
	this._visible = null;
	this.isValid = true;
};
org.xml3d.webgl.XML3DLightRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DLightRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DLightRenderAdapter;

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.collectDrawableObjects = function(
		transform, opaqueObjects, transparentObjects, outLights, shader, visible) {
	outLights.push( [ transform, this ]);
	this._transform = transform;
	this._visible = visible;
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.notifyChanged = function(e) {
	if (e.attribute == "visible")
		this._visible = e.newValue;
	else if (e.attribute == "intensity") {
		if (!isNaN(e.newValue))
			this.intensity = e.newValue;
		else
			org.xml3d.debug.logError("Invalid parameter for light intensity attribute: NaN");
	}
	
	this.factory.handler.redraw("Light attribute changed.");	
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.internalNotifyChanged = function(what, newValue) {
	if (what == "transform" || what == "parenttransform")
		this._transform = newValue;
	else if (what == "visible")
		this._visible = newValue;
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getParameters = function(modelViewMatrix) {
	var shader = this.getLightShader();

	if(!shader)
		return null;
	
	if (this._transform)
		modelViewMatrix = sglMulM4(modelViewMatrix, this._transform);
	if (!this.dataAdapter)
	{
		var renderer = shader.factory.renderer;
		this.dataAdapter = renderer.dataFactory.getAdapter(shader.node);
		if(this.dataAdapter)
			this.dataAdapter.registerObserver(renderer);
	}
	var params = this.dataAdapter.createDataTable();

	if (this._visible)
		var visibility = [1.0, 1.0, 1.0];
	else
		var visibility = [0.0, 0.0, 0.0];


	//Set up default values
	var pos = sglMulM4V4(modelViewMatrix, [0.0, 0.0, 0.0, 1.0]);
	var aParams = {
		position 	: [pos[0]/pos[3], pos[1]/pos[3], pos[2]/pos[3]],
		attenuation : [0.0, 0.0, 1.0],
		intensity 	: [1.0, 1.0, 1.0],
		visibility 	: visibility
	};

	for (var p in params) {
		if (p == "position") {
			//Position must be multiplied with the model view matrix
			var t = [params[p].data[0], params[p].data[1],params[p].data[2], 1.0];
			t = sglMulM4V4(modelViewMatrix, t);
			aParams[p] = [t[0]/t[3], t[1]/t[3], t[2]/t[3]];
			continue;
		}
		aParams[p] = params[p].data;
	}
	
	if (this.intensity !== null) {
		var i = aParams.intensity;
		aParams.intensity = [i[0]*this.intensity, i[1]*this.intensity, i[2]*this.intensity];
	}
	
	return aParams;
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getLightShader = function() {
	if (!this.lightShader) {
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
		this.lightShader = this.factory.getAdapter(shader, org.xml3d.webgl.Renderer.prototype);
	}
	return this.lightShader;
};
org.xml3d.webgl.XML3DLightRenderAdapter.prototype.dispose = function() {
	this.isValid = false;
};
