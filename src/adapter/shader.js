

// Adapter for <shader>
org.xml3d.webgl.XML3DShaderRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.program = null;
	this.gl = this.factory.handler.gl;
	this.xflowBuilt = false;
	
	this.renderer = this.factory.renderer;
	this.shaderHandler = this.renderer.shaderHandler;
	
	this.dataAdapter = this.renderer.dataFactory.getAdapter(this.node);
	if(this.dataAdapter)
		this.dataAdapter.registerObserver(this.renderer);
	else
		org.xml3d.debug.logError("Data adapter for a shader element could not be created!");
	
	//Collect textures (if any)
	this.textures = {};
	var dataTable = this.dataAdapter.createDataTable();
	for (var param in dataTable) {
		if (dataTable[param].isTexture) {
			this.textures[param] = {
				adapter : factory.getAdapter(dataTable[param].node),
				info	: { texUnit : 0 }
			};		
		} 
	}
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DShaderRenderAdapter;

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.notifyChanged = function(evt) {
	if (evt.attribute == "script") {
		if (this.program) {
			this.destroy();
		
			//All uniforms need to be dirtied to make sure they're set in the new shader program
			var dataTable = this.dataAdapter.createDataTable();		
			for (var uniform in dataTable) {
				var u = dataTable[uniform];
				if (u.clean)
					u.clean = false;
			}	
		}
		this.renderer.requestRedraw();
	} else if (evt.newValue && evt.newValue.nodeName == "texture") {		
		var adapter = this.factory.getAdapter(evt.newValue);
		var name = evt.newValue.name;
			
		this.textures[name] = { adapter : adapter, info : { texUnit : 0 } };
		this.destroy();		
	}
	
	
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.isEmpty = function(obj) {
	for (var p in obj) {
		return false;
	}
	return true;
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.getStandardShaderSource = function(scriptURL, sources) {
	//Need to check for textures to decide which internal shader to use
	var vertexColors = false;
	var dataTable = this.dataAdapter.createDataTable();	

	if (scriptURL == "urn:xml3d:shader:phong" && !this.isEmpty(this.textures))
		scriptURL = "urn:xml3d:shader:texturedphong";
	
	if (dataTable.useVertexColor && dataTable.useVertexColor.data[0] == true)
		scriptURL += "vcolor";
	
	if (scriptURL == "urn:xml3d:shader:phong" || scriptURL == "urn:xml3d:shader:phongvcolor" || scriptURL == "urn:xml3d:shader:texturedphong")
	{
		// Workaround for lack of dynamic loops on ATI cards below the HD 5000 line
		var sfrag = g_shaders[scriptURL].fragment;
		var tail = sfrag.substring(68, sfrag.length);
		var maxLights = "#ifdef GL_ES\nprecision highp float;\n" +
				"#endif\n\n const int MAXLIGHTS = "+ this.renderer.lights.length.toString() + ";\n";

		var frag = maxLights + tail;
		
		sources.vs = g_shaders[scriptURL].vertex;
		sources.fs = frag;
	} 
	else if (g_shaders[scriptURL]) {
		sources.vs = g_shaders[scriptURL].vertex;
		sources.fs = g_shaders[scriptURL].fragment;
	}
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.createShaderProgram = function(sources) {
	return this.shaderHandler.createShaderFromSources(sources);
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.bindProgram = function() {	
	this.gl.useProgram(this.shaderProgram.handle);
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.destroy = function() {
	if (this.shaderProgram)
		this.gl.deleteProgram(this.shaderProgram.handle);
	
	this.program = null;
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.dispose = function() {
	Array.forEach(this.textures, function(t) {
		t.adapter.destroy();
	});
	this.destroy();
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.enable = function(globalUniforms) {
	this.bindProgram();	
	//this.setUniformVariables(globalUniforms);
	this.bindSamplers();
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.disable = function() {
	this.unbindSamplers();
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.setUniformVariables = function(globalUniforms) {
	var dataTable = this.dataAdapter.createDataTable();
	var sp = this.shaderProgram;
	var gl = this.gl;
	
	//Set shader-specific uniforms
	for (var uniform in dataTable) {
		var u = dataTable[uniform];	
		if (u.clean === true)
			continue;
		
		if (u.isTexture) {
			//Have to check for existence of uniforms in the shader, since the user is allowed to give 
			//unused parameters
			if (sp.samplers[uniform])
				this.shaderHandler.setUniform(gl, sp.samplers[uniform], this.textures[uniform].info.texUnit);
		} 
		else if (sp.uniforms[uniform]) {
			var data = u.data.length == 1 ? u.data[0] : u.data;
			this.shaderHandler.setUniform(gl, sp.uniforms[uniform], data);
		}
		
		this.dataAdapter.dataTable[uniform].clean = true;
	}

	//Set global uniforms (lights, space conversion matrices)
	for (var uniform in globalUniforms) {
		var uValue = globalUniforms[uniform];
		
		if (sp.uniforms[uniform]) {
			this.shaderHandler.setUniform(gl, sp.uniforms[uniform], uValue);
		}
	}

};


org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.bindSamplers = function() {	
	var mustRebuildShader = false;
	
	for (var name in this.textures) {
		var tex = this.textures[name];
		if (tex.adapter.node != null)
			tex.adapter.bind(tex.info.texUnit);
		else {
			mustRebuildShader = true;
			break;
		}
	}
	
	//A texture must have been removed since the last render pass, so to be safe we should rebuild the shader
	//to try to avoid missing sampler errors in GL
	if (mustRebuildShader) {
		delete this.textures[name];
		this.destroy();
		this.enable();
	}
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.unbindSamplers = function() {
	for (var name in this.textures) {
		var tex = this.textures[name];
		tex.adapter.unbind(tex.info.texUnit);
	}
};

//Build an instance of the local shader with the given XFlow declarations and body
org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.getXFlowShader = function(declarations, body) {
	/*if (new org.xml3d.URI(this.program.scriptURL).scheme != "urn") {
		org.xml3d.debug.logWarning("XFlow scripts cannot be used in conjunction with custom shaders yet, sorry!");
		return null;
	}*/
	
	if (this.xflowBuilt) {
		return this.program;
	}
	
	var vertex = this.program.vSource;
	var fragment = this.program.fSource;
	
	vertex = declarations + vertex;
	var cutPoint = vertex.indexOf('~');
	
	var bodyCut1 = vertex.substring(0, cutPoint+1);
	var bodyCut2 = vertex.substring(cutPoint+3);
	
	vertex = bodyCut1 +"\n"+ body + bodyCut2;
	
	var sources = {};
	sources.vs = vertex;
	sources.fs = fragment;
	this.xflowBuilt = true;
	
	return this.createShaderProgram(sources);
	
};


