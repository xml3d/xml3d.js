
//Check, if basics have already been defined
var org;
if (!org || !org.xml3d)
  throw new Error("xml3d.js has to be included first");

// Create global symbol org.xml3d.webgl
if (!org.xml3d.webgl)
	org.xml3d.webgl = {};
else if (typeof org.xml3d.webgl != "object")
	throw new Error("org.xml3d.webgl already exists and is not an object");


org.xml3d.webgl.supported = function() {
	var canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	try {
		gl = canvas.getContext("experimental-webgl");
	} catch(e) {
		gl = null;
	}
	return !!gl;
};

org.xml3d.webgl.configure = function(xml3ds) {

	/*var sglscript=document.createElement('script');
	sglscript.setAttribute("type","text/javascript");
	sglscript.setAttribute("src", "../../org.xml3d.renderer.webgl/script/spidergl.js");
	document.getElementsByTagName("head")[0].appendChild(sglscript);
	*/
	for(var i in xml3ds) {
		// Creates a HTML <canvas> using the style of the <xml3d> Element
		var canvas = org.xml3d.webgl.createCanvas(xml3ds[i]);
		// Creates the gl context for the <canvas>  Element
		var context = org.xml3d.webgl.createContext(canvas, xml3ds[i]);
		xml3ds[i].canvas = canvas;
		
		context.start();
		org.xml3d._rendererFound = true;
	}
};

org.xml3d.webgl.createCanvas = function(xml3dElement) {
	// Place xml3dElement inside an invisble div
	var hideDiv = document.createElementNS(org.xml3d.xhtmlNS, 'div');
	xml3dElement.parentNode.insertBefore(hideDiv, xml3dElement);
	hideDiv.appendChild(xml3dElement);
	hideDiv.style.display = "none";

	// Create canvas and append it where the xml3d element was before
	var canvas = document.createElementNS(org.xml3d.xhtmlNS, 'canvas');
	canvas.setAttribute("style", xml3dElement.getAttribute("style"));
	canvas.setAttribute("class", xml3dElement.getAttribute("class"));
	var sides = [ "top", "right", "bottom", "left" ];
	var colorStr = styleStr = widthStr = paddingStr = "";
	for (i in sides) {
		colorStr += org.xml3d.util.getStyle(xml3dElement, "border-" + sides[i] + "-color") + " ";
		styleStr += org.xml3d.util.getStyle(xml3dElement, "border-" + sides[i] + "-style") + " ";
		widthStr += org.xml3d.util.getStyle(xml3dElement, "border-" + sides[i] + "-width") + " ";
		paddingStr += org.xml3d.util.getStyle(xml3dElement, "padding-" + sides[i]) + " ";
	}
	canvas.style.borderColor = colorStr;
	canvas.style.borderStyle = styleStr;
	canvas.style.borderWidth = widthStr;
	canvas.style.padding = paddingStr;
	canvas.style.backgroundColor = org.xml3d.util.getStyle(xml3dElement, "background-Color");

	if ((w = xml3dElement.getAttribute("width")) !== null) {
		canvas.style.width = w;
	}
	if ((h = xml3dElement.getAttribute("height")) !== null) {
		canvas.style.height = h;
	}
	canvas.id = "canvas1";
	hideDiv.parentNode.insertBefore(canvas, hideDiv);
	return canvas;
};


org.xml3d.webgl.createContext = (function() {
	
	function Scene(xml3dElement) {
		this.xml3d = xml3dElement;
		this.getBackgroundColor = function() {
			if (RGBColor && document.defaultView
					&& document.defaultView.getComputedStyle) {
				var colorStr = org.xml3d.util.getStyle(this.xml3d,
						"background-color");
				var color = new RGBColor(colorStr);
				return color.toGLAlpha();
			}
		};
		this.getActiveView = function() {
			var av = this.xml3d.getActiveView();
			if (av == null)
			{
				av = document.evaluate('//xml3d:xml3d/xml3d:view[1]', document, function() {
					return org.xml3d.xml3dNS;
				}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
				if (av == null)
					org.xml3d.debug.logError("No view defined.");
			}
			return av;
		};
	}
	
	function Context(gl, canvas, scene) {
		this.gl = gl;
		this.canvas = canvas;
		this.scene = scene;
		this.needsUpdate = true;
	}
	
	Context.prototype.start = function() {
		var ctx = this;
		ctx.renderScene();
		/*setInterval(function() {
			if (ctx.needsUpdate)
				ctx.renderScene();
		}, 16);*/
	};
	
	Context.prototype.getCanvasId = function() {
		return this.canvas.id;
	};
	
	Context.prototype.getCanvasWidth = function() {
		return this.canvas.width;
	};
	
	Context.prototype.getCanvasHeight = function() {
		return this.canvas.height;
	};
	
	function setupContext(canvas, xml3dElement) {
		org.xml3d.debug.logInfo("setupContext: canvas=" + canvas);
		var ctx = null;
		try {
			ctx = canvas.getContext("experimental-webgl");
			if (ctx) {
				return new Context(ctx, canvas, new Scene(xml3dElement));
			}
		} catch (ef) {
			return null;
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

	Context.prototype.renderPick = function(scene, screenX, screenY) {
		var gl = this.gl;
		if (!this.pickBuffer)
		{
			org.xml3d.debug.logError('Picking buffer could not be created!');
			return;
		}
		this.pickBuffer.bind();
		
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.disable(gl.CULL_FACE);
		gl.disable(gl.BLEND);
		
		this.renderer.renderPickingPass(scene, screenX, screenY);
		
		gl.disable(gl.DEPTH_TEST);
		this.pickBuffer.unbind();
	};
	
	Context.prototype.renderScene = function() {
		var gl = this.gl;

		if (this.renderer === undefined || !this.renderer) {
			this.renderer = new org.xml3d.webgl.Renderer(this);
		}
		
		var bgCol = this.scene.getBackgroundColor();
		if (bgCol)
			gl.clearColor(bgCol[0], bgCol[1], bgCol[2], bgCol[3]);
		else
			gl.clearColor(0.3, 0.3, 0.6, 1.0);
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);

		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);
		
		this.renderer.render();

		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);

	};
	
	Context.prototype.shutdown = function(scene) {
		var gl = this.gl;

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

org.xml3d.webgl.Renderer = function(ctx) {
	this.ctx = ctx;
	this.scene = ctx.scene;
	this.factory = new org.xml3d.webgl.XML3DRenderAdapterFactory(ctx, this);
	this.lights = null;
	this.camera = this.initCamera();
	this.shaderMap = {};
	sglRegisterCanvas(ctx.getCanvasId(), this, 1.0);
	this.ctx.pickBuffer = new SglFramebuffer(gl, ctx.getCanvasWidth(), ctx.getCanvasHeight(), 
			[gl.RGBA], gl.DEPTH_COMPONENT16, null, {depthAsRenderbuffer : true});
	org.xml3d.webgl.checkError(gl, "After creating picking buffer");
};
org.xml3d.webgl.Renderer.prototype.update = function() {
	//this.canvas.needUpdate = true;
};

org.xml3d.webgl.Renderer.prototype.draw = function(gl) {
	try {
		/*Un-comment to enable continuous rendering again*/
		//this.ctx.renderScene(this.scene);
	} catch (e) {
		org.xml3d.debug.logException(e);
		throw e;
	}
	
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
		objects, lights, shader) {
	var adapter = this.factory.getAdapter(this.scene.xml3d);
	if (adapter)
		return adapter.collectDrawableObjects(transform, objects, lights, shader);
	return [];
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
		var prog = null;
		
		if (name == "urn:xml3d:shader:phong" || name == "urn:xml3d:shader:phongvcolor" || name == "urn:xml3d:shader:texturedphong")
		{
			// Workaround for lack of dynamic loops on ATI cards below the HD 5000 line 
			var sfrag = g_shaders[name].fragment;
			var tail = sfrag.substring(68, sfrag.length);
			if (!this.lights)
				var maxLights = "#ifdef GL_ES\nprecision highp float;\n" +
						"#endif\n\nconst int MAXLIGHTS = 0;\n";
			else
				var maxLights = "#ifdef GL_ES\nprecision highp float;\n" +
						"#endif\n\n const int MAXLIGHTS = "+ this.lights.length.toString() + ";\n";
			
			var frag = maxLights + tail; 
			prog = new SglProgram(gl, [g_shaders[name].vertex], [frag]);
			org.xml3d.webgl.checkError(gl, "After creating shader");
		} else {
			prog = new SglProgram(gl, [g_shaders[name].vertex], [g_shaders[name].fragment]);
			org.xml3d.webgl.checkError(gl, "After creating shader");
		}
		if (!prog)
		{
			org.xml3d.debug.logError("Could not create shader program: " + name);
			return null;	
		}

		this.shaderMap[name] = prog;
		shader = prog;
	}
	return shader;
};

org.xml3d.webgl.Renderer.prototype.getCenter = function(adapter) {
	return adapter.getCenter();
};

org.xml3d.webgl.Renderer.prototype.render = function() {
	var gl = this.ctx.gl;
	var sp = null;


	if (!this.camera)
		return;
	if (this.drawableObjects === undefined || !this.drawableObjects || 
			this.lights === undefined || !this.lights) {
		this.drawableObjects = [];
		this.lights = new Array();
		this.collectDrawableObjects(new sglM4(),
				this.drawableObjects, this.lights, null);
	}
	
	
	var xform = new SglTransformStack();
	xform.view.load(this.camera.getViewMatrix());	
	var projMatrix = this.camera
	.getProjectionMatrix(this.ctx.getCanvasWidth() / this.ctx.getCanvasHeight());
	var viewMatrix = this.camera.getViewMatrix();
	xform.projection.load(projMatrix);
	
	
	var light, lightOn;

	var zPos = [];
	for (i = 0, n = this.drawableObjects.length; i < n; i++) {
		var trafo = this.drawableObjects[i][0];
		var obj3d = this.drawableObjects[i][1];
		var center = this.getCenter(obj3d);
		center.v = sglMulM4V3(trafo, center, 1.0);
		center.v = sglMulM4V3(xform.view._s[0], center, 1.0);
		
		zPos[i] = [ i, center.z ];
	}
	zPos.sort(function(a, b) {
		return a[1] - b[1];
	});

	for (var i = 0, n = zPos.length; i < n; i++) {
		var obj = this.drawableObjects[zPos[i][0]];
		var transform = obj[0];
		var shape = obj[1];
		var shader = obj[2];
	
		sp = null;
		xform.model.load(transform);
		
		if (shader) {
			sp = shader.shaderProgram;
		}
		
		if (!sp)
		{
			org.xml3d.webgl.checkError(gl, "Before default shader");
			sp = this.getStandardShaderProgram(gl, "urn:xml3d:shader:flat");
			if (sp) {
				if (RGBColor && document.defaultView
					&& document.defaultView.getComputedStyle) {
					var colorStr = document.defaultView.getComputedStyle(
						shape.node, "").getPropertyValue("color");
					var color = new RGBColor(colorStr);
					org.xml3d.webgl.checkError(gl, "Before default diffuse");
					sp.setUniforms ({ 
						diffuseColor : [0.0,0.0,0.80]
					});
					org.xml3d.webgl.checkError(gl, "After default diffuse");
					}
			}
		}
		
		var slights = this.lights;
		var lightParams = {
			positions : new Array(),
			diffuseColors : new Array(),
			ambientColors : new Array(),
			attenuations : new Array(),
			visible : new Array()
		};
		for ( var j = 0; j < slights.length; j++) {
			var light = slights[j][1];
			lightParams.positions = lightParams.positions.concat(light
					.getPosition(sglMulM4(viewMatrix, slights[j][0])));			
			lightParams.attenuations = lightParams.attenuations.concat(light
					.getAttenuation());
			lightParams.diffuseColors = lightParams.diffuseColors.concat(
					light.getIntensity());
			lightParams.visible = lightParams.visible.concat(
					light.getVisibility());		
		}

		lightParams.ambientColors = [ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ];

		//Begin setting up uniforms for rendering
		var parameters = {};
		parameters["lightPositions[0]"] = lightParams.positions;
		parameters["lightVisibility[0]"] = lightParams.visible;
		parameters["lightDiffuseColors[0]"] = lightParams.diffuseColors;
		parameters["lightAmbientColors[0]"] = lightParams.ambientColors;
		parameters["lightAttenuations[0]"] = lightParams.attenuations;
		parameters["modelViewMatrix"] = xform.modelViewMatrix;
		parameters["modelViewProjectionMatrix"] = xform.modelViewProjectionMatrix;
		
		if (shader)
		{
			//Add uniforms from the shader to the parameters package
			shader.setParameters(parameters);		
			
			shape.render(shader, parameters);
			shader.cleanUp();
			org.xml3d.webgl.checkError(gl, "Error after cleanup.");
		} else {
			shader = {};
			shader.sp = sp;
			shape.render(shader, parameters);
		}
		
	}
	
	this.drawableObjects = null;
};

org.xml3d.webgl.Renderer.prototype.renderPickingPass = function(scene, x, y) {
	try {
		gl = this.gl;
		
		
		if (this.drawableObjects === undefined || !this.drawableObjects) {
			this.drawableObjects = [];
			this.slights = new Array();
			this.collectDrawableObjects(new sglM4(),
					this.drawableObjects, this.slights, null);
		}
		
		var xform = new SglTransformStack();
		xform.view.load(this.camera.getViewMatrix());
		var projMatrix = this.camera
		.getProjectionMatrix(this.ctx.getCanvasWidth() / this.ctx.getCanvasHeight());
		xform.projection.load(projMatrix);
		
		
		var zPos = [];
		for (i = 0, n = this.drawableObjects.length; i < n; i++) {
			var trafo = this.drawableObjects[i][0];
			var obj3d = this.drawableObjects[i][1];
			var center = this.getCenter(obj3d);
			center.v = sglMulM4V3(trafo, center, 1.0);
			center.v = sglMulM4V3(xform.view._s[0], center, 1.0);
			
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
						
			xform.model.load(transform);
			
			var id = 1.0 - (1+i) / 255.0;
			var wcMin = new XML3DVec3(Number.MAX_VALUE, Number.MAX_VALUE,
					Number.MAX_VALUE).toGL();
			var wcMax = new XML3DVec3(Number.MIN_VALUE, Number.MIN_VALUE,
					Number.MIN_VALUE).toGL();
			
			var parameters = ({
				id : id,
				wcMin : wcMin,
				wcMax : wcMax,
				modelViewMatrix : xform.modelViewMatrix,
				modelViewProjectionMatrix : xform.modelViewProjectionMatrix
			});
			
			shader = {};
			shader.sp = sp;
			shape.render(shader, parameters);
			
		}
		org.xml3d.webgl.checkError(gl, "Before readpixels");

		var data = new Uint8Array(8);
		
		gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
		org.xml3d.webgl.checkError(gl, "After readpixels");
		
		//Getting the picked position in scene coordinates doesn't work yet
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
			//org.xml3d.debug.logInfo("Picked object "+objId);
		} else {
			scene.currentPickPos = null;
			scene.currentPickObj = null;
		}	
	} catch (e) {
		org.xml3d.debug.logError(e);		
	}
	
};

org.xml3d.webgl.Renderer.prototype.dispose = function() {
	var drawableObjects = new Array();
	this.collectDrawableObjects(new sglM4(),
			drawableObjects, new Array(), null);
	for ( var i = 0, n = drawableObjects.length; i < n; i++) {
		var shape = drawableObjects[i][1];
		var shader = drawableObjects[i][2];
		shape.dispose();
		if (shader)
			shader.dispose();
	}
};




org.xml3d.webgl.XML3DRenderAdapterFactory = function(ctx, renderer) {
	org.xml3d.data.AdapterFactory.call(this);
	this.ctx = ctx;
	this.renderer = renderer;
};
org.xml3d.webgl.XML3DRenderAdapterFactory.prototype = new org.xml3d.data.AdapterFactory();
org.xml3d.webgl.XML3DRenderAdapterFactory.prototype.constructor = org.xml3d.webgl.XML3DRenderAdapterFactory;

org.xml3d.webgl.XML3DRenderAdapterFactory.prototype.getAdapter = function(node) {
	return org.xml3d.data.AdapterFactory.prototype.getAdapter.call(this, node, org.xml3d.webgl.Renderer.prototype);
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
	org.xml3d.data.Adapter.call(this, factory, node);
	this.drawableObjects = null;
};
org.xml3d.webgl.RenderAdapter.prototype = new org.xml3d.data.Adapter();
org.xml3d.webgl.RenderAdapter.prototype.constructor = org.xml3d.webgl.RenderAdapter;

org.xml3d.webgl.RenderAdapter.prototype.isAdapterFor = function(protoType) {
	return protoType == org.xml3d.webgl.Renderer.prototype;
};

org.xml3d.webgl.RenderAdapter.prototype.getShader = function() {
	return null;
};

//org.xml3d.webgl.RenderAdapter.prototype.notifyChanged = function(e) {
//	org.xml3d.debug.logWarning("Unhandled change: " + e);
//};

org.xml3d.webgl.RenderAdapter.prototype.collectDrawableObjects = function(
		transform, outMeshes, outLights, parentShader) {
	for ( var i = 0; i < this.node.childNodes.length; i++) {
		if (this.node.childNodes[i]) {
			var adapter = this.factory.getAdapter(this.node.childNodes[i]);
			if (adapter) {
				var childTransform = adapter.applyTransformMatrix(transform);
				var shader = adapter.getShader();
				if (!shader)
					shader = parentShader;
				adapter.collectDrawableObjects(childTransform, outMeshes, outLights, shader);
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


//TODO: anpassen?
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
		this.viewMatrix =  this.node.orientation.negate().toMatrix().multiply(
				new XML3DMatrix().translate(this.node.position.negate()));
	}
	return new sglM4(this.viewMatrix.toGL());
	//return this.viewMatrix;
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
	return new sglM4(this.projMatrix.toGL());
	//return this.projMatrix;
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
			var gl = this.factory.ctx.gl;
			var bindables = this.getBindables();
			if (!this.sp && this.node.hasAttribute("script")) {
				var scriptURL = this.node.getAttribute("script");
				if (new org.xml3d.URI(scriptURL).scheme == "urn")
				{
					if (this.textures[0] && scriptURL == "urn:xml3d:shader:phong")
						scriptURL = "urn:xml3d:shader:texturedphong";

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

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.initTexture = function(textureNode) {
	
	var gl = this.factory.gl;
	org.xml3d.webgl.checkError(gl, "Error before creating texture:");
	var imageData = null;
	var texture = null;
	var child = textureNode.firstChild;
	
	while (child && !imageData) {
		imageData = this.factory.getAdapter(child);
		child = child.nextSibling;
	}
	var options = ({
		/*Custom texture options would go here, SGL's default options are:
		
		minFilter        : gl.LINEAR,
		magFilter        : gl.LINEAR,
		wrapS            : gl.CLAMP_TO_EDGE,
		wrapT            : gl.CLAMP_TO_EDGE,
		isDepth          : false,
		depthMode        : gl.LUMINANCE,
		depthCompareMode : gl.COMPARE_R_TO_TEXTURE,
		depthCompareFunc : gl.LEQUAL,
		generateMipmap   : false,
		flipY            : true,
		premultiplyAlpha : false,
		onload           : null
		 */
	});
	if (imageData) {
		//null would be replaced with options, --CANNOT PASS EMPTY OPTIONS OBJECT--
		texture = new SglTexture2D(gl, imageData.node.src, null);
		org.xml3d.webgl.checkError(gl, "Error after creating texture:" + imageData.node.src);
	}
	
	//Create a container for the texture
	var texContainer = ({
		semantic 	: textureNode.parentNode.semantic,
		tex 		: texture
	});
	
	this.textures.push(texContainer);
	org.xml3d.debug.logInfo("Created GL texture: " + texContainer.semantic);
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

/*
 * setParameters has been changed to only add this shader's uniforms to the parameters
 * object. Setting them before the SGLRender call in the mesh.render method creates
 * GL errors in scenes that use both textured and non-textured shaders.
 */
org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.setParameters = function(parameters) {
	if (!this.sp)
		return;
	var gl = this.factory.gl;
	var bindables = this.getBindables();
	
	for ( var i = 0; i < bindables.length; i++) {
		var bindable = bindables[i];

		if (org.xml3d.isa(bindable.node.firstElementChild, org.xml3d.classInfo.texture)) {
			//Do nothing
		} else if (bindable.kind === org.xml3d.webgl.XML3DBindRenderAdapter.SHADER_PARAMETER_TYPE) {
			var value = bindable.getGLValue();
			if (value)
			{
				parameters[bindable.semantic] = value;
			}
		}
	}

};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.cleanUp = function() {
	//TEXTURE CLEANUP NO LONGER NECESSARY
};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.dispose = function() {
	var gl = this.factory.gl;
	Array.forEach(this.textures, function(t) {
		t.tex.destroy();
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

	return sglMulM4(transform, adapter.getMatrix());
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
	return new sglM4(this.matrix.toGL());
};

org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.notifyChanged = function(e) {
	this.matrix = null;
	//this.factory.renderer.canvas.needUpdate = true;
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

org.xml3d.webgl.XML3DBindRenderAdapter.prototype.getElementArray = function() {
	var gl = this.factory.gl;
	
		var child = this.node.firstChild;
		var fArray = null;
		while (child && !fArray) {
			if (child.nodeType == Node.ELEMENT_NODE) {

				if (org.xml3d.isa(child, org.xml3d.classInfo.int)) {
					this.dataType = gl.UNSIGNED_SHORT;
					this.tupleSize = 1;
					// org.xml3d.debug.logInfo("Values: " + child.value);
					fArray = new Uint16Array(child.value);
					this.count = child.value.length;
				} else if (org.xml3d.isa(child, org.xml3d.classInfo.bool))
					this.dataType = gl.BOOL;
				else if (org.xml3d.isa(child, org.xml3d.classInfo.float)) {
					this.dataType = gl.FLOAT;
					this.tupleSize = 1;
					fArray = new Float32Array(child.value);
				} else if (org.xml3d.isa(child, org.xml3d.classInfo.float2)) {
					this.dataType = gl.FLOAT;
					this.tupleSize = 2;
					fArray = new Float32Array(child.value);
				} else if (org.xml3d.isa(child, org.xml3d.classInfo.float3)) {
					this.dataType = gl.FLOAT;
					this.tupleSize = 3;
					fArray = new Float32Array(child.value);
				}
			}
			child = child.nextSibling;
		}
	
	return fArray;
};

org.xml3d.webgl.XML3DBindRenderAdapter.prototype.getBuffer = function() {
	var gl = this.factory.gl;

	if (!this.buffer) {
		org.xml3d.debug.logInfo("Creating buffer for: " + this.semantic);
		
		if (this.semantic == "texcoord")
			var herp = 0;

		var child = this.node.firstChild;
		var fArray = null;
		while (child && !fArray) {
			if (child.nodeType == Node.ELEMENT_NODE) {

				if (org.xml3d.isa(child, org.xml3d.classInfo.int)) {
					this.dataType = gl.UNSIGNED_SHORT;
					this.tupleSize = 1;
					// org.xml3d.debug.logInfo("Values: " + child.value);
					fArray = new Uint16Array(child.value);
					this.count = child.value.length;
				} else if (org.xml3d.isa(child, org.xml3d.classInfo.bool))
					this.dataType = gl.BOOL;
				else if (org.xml3d.isa(child, org.xml3d.classInfo.float)) {
					this.dataType = gl.FLOAT;
					this.tupleSize = 1;
					fArray = new Float32Array(child.value);
				} else if (org.xml3d.isa(child, org.xml3d.classInfo.float2)) {
					this.dataType = gl.FLOAT;
					this.tupleSize = 2;
					fArray = new Float32Array(child.value);
				} else if (org.xml3d.isa(child, org.xml3d.classInfo.float3)) {
					this.dataType = gl.FLOAT;
					this.tupleSize = 3;
					fArray = new Float32Array(child.value);
				}
			}
			child = child.nextSibling;
		}
		if (fArray) {
			this.buffer = fArray;
		} else {
			org.xml3d.debug.logInfo("Could not create Array Buffer for "
					+ this.semantic);
			this.buffer = null;
		}

	}
	var bufferInfo = ({
		tupleSize 	: this.tupleSize,
		dataType 	: this.dataType,
		buffer		: this.buffer
	});
	return bufferInfo;
};

org.xml3d.webgl.XML3DBindRenderAdapter.prototype.notifyChanged = function(e) {
	this.glValue = null;
	//this.factory.renderer.canvas.needUpdate = true;
};

// Adapter for <mesh>
org.xml3d.webgl.XML3DMeshRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	
	//Support for mesh loading from .obj files
	var src = node.getSrc();
	this.loadedMesh = false;
	if (src)
	{
		var meshJS = new SglMeshJS();
		if (!meshJS.importOBJ(src))
			org.xml3d.debug.logInfo("Could not create mesh from "+ src);
		else {
			this.mesh = meshJS.toPackedMeshGL(factory.gl, "triangles", 64000);
			this.loadedMesh = true;
		}
	} else {	
		this.mesh = new SglMeshGL(factory.gl);
	}
};
org.xml3d.webgl.XML3DMeshRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DMeshRenderAdapter;

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getCenter = function() {
	var min = new XML3DVec3(-1, -1, -1);
	var max = new XML3DVec3(1, 1, 1);
	this.getBBox(min, max, true);
	var center = min.add(max).scale(0.5);
	return new SglVec3(center.x, center.y, center.z);
	//return center;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.collectDrawableObjects = function(
		transform, outMeshes, outLights, shader) {
	outMeshes.push( [ transform, this, shader ]);
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getBBox = function(min, max,
		invalidate) {

};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.dispose = function() {
	this.mesh.destroy();
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.render = function(shader, parameters) {

	var gl = this.factory.ctx.gl;
	var bindables = this.getBindables();
	var elements = null;
	
	var samplers = {};
	var invalidTextures = false;
	if (shader.textures !== undefined && shader.textures.length > 0)
	{
		
		for (var t in shader.textures)
		{
			var temp = shader.textures[t];
			if (temp.tex.isValid) 
				samplers[temp.semantic] = temp.tex;
			else
				invalidTextures = true;
		}
	}
	if (invalidTextures)
	{
		//Texture is not ready for rendering yet, skip this object
		return;
	}

	
	

//---------------------------------------------
   //TODO: test
	var factory       = new org.xml3d.webgl.XML3DDataAdapterFactory(this);
	var dataCollector = factory.getAdapter(this.node, org.xml3d.webgl.XML3DDataAdapterFactory.prototype);

	var tmp = dataCollector.createDataTable();
	
	var txt = "";
	for(key in tmp)
	{
		txt += key + ":" + tmp[key] + "\n\n";
	}
	
	alert("createDataTable:\n" + txt);
//---------------------------------
	
	
	
	
	
	org.xml3d.webgl.checkError(gl, "Error before starting render.");
	//Fill mesh attribute arrays (index, position, normal...)
	for ( var i = 0; i < bindables.length; i++) {
		 
		var bindable = bindables[i];
		
		if (bindable.kind != org.xml3d.webgl.XML3DBindRenderAdapter.BUFFER_TYPE)
			continue;

		if (bindable.isIndex) {
			var fArray = bindable.getElementArray();
			this.mesh.addIndexedPrimitives("triangles", gl.TRIANGLES, fArray);
			org.xml3d.webgl.checkError(gl, "Error after setting prims");
			elements = bindable;
			delete fArray;
		} else {
			var bufferInfo = bindable.getBuffer();
			if (shader.sp.attributes[bindable.semantic] !== undefined && bufferInfo) {
				this.mesh.addVertexAttribute(bindable.semantic, bufferInfo.tupleSize, bufferInfo.buffer);
				org.xml3d.webgl.checkError(gl, "Error after setting bindable "+bindable.semantic);
			}		
		}
	}

	
	if (this.loadedMesh || elements) {
		org.xml3d.webgl.checkError(gl, "Error before drawing Elements.");
		sglRenderMeshGLPrimitives(this.mesh, "triangles", shader.sp, null, parameters, samplers);
		org.xml3d.webgl.checkError(gl, "Error after drawing Elements.");
		
	} else
		org.xml3d.debug.logError("No element array found!");
};



// Adapter for <light>
org.xml3d.webgl.XML3DLightRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.position = null;
	this.attenuation = null;
	this.intensity = null;
	this.visible = null;
};
org.xml3d.webgl.XML3DLightRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DLightRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DLightRenderAdapter;

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.collectDrawableObjects = function(
		transform, outMeshes, outLights, shader) {
	outLights.push( [ transform, this ]);
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.notifyChanged = function(e) {
	this[e.attribute] = null;
	var derp = 0;
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getPosition = function(
		transform) {
	
	//(Can't cache the light's position because it may change every frame when
	//moving the camera)
	var ls = this.getLightShader();
	var bindables = ls.getBindables();
	for ( var i = 0; i < bindables.length; i++) {
		if (bindables[i].semantic == "position") {
			var pos = bindables[i].getGLValue();
			var t = sglMulM4V4(transform, [pos[0], pos[1], pos[2], 1.0]);
			this.position = [t[0]/t[3], t[1]/t[3], t[2]/t[3]];
			return this.position;
		}
	}
	var t = sglMulM4V4(transform, [0.0, 0.0, 0.0, 1.0]);
	this.position = [t[0]/t[3], t[1]/t[3], t[2]/t[3]];
	return this.position;
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getAttenuation = function(
		transform) {
	if (this.attenuation)
		return this.attenuation;
	
	var ls = this.getLightShader();
	var bindables = ls.getBindables();
	for ( var i = 0; i < bindables.length; i++) {
		if (bindables[i].semantic == "attenuation") {
			var attn = bindables[i].getGLValue();
			this.attenuation = [attn[0], attn[1], attn[2]];
			return this.attenuation;
		}
	}
	this.attenuation = [0.0, 0.0, 0.1];
	return this.attenuation;
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getIntensity = function()
{
	if (this.intensity)
		return this.intensity;
	
	var ls = this.getLightShader();
	var bindables = ls.getBindables();
	
	for ( var i = 0; i < bindables.length; i++) {
		if (bindables[i].semantic == "intensity") {
			var diff = bindables[i].getGLValue();
			this.intensity = [diff[0], diff[1], diff[2]];
			return this.intensity;
		}
	}
	this.intensity = [1.0, 1.0, 1.0];
	return this.intensity;
		
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getVisibility = function() {
	//For now visibility is returned as a vec3 of either 1's or 0's
	
	if (this.visible)
		return this.visible;
	
	var lightOn = this.node.visible;
	
	if (lightOn !== undefined)
	{
		if (lightOn)
			this.visible = [1.0,1.0,1.0];
		else
			this.visible = [0.0,0.0,0.0];
	} else {
		this.visible = [1.0,1.0,1.0];
	}
	return this.visible;
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
			"#ifdef GL_ES\n"
			+"precision highp float;\n"
			+"#endif\n\n"
		    + "uniform vec3 diffuseColor;"
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
				"#ifdef GL_ES\n"
				+"precision highp float;\n"
				+"#endif\n\n"
			    + "uniform vec3 diffuseColor;"
				+ "varying vec3 fragVertexColor;"
				+ "void main(void) {"
				+ "    gl_FragColor = vec4(fragVertexColor, 1.0);"
				+ "}"
	};

g_shaders["urn:xml3d:shader:phong"] = {
		vertex :
					
		"attribute vec3 position;\n"
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
		+"	  fragNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;\n"
		+"	  fragVertexPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;\n"
		+"	  fragEyeVector = fragVertexPosition;\n"
		//+"    fragTexCoord = texcoord;\n"
		+"}\n",
		
	fragment:
	// NOTE: Any changes to this area must be carried over to the substring calculations in
	// org.xml3d.webgl.Renderer.prototype.getStandardShaderProgram
			+"#ifdef GL_ES\n"
			+"precision highp float;\n"
			+"#endif\n\n"
			+"const int MAXLIGHTS = 0; \n"
	// ------------------------------------------------------------------------------------
			+"uniform float ambientIntensity;\n"
			+"uniform vec3 diffuseColor;\n"
			+"uniform vec3 emissiveColor;\n"
			+"uniform float shininess;\n"
			+"uniform vec3 specularColor;\n"
			+"uniform float transparency;\n"
			+"uniform float lightOn;\n"
			//+"uniform sampler2D diffuseTexture;\n"
			
			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"
			//+"varying vec2 fragTexCoord;\n"
			
			+"uniform vec3 lightAttenuations[MAXLIGHTS+1];\n"
			+"uniform vec3 lightPositions[MAXLIGHTS+1];\n"
			+"uniform vec3 lightDiffuseColors[MAXLIGHTS+1];\n"
			+"uniform vec3 lightAmbientColors[MAXLIGHTS+1];\n"
			+"uniform vec3 lightVisibility[MAXLIGHTS+1];\n"
			
			
			+"vec3 light(in int i)\n"
		 	+"{\n"
		 	+"		vec3 L = lightPositions[i] - fragVertexPosition;\n"
		 	+"      vec3 N = normalize(fragNormal);\n"
		 	+"		vec3 E = normalize(fragEyeVector);\n"
			+"		float dist = length(L);\n"
		 	+"      L = normalize(L);\n"
			+"		vec3 R = normalize(reflect(L,N));\n"
			
			+"		vec3 ambientColor = ambientIntensity * diffuseColor;\n"		 			
			+"		float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);\n"	 

			+"		vec3 Iamb = ambientColor * lightAmbientColors[i];\n"
			+"		vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * diffuseColor ;\n"//* texture2D(tex, texCoord).rgb
			+"		vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess);\n"
			+"		vec3 color = (emissiveColor+Iamb+atten*(Idiff + Ispec));\n"
			+"		return color * lightVisibility[i];\n" 
			+"}\n"
			
			+"void main(void) {\n"
			//+"  vec2 texCoord = vec2(fragTexCoord.x,1.0-fragTexCoord.y);\n"
			+"	if (MAXLIGHTS < 1) {\n"
			+"      vec3 light = normalize(-fragVertexPosition);\n"
			+"      vec3 normal = normalize(fragNormal);\n"
			+"      vec3 eye = normalize(fragVertexPosition);\n"
			+"      float diffuse = max(0.0, dot(normal, light)) ;\n"//* lightOn
			+"      diffuse += max(0.0, dot(normal, eye));\n"
			+"      float specular = pow(max(0.0, dot(normal, normalize(light+eye))), shininess);\n" //*lightOn
			+"      specular += pow(max(0.0, dot(normal, eye)), shininess);\n"
			+"      vec3 rgb = emissiveColor + diffuse*diffuseColor + specular*specularColor;\n"//*texture2D(tex, texCoord).rgb
			+"      rgb = clamp(rgb, 0.0, 1.0);\n"
			+"      gl_FragColor = vec4(rgb, max(0.0, 1.0 - transparency)); \n"
			+"	} else {\n"
			+"      vec3 color = vec3(0,0,0);\n"
			+"		for (int i=0; i<MAXLIGHTS; i++) {\n"
			+"			color = color + light(i);\n"
			+"		}\n"
			+"		gl_FragColor = vec4(color, max(0.0, 1.0 - transparency));\n"
			+"  }\n"
			+"}"
};

g_shaders["urn:xml3d:shader:texturedphong"] = {
		vertex :
			
		//"#version 120\n\n"	
		"attribute vec3 position;\n"
		+"attribute vec3 normal;\n"
		+"attribute vec2 texcoord;\n"
		
		+"varying vec3 fragNormal;\n"
		+"varying vec3 fragVertexPosition;\n"
		+"varying vec3 fragEyeVector;\n"
		+"varying vec2 fragTexCoord;\n"
		
		+"uniform mat4 modelViewProjectionMatrix;\n"
		+"uniform mat4 modelViewMatrix;\n"
		+"uniform vec3 eyePosition;\n"
		
		
		+"void main(void) {\n"
		+"	  gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);\n"
		+"	  fragNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;\n"
		+"	  fragVertexPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;\n"
		+"	  fragEyeVector = fragVertexPosition;\n"
		+"    fragTexCoord = texcoord;\n"
		+"}\n",
		
	fragment:
		// NOTE: Any changes to this area must be carried over to the substring calculations in
		// org.xml3d.webgl.Renderer.prototype.getStandardShaderProgram
			//"#version 120\n\n"
			+"#ifdef GL_ES\n"
			+"precision highp float;\n"
			+"#endif\n\n"
			+"const int MAXLIGHTS = 0; \n"
		// ------------------------------------------------------------------------------------
			+"uniform float ambientIntensity;\n"
			+"uniform vec3 diffuseColor;\n"
			+"uniform vec3 emissiveColor;\n"
			+"uniform float shininess;\n"
			+"uniform vec3 specularColor;\n"
			+"uniform float transparency;\n"
			+"uniform float lightOn;\n"
			+"uniform sampler2D diffuseTexture;\n"
			
			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"
			+"varying vec2 fragTexCoord;\n"
			
			+"uniform vec3 lightAttenuations[MAXLIGHTS+1];\n"
			+"uniform vec3 lightPositions[MAXLIGHTS+1];\n"
			+"uniform vec3 lightDiffuseColors[MAXLIGHTS+1];\n"
			+"uniform vec3 lightAmbientColors[MAXLIGHTS+1];\n"
			+"uniform vec3 lightVisibility[MAXLIGHTS+1];\n"
			
			
			+"vec3 light(in int i)\n"
		 	+"{\n"
		 	+"		vec3 L = lightPositions[i] - fragVertexPosition;\n"
		 	+"      vec3 N = normalize(fragNormal);\n"
		 	+"		vec3 E = normalize(fragEyeVector);\n"
			+"		float dist = length(L);\n"
		 	+"      L = normalize(L);\n"
			+"		vec3 R = normalize(reflect(L,N));\n"
			
			+"		vec3 ambientColor = ambientIntensity * diffuseColor;\n"		 			
			+"		float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);\n"	 

			+"		vec3 Iamb = ambientColor * lightAmbientColors[i] * lightVisibility[i];\n"
			+"		vec3 Idiff = lightDiffuseColors[i]* lightVisibility[i] * max(dot(N,L),0.0) * texture2D(diffuseTexture, fragTexCoord).xyz;\n"
			+"		vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess);\n"
			+"		vec3 color = (emissiveColor+Iamb+atten*(Idiff + Ispec));\n"
			+"		return color;\n" 
			+"}\n"
			
			+"void main(void) {\n"
			+"	if (MAXLIGHTS < 1) {\n"
			+"      vec3 light = normalize(-fragVertexPosition);\n"
			+"      vec3 normal = normalize(fragNormal);\n"
			+"      vec3 eye = normalize(fragVertexPosition);\n"
			+"      float diffuse = max(0.0, dot(normal, light)) ;\n"//* lightOn
			+"      diffuse += max(0.0, dot(normal, eye));\n"
			+"      float specular = pow(max(0.0, dot(normal, normalize(light-eye))), shininess);\n" //*lightOn
			+"      specular += pow(max(0.0, dot(normal, eye)), shininess);\n"
			+"      vec3 rgb = emissiveColor + diffuse*texture2D(diffuseTexture, fragTexCoord).xyz + specular*specularColor;\n"
			+"      gl_FragColor = vec4(rgb, max(0.0, 1.0 - transparency)); \n"
			+"	} else {\n"
			+"      vec3 color = vec3(0,0,0);\n"
			+"		for (int i=0; i<MAXLIGHTS; i++) {\n"
			+"			color = color + light(i);\n"
			+"		}\n"
			+"		gl_FragColor = vec4(color, max(0.0, 1.0 - transparency));\n"
			+"  }\n"
			+"}"
};

g_shaders["urn:xml3d:shader:phongvcolor"] = {
		vertex :

			"attribute vec3 position;\n"
			+"attribute vec3 normal;\n"
			+"attribute vec3 color;\n"
			
			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"
			+"varying vec2 fragTexCoord;\n"
			+"varying vec3 fragVertexColor;\n"
			
			+"uniform mat4 modelViewProjectionMatrix;\n"
			+"uniform mat4 modelViewMatrix;\n"
			+"uniform vec3 eyePosition;\n"
			
			+"void main(void) {\n"
			+"	  gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);\n"
			+"	  fragNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;\n"
			+"	  fragVertexPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;\n"
			+"	  fragEyeVector = fragVertexPosition;\n"
			+ "   fragVertexColor = color;\n"
			+"}\n",
			
		fragment:
		// NOTE: Any changes to this area must be carried over to the substring calculations in
		// org.xml3d.webgl.Renderer.prototype.getStandardShaderProgram
				"#ifdef GL_ES\n"
				+"precision highp float;\n"
				+"#endif\n\n"
				+"const int MAXLIGHTS = 0; \n"
		// ------------------------------------------------------------------------------------
				+"uniform float ambientIntensity;\n"
				+"uniform vec3 diffuseColor;\n"
				+"uniform vec3 emissiveColor;\n"
				+"uniform float shininess;\n"
				+"uniform vec3 specularColor;\n"
				+"uniform float transparency;\n"
				+"uniform float lightOn;\n"
				
				+"varying vec3 fragNormal;\n"
				+"varying vec3 fragVertexPosition;\n"
				+"varying vec3 fragEyeVector;\n"
				+"varying vec3 fragVertexColor;\n"
				
				+"uniform vec3 lightAttenuations[MAXLIGHTS+1];\n"
				+"uniform vec3 lightPositions[MAXLIGHTS+1];\n"
				+"uniform vec3 lightDiffuseColors[MAXLIGHTS+1];\n"
				+"uniform vec3 lightAmbientColors[MAXLIGHTS+1];\n"
				+"uniform vec3 lightVisibility[MAXLIGHTS+1];\n"
				
				
				+"vec3 light(in int i)\n"
			 	+"{\n"
			 	+"		vec3 L = lightPositions[i] - fragVertexPosition;\n"
			 	+"      vec3 N = normalize(fragNormal);\n"
			 	+"		vec3 E = normalize(fragEyeVector);\n"
				+"		float dist = length(L);\n"
			 	+"      L = normalize(L);\n"
				+"		vec3 R = normalize(reflect(L,N));\n"
				
				+"		vec3 ambientColor = ambientIntensity * diffuseColor;\n"		 			
				+"		float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);\n"	 

				+"		vec3 Iamb = ambientColor * lightAmbientColors[i]* lightVisibility[i];\n"
				+"		vec3 Idiff = lightDiffuseColors[i]* lightVisibility[i] * max(dot(N,L),0.0) * fragVertexColor ;\n"//* texture2D(tex, texCoord).rgb
				+"		vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess);\n"
				+"		vec3 color = (emissiveColor+Iamb+atten*(Idiff + Ispec));\n"
				+"		return color;\n" 
				+"}\n"
				
				+"void main(void) {\n"
				+"	if (MAXLIGHTS < 1) {\n"
				+"      vec3 light = normalize(-fragVertexPosition);\n"
				+"      vec3 normal = normalize(fragNormal);\n"
				+"      vec3 eye = normalize(fragVertexPosition);\n"
				+"      float diffuse = max(0.0, dot(normal, light)) ;\n"//* lightOn
				+"      diffuse += max(0.0, dot(normal, eye));\n"
				+"      float specular = pow(max(0.0, dot(normal, normalize(light+eye))), shininess);\n" //*lightOn
				+"      specular += pow(max(0.0, dot(normal, eye)), shininess);\n"
				+"      vec3 rgb = emissiveColor + diffuse*fragVertexColor + specular*specularColor;\n"//*texture2D(tex, texCoord).rgb
				+"      rgb = clamp(rgb, 0.0, 1.0);\n"
				+"      gl_FragColor = vec4(rgb, max(0.0, 1.0 - transparency)); \n"
				+"	} else {\n"
				+"      vec3 color = vec3(0,0,0);\n"
				+"		for (int i=0; i<MAXLIGHTS; i++) {\n"
				+"			color = color + light(i);\n"
				+"		}\n"
				+"		gl_FragColor = vec4(color, max(0.0, 1.0 - transparency));\n"
				+"  }\n"
				+"}"
	};	

g_shaders["urn:xml3d:shader:picking"] = {
		vertex:
		
		"attribute vec3 position;\n"
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
		
		
		"#ifdef GL_ES\n"
		+"precision highp float;\n"
		+"#endif\n\n"
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















//-----------------------------------------------------------------------

/* Data collector */

/**
 * Class org.xml3d.webgl.XML3DDataAdapterFactory
 * 
 * extends: org.xml3d.data.AdapterFactory
 * 
 * @author Kristian Sons
 * @author Benjamin Friedrich
 * 
 * @version  10/2010  1.0
 */

/**
 * Constructor of org.xml3d.webgl.XML3DDataAdapterFactory 
 * 
 * @augments org.xml3d.data.AdapterFactory
 * @constructor
 * 
 * @param ctx
 */
org.xml3d.webgl.XML3DDataAdapterFactory = function(ctx) 
{
	org.xml3d.data.AdapterFactory.call(this);
	this.ctx = ctx;
};
org.xml3d.webgl.XML3DDataAdapterFactory.prototype             = new org.xml3d.data.AdapterFactory();
org.xml3d.webgl.XML3DDataAdapterFactory.prototype.constructor = org.xml3d.webgl.XML3DDataAdapterFactory;

/**
 * Returns adapter 
 * 
 * @param node
 * @returns
 */
org.xml3d.webgl.XML3DDataAdapterFactory.prototype.getAdapter  = function(node) 
{
	return org.xml3d.data.AdapterFactory.prototype.getAdapter.call(this, node, org.xml3d.webgl.XML3DDataAdapterFactory.prototype);
};

/**
 * Creates adapter
 * 
 * @param node
 * @returns
 */
org.xml3d.webgl.XML3DDataAdapterFactory.prototype.createAdapter = function(node) 
{
	if (node.localName == "mesh")
	{
		return new org.xml3d.webgl.MeshDataAdapter(this, node);// TODO
	}
	
	if (node.localName == "float" || 
		node.localName == "float2" || 
		node.localName == "float3" || 
		node.localName == "float4" || 
		node.localName == "int" ||
		node.localName == "bool" ||
		node.localName == "texture")
	{
		
		return new org.xml3d.webgl.ValueDataAdapter(this, node);// TODO
	}
		
	if (node.localName == "data")
		return null;// TODO
	
	org.xml3d.debug.logError("org.xml3d.webgl.XML3DDataAdapterFactory.prototype.createAdapter: " + 
			                 node.localName + " is not supported");
	return null;
};

//-----------------------------------------------------------------------

/**
 * Class org.xml3d.webgl.DataAdapter
 * 
 * extends: org.xml3d.data.Adapter
 * 
 * @author Kristian Sons
 * @author Benjamin Friedrich
 * 
 * @version  10/2010  1.0
 */

/**
 * Constructor of org.xml3d.webgl.DataAdapter
 * 
 * @augments org.xml3d.data.Adapter
 * @constructor
 * 
 * @param factory
 * @param node
 */
org.xml3d.webgl.DataAdapter = function(factory, node) 
{
	org.xml3d.data.Adapter.call(this, factory, node);
	this.observers = new Array();	
};
org.xml3d.webgl.DataAdapter.prototype             = new org.xml3d.data.Adapter();
org.xml3d.webgl.DataAdapter.prototype.constructor = org.xml3d.webgl.DataAdapter;


///**
// * Init is called by the factory after adding the adapter to the node
// */
//org.xml3d.webgl.DataAdapter.prototype.init = function() 
//{
//	
//};

/**
 * 
 * @param aType
 * @returns
 */
org.xml3d.webgl.DataAdapter.prototype.isAdapterFor = function(aType) 
{
	return aType == org.xml3d.webgl.XML3DDataAdapterFactory.prototype;
};


org.xml3d.webgl.DataAdapter.prototype.notifyObservers = function() 
{	
	for(var i = 0; i < this.observers.length; i++)
	{
		this.observers[i].notifyDataChanged();
	}
};

/**
 * Notification from the data structure.
 * 
 * @param e  notification of type org.xml3d.Notification
 */
org.xml3d.webgl.DataAdapter.prototype.notifyChanged = function(e) 
{	
	this.notifyObservers();
};


org.xml3d.webgl.DataAdapter.prototype.registerObserver = function(observer)
{
	for(var i = 0; i < this.observers.length; i++)
	{
		if(this.observers[i] == observer)
		{
			org.xml3d.debug.logWarning("Observer " + observer + " is already registered");
			return;
		}
	}	
	
	this.observers.push(observer);
};


org.xml3d.webgl.DataAdapter.prototype.unregisterObserver = function(observer)
{
	for(var i = 0; i < this.observers.length; i++)
	{
		if(this.observers[i] == observer)
		{
			this.observers = this.observers.splice(i, 1);
			return;
		}
	}	
	
	org.xml3d.debug.logWarning("Observer " + observer + 
			                   " can not be unregistered because it is not registered");
};


//TODO: pass last node and its corresponding data table to its observers
org.xml3d.webgl.DataAdapter.prototype.notifyDataChanged = function()
{
	this.notifyObservers();
	// Maybe caching mechanism
};


org.xml3d.webgl.DataAdapter.prototype.createDataTable = function()
{
	// abstract
};

org.xml3d.webgl.DataAdapter.prototype.toString = function()
{
	return "org.xml3d.webgl.DataAdapter";
};

//-----------------------------------------------------------------------

/**
 * Class org.xml3d.webgl.ValueDataAdapter
 * 
 * extends: org.xml3d.data.DataAdapter
 * 
 * @author Benjamin Friedrich
 * 
 * @version  10/2010  1.0
 */

/**
 * Constructor of org.xml3d.webgl.ValueDataAdapter
 * 
 * @augments org.xml3d.data.DataAdapter
 * @constructor
 * 
 * @param factory
 * @param node
 */
org.xml3d.webgl.ValueDataAdapter = function(factory, node) 
{
	org.xml3d.webgl.DataAdapter.call(this, factory, node);
};
org.xml3d.webgl.ValueDataAdapter.prototype             = new org.xml3d.webgl.DataAdapter();
org.xml3d.webgl.ValueDataAdapter.prototype.constructor = org.xml3d.webgl.ValueDataAdapter;

org.xml3d.webgl.ValueDataAdapter.prototype.createDataTable = function()
{
	var name  = this.node.name;
	var value = this.node.getTextContent();
	var data  = new Array(1);
	
	data[name] = value;
	
	return data;
};

org.xml3d.webgl.ValueDataAdapter.prototype.toString = function()
{
	return "org.xml3d.webgl.ValueDataAdapter";
};


//-----------------------------------------------------------------------

/**
 * Class org.xml3d.webgl.MeshDataAdapter
 * 
 * extends: org.xml3d.data.DataAdapter
 * 
 * @author Benjamin Friedrich
 * 
 * @version  10/2010  1.0
 */

/**
 * Constructor of org.xml3d.webgl.MeshDataAdapter
 * 
 * @augments org.xml3d.data.DataAdapter
 * @constructor
 * 
 * @param factory
 * @param node
 */
org.xml3d.webgl.MeshDataAdapter = function(factory, node) 
{
	org.xml3d.webgl.DataAdapter.call(this, factory, node);
	
	//TODO: why is init() declared as privileged method?
	this.init = function()
	{
		for ( var i = 0; i < this.node.childNodes.length; i++) 
		{
			var childNode = this.node.childNodes[i];
		
			if(childNode  && childNode.nodeType === Node.ELEMENT_NODE)
			{				
				dataCollector = this.factory.getAdapter(childNode);			
				
				if(dataCollector)
				{
					dataCollector.registerObserver(this);
				}
			}
		}		
	};

};
org.xml3d.webgl.MeshDataAdapter.prototype             = new org.xml3d.webgl.DataAdapter();
org.xml3d.webgl.MeshDataAdapter.prototype.constructor = org.xml3d.webgl.DataAdapter;



//org.xml3d.webgl.MeshDataAdapter.init = function()
//{
//	alert("---> MeshDataAdapter.prototype.init ");
//	for ( var i = 0; i < this.node.childNodes.length; i++) 
//	{
//		var childNode = this.node.childNodes[i];
//		
//		if(childNode)
//		{
//			dataCollector = this.factory.getAdapter(childNode);
//			dataCollector.registerObserver(this);
//		}
//	}
//};


org.xml3d.webgl.MeshDataAdapter.prototype.notifyDataChanged = function()
{
	// Maybe caching mechanism
};

org.xml3d.webgl.MeshDataAdapter.prototype.createDataTable = function()
{
	var dataTable = new Array();

	for ( var i = 0; i < this.node.childNodes.length; i++) 
	{
		var childNode = this.node.childNodes[i];

		if(childNode  && childNode.nodeType === Node.ELEMENT_NODE)
		{
			var dataCollector = this.factory.getAdapter(childNode);
			var tmpDataTable  = dataCollector.createDataTable();
		
			if(tmpDataTable)
			{
				for (key in tmpDataTable) 
				{ 
					dataTable[key] = tmpDataTable[key]; 
				}				
			}
		}
	}
	
	return dataTable;
};


org.xml3d.webgl.MeshDataAdapter.prototype.toString = function()
{
	return "org.xml3d.webgl.MeshDataAdapter";
};