// Adapter for <light>
(function() {

	var XML3DLightRenderAdapter = function(factory, node) {
		XML3D.webgl.RenderAdapter.call(this, factory, node);
		
		var intensityAttribute = node.getAttribute("intensity");
		if (intensityAttribute) {
			try {
				var flt = parseFloat(intensityAttribute);
				this.intensity = flt;
			} catch (e) {XML3D.debug.logWarning("Could not parse light intensity attribute ' "+intensityAttribute+" '"); }
		}
		
		this.visible = true;
		this.position = null;
		this.intensity = null;
		this.transform = null;
		this.lightShader = null;

		this.isValid = true;
	};
	XML3D.createClass(XML3DLightRenderAdapter, XML3D.webgl.RenderAdapter);
	
	XML3DLightRenderAdapter.prototype.notifyChanged = function(evt) {
		var target = evt.internalType || evt.wrapped.attrName;
		
		switch(target) {
		case "visible":
			this.visible = (evt.wrapped.newValue == "true") && this.node.parentNode.visible;
			break;
		case "parentvisible":
			this.visible = evt.newValue && this.node.visible;
			break;
		case "intensity":
			if (!isNaN(evt.newValue))
				this.intensity = evt.newValue;
			else
				XML3D.debug.logError("Invalid parameter for light intensity attribute: NaN");
			break;
		case "parenttransform":
			this.transform = evt.newValue;
			break;
		}
		
		this.factory.handler.redraw("Light attribute changed.");	
	};
	
	XML3DLightRenderAdapter.prototype.getParameters = function(viewMatrix) {
		var shader = this.getLightShader();
	
		if(!shader)
			return null;
		var mvm = mat4.create(viewMatrix);
		
		if (this.transform)
			mvm = mat4.multiply(mvm, this.transform, mat4.create());
		
		if (!this.dataAdapter)
		{
			var renderer = shader.factory.renderer;
			this.dataAdapter = renderer.dataFactory.getAdapter(shader.node);
			if(this.dataAdapter)
				this.dataAdapter.registerObserver(renderer);
		}
		var params = this.dataAdapter.createDataTable();
	
		if (this.visible)
			var visibility = [1.0, 1.0, 1.0];
		else
			var visibility = [0.0, 0.0, 0.0];
	
	
		//Set up default values
		var pos = mat4.multiplyVec4(mvm, quat4.create([0,0,0,1]));
		var aParams = {
			position 	: [pos[0]/pos[3], pos[1]/pos[3], pos[2]/pos[3]],
			attenuation : [0.0, 0.0, 1.0],
			intensity 	: [1.0, 1.0, 1.0],
			visibility 	: visibility
		};
	
		for (var p in params) {
			if (p == "position") {
				//Position must be multiplied with the model view matrix
				var t = quat4.create([params[p].data[0], params[p].data[1],params[p].data[2], 1.0]);
				mat4.multiplyVec4(mvm, t);
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
	
	XML3DLightRenderAdapter.prototype.getLightShader = function() {
		if (!this.lightShader) {
			var shaderLink = this.node.shader;
			var shader = null;
			if (shaderLink != "")
				shader = XML3D.URIResolver.resolve(shaderLink);
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
			this.lightShader = this.factory.getAdapter(shader);
		}
		return this.lightShader;
	};
	XML3DLightRenderAdapter.prototype.dispose = function() {
		this.isValid = false;
	};

	// Export to XML3D.webgl namespace
	XML3D.webgl.XML3DLightRenderAdapter = XML3DLightRenderAdapter;

}());