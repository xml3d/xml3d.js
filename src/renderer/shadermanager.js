/**********************************************
 * Class xml3d.webgl.XML3DShaderManager
 * 
 * The XML3DShaderManager is an abstraction between the renderer and WebGL. It handles the creation and management 
 * of all shaders used in the scene, including internal shaders (eg. picking shader). 
 * 
 **********************************************/

xml3d.webgl.XML3DShaderManager = function(gl, renderer, dataFactory, factory) {
	this.gl = gl;
	this.renderer = renderer;
	this.dataFactory = dataFactory;
	this.factory = factory;
	this.currentProgram = null;
	this.shaders = {};
	
	//Always create a default flat shader as a fallback for error handling
	this.shaders["defaultShader"] = this.getStandardShaderProgram("urn:xml3d:shader:flat");
	
	//Create picking shaders
	this.shaders["picking"] = this.getStandardShaderProgram("urn:xml3d:shader:picking");
	this.shaders["pickedNormals"] = this.getStandardShaderProgram("urn:xml3d:shader:pickedNormals");
};

xml3d.webgl.XML3DShaderManager.prototype.createShader = function(shaderAdapter, lights) {
	//This method is 'suboptimal', but will be replaced with the new modular shader system
	var shader = null;
	var shaderId = "defaultShader";
	var shaderNode = null;
	
	if (shaderAdapter) {
		shaderNode = shaderAdapter.node;
		shaderId = shaderNode.id;
	}

    shader = this.shaders[shaderId];
    
    if (shader)
        return shaderId;
        
    var sources = {vs:null, fs:null};
    var dataTable = null;
    var hasTextures = false;
    
    if (shaderAdapter) {
	    dataTable = shaderAdapter.getDataTable();
	    hasTextures = this.hasTextures(dataTable);	
    }
    
	if (shaderNode && shaderNode.hasAttribute("script"))
	{
		var scriptURL = shaderNode.getAttribute("script");
		if (new xml3d.URI(scriptURL).scheme == "urn") {
			//Internal shader
			this.getStandardShaderSource(scriptURL, sources, shaderAdapter, lights, hasTextures);
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
		this.shaders[shaderId] = shader;
	} else {	
		// Create the default flat shader
		shader = this.shaders["defaultShader"];
		shaderId = "defaultShader";
	}
	
	if (shaderAdapter) {		
		this.createTextures(shader, dataTable);
		this.setUniformVariables(shader, dataTable);
	}
   
   return shaderId;	
};

xml3d.webgl.XML3DShaderManager.prototype.getStandardShaderSource = function(scriptURL, sources, shaderAdapter, lights, hasTextures) {
	//Need to check for textures to decide which internal shader to use
	var vertexColors = false;
	var dataTable = shaderAdapter.getDataTable();	
	
	if (scriptURL == "urn:xml3d:shader:phong" && hasTextures)
		scriptURL = "urn:xml3d:shader:texturedphong";
	
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

xml3d.webgl.XML3DShaderManager.prototype.getStandardShaderProgram = function(name) {
	var sources = {};
	
	if (!g_shaders[name]) {
		xml3d.debug.logError("Unknown shader: "+name+". Using flat shader instead.");
	} else {
		sources.vs = g_shaders[name].vertex;
		sources.fs = g_shaders[name].fragment;
	}
	
	var shaderProgram = this.createShaderFromSources(sources);	
	
	return shaderProgram;
};

xml3d.webgl.XML3DShaderManager.prototype.createShaderFromSources = function(sources) {
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
		xml3d.debug.logError(errorString);
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
	
	gl.useProgram(prg);
	
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
	programObject.changes = [];
	return programObject;
};

xml3d.webgl.XML3DShaderManager.prototype.compileShader = function(type, shaderSource) {
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
		xml3d.debug.logError(errorString);
		gl.getError();
		
		return null;
	}
	
	return shd;
};


xml3d.webgl.XML3DShaderManager.prototype.recompileShader = function(shaderAdapter, lights) {
	var shader = this.shaders[shaderAdapter.node.id];
	if (shader) {
		this.destroyShader(shader);
		delete shader;
		this.createShader(shaderAdapter, lights);
	}
};

xml3d.webgl.XML3DShaderManager.prototype.shaderDataChanged = function(shaderAdapter, evt) {
	var targetName = evt.wrapped.currentTarget.name;
	var shader = this.shaders[shaderAdapter.node.id];
	var dataTable = shaderAdapter.getDataTable();
	
	//Store the change, it will be applied the next time the shader is bound
	if (dataTable[targetName]){
		shader.changes.push({
			type : "uniform",
			name : targetName,
			newValue : dataTable[targetName].data
		});
	}
	
};


xml3d.webgl.XML3DShaderManager.prototype.setStandardUniforms = function(sp) {
	
	var gl = this.gl;
	
	var uniform = null;
	
	//Diffuse color
	uniform = sp.uniforms.diffuseColor;
	if (uniform) { 
		this.setUniform(gl, uniform, [0.0, 0.0, 1.0]);
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

	
	//xml3d.webgl.checkError(this.gl);
};

xml3d.webgl.XML3DShaderManager.prototype.getShaderById = function(shaderId) {
	var sp = this.shaders[shaderId];
	if (!sp) {
		xml3d.debug.logError("Could not find the shader [ "+shaderId+" ]");
		sp = this.shaders["default"];
	}
	return sp;
};

xml3d.webgl.XML3DShaderManager.prototype.setUniformVariables = function(shader, uniforms) {
	this.bindShader(shader);
	
	for (var name in uniforms) {
		var u = uniforms[name];
		
		if (u.data)
			u = u.data;		
		if (u.clean)
			continue;
		if (u.length == 1)
			u = u[0]; // Either a single float, int or bool
		
		if (shader.uniforms[name]) {
			this.setUniform(this.gl, shader.uniforms[name], u);
		}
	}
	
};

xml3d.webgl.XML3DShaderManager.prototype.bindShader = function(shader) {
    // TODO: bind samplers (if any)
	var sp = (typeof shader == typeof "") ? this.getShaderById(shader) : shader;

	//Apply any changes encountered since the last time this shader was rendered
    for (var i=0, l = sp.changes.length; i<l; i++) {
    	var change = sp.changes[i];
    	if (change.type == "uniform" && sp.uniforms[change.name]) {
    		this.setUniform(this.gl, sp.uniforms[change.name], change.newValue);
    	}
    	
    	//TODO: changes to samplers/attributes
    }
    sp.changes = [];

    var samplers = sp.samplers;
	for (var tex in samplers) {
		this.bindTexture(samplers[tex]);
	}
	sp = sp.handle;
	
    if (this.currentProgram != sp) {
        this.currentProgram = sp;
        this.gl.useProgram(sp);
    }

};

xml3d.webgl.XML3DShaderManager.prototype.unbindShader = function(shader) {
    // TODO: unbind samplers (if any)	
	var sp = (typeof shader == typeof "") ? this.getShaderById(shader) : shader;
	var samplers = sp.samplers;
	for (var tex in samplers) {
		this.unbindTexture(samplers[tex]);
	}
	
	this.currentProgram = null;
	this.gl.useProgram(null);
};

xml3d.webgl.XML3DShaderManager.prototype.setUniform = function(gl, u, value) {
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
			xml3d.debug.logError("Unknown uniform type "+u.glType);
			break;
	}
};

xml3d.webgl.XML3DShaderManager.prototype.setGLContext = function(gl) {
	this.gl = gl;
};

xml3d.webgl.XML3DShaderManager.prototype.destroyShader = function(shader) {
	for (var tex in shader.samplers) {
		this.destroyTexture(shader.samplers[tex]);
	}
	
	this.gl.deleteProgram(shader.handle);
};

xml3d.webgl.XML3DShaderManager.prototype.hasTextures = function(dataTable) {
	for (var param in dataTable) {
		if (dataTable[param].isTexture) {
			return true;	
		} 
	}
	return false;
};

xml3d.webgl.XML3DShaderManager.prototype.createTextures = function(shader, dataTable) {
	var texUnit = 0;
	
	for (var name in shader.samplers) {
		var texture = dataTable[name];
		var sampler = shader.samplers[name];
		
		var opt = {
				isDepth          : false,
				minFilter 		 : dataTable[name].options.minFilter,
				magFilter		 : dataTable[name].options.magFilter,
				wrapS			 : dataTable[name].options.wrapS,
				wrapT			 : dataTable[name].options.wrapT,
				generateMipmap	 : dataTable[name].options.generateMipmap,
				flipY            : true,
				premultiplyAlpha : true	
		};
		
		var tex = this.gl.createTexture();
		var info = { 
				status : 0, //image has not been loaded yet
				handle : tex,
				texUnit : texUnit
		};
		var image = new Image();
		var renderer = this.renderer;
		image.onload = function() {
			info.status = 1; //image loaded, next phase is texture creation
			renderer.requestRedraw.call(renderer, "Texture loaded");
		};
		image.src = texture.src[0];
		
		info.image = image;
		sampler.info = info;
		sampler.options = opt;
		texUnit++;
	}
};

xml3d.webgl.XML3DShaderManager.prototype.createTex2DFromData = function(internalFormat, width, height, 
		sourceFormat, sourceType, texels, opt) {
	var gl = this.gl;
	var info = {};
	if (!texels) {
		if (sourceType == gl.FLOAT) {
			texels = new Float32Array(width * height * 4);
		}
		else {
			texels = new Uint8Array(width * height * 4);
		}
	}
	
	var handle = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, handle);
	
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opt.wrapS);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opt.wrapT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opt.minFilter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opt.magFilter);
	
	gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, sourceFormat, sourceType, texels);
	
	if (opt.isDepth) {
		gl.texParameteri(gl.TEXTURE_2D, gl.DEPTH_TEXTURE_MODE,   opt.depthMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, opt.depthCompareMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, opt.depthCompareFunc);
	}
	if (opt.generateMipmap) {
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	info.handle = handle;
	info.options = opt;
	info.valid = true;
	info.glType = gl.TEXTURE_2D;
	info.format = internalFormat;	
	
	return info;
};

xml3d.webgl.XML3DShaderManager.prototype.createTex2DFromImage = function(info, opt) {
	var gl = this.gl;
	var texInfo = {};
	gl.bindTexture(gl.TEXTURE_2D, info.handle);
	
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opt.wrapS);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opt.wrapT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opt.minFilter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opt.magFilter);
	
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, info.image);
	
	if (opt.generateMipmap) {
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	texInfo.handle = info.handle;
	texInfo.texUnit = info.texUnit;
	texInfo.options = opt;
	texInfo.valid = true;
	texInfo.glType = gl.TEXTURE_2D;
	texInfo.format = gl.RGBA;	
	
	return texInfo;	
};

xml3d.webgl.XML3DShaderManager.prototype.bindTexture = function(tex) {
	var info = tex.info;
	
	if (info.valid) {
		this.gl.activeTexture(this.gl.TEXTURE0 + info.texUnit);
		this.gl.bindTexture(info.glType, info.handle);
	} else {
		if (info.status)
			tex.info = this.createTex2DFromImage(info, tex.options);
	}
};

xml3d.webgl.XML3DShaderManager.prototype.unbindTexture = function(tex) {
	this.gl.activeTexture(this.gl.TEXTURE0 + tex.info.texUnit);
	this.gl.bindTexture(tex.info.glType, null);
};
