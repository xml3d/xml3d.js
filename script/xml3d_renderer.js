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

org.xml3d.webgl.Renderer = function(scene, canvas, gl) {
	this.scene = scene;
	this.canvas = canvas;
	this.gl = gl;
	this.factory = new org.xml3d.webgl.XML3DRenderAdapterFactory(gl);
	this.defaultShader = null;
	this.lights = null;
	this.camera = this.initCamera();
};

org.xml3d.webgl.Renderer.prototype.initCamera = function() {
	var av = this.scene.getActiveView();
	if (av == null)
	{
		org.xml3d.debug.logWarning("No View defined for xml3d element.");
		return new org.xml3d.Camera();
	}
	org.xml3d.debug.logWarning("Creating view.");
	return new org.xml3d.Camera(av);
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
			adapter.collectLights(org.xml3d.dataTypes.SFMatrix4.identity(),
					this.lights);
	}
	return this.lights;
};

org.xml3d.webgl.Renderer.prototype.getDefaultShaderProgram = function(gl) {
	if (!this.defaultShader) {
		var prog = gl.createProgram();
		var vs = gl.createShader(gl.VERTEX_SHADER);
		var fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(vs, g_shaders['vs-x3d-default'].data);
		gl.shaderSource(fs, g_shaders['fs-x3d-default'].data);
		gl.compileShader(vs);
		gl.compileShader(fs);
		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.linkProgram(prog);
		var msg = gl.getProgramInfoLog(prog);
		if (msg) {
			org.xml3d.debug.logError(msg);
		}
		this.defaultShader = org.xml3d.webgl.Renderer.wrapShaderProgram(gl,
				prog);
	}
	return this.defaultShader;
};

org.xml3d.webgl.Renderer.prototype.getCenter = function(adapter) {
	return adapter.getCenter();
};

org.xml3d.webgl.Renderer.prototype.render = function() {
	var gl = this.gl;
	var sp = null;

	if (this.drawableObjects === undefined || !this.drawableObjects) {
		this.drawableObjects = [];
		this.collectDrawableObjects(org.xml3d.dataTypes.SFMatrix4.identity(),
				this.drawableObjects, null);
	}

	var mat_view = this.camera.getViewMatrix();
	var light, lightOn;

	var zPos = [];
	for (i = 0, n = this.drawableObjects.length; i < n; i++) {
		var trafo = this.drawableObjects[i][0];
		var obj3d = this.drawableObjects[i][1];
		var center = this.getCenter(obj3d);
		center = trafo.multMatrixPnt(center);
		center = mat_view.multMatrixPnt(center);
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

		sp = null;
		if (shader) {
			sp = shader.shaderProgram;
		}
		if (!sp) {
			sp = this.getDefaultShaderProgram(gl);
			if (RGBColor && document.defaultView
					&& document.defaultView.getComputedStyle) {
				var colorStr = document.defaultView.getComputedStyle(
						shape.node, "").getPropertyValue("color");
				var color = new RGBColor(colorStr);
				sp.diffuseColor = color.toGL();
			}
		}
		sp.bind();

		var slights = this.getLights();
		var lightParams = {
			positions : new Array(),
			diffuseColors : new Array(),
			ambientColors : new Array(),
			attenuations : new Array()
		};

		for ( var j = 0; j < slights.length; j++) {
			var light = slights[j][1];
			lightParams.positions = lightParams.positions.concat(light
					.getPosition(slights[j][0]).toGL());
			lightParams.attenuations = lightParams.attenuations.concat(light
					.getAttenuation().toGL());

		}
		lightParams.diffuseColors = [ 10, 4, 4, 4, 4, 10 ];
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

		sp.modelViewMatrix = mat_view.mult(transform).toGL();
		var projMatrix = this.camera
				.getProjectionMatrix(this.canvas.width / this.canvas.height);
		var viewMatrix = this.camera.getViewMatrix();
		sp.modelViewProjectionMatrix = projMatrix.mult(viewMatrix).mult(
				transform).toGL();

		gl.disable(gl.CULL_FACE);
		if (shader)
			shader.setParameters();
		shape.render(sp);
		if (shader)
			shader.cleanUp();
	}

	this.drawableObjects = null;
};

org.xml3d.webgl.Renderer.prototype.dispose = function() {
	var drawableObjects = new Array();
	this.collectDrawableObjects(org.xml3d.dataTypes.SFMatrix4.identity(),
			drawableObjects, null);
	for ( var i = 0, n = drawableObjects.length; i < n; i++) {
		var shape = drawableObjects[i][1];
		var shader = drawableObjects[i][2];
		shape.dispose();
		if (shader)
			shader.dispose();
	}
};

org.xml3d.webgl.XML3DRenderAdapterFactory = function(gl) {
	this.gl = gl;
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
	if (node.localName == "group")
		return new org.xml3d.webgl.XML3DGroupRenderAdapter(this, node);
	if (node.localName == "mesh")
		return new org.xml3d.webgl.XML3DMeshRenderAdapter(this, node);
	if (node.localName == "texture")
		return new org.xml3d.webgl.XML3DTextureRenderAdapter(this, node);
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

// Adapter for <img>
org.xml3d.webgl.XML3DImgRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DImgRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DImgRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DImgRenderAdapter;

org.xml3d.webgl.XML3DImgRenderAdapter.prototype.bindTexture = function(
		textureAdapter) {
	var gl = this.factory.gl;
	var image = new Image();
	image.src = this.node.src;
	org.xml3d.debug.logInfo("Bind texture: " + image.src);
	image.onload = function() {
		org.xml3d.debug.logInfo("Texture loaded: " + image);

		gl.bindTexture(gl.TEXTURE_2D, textureAdapter.textureId);
		gl.texImage2D(gl.TEXTURE_2D, 0, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		textureAdapter.isValid = true;
	};
};

// Adapter for <texture>
org.xml3d.webgl.XML3DTextureRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.textureId = null;
	this.isValid = false;
};
org.xml3d.webgl.XML3DTextureRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DTextureRenderAdapter;

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.init = function() {
	var gl = this.factory.gl;

	var imageData = null;
	var child = this.node.firstChild;
	while (child && !imageData) {
		imageData = this.factory.getAdapter(child);
		child = child.nextSibling;
	}
	if (imageData) {
		this.textureId = gl.createTexture();
		org.xml3d.debug.logInfo("Creating GL texture: " + this.textureId);
		imageData.bindTexture(this);
	}
	this.wrapS = this.initWrapMode("wrapS");
	this.wrapT = this.initWrapMode("wrapT");

};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.initWrapMode = function(
		which) {
	var gl = this.factory.gl;
	switch (this.node[which]) {
	case org.xml3d.WrapTypes.clamp:
		return gl.CLAMP_TO_EDGE;
	case org.xml3d.WrapTypes.border:
		return gl.BORDER;
	case org.xml3d.WrapTypes.repeat:
	default:
		return gl.REPEAT;
	}
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.enable = function() {
	var gl = this.factory.gl;
	gl.enable(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, this.textureId);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.disable = function() {
	var gl = this.factory.gl;
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.disable(gl.TEXTURE_2D);
};

org.xml3d.webgl.XML3DTextureRenderAdapter.prototype.dispose = function() {
	var gl = this.factory.gl;
	gl.deleteTexture(this.textureId);
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
			if (!this.sp && this.node.hasAttribute("script")) {
				var scriptURL = this.node.getAttribute("script");
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
	if (msg) {
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
	this.textures = new Array();
	for ( var i = 0; i < bindables.length; i++) {

		var bindable = bindables[i];
		if (bindable.kind === org.xml3d.webgl.XML3DBindRenderAdapter.TEXTURE_TYPE) {
			var texture = bindable.texture;
			if (texture && texture.isValid) {
				texture.enable();
				this.textures.push(texture);
			}

		} else if (bindable.kind === org.xml3d.webgl.XML3DBindRenderAdapter.SHADER_PARAMETER_TYPE) {

			var value = bindable.getGLValue();
			if (value)
				this.sp[bindable.semantic] = value;
		}
	}
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.cleanUp = function() {
	Array.forEach(this.textures, function(t) {
		t.disable();
	});
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.dispose = function() {
	Array.forEach(this.textures, function(t) {
		t.dispose();
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

	return transform.mult(adapter.getMatrix());
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
		var m = org.xml3d.dataTypes.SFMatrix4;
		this.matrix = m.translation(n.translation)
				.mult(m.translation(n.center)).mult(n.rotation.toMatrix())
				.mult(n.scaleOrientation.toMatrix()).mult(m.scale(n.scale))
				.mult(n.scaleOrientation.toMatrix().inverse()).mult(
						m.translation(n.center.negate()));
	}
	return this.matrix;
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

					this.kind = org.xml3d.webgl.XML3DBindRenderAdapter.TEXTURE_TYPE;
					this.texture = this.factory.getAdapter(child);
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

	if (!this.glValue) {
		org.xml3d.debug.logInfo("Creating GL value for: " + this.semantic);
		var child = this.node.firstChild;
		while(child && !this.glValue)
		{
			if (child.nodeTyep = Node.ELEMENT_NODE)
			{
				this.glValue = child.value;
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

// Adapter for <mesh>
org.xml3d.webgl.XML3DMeshRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DMeshRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DMeshRenderAdapter;

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getCenter = function() {
	var min = new org.xml3d.dataTypes.Vec3f(-1, -1, -1);
	var max = new org.xml3d.dataTypes.Vec3f(1, 1, 1);
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
		var error = gl.getError();
		if (error !== gl.NO_ERROR) {
			org.xml3d.debug.logInfo("Error before:" + error);
		}
		gl.drawElements(gl.TRIANGLES, elements.count, elements.dataType, 0);
		var error = gl.getError();
		if (error !== gl.NO_ERROR) {
			org.xml3d.debug.logInfo("Error after: " + error);
		}
	} else
		org.xml3d.debug.logInfo("No element array found!");

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
			return transform.multMatrixPnt(new org.xml3d.dataTypes.Vec3f(
					pos[0], pos[1], pos[2]));
		}
	}
	return transform
			.multMatrixPnt(new org.xml3d.dataTypes.Vec3f(0.0, 0.0, 0.0));
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getAttenuation = function(
		transform) {
	var ls = this.getLightShader();
	var bindables = ls.getBindables();
	for ( var i = 0; i < bindables.length; i++) {
		if (bindables[i].semantic == "attenuation") {
			var attn = bindables[i].getGLValue();
			return new org.xml3d.dataTypes.Vec3f(attn[0], attn[1], attn[2]);
		}
	}
	return new org.xml3d.dataTypes.Vec3f(0.0, 0.0, 1.0);
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

g_shaders['vs-x3d-default'] = {
	type : "vertex",
	data : "attribute vec3 position;"
			+ "uniform mat4 modelViewProjectionMatrix;"
			+ "void main(void) {"
			+ "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);"
			+ "}"
};
g_shaders['fs-x3d-default'] = {
	type : "fragment",
	data : "uniform vec3 diffuseColor;"
			+ "uniform float alpha;"
			+ "uniform float lightOn;"
			+ "void main(void) {"
			+ "    gl_FragColor = vec4(diffuseColor.x, diffuseColor.y, diffuseColor.z, 1.0);"
			+ "}"
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