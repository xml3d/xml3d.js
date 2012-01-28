/**********************************************
 * Class org.xml3d.webgl.XML3DShaderManager
 * 
 * The XML3DShaderManager is an abstraction between the renderer and WebGL. It handles the creation and management 
 * of all shaders used in the scene, including internal shaders (eg. picking shader). 
 * 
 **********************************************/

org.xml3d.webgl.XML3DShaderManager = function(gl, renderer, dataFactory, factory) {
	this.gl = gl;
	this.renderer = renderer;
	this.dataFactory = dataFactory;
	this.factory = factory;
	this.currentProgram = null;
	this.shaders = {};
};

org.xml3d.webgl.XML3DShaderManager.prototype.createShaderForObject = function(obj, lights) {
	//This method is 'suboptimal', but will be replaced with the new modular shader system
	var shaderNode = null;
	var shader = null;
	
	var groupAdapter = this.factory.getAdapter(obj.meshNode.parentNode);
	var shaderAdapter = groupAdapter.getShader();
	shaderNode = shaderAdapter ? shaderAdapter.node : null;	

    shader = shaderNode ? this.shaders[shaderNode.id] : null;
    
    if (shader)
        return shader;
        
    var sources = {vs:null, fs:null};
			
	if (shaderNode && shaderNode.hasAttribute("script"))
	{
		var scriptURL = shaderNode.getAttribute("script");
		if (new org.xml3d.URI(scriptURL).scheme == "urn") {
			//Internal shader
			this.getStandardShaderSource(scriptURL, sources, shaderAdapter, lights);
            shader = this.createShaderFromSources(sources);
		} else {
			//User-provided shader
			var vsScript = this.node.xml3ddocument.resolve(scriptURL
					+ "-vs");
			var fsScript = this.node.xml3ddocument.resolve(scriptURL
					+ "-fs");
			if (vsScript && fsScript) {
				sources.vs = vsScript.textContent;
				sources.fs = fsScript.textContent;
			}
			
            shader = this.createShaderFromSources(sources);
		}
		this.shaders[shaderNode.id] = shader;
	} else {	
		shader = this.createShaderFromSources(sources);
	}
	
	if (shaderAdapter) {
		var dataTable = shaderAdapter.getDataTable();
		this.setUniformVariables(shader, dataTable);
	}
   
   return shader;	
};

org.xml3d.webgl.XML3DShaderManager.prototype.getStandardShaderSource = function(scriptURL, sources, shaderAdapter, lights) {
	//Need to check for textures to decide which internal shader to use
	var vertexColors = false;
	var dataTable = shaderAdapter.dataAdapter.createDataTable();	

	//if (scriptURL == "urn:xml3d:shader:phong" && !this.isEmpty(this.textures))
	//	scriptURL = "urn:xml3d:shader:texturedphong";
	
	if (dataTable.useVertexColor && dataTable.useVertexColor.data[0] == true)
		scriptURL += "vcolor";
	
	if (scriptURL == "urn:xml3d:shader:phong" || scriptURL == "urn:xml3d:shader:phongvcolor" || scriptURL == "urn:xml3d:shader:texturedphong")
	{
		// Workaround for lack of dynamic loops on ATI cards below the HD 5000 line
		var sfrag = g_shaders[scriptURL].fragment;
		var tail = sfrag.substring(68);
		var maxLights = "#ifdef GL_ES\nprecision highp float;\n" +
				"#endif\n\n const int MAXLIGHTS = "+ lights.length.toString() + ";\n";

		var frag = maxLights + tail;
		
		sources.vs = g_shaders[scriptURL].vertex;
		sources.fs = frag;
	} 
	else if (g_shaders[scriptURL]) {
		sources.vs = g_shaders[scriptURL].vertex;
		sources.fs = g_shaders[scriptURL].fragment;
	}
};

org.xml3d.webgl.XML3DShaderManager.prototype.getStandardShaderProgram = function(name) {
	var sources = {};
	
	if (!g_shaders[name]) {
		org.xml3d.debug.logError("Unknown shader: "+name+". Using flat shader instead.");
	} else {
		sources.vs = g_shaders[name].vertex;
		sources.fs = g_shaders[name].fragment;
	}
	
	var shaderProgram = this.createShaderFromSources(sources);	
	
	return shaderProgram;
};

org.xml3d.webgl.XML3DShaderManager.prototype.createShaderFromSources = function(sources) {
	var gl = this.gl;
	
	if (!sources.vs || !sources.fs) {
		return this.createShaderFromSources( {vs : g_shaders["urn:xml3d:shader:flat"].vertex, 
										  fs : g_shaders["urn:xml3d:shader:flat"].fragment} );	
	}
	
	var prg = gl.createProgram();
	
	var vShader = this.compileShader(gl.VERTEX_SHADER, sources.vs);
	var fShader = this.compileShader(gl.FRAGMENT_SHADER, sources.fs);
	
	if (vShader === null || fShader === null) {
		//Use a default flat shader instead
		return this.createShaderFromSources( {vs : g_shaders["urn:xml3d:shader:flat"].vertex, 
										  fs : g_shaders["urn:xml3d:shader:flat"].fragment} );
	}
	
	//Link shader program	
	gl.attachShader(prg, vShader);
	gl.attachShader(prg, fShader);
	gl.linkProgram(prg);
	
	if (gl.getProgramParameter(prg, gl.LINK_STATUS) == 0) {
		var errorString = "Shader linking failed: \n";
		errorString += gl.getProgramInfoLog(prg);
		errorString += "\n--------\n";
		org.xml3d.debug.logError(errorString);
		gl.getError();
		
		return this.createShaderFromSources( {vs : g_shaders["urn:xml3d:shader:flat"].vertex, 
										  fs : g_shaders["urn:xml3d:shader:flat"].fragment} );
	}
	
	var programObject = { 	
			attributes 	: {}, 
			uniforms 	: {}, 
			samplers	: {},
			handle		: prg, 
			vSource		: sources.vs,
			fSource		: sources.fs
	};
	
	this.bindShader(prg);
	
	//Tally shader attributes
	var numAttributes = gl.getProgramParameter(prg, gl.ACTIVE_ATTRIBUTES);
	for (var i=0; i<numAttributes; i++) {
		var att = gl.getActiveAttrib(prg, i);
		if (!att) continue;
		var attInfo = {};
		attInfo.name = att.name;
		attInfo.size = att.size;
		attInfo.glType = att.type;
		attInfo.location = gl.getAttribLocation(prg, att.name);
		programObject.attributes[att.name] = attInfo;
	}

	//TODO: shader not picking up light uniforms?
	//Tally shader uniforms and samplers
	var texCount = 0;
	var numUniforms = gl.getProgramParameter(prg, gl.ACTIVE_UNIFORMS);
	for (var i=0; i<numUniforms; i++) {
		var uni = gl.getActiveUniform(prg, i);
		if (!uni) continue;
		var uniInfo = {};	
		uniInfo.name = uni.name;
		uniInfo.size = uni.size;
		uniInfo.glType = uni.type;
		uniInfo.location = gl.getUniformLocation(prg, uni.name);
		
		if (uni.type == gl.SAMPLER_2D || uni.type == gl.SAMPLER_CUBE) {
			uniInfo.texUnit = texCount;
			programObject.samplers[uni.name] = uniInfo;
			texCount++;
		}
		else
			programObject.uniforms[uni.name] = uniInfo;
	}
	
	this.setStandardUniforms(programObject);
	
	return programObject;
};

org.xml3d.webgl.XML3DShaderManager.prototype.compileShader = function(type, shaderSource) {
	var gl = this.gl;
	
	var shd = gl.createShader(type);
	gl.shaderSource(shd, shaderSource);
	gl.compileShader(shd);
	
	if (gl.getShaderParameter(shd, gl.COMPILE_STATUS) == 0) {
		var errorString = "";
		if (type == gl.VERTEX_SHADER)
			errorString = "Vertex shader failed to compile: \n";
		else
			errorString = "Fragment shader failed to compile: \n";
		
		errorString += gl.getShaderInfoLog(shd) + "\n--------\n";
		org.xml3d.debug.logError(errorString);
		gl.getError();
		
		return null;
	}
	
	return shd;
};

org.xml3d.webgl.XML3DShaderManager.prototype.setStandardUniforms = function(sp) {
	
	var gl = this.gl;
	
	var uniform = null;
	
	//Diffuse color
	uniform = sp.uniforms.diffuseColor;
	if (uniform) { 
		this.setUniform(gl, uniform, [1.0, 1.0, 1.0]);
	}
	
	//Emissive color
	uniform = sp.uniforms.emissiveColor;
	if (uniform) { 
		this.setUniform(gl, uniform, [0.0, 0.0, 0.0]);
	}
	
	//Specular color
	uniform = sp.uniforms.specularColor;
	if (uniform) { 
		this.setUniform(gl, uniform, [0.0, 0.0, 0.0]);
	}
		
	//Shininess
	uniform = sp.uniforms.shininess;
	if (uniform) { 
		this.setUniform(gl, uniform, 0.2);
	}
	
	//Transparency
	uniform = sp.uniforms.transparency;
	if (uniform) { 
		this.setUniform(gl, uniform, 0.0);
	}

	
	//org.xml3d.webgl.checkError(this.gl);
};

org.xml3d.webgl.XML3DShaderManager.prototype.setUniformVariables = function(sp, uniforms) {
	this.bindShader(sp);
	
	for (var name in uniforms) {
		var u = uniforms[name];
		
		if (u.data)
			u = u.data;		
		if (u.clean)
			continue;
		if (u.length == 1)
			u = u[0]; // Either a single float, int or bool
		
		if (sp.uniforms[name]) {
			this.setUniform(this.gl, sp.uniforms[name], u);
		}
	}
	
};

org.xml3d.webgl.XML3DShaderManager.prototype.bindShader = function(sp) {
    // TODO: bind samplers (if any)
	if (sp.handle)
		sp = sp.handle;
    if (this.currentProgram != sp) {
        this.currentProgram = sp;
        this.gl.useProgram(sp);
    }
};

org.xml3d.webgl.XML3DShaderManager.prototype.unbindShader = function(sp) {
    // TODO: unbind samplers (if any)
	this.currentProgram = null;
	this.gl.useProgram(null);
};

org.xml3d.webgl.XML3DShaderManager.prototype.setUniform = function(gl, u, value) {
	switch (u.glType) {
		case gl.BOOL:
		case gl.INT:		
		case gl.SAMPLER_2D:	gl.uniform1i(u.location, value); break;	
		
		case gl.BOOL_VEC2: 	
		case gl.INT_VEC2:	gl.uniform2iv(u.location, value); break;
		
		case gl.BOOL_VEC3:	
		case gl.INT_VEC3:	gl.uniform3iv(u.location, value); break;
		
		case gl.BOOL_VEC4:	
		case gl.INT_VEC4:	gl.uniform4iv(u.location, value); break;
		
		case gl.FLOAT:		gl.uniform1f(u.location, value); break;
		case gl.FLOAT_VEC2:	gl.uniform2fv(u.location, value); break;
		case gl.FLOAT_VEC3:	gl.uniform3fv(u.location, value); break;
		case gl.FLOAT_VEC4:	gl.uniform4fv(u.location, value); break;
		
		case gl.FLOAT_MAT2: gl.uniformMatrix2fv(u.location, gl.FALSE, value); break;
		case gl.FLOAT_MAT3: gl.uniformMatrix3fv(u.location, gl.FALSE, value); break;
		case gl.FLOAT_MAT4: gl.uniformMatrix4fv(u.location, gl.FALSE, value); break;
		
		default:
			org.xml3d.debug.logError("Unknown uniform type "+u.glType);
			break;
	}
};

org.xml3d.webgl.XML3DShaderManager.prototype.bindDefaultShader = function() {
	if (!this.shaders.defaultShader) {
		this.shaders.defaultShader = this.getStandardShaderProgram("urn:xml3d:shader:flat");
	}
	this.currentProgram = this.shaders.defaultShader;
	this.gl.useProgram(this.shaders.defaultShader.handle);
	
	return this.shaders.defaultShader;
};

org.xml3d.webgl.XML3DShaderManager.prototype.unbindDefaultShader = function() {
	this.currentProgram = null;
	this.gl.useProgram(null);
};

org.xml3d.webgl.XML3DShaderManager.prototype.setGLContext = function(gl) {
	this.gl = gl;
};
