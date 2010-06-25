// Create global symbol org
var org;
if (!org)
	org = {};
else if (typeof org != "object")
	throw new Error("org already exists and is not an object");

if (!org.xml3d)
	org.xml3d = {};
else if (typeof org.xml3d != "object")
	throw new Error("org.xml3d already exists and is not an object");

// Create global symbol org.xml3d
if (!org.xml3d.webgl)
	org.xml3d.webgl = {};
else if (typeof org.xml3d.webgl != "object")
	throw new Error("org.xml3d.webgl already exists and is not an object");

org.xml3d.gfx_webgl = (function() {
	function Context(ctx3d, canvas, name) {
		this.ctx3d = ctx3d;
		this.canvas = canvas;
		this.name = name;
	}
	Context.prototype.getName = function() {
		return this.name;
	};
	function setupContext(canvas) {
		// org.xml3d.debug.logInfo("setupContext: canvas=" + canvas);
		var ctx = null;
		try {
			ctx = canvas.getContext('moz-webgl');
			if (ctx) {
				return new Context(ctx, canvas, 'moz-webgl');
			}
		} catch (ef) {
		}
		try {
			ctx = canvas.getContext('webkit-3d');
			if (ctx) {
				return new Context(ctx, canvas, 'webkit-3d');
			}
		} catch (es) {
		}
	}

	function getShaderProgram(gl, ids) {
		var shader = [];
		for ( var id = 0; id < 2; id++) {
			if (!g_shaders[ids[id]]) {
				org.xml3d.debug.logError('Cannot find shader ' + ids[id]);
				return;
			}
			if (g_shaders[ids[id]].type == 'vertex') {
				shader[id] = gl.createShader(gl.VERTEX_SHADER);
			} else if (g_shaders[ids[id]].type == 'fragment') {
				shader[id] = gl.createShader(gl.FRAGMENT_SHADER);
			} else {
				org.xml3d.debug
						.logError('Invalid shader type ' + g_shaders[id].type);
				return;
			}
			gl.shaderSource(shader[id], g_shaders[ids[id]].data);
			gl.compileShader(shader[id]);
		}
		var prog = gl.createProgram();
		gl.attachShader(prog, shader[0]);
		gl.attachShader(prog, shader[1]);
		gl.linkProgram(prog);
		var msg = gl.getProgramInfoLog(prog);
		if (msg) {
			org.xml3d.debug.logError(msg);
		}
		return wrapShaderProgram(gl, prog);
	}


	Context.prototype.renderScene = function(scene) {
		var gl = this.ctx3d;
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		var bgCol = scene.getBackgroundColor();
		if (bgCol)
			gl.clearColor(bgCol[0], bgCol[1], bgCol[2], bgCol[3]);
		else
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT
				| gl.STENCIL_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		if (this.renderer === undefined || !this.renderer) {
			this.renderer = new org.xml3d.webgl.Renderer(scene, this.canvas, gl);
		}
		this.renderer.render();

		gl.disable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);

	};

	Context.prototype.initTex = function(gl, w, h) {
		var tex = gl.createTexture();
		org.xml3d.webgl.checkError(gl, "After initTex");
		gl.bindTexture(gl.TEXTURE_2D, tex);
		//this.emptyTexImage2D(gl, gl.RGBA, w, h, gl.RGBA, gl.UNSIGNED_BYTE);

		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		tex.width = w;
		tex.height = h;
		return tex;
	};
	Context.prototype.initFbo = function(gl, w, h) {
		var fbo = gl.createFramebuffer();
		var rb = gl.createRenderbuffer();
		var tex = this.initTex(gl, w, h, nearest);
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT, w, h);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_2D, tex, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
				gl.RENDERBUFFER, rb);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		var r = {};
		r.fbo = fbo;
		r.rbo = rb;
		r.tex = tex;
		r.width = w;
		r.height = h;
		return r;
	};
	
	Context.prototype.shutdown = function(scene) {
		var gl = this.ctx3d;

		if (this.renderer) {
			this.renderer.dispose();
		}
	};
	return setupContext;
})();


org.xml3d.webgl.checkError = function(gl, text)
{
	var error = gl.getError();
	if (error !== gl.NO_ERROR) {
		var msg = "GL error " + error + " occured.";
		if (text !== undefined)
			msg += " " + text;
		org.xml3d.debug.logError(msg);
	}
};

org.xml3d.webgl.Renderer = function(scene, canvas, gl) {
	this.scene = scene;
	this.canvas = canvas;
	this.gl = gl;
	this.factory = new org.xml3d.webgl.XML3DRenderAdapterFactory(gl, this);
	this.lights = null;
	this.camera = this.initCamera();
	this.shaderMap = {};
};
org.xml3d.webgl.Renderer.prototype.update = function() {
	this.canvas.needUpdate = true;
};

org.xml3d.webgl.Renderer.prototype.initCamera = function() {
	var av = this.scene.getActiveView();
	if (av == null)
	{
		av =  document.evaluate('//xml3d:xml3d/xml3d:view[1]', document, function() {
			return org.xml3d.xml3dNS;
		}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		if (av == null)
			org.xml3d.debug.logError("No view defined.");
		return this.factory.getAdapter(av);
	}
	return this.factory.getAdapter(av);
};

org.xml3d.webgl.Renderer.prototype.collectDrawableObjects = function(transform,
		object, shader) {
	var adapter = this.factory.getAdapter(this.scene);
	if (adapter)
		return adapter.collectDrawableObjects(transform, object, shader);
	return [];
};

org.xml3d.webgl.Renderer.prototype.getLights = function() {
	if (!this.lights) {
		this.lights = new Array();
		var adapter = this.factory.getAdapter(this.scene);
		if (adapter)
			adapter.collectLights(new XML3DMatrix(),
					this.lights);
	}
	return this.lights;
};

org.xml3d.webgl.Renderer.prototype.getStandardShaderProgram = function(gl, name) {
	var shader = this.shaderMap[name];
	if (!shader) {
		if (g_shaders[name] === undefined)
		{
			org.xml3d.debug.logError("Could not find standard shader: " + name);
			return null;
		}
		org.xml3d.webgl.checkError(gl, "Before creating shader");
		var prog = gl.createProgram();
		var vs = gl.createShader(gl.VERTEX_SHADER);
		var fs = gl.createShader(gl.FRAGMENT_SHADER);
		
		if (name == "urn:xml3d:shader:phong")
		{
			// Workaround for lack of dynamic loops on ATI cards below the HD 5000 line 
			var lights = this.getLights();
			var sfrag = g_shaders[name].fragment;
			var tail = sfrag.substring(38, sfrag.length);
			var maxLights = "#version 120\n\n const int MAXLIGHTS = "+ lights.length.toString() + ";\n";
			
			gl.shaderSource(vs, g_shaders[name].vertex);
			var frag = maxLights + tail; 
			gl.shaderSource(fs, frag);
			// ------------------------------------------------------------------------
		} else {
			gl.shaderSource(vs, g_shaders[name].vertex);
			gl.shaderSource(fs, g_shaders[name].fragment);
		}
		gl.compileShader(vs);
		gl.compileShader(fs);
		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.linkProgram(prog);
		var msg = gl.getProgramInfoLog(prog);
		if (msg.length > 54) {
			org.xml3d.debug.logError("Could not create standard shader: " + name + " ("+ msg +")");
			return null;
		}
		org.xml3d.webgl.checkError(gl, "Before wrapping shader");
		shader = org.xml3d.webgl.Renderer.wrapShaderProgram(gl, prog);
		org.xml3d.webgl.checkError(gl, "After wrapping shader");
		this.shaderMap[name] = shader;
	}
	return shader;
};

org.xml3d.webgl.Renderer.prototype.getCenter = function(adapter) {
	return adapter.getCenter();
};

org.xml3d.webgl.Renderer.prototype.render = function() {
	var gl = this.gl;
	var sp = null;
	if (!this.camera)
		return;

	org.xml3d.webgl.checkError(gl, "Start render");
	if (this.drawableObjects === undefined || !this.drawableObjects) {
		this.drawableObjects = [];
		this.collectDrawableObjects(new XML3DMatrix(),
				this.drawableObjects, null);
	}
	
	var worldViewMatrix = this.camera.getViewMatrix();
	
	
	var light, lightOn;

	var zPos = [];
	for (i = 0, n = this.drawableObjects.length; i < n; i++) {
		var trafo = this.drawableObjects[i][0];
		var obj3d = this.drawableObjects[i][1];
		var center = this.getCenter(obj3d);
		center = trafo.multiply(center);
		center = worldViewMatrix.multiply(center);
		zPos[i] = [ i, center.z ];
	}
	zPos.sort(function(a, b) {
		return a[1] - b[1];
	});

	org.xml3d.webgl.checkError(gl, "Before drawing");
	for (i = 0, n = zPos.length; i < n; i++) {
		var obj = this.drawableObjects[zPos[i][0]];
		var transform = obj[0];
		var shape = obj[1];
		var shader = obj[2];

		sp = null;
		if (shader) {
			sp = shader.shaderProgram;
		}
		if (sp)
		{
			org.xml3d.webgl.checkError(gl, "Before bind shader");
			sp.bind();
			org.xml3d.webgl.checkError(gl, "After bind shader");
		}
		else
		{
			org.xml3d.webgl.checkError(gl, "Before default shader");
			sp = this.getStandardShaderProgram(gl, "urn:xml3d:shader:flat");
			if (sp) {
				sp.bind();
				if (RGBColor && document.defaultView
					&& document.defaultView.getComputedStyle) {
					var colorStr = document.defaultView.getComputedStyle(
						shape.node, "").getPropertyValue("color");
					var color = new RGBColor(colorStr);
					org.xml3d.webgl.checkError(gl, "Before default diffuse");
					sp.diffuseColor = [0.0,0.0,0.80];//color.toGL();
					org.xml3d.webgl.checkError(gl, "After default diffuse");
			}
			}
		}
		
		var slights = this.getLights();
		var lightParams = {
			positions : new Array(),
			diffuseColors : new Array(),
			ambientColors : new Array(),
			attenuations : new Array()
		};

		for ( var j = 0; j < slights.length; j++) {
			var light = slights[j][1];
			lightParams.positions = lightParams.positions.concat(
					worldViewMatrix.multiply(light
					.getPosition(slights[j][0])).toGL());
			lightParams.attenuations = lightParams.attenuations.concat(light
					.getAttenuation().toGL());
			lightParams.diffuseColors = lightParams.diffuseColors.concat(
					light.getDiffuseColor().toGL());

		}
		//lightParams.diffuseColors = [ 10, 4, 4, 4, 4, 10 ];
		//lightParams.diffuseColors = [ 1.0, 1.0, 1.0, 1.0, 1.0, 1.0 ];
		lightParams.ambientColors = [ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ];

		sp.lightPositions = lightParams.positions;
		sp.lightDiffuseColors = lightParams.diffuseColors;
		sp.lightAmbientColors = lightParams.ambientColors;
		sp.lightAttenuations = lightParams.attenuations;

		/*
		 * if (slights.length > 0) { light = slights[0]._direction; lightOn =
		 * (slights[0]._on === true) ? 1.0 : 0.0; lightOn = lightOn *
		 * slights[0]._intensity; } else { light = new
		 * org.xml3d.dataTypes.Vec3f(0, -1, 0); lightOn = 1.0; } light =
		 * mat_view.multMatrixVec(light);
		 */
		/*
		 * sp.eyePosition = [ 0, 0, 0 ]; sp.lightDirection = light.toGL();
		 * sp.lightOn = lightOn;
		 */
		
		sp.modelViewMatrix = worldViewMatrix.multiply(transform).toGL();
		var projMatrix = this.camera
				.getProjectionMatrix(this.canvas.width / this.canvas.height);
		sp.modelViewProjectionMatrix = projMatrix.multiply(worldViewMatrix).multiply(
				transform).toGL();
		
		sp.worldViewMatrix = worldViewMatrix.toGL();
		sp.eyePosition = this.camera.node.position.toGL();
		
		gl.disable(gl.CULL_FACE);
		if (shader)
			shader.setParameters();
		
		shape.render(sp);
		if (shader)
			shader.cleanUp();
	}

	this.canvas.needUpdate = false;
	this.drawableObjects = null;
};

org.xml3d.webgl.Renderer.prototype.renderPickingPass = function(scene, x, y) {
	try {
		gl = this.gl;
		
		
		if (this.drawableObjects === undefined || !this.drawableObjects) {
			this.drawableObjects = [];
			this.collectDrawableObjects(new XML3DMatrix(),
					this.drawableObjects, null);
		}
		
		var worldViewMatrix = this.camera.getViewMatrix();
		
		var zPos = [];
		for (i = 0, n = this.drawableObjects.length; i < n; i++) {
			var trafo = this.drawableObjects[i][0];
			var obj3d = this.drawableObjects[i][1];
			var center = this.getCenter(obj3d);
			center = trafo.multiply(center);
			center = worldViewMatrix.multiply(center);
			zPos[i] = [ i, center.z ];
		}
		zPos.sort(function(a, b) {
			return a[1] - b[1];
		});
		
		for (i = 0, n = zPos.length; i < n; i++) {
			var obj = this.drawableObjects[zPos[i][0]];
			var transform = obj[0];
			var shape = obj[1];
			var shader = obj[2];
			
			var sp = this.getStandardShaderProgram(gl, "urn:xml3d:shader:picking");
			sp.bind();
			
			sp.id = 1.0 - (i+1) / 255.0;
			sp.wcMin = new XML3DVec3(Number.MAX_VALUE, Number.MAX_VALUE,
					Number.MAX_VALUE).toGL();
			sp.wcMax = new XML3DVec3(Number.MIN_VALUE, Number.MIN_VALUE,
					Number.MIN_VALUE).toGL();
			
			sp.modelViewMatrix = worldViewMatrix.multiply(transform).toGL();
			var projMatrix = this.camera
					.getProjectionMatrix(this.canvas.width / this.canvas.height);
			var viewMatrix = this.camera.getViewMatrix();
			sp.modelViewProjectionMatrix = projMatrix.multiply(viewMatrix).multiply(
					transform).toGL();
			
			sp.worldViewMatrix = worldViewMatrix.toGL();
			
			shape.render(sp);
			if (shader)
				shader.cleanUp();
		}
		org.xml3d.webgl.checkError(gl, "Before readpixels");
		gl.flush();
		var data = gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE);
		org.xml3d.webgl.checkError(gl, "After readpixels");
		var pickPos = new XML3DVec3(0, 0, 0);
		pickPos.x = data[0] / 255;
		pickPos.y = data[1] / 255;
		pickPos.z = data[2] / 255;
		//pickPos = pickPos.mult(max.subtract(min)).add(min);
		var objId = 255 - data[3] - 1;
		if (objId >= 0) {
			scene.currentPickPos = pickPos;
			var pickedObj = this.drawableObjects[zPos[objId][0]];
			scene.currentPickObj = pickedObj[1].node;
			org.xml3d.debug.logInfo("Picked object "+objId);
		}
		this.canvas.needUpdate = true;
		
		
	} catch (e) {
		//org.xml3d.debug.logError(e);
		this.canvas.needUpdate = true;
		var derp = e;
		var herp = 0;
	}
	
	
	
};

org.xml3d.webgl.Renderer.prototype.dispose = function() {
	var drawableObjects = new Array();
	this.collectDrawableObjects(new XML3DMatrix(),
			drawableObjects, null);
	for ( var i = 0, n = drawableObjects.length; i < n; i++) {
		var shape = drawableObjects[i][1];
		var shader = drawableObjects[i][2];
		shape.dispose();
		if (shader)
			shader.dispose();
	}
};

org.xml3d.webgl.XML3DRenderAdapterFactory = function(gl, renderer) {
	this.gl = gl;
	this.renderer = renderer;
};

org.xml3d.webgl.XML3DRenderAdapterFactory.prototype.getAdapter = function(node) {
	if (node === undefined || node == null || node._configured === undefined)
		return null;

	// org.xml3d.debug.logInfo("Node: " + node);

	for (i = 0; i < node.adapters.length; i++) {
		if (node.adapters[i].isAdapterFor(org.xml3d.webgl.Renderer.prototype)) {
			return node.adapters[i];
		}
	}
	var adapter = this.createAdapter(node);
	if (adapter) {
		node.addAdapter(adapter);
		adapter.init();
	}
	/*else
		org.xml3d.debug.logInfo("Renderer: No adapter found for node of type "
				+ node.localName);*/

	return adapter;
};

org.xml3d.webgl.XML3DRenderAdapterFactory.prototype.createAdapter = function(
		node) {
	if (node.localName == "xml3d")
		return new org.xml3d.webgl.XML3DCanvasRenderAdapter(this, node);
	if (node.localName == "view")
		return new org.xml3d.webgl.XML3DViewRenderAdapter(this, node);
	if (node.localName == "group")
		return new org.xml3d.webgl.XML3DGroupRenderAdapter(this, node);
	if (node.localName == "mesh")
		return new org.xml3d.webgl.XML3DMeshRenderAdapter(this, node);
	if (node.localName == "img")
		return new org.xml3d.webgl.XML3DImgRenderAdapter(this, node);
	if (node.localName == "bind")
		return new org.xml3d.webgl.XML3DBindRenderAdapter(this, node);
	if (node.localName == "transform")
		return new org.xml3d.webgl.XML3DTransformRenderAdapter(this, node);
	if (node.localName == "shader")
		return new org.xml3d.webgl.XML3DShaderRenderAdapter(this, node);
	if (node.localName == "light")
		return new org.xml3d.webgl.XML3DLightRenderAdapter(this, node);
	if (node.localName == "lightshader")
		return new org.xml3d.webgl.XML3DLightShaderRenderAdapter(this, node);

	if (node.localName == "use") {
		var reference = node.getHref();
		return this.getAdapter(reference);
	}

	return null;
};

org.xml3d.webgl.RenderAdapter = function(factory, node) {
	this.factory = factory;
	this.node = node;
	this.drawableObjects = null;
};

org.xml3d.webgl.RenderAdapter.prototype.getShader = function() {
	return null;
};

org.xml3d.webgl.RenderAdapter.prototype.init = function() {
};

org.xml3d.webgl.RenderAdapter.prototype.notifyChanged = function(e) {
	org.xml3d.debug.logWarning("Unhandled change: " + e);
};

org.xml3d.webgl.RenderAdapter.prototype.collectDrawableObjects = function(
		transform, out, parentShader) {
	for ( var i = 0; i < this.node.childNodes.length; i++) {
		if (this.node.childNodes[i]) {
			var adapter = this.factory.getAdapter(this.node.childNodes[i]);
			if (adapter) {
				var childTransform = adapter.applyTransformMatrix(transform);
				var shader = adapter.getShader();
				if (!shader)
					shader = parentShader;
				adapter.collectDrawableObjects(childTransform, out, shader);
			}
		}
	}
};

org.xml3d.webgl.RenderAdapter.prototype.collectLights = function(transform, out) {
	for ( var i = 0; i < this.node.childNodes.length; i++) {
		if (this.node.childNodes[i]) {
			var adapter = this.factory.getAdapter(this.node.childNodes[i]);
			if (adapter) {
				var childTransform = adapter.applyTransformMatrix(transform);
				adapter.collectLights(childTransform, out);
			}
		}
	}
};

org.xml3d.webgl.RenderAdapter.prototype.applyTransformMatrix = function(
		transform) {
	return transform;
};

org.xml3d.webgl.RenderAdapter.prototype.isAdapterFor = function(protoType) {
	return protoType == org.xml3d.webgl.Renderer.prototype;
};

org.xml3d.webgl.RenderAdapter.prototype.getBindables = function() {
	if (!this.bindables) {
		this.bindables = new Array();
		for ( var i = 0; i < this.node.childNodes.length; i++) {
			var childNode = this.node.childNodes[i];
			if (childNode
					&& (org.xml3d.isa(childNode, org.xml3d.classInfo.bind))) {
				this.bindables.push(this.factory.getAdapter(childNode));
			}
		}
	}
	return this.bindables;
};

// Adapter for <xml3d>
org.xml3d.webgl.XML3DCanvasRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DCanvasRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DCanvasRenderAdapter;

// Adapter for <view>
org.xml3d.webgl.XML3DViewRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.zFar = 100000;
	this.zNear = 0.1;
	this.viewMatrix = null;
	this.projMatrix = null;
};
org.xml3d.webgl.XML3DViewRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DViewRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DViewRenderAdapter;

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getViewMatrix = function() {
	if (this.viewMatrix == null) {
		//this.viewMatrix =  this.node.orientation.negate().toMatrix().multiply(
		//		new XML3DMatrix().translate(this.node.position.negate()));
		this.viewMatrix =  new XML3DMatrix().translate(this.node.position.negate()).multiply(
				this.node.orientation.negate().toMatrix());
	}
	return this.viewMatrix;
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.getProjectionMatrix = function(aspect) {
	if (this.projMatrix == null) {
		var fovy = this.node.fieldOfView;
		var zfar = this.zFar;
		var znear = this.zNear;
		var f = 1 / Math.tan(fovy / 2);
		this.projMatrix = new XML3DMatrix(f / aspect, 0, 0,
				0, 0, f, 0, 0, 0, 0, (znear + zfar) / (znear - zfar), 2 * znear
						* zfar / (znear - zfar), 0, 0, -1, 0);
	}
	return this.projMatrix;
};

org.xml3d.webgl.XML3DViewRenderAdapter.prototype.notifyChanged = function(e) {
	if (e.attribute == "orientation" || e.attribute == "position")
		this.viewMatrix = null;
	else if (e.attribute == "fieldOfView")
		this.projMatrix = null;
	else {
		this.viewMatrix = null;
		this.projMatrix = null;
	}
	this.factory.renderer.update();
};

// Adapter for <img>
org.xml3d.webgl.XML3DImgRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DImgRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DImgRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DImgRenderAdapter;

org.xml3d.webgl.XML3DImgRenderAdapter.prototype.bindTexture = function(
		texture) {
	var gl = this.factory.gl;
	var fact = this.factory;
	var image = new Image();
	image.onload = function() {
		org.xml3d.debug.logInfo("Texture loaded: " + image);

		gl.bindTexture(gl.TEXTURE_2D, texture.textureId);
		gl.texImage2D(gl.TEXTURE_2D, 0, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		org.xml3d.webgl.checkError(gl, "After binding texture");
		fact.renderer.update();
	};
	
	image.src = this.node.src;
	org.xml3d.debug.logInfo("Bind texture: " + image.src);
};

// Adapter for <shader>
org.xml3d.webgl.XML3DShaderRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.sp = null;
	this.textures = new Array();
};
org.xml3d.webgl.XML3DShaderRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DShaderRenderAdapter;

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.__defineGetter__(
		"shaderProgram", (function() {
			var gl = this.factory.gl;
			var bindables = this.getBindables();
			if (!this.sp && this.node.hasAttribute("script")) {
				var scriptURL = this.node.getAttribute("script");
				if (new org.xml3d.URI(scriptURL).scheme == "urn")
				{
					for ( var i = 0; i < bindables.length; i++) {
						var bindable = bindables[i];
						if (bindable.semantic == "useVertexColor") {
							var value = bindable.getGLValue();
							if (value)
								scriptURL = scriptURL + "vcolor";
						}
					}					
					this.sp = this.factory.renderer.getStandardShaderProgram(gl, scriptURL);
					return this.sp;
				}
				var vsScript = this.node.xml3ddocument.resolve(scriptURL
						+ "-vs");
				var fsScript = this.node.xml3ddocument.resolve(scriptURL
						+ "-fs");
				if (vsScript && fsScript) {
					var vShader = {
						script : vsScript.value,
						type : gl.VERTEX_SHADER
					};
					var fShader = {
						script : fsScript.value,
						type : gl.FRAGMENT_SHADER
					};
					this.sp = this.createShaderProgram( [ vShader, fShader ]);

				}
			}
			return this.sp;
		}));
org.xml3d.webgl.XML3DShaderRenderAdapter.texture = function () {
	this.textureId = null;
	this.wrapS = null;
	this.wrapT = null;
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.initTexture = function(textureNode) {
	var gl = this.factory.gl;

	var imageData = null;
	var child = textureNode.firstChild;
	var texture = new org.xml3d.webgl.XML3DShaderRenderAdapter.texture();
	while (child && !imageData) {
		imageData = this.factory.getAdapter(child);
		child = child.nextSibling;
	}
	if (imageData) {
		texture.textureId = gl.createTexture();
		imageData.bindTexture(texture);
	}
	texture.wrapS = this.initWrapMode(textureNode, "wrapS");
	texture.wrapT = this.initWrapMode(textureNode, "wrapT");
	this.enable(texture);
	this.textures.push(texture);
	org.xml3d.debug.logInfo("Created GL texture: " + texture.textureId);
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.initWrapMode = function(
		texNode, which) {
	var gl = this.factory.gl;
	switch (texNode.childNodes[which]) {
	case org.xml3d.WrapTypes.clamp:
		return gl.CLAMP_TO_EDGE;
	case org.xml3d.WrapTypes.border:
		return gl.BORDER;
	case org.xml3d.WrapTypes.repeat:
	default:
		return gl.REPEAT;
	}
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.enable = function(texture) {
	var gl = this.factory.gl;
	gl.enable(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, texture.textureId);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, texture.wrapS);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, texture.wrapT);
	org.xml3d.webgl.checkError(gl, "After trying to enable texture.");
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.createShaderProgram = function(
		shaderArray) {
	var gl = this.factory.gl;
	var shader = [];

	var prog = gl.createProgram();

	for ( var i = 0; i < 2; i++) {
		shader[i] = gl.createShader(shaderArray[i].type);
		gl.shaderSource(shader[i], shaderArray[i].script);
		gl.compileShader(shader[i]);
		gl.attachShader(prog, shader[i]);
	}

	gl.linkProgram(prog);
	var msg = gl.getProgramInfoLog(prog);

	if (msg.length > 54) {
		org.xml3d.debug.logError(msg);
		return null;
	}
	return org.xml3d.webgl.Renderer.wrapShaderProgram(gl, prog);
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.setParameters = function() {
	if (!this.sp)
		return;
	var gl = this.factory.gl;
	var bindables = this.getBindables();
	var texNum = 0;
	for ( var i = 0; i < bindables.length; i++) {

		var bindable = bindables[i];

		if (org.xml3d.isa(bindable.node.firstElementChild, org.xml3d.classInfo.texture)) {
			this.enable(this.textures[texNum]);
			texNum++;
		} else if (bindable.kind === org.xml3d.webgl.XML3DBindRenderAdapter.SHADER_PARAMETER_TYPE) {
			org.xml3d.webgl.checkError(gl, "Error before setting parameter:" + bindable.semantic);
			var value = bindable.getGLValue();
			if (value)
				this.sp[bindable.semantic] = value;
			org.xml3d.webgl.checkError(gl, "Error after setting parameter:" + bindable.semantic + ", value: " + value);
		}
	}

};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.cleanUp = function() {
	var gl = this.factory.gl;
	Array.forEach(this.textures, function(t) {
		org.xml3d.webgl.checkError(gl, "Before shader cleanup.");
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.disable(gl.TEXTURE_2D);
		org.xml3d.webgl.checkError(gl, "After shader cleanup.");
	});
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.dispose = function() {
	var gl = this.factory.gl;
	Array.forEach(this.textures, function(t) {
		gl.deleteTexture(t.textureId);
	});
};

// Adapter for <group>
org.xml3d.webgl.XML3DGroupRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DGroupRenderAdapter;
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.applyTransformMatrix = function(
		transform) {
	var adapter = this.factory.getAdapter(this.node.getTransform());
	if (adapter === null)
		return transform;

	return transform.multiply(adapter.getMatrix());
};
org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.getShader = function() {
	return this.factory.getAdapter(this.node.getShader());
};

// Adapter for <transform>
org.xml3d.webgl.XML3DTransformRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.matrix = null;
};
org.xml3d.webgl.XML3DTransformRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DTransformRenderAdapter;

org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.getMatrix = function() {
	if (!this.matrix) {
		var n = this.node;
		var m = new XML3DMatrix();
		this.matrix = m.translate(n.translation)
		  .multiply(m.translate(n.center)).multiply(n.rotation.toMatrix())
		  .multiply(n.scaleOrientation.toMatrix()).multiply(m.scale(n.scale))
		  .multiply(n.scaleOrientation.toMatrix().inverse()).multiply(
				  m.translate(n.center.negate()));
		//org.xml3d.debug.logInfo(this.matrix);
	}
	return this.matrix;
};

org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.notifyChanged = function(e) {
	this.matrix = null;
	this.factory.renderer.canvas.needUpdate = true;
};

// Adapter for <bind>
org.xml3d.webgl.XML3DBindRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.buffer = null;
	this.glValue = null;
	this.tupleSize = 1;
	this.dataType = factory.gl.FLOAT;
	this.semantic = node.semantic;
	this.isIndex = this.semantic == "index";
	this.kind = -1;
	this.texture = null;
};

org.xml3d.webgl.XML3DBindRenderAdapter.SHADER_PARAMETER_TYPE = 0;
org.xml3d.webgl.XML3DBindRenderAdapter.BUFFER_TYPE = 1;
org.xml3d.webgl.XML3DBindRenderAdapter.TEXTURE_TYPE = 2;
org.xml3d.webgl.XML3DBindRenderAdapter.LIGHTSHADER_PARAMETER_TYPE = 3;

org.xml3d.webgl.XML3DBindRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DBindRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DBindRenderAdapter;

org.xml3d.webgl.XML3DBindRenderAdapter.prototype.init = function() {
	var child = this.node.firstChild;
	while (child) {
		if (child.nodeType == Node.ELEMENT_NODE) {
			if (org.xml3d.isa(this.node.parentNode, org.xml3d.classInfo.mesh)) {
				this.kind = org.xml3d.webgl.XML3DBindRenderAdapter.BUFFER_TYPE;
			} else if (org.xml3d.isa(this.node.parentNode,
					org.xml3d.classInfo.shader)) {
				if (org.xml3d.isa(child, org.xml3d.classInfo.texture)) {
					this.kind = org.xml3d.webgl.XML3DBindRenderAdapter.SHADER_PARAMETER_TYPE;
					this.node.parentNode.adapters[0].initTexture(child);
				} else {
					this.kind = org.xml3d.webgl.XML3DBindRenderAdapter.SHADER_PARAMETER_TYPE;
				}
			} else if (org.xml3d.isa(this.node.parentNode,
					org.xml3d.classInfo.lightshader)) {
				this.kind = org.xml3d.webgl.XML3DBindRenderAdapter.LIGHTSHADER_PARAMETER_TYPE;
			}
		}
		child = child.nextSibling;
	}

};



org.xml3d.webgl.XML3DBindRenderAdapter.prototype.getGLValue = function() {
	var gl = this.factory.gl;

	if (this.glValue == undefined) {
		org.xml3d.debug.logInfo("Creating GL value for: " + this.semantic);
		var child = this.node.firstChild;
		while(child && !this.glValue)
		{
			if (child.nodeType == Node.ELEMENT_NODE)
			{
				if (child.nodeName == "bool")
				{
					if (child.textContent == "true")
						this.glValue = true;
					else
						this.glValue = false;
				} else {
					this.glValue = child.value;
				}
			}
			child = child.nextSibling;
		}
	}
	return this.glValue;
};

org.xml3d.webgl.XML3DBindRenderAdapter.prototype.getBuffer = function() {
	var gl = this.factory.gl;

	if (!this.buffer) {
		org.xml3d.debug.logInfo("Creating buffer for: " + this.semantic);

		var child = this.node.firstChild;
		var fArray = null;
		while (child && !fArray) {
			if (child.nodeType == Node.ELEMENT_NODE) {

				if (org.xml3d.isa(child, org.xml3d.classInfo.int)) {
					this.dataType = gl.UNSIGNED_SHORT;
					this.tupleSize = 1;
					// org.xml3d.debug.logInfo("Values: " + child.value);
					fArray = new WebGLUnsignedShortArray(child.value);
					this.count = child.value.length;
				} else if (org.xml3d.isa(child, org.xml3d.classInfo.bool))
					this.dataType = gl.BOOL;
				else if (org.xml3d.isa(child, org.xml3d.classInfo.float)) {
					this.dataType = gl.FLOAT;
					this.tupleSize = 1;
					fArray = new WebGLFloatArray(child.value);
				} else if (org.xml3d.isa(child, org.xml3d.classInfo.float2)) {
					this.dataType = gl.FLOAT;
					this.tupleSize = 2;
					fArray = new WebGLFloatArray(child.value);
				} else if (org.xml3d.isa(child, org.xml3d.classInfo.float3)) {
					this.dataType = gl.FLOAT;
					this.tupleSize = 3;
					fArray = new WebGLFloatArray(child.value);
				}
			}
			child = child.nextSibling;
		}
		if (fArray) {
			var bufferType = this.isElementArray ? gl.ELEMENT_ARRAY_BUFFER
					: gl.ARRAY_BUFFER;
			this.buffer = gl.createBuffer();
			gl.bindBuffer(bufferType, this.buffer);
			gl.bufferData(bufferType, fArray, gl.STATIC_DRAW);
			delete fArray;
		} else {
			org.xml3d.debug.logInfo("Could not create Array Buffer for "
					+ this.semantic);
			this.buffer = null;
		}

	}

	return this.buffer;
};

org.xml3d.webgl.XML3DBindRenderAdapter.prototype.notifyChanged = function(e) {
	this.glValue = null;
	this.factory.renderer.canvas.needUpdate = true;
};

// Adapter for <mesh>
org.xml3d.webgl.XML3DMeshRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DMeshRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DMeshRenderAdapter;

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getCenter = function() {
	var min = new XML3DVec3(-1, -1, -1);
	var max = new XML3DVec3(1, 1, 1);
	this.getBBox(min, max, true);
	var center = min.add(max).scale(0.5);
	return center;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.collectDrawableObjects = function(
		transform, out, shader) {
	out.push( [ transform, this, shader ]);
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getBBox = function(min, max,
		invalidate) {

};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.dispose = function() {
	var gl = this.factory.gl;
	var bindables = this.getBindables();
	for ( var i = 0; i < bindables.length; i++) {
		var bindable = bindables[i];
		if (bindable.kind != org.xml3d.webgl.XML3DBindRenderAdapter.BUFFER_TYPE)
			continue;

		var buffer = bindable.getBuffer();
		if (buffer)
			gl.deleteBuffer(buffer);
	}
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.render = function(shader) {
	var gl = this.factory.gl;
	var bindables = this.getBindables();
	var elements = null;
	for ( var i = 0; i < bindables.length; i++) {
		var bindable = bindables[i];

		if (bindable.kind != org.xml3d.webgl.XML3DBindRenderAdapter.BUFFER_TYPE)
			continue;

		var buffer = bindable.getBuffer();
		if (bindable.isIndex && buffer) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
			elements = bindable;
		} else {
			if (shader[bindable.semantic] !== undefined && buffer) {
				gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
				gl.vertexAttribPointer(shader[bindable.semantic],
					bindable.tupleSize, bindable.dataType, false, 0, 0);
				gl.enableVertexAttribArray(shader[bindable.semantic]);			
			}
		}
	}
	if (elements) {
		org.xml3d.webgl.checkError(gl, "Error before drawing Elements. Count: " + elements.count);
		gl.drawElements(gl.TRIANGLES, elements.count, elements.dataType, 0);
		org.xml3d.webgl.checkError(gl, "Error after drawing Elements. Count: " + elements.count);
	} else
		org.xml3d.debug.logError("No element array found!");

	for ( var i = 0; i < bindables.length; i++) {
		var bindable = bindables[i];
		if (bindable.kind != org.xml3d.webgl.XML3DBindRenderAdapter.BUFFER_TYPE)
			continue;

		if (shader[bindable.semantic] !== undefined && bindable.values) {
			gl.disableVertexAttribArray(shader[bindable.semantic]);
		}
	}
};

// Adapter for <light>
org.xml3d.webgl.XML3DLightRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DLightRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DLightRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DLightRenderAdapter;

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.collectLights = function(
		transform, out) {
	org.xml3d.debug.logInfo("Found a light!");
	out.push( [ transform, this ]);
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getPosition = function(
		transform) {
	var ls = this.getLightShader();
	var bindables = ls.getBindables();
	for ( var i = 0; i < bindables.length; i++) {
		if (bindables[i].semantic == "position") {
			var pos = bindables[i].getGLValue();
			var t =  transform.multiply(new XML3DRotation(
					pos[0], pos[1], pos[2], 1.0));
			return new XML3DVec3(t.x/t.w, t.y/t.w, t.z/t.w);
		}
	}
	var t = transform
			.multiply(new XML3DRotation(0.0, 0.0, 0.0, 1.0));
	return new XML3DVec3(t.x/t.w, t.y/t.w, t.z/t.w);
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getAttenuation = function(
		transform) {
	var ls = this.getLightShader();
	var bindables = ls.getBindables();
	for ( var i = 0; i < bindables.length; i++) {
		if (bindables[i].semantic == "attenuation") {
			var attn = bindables[i].getGLValue();
			return new XML3DVec3(attn[0], attn[1], attn[2]);
		}
	}
	return new XML3DVec3(0.0, 0.0, 1.0);
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getDiffuseColor = function()
{
	var ls = this.getLightShader();
	var bindables = ls.getBindables();
	
	for ( var i = 0; i < bindables.length; i++) {
		if (bindables[i].semantic == "diffuseColor") {
			var diff = bindables[i].getGLValue();
			return new XML3DVec3(diff[0], diff[1], diff[2]);
		}
	}
	return new XML3DVec3(1.0, 1.0, 1.0);
		
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getLightShader = function() {
	if (!this.lightShader) {
		this.lightShader = this.factory.getAdapter(this.node.getShader());
	}
	return this.lightShader;
};

// Adapter for <lightshader>
org.xml3d.webgl.XML3DLightShaderRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DLightShaderRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DLightShaderRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DLightShaderRenderAdapter;

var g_shaders = {};

g_shaders["urn:xml3d:shader:flat"] = {
	vertex : 
			 "attribute vec3 position;"
			+ "uniform mat4 modelViewProjectionMatrix;"		
			+ "void main(void) {"
			+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);"
			+ "}",
	fragment :
		     "uniform vec3 diffuseColor;"
			+ "void main(void) {"
			+ "    gl_FragColor = vec4(diffuseColor.x, diffuseColor.y, diffuseColor.z, 1.0);"
			+ "}"
};
g_shaders["urn:xml3d:shader:flatvcolor"] = {
		vertex : 
				 "attribute vec3 position;"
				+ "attribute vec3 color;"
				+ "varying vec3 fragVertexColor;"
				+ "uniform mat4 modelViewProjectionMatrix;"	
				+ "void main(void) {"
				+ "    fragVertexColor = color;"
				+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);"
				+ "}",
		fragment :
			     "uniform vec3 diffuseColor;"
				+ "varying vec3 fragVertexColor;"
				+ "void main(void) {"
				+ "    gl_FragColor = vec4(fragVertexColor, 1.0);"
				+ "}"
	};

g_shaders["urn:xml3d:shader:phong"] = {
		vertex :
			
		"#version 120\n\n"	
		+"attribute vec3 position;\n"
		+"attribute vec3 normal;\n"
		//+"attribute vec2 texcoord;\n"
		
		+"varying vec3 fragNormal;\n"
		+"varying vec3 fragVertexPosition;\n"
		+"varying vec3 fragEyeVector;\n"
		+"varying vec2 fragTexCoord;\n"
		
		
		+"uniform mat4 modelViewProjectionMatrix;\n"
		+"uniform mat4 modelViewMatrix;\n"
		+"uniform vec3 eyePosition;\n"
		
		+"void main(void) {\n"
		+"	  gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);\n"
		+"	  fragNormal = normalize((modelViewMatrix * vec4(normal, 0.0)).xyz);\n"
		+"	  fragVertexPosition = (modelViewMatrix * vec4(position, 0.0)).xyz;\n"
		+"	  fragEyeVector = normalize(eyePosition - fragVertexPosition);\n"
		//+"    fragTexCoord = texcoord;\n"
		+"}\n",
		
		fragment:
	// NOTE: Any changes to this area must be carried over to the substring calculations in
	// org.xml3d.webgl.Renderer.prototype.getStandardShaderProgram
			"#version 120\n\n"
			
			+"const int MAXLIGHTS = 0; \n"
	// ------------------------------------------------------------------------------------
			+"uniform float ambientIntensity;\n"
			+"uniform vec3 diffuseColor;\n"
			+"uniform vec3 emissiveColor;\n"
			+"uniform float shininess;\n"
			+"uniform vec3 specularColor;\n"
			+"uniform float transparency;\n"
			+"uniform float lightOn;\n"
			//+"uniform sampler2D tex;\n"
			
			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"
			//+"varying vec2 fragTexCoord;\n"
			
			+"uniform vec3 lightAttenuations[MAXLIGHTS+1];\n"
			+"uniform vec3 lightPositions[MAXLIGHTS+1];\n"
			+"uniform vec3 lightDiffuseColors[MAXLIGHTS+1];\n"
			+"uniform vec3 lightAmbientColors[MAXLIGHTS+1];\n"
			
			
			+"vec3 light(in int i)\n"
		 	+"{\n"
		 	+"		vec3 L = lightPositions[i].xyz - fragVertexPosition;\n"
		 	+"		float dist = length(L);\n"
		 	+"      L = normalize(-L);\n"
		 	+"      vec3 N = normalize(fragNormal);\n"

			+"		vec3 E = fragEyeVector;\n"
			+"		vec3 R = -reflect(L,N);\n"					
			+"		vec3 ambientColor = ambientIntensity * diffuseColor;\n"		 			
			+"		float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);\n"	 

			+"		vec3 Iamb = ambientColor * lightAmbientColors[i];\n"
			+"		vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * diffuseColor ;\n"//* texture2D(tex, texCoord).rgb
			+"		vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), 0.3*shininess);\n"		 
			+"		vec3 color = (emissiveColor+Iamb+atten*(Idiff + Ispec));\n"
			//+"		return vec3(max(dot(fragNormal,L),0.0), max(dot(-fragNormal,L),0.0), max(dot(fragNormal,-L),0.0));\n" 
			+"		return color;\n" 
			+"}\n"
			
			+"void main(void) {\n"
			//+"  vec2 texCoord = vec2(fragTexCoord.x,1.0-fragTexCoord.y);\n"
			+"	if (MAXLIGHTS == 0) {\n"
			+"      vec3 light = vec3(0,0,0);\n"
			+"      vec3 normal = fragNormal;\n"
			+"      vec3 eye = fragEyeVector;\n"
			+"      float diffuse = max(0.0, dot(normal, light)) * lightOn;\n"
			+"      diffuse += max(0.0, dot(normal, eye));\n"
			+"      float specular = pow(max(0.0, dot(normal, normalize(light+eye))), shininess*128.0) * lightOn;\n" 
			+"      specular += pow(max(0.0, dot(normal, normalize(eye))), shininess*128.0);\n"
			+"      vec3 rgb = emissiveColor + diffuse*diffuseColor + specular*specularColor;\n"//*texture2D(tex, texCoord).rgb
			+"      rgb = clamp(rgb, 0.0, 1.0);\n"
			+"      gl_FragColor = vec4(rgb, max(0.0, 1.0 - transparency)); \n"
			+"	} else {\n"
			+"      vec3 color = vec3(0,0,0);\n"
			+"		for (int i=0; i<MAXLIGHTS; i++) {\n"
			+"			color = color + light(i);\n"
			+"		}\n"
			+"		gl_FragColor = vec4(color, max(0.0, 1.0 - transparency));\n"
			//+"		gl_FragColor = vec4(fragNormal.x, fragNormal.y, fragNormal.z, max(0.0, 1.0 - transparency));\n"
				+"  }\n"
			+"}"
};

g_shaders["urn:xml3d:shader:phongvcolor"] = {
		vertex : 	
		  "attribute vec3 position;\n"
		+ "attribute vec3 normal;\n"
		+ "attribute vec2 texcoord;\n"
		+ "attribute vec3 color;\n"
		+ "varying vec3 fragNormal;\n"
		+ "varying vec3 fragLightVector;\n"
		+ "varying vec3 fragEyeVector;\n"
		+ "varying vec2 fragTexCoord;\n"
		+ "varying vec3 fragVertexColor;\n"
		+ "uniform mat4 modelViewProjectionMatrix;\n"
		+ "uniform mat4 modelViewMatrix;\n"
		+ "uniform mat4 worldViewMatrix;\n"
		+ "uniform mat4 normalViewMatrix;\n"
		+ "uniform vec3 lightDirection;\n"
		+ "uniform vec3 eyePosition;\n"
		+ "\n"
		+ "void main(void) {\n"
		+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);\n"
		+ "    fragNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;\n"
		+ "    fragLightVector = -lightDirection;\n"
		+ "    fragEyeVector = eyePosition - (modelViewMatrix * vec4(position, 1.0)).xyz;\n"
		+ "    fragTexCoord = texcoord;\n"
		+ "    fragVertexColor = color;\n"
		+ "}\n",
		
		fragment : 
		  "uniform float ambientIntensity;\n"
		+ "uniform vec3 diffuseColor;\n"
		+ "uniform vec3 emissiveColor;\n"
		+ "uniform float shininess;\n"
		+ "uniform vec3 specularColor;\n"
		+ "uniform float alpha;\n"
		+ "uniform float lightOn;\n"
		+ "uniform sampler2D tex;\n"
		+ "varying vec3 fragNormal;\n"
		+ "varying vec3 fragLightVector;\n"
		+ "varying vec3 fragEyeVector;\n"
		+ "varying vec2 fragTexCoord;\n"
		+ "varying vec3 fragVertexColor;\n"
		+ "void main(void) {\n"
		+ "	vec3 normal = normalize(fragNormal);\n"
		+ "	vec3 light = normalize(fragLightVector);\n"
		+ "	vec3 eye = normalize(fragEyeVector);\n"
		+ "	vec2 texCoord = vec2(fragTexCoord.x,1.0-fragTexCoord.y);\n"
		+ "	float diffuse = max(0.0, dot(normal, light)) * lightOn;\n"
		+ "	diffuse += max(0.0, dot(normal, eye));\n"
		+ "	float specular = pow(max(0.0, dot(normal, normalize(light+eye))), shininess*128.0) * lightOn;\n"
		+ "	specular += pow(max(0.0, dot(normal, normalize(eye))), shininess*128.0);\n"
		+ "	vec3 rgb = emissiveColor + diffuse*fragVertexColor + specular*specularColor;\n"
		+ "	rgb = clamp(rgb, 0.0, 1.0);\n"
		+ "	gl_FragColor = vec4(rgb, 1.0);\n"
		+ "}\n"
	};

g_shaders["urn:xml3d:shader:picking"] = {
		vertex:
		"#version 120\n\n"	
		+"attribute vec3 position;\n"
		+ "uniform mat4 modelViewMatrix;\n"
		+ "uniform mat4 modelViewProjectionMatrix;\n"
		+ "uniform vec3 wcMin;\n"
		+ "uniform vec3 wcMax;\n"
		
		+ "varying vec3 worldCoord;\n"
		+ "void main(void) {\n"
		+ "    worldCoord = (modelViewMatrix * vec4(position, 1.0)).xyz;\n"
		//+ "    vec3 dia = wcMax - wcMin;\n"
		//+ "    worldCoord = worldCoord - wcMin;\n"
		//+ "    worldCoord.x /= dia.x;\n"
		//+ "    worldCoord.y /= dia.y;\n"
		//+ "    worldCoord.z /= dia.z;\n"
		+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);\n"
		+ "}" ,
		
		fragment:
		
		"#version 120\n\n"		
		+"uniform float id;" 
		+ "varying vec3 worldCoord;\n"
		
		+ "void main(void) {\n"
		+ "    gl_FragColor = vec4(worldCoord, id);\n" 
		+ "}\n"
	};
	
	
org.xml3d.webgl.Renderer.wrapShaderProgram = function(gl, sp) {
	var shader = {};
	shader.bind = function() {
		gl.useProgram(sp);
	};
	var i = 0, ok = true;
	var loc = null, obj = null;
	for (i = 0; ok; ++i) {
		try {
			obj = gl.getActiveUniform(sp, i);
		} catch (eu) {
		}
		if (gl.getError() !== 0) {
			break;
		}
		loc = gl.getUniformLocation(sp, obj.name);

		switch (obj.type) {
		case gl.SAMPLER_2D:
			shader.__defineSetter__(obj.name, (function(loc) {
				return function(val) {
					gl.uniform1i(loc, val);
				};
			})(loc));
			break;
		case gl.SAMPLER_CUBE:
			shader.__defineSetter__(obj.name, (function(loc) {
				return function(val) {
					gl.uniform1i(loc, val);
				};
			})(loc));
			break;
		case gl.BOOL:
			shader.__defineSetter__(obj.name, (function(loc) {
				return function(val) {
					gl.uniform1i(loc, val);
				};
			})(loc));
			break;
		case gl.FLOAT:
			shader.__defineSetter__(obj.name, (function(loc) {
				return function(val) {
					gl.uniform1f(loc, val);
				};
			})(loc));
			break;
		case gl.FLOAT_VEC2:
			shader.__defineSetter__(obj.name, (function(loc) {
				return function(val) {
					gl.uniform2f(loc, val[0], val[1]);
				};
			})(loc));
			break;
		case gl.FLOAT_VEC3:
			if (obj.size == 1) {
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniform3f(loc, val[0], val[1], val[2]);
					};
				})(loc));
			} else {
				shader.__defineSetter__(obj.name, (function(loc) {
					return function(val) {
						gl.uniform3fv(loc, val);
					};
				})(loc));
			}
			break;
		case gl.FLOAT_VEC4:
			shader.__defineSetter__(obj.name, (function(loc) {
				return function(val) {
					gl.uniform4f(loc, val[0], val[1], val[2], val[3]);
				};
			})(loc));
			break;
		case gl.FLOAT_MAT2:
			shader.__defineSetter__(obj.name, (function(loc) {
				return function(val) {
					gl.uniformMatrix2fv(loc, false, new WebGLFloatArray(val));
				};
			})(loc));
			break;
		case gl.FLOAT_MAT3:
			shader.__defineSetter__(obj.name, (function(loc) {
				return function(val) {
					gl.uniformMatrix3fv(loc, false, new WebGLFloatArray(val));
				};
			})(loc));
			break;
		case gl.FLOAT_MAT4:
			shader.__defineSetter__(obj.name, (function(loc) {
				return function(val) {
					gl.uniformMatrix4fv(loc, false, new WebGLFloatArray(val));
				};
			})(loc));
			break;
		default:
			org.xml3d.debug.logInfo('GLSL program variable ' + obj.name
					+ ' has unknown type ' + obj.type);
		}

	}
	for (i = 0; ok; ++i) {
		try {
			obj = gl.getActiveAttrib(sp, i);
		} catch (ea) {
		}
		if (gl.getError() !== 0) {
			break;
		}
		loc = gl.getAttribLocation(sp, obj.name);
		shader[obj.name] = loc;
	}
	return shader;
};