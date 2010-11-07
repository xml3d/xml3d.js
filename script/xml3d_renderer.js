/*************************************************************************/
/*                                                                       */
/*  xml3d_renderer.js                                                    */
/*  WebGL renderer for XML3D						                     */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  DFKI - German Research Center for Artificial Intelligence            */
/* 	partly based on code originally provided by Philip Taylor, 			 */
/*  Peter Eschler, Johannes Behr and Yvonne Jung 						 */
/*  (philip.html5.org, www.x3dom.org)                                    */
/*                                                                       */
/*  This file is part of xml3d.js                                        */
/*                                                                       */
/*  xml3d.js is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU General Public License as                 */
/*  published by the Free Software Foundation; either version 2 of       */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  xml3d.js is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU General Public License                                   */
/*  (http://www.fsf.org/licensing/licenses/gpl.html) for more details.   */
/*                                                                       */
/*************************************************************************/

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

	for(var i in xml3ds) {
		// Creates a HTML <canvas> using the style of the <xml3d> Element
		var canvas = org.xml3d.webgl.createCanvas(xml3ds[i], i);
		// Creates the gl context for the <canvas>  Element
		var context = org.xml3d.webgl.createContext(canvas, xml3ds[i]);
		xml3ds[i].canvas = canvas;
		
		context.start();
		org.xml3d._rendererFound = true;
	}
};

org.xml3d.webgl.createCanvas = function(xml3dElement, index) {
	
	var parent = xml3dElement.parentNode;
	// Place xml3dElement inside an invisble div
	var hideDiv = parent.ownerDocument.createElement('div');
	hideDiv.style.display = "none";
	parent.insertBefore(hideDiv, xml3dElement);
	hideDiv.appendChild(xml3dElement);
	
	// Create canvas and append it where the xml3d element was before
	var canvas = parent.ownerDocument.createElement('canvas');
	parent.insertBefore(canvas, hideDiv);
	if (xml3dElement.hasAttribute("style"))
		canvas.setAttribute("style", xml3dElement.getAttribute("style"));
	if (xml3dElement.hasAttribute("class"))
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
	canvas.style.cursor = "default";

	if ((w = xml3dElement.getAttribute("width")) !== null) {
		canvas.style.width = w;
	} 
	if ((h = xml3dElement.getAttribute("height")) !== null) {
		canvas.style.height = h;
	} 

	canvas.id = "canvas"+index;
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	canvas.style.display = "block";
	return canvas;
};

org.xml3d.webgl.createContext = (function() {
	
	function Scene(xml3dElement) {
		this.xml3d = xml3dElement;
		
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
			if (typeof av == typeof "") {
				av = this.xml3d.xml3ddocument.resolve(av);
				if (av == null)
					org.xml3d.debug.logError("Could not find view");
			}
			return av;
		};
	}
	
	function Context(gl, canvas, scene) {
		this.gl = gl;
		this.canvas = canvas;
		this.scene = scene;
		this.needDraw = true;
	}
	
	Context.prototype.start = function() {
		//sglRegisterCanvas(this.canvas.id, this, 30.0); //Last parameter is frames-per-second value

		_sglManageCanvas(this.canvas.id, this, 30.0);
		_sglUnmanageCanvasOnLoad(this.canvas.id);
		SGL_DefaultStreamMappingPrefix = "";
		
		var ctx = this;
		ctx.renderScene();
	};
	
	Context.prototype.getCanvasId = function() {
		return this.canvas.id;
	};
	
	Context.prototype.getCanvasWidth = function() {
		return this.canvas.clientWidth;
	};
	
	Context.prototype.getCanvasHeight = function() {
		return this.canvas.clientHeight;
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

	Context.prototype.renderPick = function(gl, screenX, screenY) {
		//var gl = this.gl;
		if (!this.pickBuffer)
		{
			this.pickBuffer = new SglFramebuffer(gl, this.getCanvasWidth(), this.getCanvasHeight(), 
					[gl.RGBA], gl.DEPTH_COMPONENT16, null, 
					{ depthAsRenderbuffer : true }
			);
			if (!this.pickBuffer.isValid)
				return;
		}
		this.pickBuffer.bind();

		//gl.clearColor(0.0, 0.0, 0.0, 1.0);
		//gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		//gl.depthFunc(gl.LEQUAL);
		gl.disable(gl.CULL_FACE);
		gl.disable(gl.BLEND);
		
		this.renderer.renderPickingPass(screenX, screenY);
		
		gl.disable(gl.DEPTH_TEST);
		this.pickBuffer.unbind();

	};
	
	Context.prototype.renderScene = function() {
		var gl = this.gl;

		if (this.renderer === undefined || !this.renderer) {
			this.renderer = new org.xml3d.webgl.Renderer(this);
		}
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);		
		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);		
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE,
				gl.ONE);
		gl.enable(gl.BLEND);
		
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
	
	Context.prototype.update = function() {
		return this.needDraw;
	};

	Context.prototype.redraw = function() {
		this.needDraw = true;
	};

	Context.prototype.mouseUp = function(gl, button, x, y) {
		if (button == 0) {
			this.renderPick(gl, x, y);
			if (this.scene.currentPickObj)
			{
				var currentObj = this.scene.currentPickObj;
				var evtMethod = currentObj.getAttribute('onclick');
				if (evtMethod && currentObj.evalMethod) {
					currentObj.evalMethod(evtMethod);
				}
				
				while(currentObj.parentNode.nodeName == "group")
				{
					currentObj = currentObj.parentNode;
					evtMethod = currentObj.getAttribute('onclick');
					if (evtMethod && currentObj.evalMethod) {
						currentObj.evalMethod(evtMethod);
					}
				}
				return true;
			}
			
		}
		return false;
	};
	
	/*Context.prototype.mouseMove = function(gl, x, y) {
		var lastObj = this.scene.currentPickObj;
		
		this.renderPick(gl, x, y);
		if (this.scene.currentPickObj)
		{
			var currentObj = this.scene.currentPickObj;
			var evtMethod = currentObj.getAttribute('onmouseover');
			if (evtMethod && currentObj.evalMethod) {
				currentObj.evalMethod(evtMethod);
			}
			
			while(currentObj.parentNode.nodeName == "group")
			{
				currentObj = currentObj.parentNode;
				evtMethod = currentObj.getAttribute('onmouseover');
				if (evtMethod && currentObj.evalMethod) {
					currentObj.evalMethod(evtMethod);
				}
			}
			return true;
		} else if (lastObj) {
			var currentObj = lastObj;
			var evtMethod = currentObj.getAttribute('onmouseout');
			if (evtMethod && currentObj.evalMethod) {
				currentObj.evalMethod(evtMethod);
			}
			
			while(currentObj.parentNode.nodeName == "group")
			{
				currentObj = currentObj.parentNode;
				evtMethod = currentObj.getAttribute('onmouseout');
				if (evtMethod && currentObj.evalMethod) {
					currentObj.evalMethod(evtMethod);
				}
			}
			return true;
		}
		return false;
	};
	*/

	Context.prototype.draw = function(gl) {
		try {
			this.needDraw = false;
			this.renderScene();		
		} catch (e) {
			org.xml3d.debug.logException(e);
			throw e;
		}
		
	};
	return setupContext;
})();


org.xml3d.webgl.checkError = function(gl, text)
{
	var error = gl.getError();
	if (error !== gl.NO_ERROR) {
		var textErr = ""+error;
		switch (error) {
		case 1280: textErr = "1280 ( GL_INVALID_ENUM )"; break;
		case 1281: textErr = "1281 ( GL_INVALID_VALUE )"; break;
		case 1282: textErr = "1282 ( GL_INVALID_OPERATION )"; break;
		case 1283: textErr = "1283 ( GL_STACK_OVERFLOW )"; break;
		case 1284: textErr = "1284 ( GL_STACK_UNDERFLOW )"; break;
		case 1285: textErr = "1285 ( GL_OUT_OF_MEMORY )"; break;
		}
		var msg = "GL error " + textErr + " occured.";
		if (text !== undefined)
			msg += " " + text;
		org.xml3d.debug.logError(msg);
	}
};

org.xml3d.webgl.Renderer = function(ctx) {
	this.ctx = ctx;
	this.currentView = null;
	this.scene = ctx.scene;
	this.factory = new org.xml3d.webgl.XML3DRenderAdapterFactory(ctx, this);
	this.dataFactory = new org.xml3d.webgl.XML3DDataAdapterFactory(ctx);
	this.lights = null;
	this.camera = this.initCamera();
	this.shaderMap = {};
	this.width = this.ctx.getCanvasWidth();
	this.height = this.ctx.getCanvasHeight();

	//this.ctx.pickBuffer = new SglRenderbuffer(gl, gl.DEPTH_COMPONENT16, ctx.getCanvasWidth(), ctx.getCanvasHeight());
	
	
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
		this.currentView = av;
		return this.factory.getAdapter(av, org.xml3d.webgl.Renderer.prototype);
	}
	this.currentView = av;
	return this.factory.getAdapter(av, org.xml3d.webgl.Renderer.prototype);
};

org.xml3d.webgl.Renderer.prototype.collectDrawableObjects = function(transform,
		objects, lights, shader) {
	var adapter = this.factory.getAdapter(this.scene.xml3d, org.xml3d.webgl.Renderer.prototype);
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


org.xml3d.webgl.Renderer.prototype.render = function() {
	var gl = this.ctx.gl;
	var sp = null;


	if (!this.camera)
		return;
	if (this.currentView != this.scene.getActiveView())
		this.camera = this.initCamera();
	
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
	.getProjectionMatrix(this.width / this.height);
	var viewMatrix = this.camera.getViewMatrix();
	xform.projection.load(projMatrix);
	
	
	var light, lightOn;

	var zPos = [];
	for (i = 0, n = this.drawableObjects.length; i < n; i++) {
		var trafo = this.drawableObjects[i][0];
		var meshAdapter = this.drawableObjects[i][1];
		var center = new SglVec3(meshAdapter.bbox.center);
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
		var parameters = {};
		
		if (shader) {
			sp = shader.shaderProgram;
		} 
		
		if (!sp)
		{
			org.xml3d.webgl.checkError(gl, "Before default shader");
			if (shader) {
				shader.sp = this.getStandardShaderProgram(gl, "urn:xml3d:shader:flat");
				sp = shader.sp;
			}
			else
				sp = this.getStandardShaderProgram(gl, "urn:xml3d:shader:flat");
			if (sp) {
				if (RGBColor && document.defaultView
					&& document.defaultView.getComputedStyle) {
					var colorStr = document.defaultView.getComputedStyle(
						shape.node, "").getPropertyValue("color");
					var color = new RGBColor(colorStr);
					org.xml3d.webgl.checkError(gl, "Before default diffuse");
					parameters["diffuseColor"] = [0.0,0.0,0.80];
					org.xml3d.webgl.checkError(gl, "After default diffuse");
					}
			}
		}
		
		var slights = this.lights;
		var elements = slights.length * 3;
		var lightParams = {
			positions : new Float32Array(elements),
			diffuseColors : new Float32Array(elements),
			ambientColors : new Float32Array(elements),
			attenuations : new Float32Array(elements),
			visible : new Float32Array(elements)
		};
		for ( var j = 0; j < slights.length; j++) {
			var light = slights[j][1];
			var params = light.getParameters(sglMulM4(viewMatrix, slights[j][0]));
			if (!params)
				continue; // TODO: Shrink array
			lightParams.positions.set(params.position, j*3);
			lightParams.attenuations.set(params.attenuation, j*3);
			lightParams.diffuseColors.set(params.intensity, j*3);
			lightParams.visible.set(params.visibility, j*3);
		}

		lightParams.ambientColors = [ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ];

		//Begin setting up uniforms for rendering
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
			org.xml3d.webgl.checkError(gl, "Error after cleanup.");
		} else {
			shader = {};
			shader.sp = sp;
			shape.render(shader, parameters);
		}
		xform.model.pop();
		
	}
	xform.view.pop();
	xform.projection.pop();
	
	this.drawableObjects = null;
};

org.xml3d.webgl.Renderer.prototype.renderPickingPass = function(x, y) {
	try {
		if (x<0 || y<0 || x>=this.width || y>=this.height)
			return;
		gl = this.ctx.gl;
		
		
		if (this.drawableObjects === undefined || !this.drawableObjects) {
			this.drawableObjects = [];
			this.slights = new Array();
			this.collectDrawableObjects(new sglM4(),
					this.drawableObjects, this.slights, null);
		}
		
		var xform = new SglTransformStack();
		xform.view.load(this.camera.getViewMatrix());
		var projMatrix = this.camera
		.getProjectionMatrix(this.width / this.height);
		xform.projection.load(projMatrix);
		
		
		var zPos = [];
		for (i = 0, n = this.drawableObjects.length; i < n; i++) {
			var trafo = this.drawableObjects[i][0];
			var meshAdapter = this.drawableObjects[i][1];
			var center = new SglVec3(meshAdapter.bbox.center);
			center.v = sglMulM4V3(trafo, center, 1.0);
			center.v = sglMulM4V3(xform.view._s[0], center, 1.0);
			
			zPos[i] = [ i, center.z ];
		}
		zPos.sort(function(a, b) {
			return a[1] - b[1];
		});
		
		for (j = 0, n = zPos.length; j < n; j++) {
			var obj = this.drawableObjects[zPos[j][0]];
			var transform = obj[0];
			var shape = obj[1];
			var shader = obj[2];
			
			var sp = this.getStandardShaderProgram(gl, "urn:xml3d:shader:picking");
						
			xform.model.load(transform);
			
			var id = 1.0 - (1+j) / 255.0;
			var wcMin = new XML3DVec3(Number.MAX_VALUE, Number.MAX_VALUE,
					Number.MAX_VALUE).toGL();
			var wcMax = new XML3DVec3(Number.MIN_VALUE, Number.MIN_VALUE,
					Number.MIN_VALUE).toGL();
			
			var parameters = {
				id : id,
				wcMin : wcMin,
				wcMax : wcMax,
				modelViewMatrix : xform.modelViewMatrix,
				modelViewProjectionMatrix : xform.modelViewProjectionMatrix
			};
			
			shader = {};
			shader.sp = sp;
			shape.render(shader, parameters);
			xform.model.pop();
			
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
		if (objId >= 0 && data[3] > 0) {
			this.scene.currentPickPos = pickPos;
			var pickedObj = this.drawableObjects[(zPos[objId][0])];
			this.scene.currentPickObj = pickedObj[1].node;
		} else {
			this.scene.currentPickPos = null;
			this.scene.currentPickObj = null;
		}	
	} catch (e) {
		org.xml3d.debug.logError(e);		
	}
	xform.view.pop();
	xform.projection.pop();
	
};

org.xml3d.webgl.Renderer.prototype.dispose = function() {
	var drawableObjects = new Array();
	this.collectDrawableObjects(this, new sglM4(),
			drawableObjects, new Array(), null);
	for ( var i = 0, n = drawableObjects.length; i < n; i++) {
		var shape = drawableObjects[i][1];
		var shader = drawableObjects[i][2];
		shape.dispose();
		if (shader)
			shader.dispose();
	}
};

org.xml3d.webgl.Renderer.prototype.notifyDataChanged = function() {
	this.ctx.renderScene();
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
			var adapter = this.factory.getAdapter(this.node.childNodes[i], org.xml3d.webgl.Renderer.prototype);
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


org.xml3d.webgl.RenderAdapter.prototype.applyTransformMatrix = function(
		transform) {
	return transform;
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
	if (this.viewMatrix == null) 
	{
		var negPos      = this.node.position.negate();
		this.viewMatrix = this.node.orientation.negate().toMatrix().multiply(
				new XML3DMatrix().translate(negPos.x, negPos.y, negPos.z));
	}
	return new sglM4(this.viewMatrix.toGL());
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
	this.factory.ctx.update();
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
			var gl = this.factory.ctx.gl;
			if (!this.sp)
			{
				if (!this.dataAdapter)
				{
					var renderer = this.factory.renderer;
					this.dataAdapter = renderer.dataFactory.getAdapter(this.node);
					if(this.dataAdapter)
						this.dataAdapter.registerObserver(renderer);
					else
						org.xml3d.logError("Data adapter for a mesh element could not be created!");
				}
				var sParams = this.dataAdapter.createDataTable();
				this.setParameters({}); //Indirectly checks for textures
				if (this.node.hasAttribute("script"))
				{
					var scriptURL = this.node.getAttribute("script");
					if (new org.xml3d.URI(scriptURL).scheme == "urn")
					{
						if (this.textures[0] && scriptURL == "urn:xml3d:shader:phong")
							scriptURL = "urn:xml3d:shader:texturedphong";
					
						if (sParams.useVertexColor && sParams.useVertexColor.data[0] == true)
							scriptURL = scriptURL + "vcolor";
						
						this.sp = this.factory.renderer.getStandardShaderProgram(gl, scriptURL);
						return this.sp;		
					}
					var vsScript = this.node.xml3ddocument.resolve(scriptURL
							+ "-vs");
					var fsScript = this.node.xml3ddocument.resolve(scriptURL
							+ "-fs");
					if (vsScript && fsScript) {
						var vShader = {
							script : vsScript.textContent,
							type : gl.VERTEX_SHADER
						};
						var fShader = {
							script : fsScript.textContent,
							type : gl.FRAGMENT_SHADER
						};
						this.sp = this.createShaderProgram( [ vShader, fShader ]);

					}
				}
			}
			return this.sp;
		}));

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.initTexture = function(textureSrc, semantic) {
	
	var gl = this.factory.ctx.gl;
	org.xml3d.webgl.checkError(gl, "Error before creating texture:");
	var imageData = null;
	var texture = null;
	
	//See if this texture already exists
	for (var t in this.textures) {
		var tex = this.textures[t];
		if (tex.semantic == semantic && tex.src == textureSrc)
			return;
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

	//null would be replaced with options, --CANNOT PASS EMPTY OPTIONS OBJECT--
	texture = new SglTexture2D(gl, textureSrc, null);
	org.xml3d.webgl.checkError(gl, "Error after creating texture:" + textureSrc);
	
	if (!texture) {
		org.xml3d.debug.logError("Could not create texture for " + textureSrc);
		return;
	}
	//Create a container for the texture
	var texContainer = ({
		semantic 	: semantic,
		src 		: textureSrc,
		tex 		: texture
	});
	
	this.textures.push(texContainer);
	
	//org.xml3d.debug.logInfo("Created GL texture: " + texContainer.semantic);
	//return;
};


org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.createShaderProgram = function(
		shaderArray) {
	var gl = this.factory.ctx.gl;
	var prog = prog = new SglProgram(gl,[shaderArray[0].script], [shaderArray[1].script]);

	var msg = prog.log;
	var checkFail = msg.match(/(FAIL)/i);
	if (checkFail) {
		org.xml3d.debug.logError("Shader creation failed: ("+ msg +")");
		org.xml3d.debug.logInfo("A custom shader failed during compilation, using default flat shader instead.");
		gl.getError(); //We know an error was generated when the shader failed, pop it
		return null;
	}

	return prog;
};

/*
 * setParameters has been changed to only add this shader's uniforms to the parameters
 * object. Setting them before the SGLRender call in the mesh.render method creates
 * GL errors in scenes that use both textured and non-textured shaders.
 */
org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.setParameters = function(parameters) {
	if (!this.dataAdapter)
	{
		var renderer = this.factory.renderer;
		this.dataAdapter = renderer.dataFactory.getAdapter(this.node);
		if(this.dataAdapter)
			this.dataAdapter.registerObserver(renderer);
		else
			org.xml3d.logError("Data adapter for a shader element could not be created!");
	}
	var gl = this.factory.gl;
	//set up default values for built in phong shader, 
	//chrome won't render correctly if a required value is missing
	parameters.diffuseColor = [1,1,1];
	parameters.emissiveColor = [0,0,0];
	parameters.shininess = [0.2];
	parameters.specularColor = [0,0,0];
	parameters.transparency = [0];

	var sParams = this.dataAdapter.createDataTable();
	for (var p in sParams)
	{
		var data = sParams[p].data;
		if (typeof data == typeof "") {
			var check = data.match(/(jpg|png|gif|jpeg|bmp)/g);
			if (check) {
				//Probably a texture, try to create one
				this.initTexture(sParams[p].data, p);
				continue;
			} else {
				org.xml3d.debug.logError("Shader did not expect a String as data for "+p);
				continue;
			}
		}
		if (data.length == 1)
			data = data[0];
		parameters[p] = data;
	}

};

org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.notifyChanged = function(e) {
	if (e.attribute == "script") {
		this.sp.destroy();
		this.sp = null;
	}
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
	var adapter = this.factory.getAdapter(this.node.getTransform(), org.xml3d.webgl.Renderer.prototype);
	if (adapter === null)
		return transform;

	return sglMulM4(transform, adapter.getMatrix());
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.evalOnclick = function(evtMethod) {
	
	if (evtMethod)
		eval(evtMethod);
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.notifyChanged = function(e) {
	if (e.attribute == "shader") {	
		this.shader = this.getShader();
	}
};

org.xml3d.webgl.XML3DGroupRenderAdapter.prototype.getShader = function() 
{
	var shader = this.node.getShader();

	// if no shader attribute is specified, try to get a shader from the style attribute
	if(shader == null)
	{
		var styleValue = this.node.getAttribute('style');
		if(!styleValue)
			return null;
		var pattern    = /shader\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
		pattern.exec(styleValue);
		shader = this.node.xml3ddocument.resolve(RegExp.$1);
	}

	return this.factory.getAdapter(shader, org.xml3d.webgl.Renderer.prototype);
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
		var n         = this.node;
		var m         = new XML3DMatrix();
		var negCenter = n.center.negate();
		
		this.matrix = m.translate(n.translation.x, n.translation.y, n.translation.z)
		  .multiply(m.translate(n.center.x,n.center.y, n.center.z)).multiply(n.rotation.toMatrix())
		  .multiply(n.scaleOrientation.toMatrix()).multiply(m.scale(n.scale.x, n.scale.y, n.scale.z))
		  .multiply(n.scaleOrientation.toMatrix().inverse()).multiply(
				  m.translate(negCenter.x, negCenter.y, negCenter.z));
	}
	return new sglM4(this.matrix.toGL());
};

org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.notifyChanged = function(e) {
	this.matrix = null;
	this.factory.ctx.redraw();
};

// Adapter for <mesh>
org.xml3d.webgl.XML3DMeshRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	
	var src = node.getSrc();
	this.loadedMesh = false;
	this._bbox = null;
	
	//Support for mesh loading from .obj files 
	//DISABLED FOR NOW
	/*if (src && typeof src == typeof "" && src.charAt(0)!='#')
	{
		var meshJS = new SglMeshJS();
		if (!meshJS.importOBJ(src))
			org.xml3d.debug.logInfo("Could not create mesh from "+ src);
		else {
			this.mesh = meshJS.toPackedMeshGL(factory.gl, "triangles", 64000);
			this.loadedMesh = true;
		}
	} else {	*/
		this.mesh = new SglMeshGL(factory.ctx.gl);
	//}
	this.__defineGetter__("bbox", function() {
		if (!this._bbox) {
			var dt = this.factory.renderer.dataFactory.getAdapter(this.node).createDataTable();
			this._bbox  = org.xml3d.webgl.calculateBoundingBox(dt.position.data);
		}
		return this._bbox;
	}); 
		
};
org.xml3d.webgl.XML3DMeshRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DMeshRenderAdapter;

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.collectDrawableObjects = function(
		transform, outMeshes, outLights, shader) {
	outMeshes.push( [ transform, this, shader ]);
};



org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.dispose = function() {
	this.mesh.destroy();
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.evalOnclick = function(evtMethod) {
	if (evtMethod) {
		eval(evtMethod);
	}
	
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.render = function(shader, parameters) {

	if (!this.dataAdapter && !this.loadedMesh)
	{
		var renderer = this.factory.renderer;
		this.dataAdapter = renderer.dataFactory.getAdapter(this.node);
		if(this.dataAdapter)
			this.dataAdapter.registerObserver(renderer);
		else
			org.xml3d.logError("Data adapter for a mesh element could not be created!");
	}
	var gl = this.factory.ctx.gl;
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
		this.factory.ctx.redraw();
		//Texture is not ready for rendering yet, skip this object
		return;
	}
	
	
	org.xml3d.webgl.checkError(gl, "Error before starting render.");
	
	if (!this.loadedMesh) {
		var meshParams = this.dataAdapter.createDataTable();
		var mIndicies = new Uint16Array(meshParams.index.data);
		this.mesh.addIndexedPrimitives("triangles", gl.TRIANGLES, mIndicies);
		for (var p in meshParams) {
			if (p == "index")
				continue;
			var parameter = meshParams[p];
			this.mesh.addVertexAttribute(p, parameter.tupleSize, parameter.data);
		}
	}
	
	if (this.loadedMesh || meshParams) {
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
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getParameters = function(modelViewMatrix) {
	var shader = this.getLightShader();
	
	if(!shader)
		return null;
	
	if (!this.dataAdapter)
	{
		var renderer = shader.factory.renderer;
		this.dataAdapter = renderer.dataFactory.getAdapter(shader.node);
		if(this.dataAdapter)
			this.dataAdapter.registerObserver(renderer);
	}
	var params = this.dataAdapter.createDataTable();
	
	var visible = this.node.getAttribute("visible");
	if (visible === null || visible == "true")
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
			var t = sglMulM4V4(modelViewMatrix, [params[p].data[0], params[p].data[1], params[p].data[2], 1.0]);
			aParams[p] = [t[0]/t[3], t[1]/t[3], t[2]/t[3]];
			continue;
		}
		aParams[p] = params[p].data;	
	}
	
	return aParams;
};

org.xml3d.webgl.XML3DLightRenderAdapter.prototype.getLightShader = function() {
	if (!this.lightShader) {
		var shader = this.node.getShader();
		// if no shader attribute is specified, try to get a shader from the style attribute
		if(shader == null)
		{
			var styleValue = this.node.getAttribute('style');
			if(!styleValue)
				return null;
			var pattern    = /shader\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
			pattern.exec(styleValue);
			shader = this.node.xml3ddocument.resolve(RegExp.$1);
		}
		this.lightShader = this.factory.getAdapter(shader, org.xml3d.webgl.Renderer.prototype);
	}
	return this.lightShader;
};



// Adapter for <lightshader>
org.xml3d.webgl.XML3DLightShaderRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DLightShaderRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DLightShaderRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DLightShaderRenderAdapter;

// Utility functions
org.xml3d.webgl.calculateBoundingBox = function(tArray) {
	var bbox = new SglBox3();
	if (!tArray || tArray.length < 3)
		return bbox;
	
	// Initialize with first position
	for (var j=0; j<3; ++j) {
		bbox.min[j] = tArray[j];
		bbox.max[j] = tArray[j];
	}

	var val = 0.0;
	for (var i=3; i<tArray.length; i+=3) {
		for (var j=0; j<3; ++j) {
			val = tArray[i+j];
			if (bbox.min[j] > val) bbox.min[j] = val;
			if (bbox.max[j] < val) bbox.max[j] = val;
		}
	}
	return bbox;
};

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
			
			+"varying vec3 fragNormal;\n"
			+"varying vec3 fragVertexPosition;\n"
			+"varying vec3 fragEyeVector;\n"
			
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
			+"		vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * diffuseColor ;\n"
			+"		vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess*128.0);\n"
			+"		vec3 color = (emissiveColor+Iamb+atten*(Idiff + Ispec));\n"
			+"		return color * lightVisibility[i];\n" 
			+"}\n"
			
			+"void main(void) {\n"
			+"	if (MAXLIGHTS < 1) {\n"
			+"      vec3 light = normalize(-fragVertexPosition);\n"
			+"      vec3 normal = normalize(fragNormal);\n"
			+"      vec3 eye = normalize(fragVertexPosition);\n"
			+"      float diffuse = max(0.0, dot(normal, light)) ;\n"
			+"      diffuse += max(0.0, dot(normal, eye));\n"
			+"      float specular = pow(max(0.0, dot(normal, normalize(light+eye))), shininess*128.0);\n" 
			+"      specular += pow(max(0.0, dot(normal, eye)), shininess*128.0);\n"
			+"      vec3 rgb = emissiveColor + diffuse*diffuseColor + specular*specularColor;\n"
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
			
			
			+"vec4 light(in int i)\n"
		 	+"{\n"
		 	+"		vec3 L = lightPositions[i] - fragVertexPosition;\n"
		 	+"      vec3 N = normalize(fragNormal);\n"
		 	+"		vec3 E = normalize(fragEyeVector);\n"
			+"		float dist = length(L);\n"
		 	+"      L = normalize(L);\n"
			+"		vec3 R = normalize(reflect(L,N));\n"
			
			+"		vec3 ambientColor = ambientIntensity * diffuseColor;\n"		 			
			+"		float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);\n"	 
			+"      vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);\n"
			
			+"		vec3 Iamb = ambientColor * lightAmbientColors[i] * lightVisibility[i];\n"
			+"		vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * texDiffuse.xyz;\n"
			+"		vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess*128.0);\n"
			+"		vec3 color = (emissiveColor+Iamb+atten*(Idiff + Ispec));\n"
			+"		return vec4(color * lightVisibility[i], texDiffuse.w);\n" 
			+"}\n"
			
			+"void main(void) {\n"
			+"	if (MAXLIGHTS < 1) {\n"
			+"      vec3 light = normalize(-fragVertexPosition);\n"
			+"      vec3 normal = normalize(fragNormal);\n"
			+"      vec3 eye = normalize(fragVertexPosition);\n"
			+"      float diffuse = max(0.0, dot(normal, light)) ;\n"
			+"      diffuse += max(0.0, dot(normal, eye));\n"
			+"      float specular = pow(max(0.0, dot(normal, normalize(light-eye))), shininess*128.0);\n"
			+"      specular += pow(max(0.0, dot(normal, eye)), shininess*128.0);\n"
			+"      vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);\n"
			+"      vec3 rgb = emissiveColor + diffuse*texDiffuse.xyz+ specular*specularColor;\n"
			+"      gl_FragColor = vec4(rgb, texDiffuse.w*max(0.0, 1.0 - transparency)); \n"
			+"	} else {\n"
			+"      vec4 color = vec4(0,0,0,0);\n"
			+"		for (int i=0; i<MAXLIGHTS; i++) {\n"
			+"			color = color + light(i);\n"
			+"		}\n"
			+"		gl_FragColor = vec4(color.xyz, color.w*max(0.0, 1.0 - transparency));\n"
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
				+"		vec3 Idiff = lightDiffuseColors[i]* lightVisibility[i] * max(dot(N,L),0.0) * fragVertexColor ;\n"
				+"		vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess*128.0);\n"
				+"		vec3 color = (emissiveColor+Iamb+atten*(Idiff + Ispec));\n"
				+"		return color;\n" 
				+"}\n"
				
				+"void main(void) {\n"
				+"	if (MAXLIGHTS < 1) {\n"
				+"      vec3 light = normalize(-fragVertexPosition);\n"
				+"      vec3 normal = normalize(fragNormal);\n"
				+"      vec3 eye = normalize(fragVertexPosition);\n"
				+"      float diffuse = max(0.0, dot(normal, light)) ;\n"
				+"      diffuse += max(0.0, dot(normal, eye));\n"
				+"      float specular = pow(max(0.0, dot(normal, normalize(light+eye))), shininess*128.0);\n" 
				+"      specular += pow(max(0.0, dot(normal, eye)), shininess*128.0);\n"
				+"      vec3 rgb = emissiveColor + diffuse*fragVertexColor + specular*specularColor;\n"
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













/********************************** Start of the DataCollector Implementation *************************************************/

/*-----------------------------------------------------------------------
 * XML3D Data Composition Rules:
 * -----------------------------
 *
 * The elements <mesh>, <data>, <shader>, <lightshader> and any other elements that uses generic 
 * data fields implements the behavior of a "DataCollector".
 *
 * The result of a DataCollector is a "datatable" - a map with "name" as key and a TypedArray
 * (https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/TypedArray-spec.html)
 * as value.
 *
 * The <data> element is the only DataCollector that forwards the data to parent nodes or referring nodes.
 *
 * For each DataCollector, data is collected with following algorithm:
 * 
 * 1. If the "src" attribute is used, reuse the datatable of the referred <data> element and ignore the element's content
 * 2. If no "src" attribute is defined:
 *    2.1 Go through each <data> element contained by the DataCollector from top to down and apply it's datatable to the result.
 *        2.1.1 If the datatables of consecutive <data> elements define a value for the same name, the later overwrites the former.
 *    2.2 Go through each value element (int, float1, float2 etc.) and assign it's name-value pair to the datatable, overwriting 
 *        existing entries.
 * 
 *   
 * Description of the actual Implementation:  
 * -----------------------------------------        
 * The DataCollector is implementation according to the Adapter concept. For each element that uses
 * generic data (<mesh>, <data>, <float>,...) a DataAdapter is instantiated. Such a DataAdapter should
 * be constructed via the "XML3DDataAdapterFactory" factory. The XML3DDataAdapterFactory manages all 
 * DataAdapter instances so that for each node there is always just one DataAdapter. It is also responsible
 * for creating the corresponding DataAdapter for an element node. In addition, when a DataAdapter is constructed 
 * via the factory, its init method is called which ensures that all child elements have a corresponding DataAdapter.
 * In doing so, the parent DataAdapter registers itself as observer in its child DataAdapters. When a DataCollector 
 * element changes, all its observers are notified (those are generally its parent DataAdapter or other components 
 * such as a renderer relying on the data of the observed element). 
 */

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class org.xml3d.webgl.XML3DDataAdapterFactory
 * extends: org.xml3d.data.AdapterFactory
 * 
 * XML3DDataAdapterFactory creates DataAdapter instances for elements using generic data (<mesh>, <data>, <float>,...).
 * Additionally, it manages all DataAdapter instances so that for each node there is always just one DataAdapter. When
 * it creates a DataAdapter, it calls its init method. Currently, the following elements are supported:
 * 
 * <ul>
 * 		<li>mesh</li>
 * 		<li>shader</li>
 * 		<li>lightshader</li>
 * 		<li>float</li>
 * 		<li>float2</li>
 * 		<li>float3</li>
 * 		<li>float4</li>
 * 		<li>int</li>
 * 		<li>bool</li>
 * 		<li>texture</li>
 * 		<li>data</li>
 * </ul>
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
 * Returns a DataAdapter instance associated with the given node. If there is already a DataAdapter created for this node,
 * this instance is returned, otherwise a new one is created. 
 * 
 * @param   node  element node which uses generic data. The supported elements are listed in the class description above. 
 * @returns DataAdapter instance
 */
org.xml3d.webgl.XML3DDataAdapterFactory.prototype.getAdapter = function(node) 
{
	return org.xml3d.data.AdapterFactory.prototype.getAdapter.call(this, node, org.xml3d.webgl.XML3DDataAdapterFactory.prototype);
};

/**
 * Creates a DataAdapter associated with the given node.
 * 
 * @param   node  element node which uses generic data. The supported elements are listed in the class description above. 
 * @returns DataAdapter instance
 */
org.xml3d.webgl.XML3DDataAdapterFactory.prototype.createAdapter = function(node) 
{
	if (node.localName == "mesh"   ||
		node.localName == "shader" ||
		node.localName == "lightshader" )
	{
		return new org.xml3d.webgl.RootDataAdapter(this, node);
	}
	
	if (node.localName == "float"    || 
		node.localName == "float2"   || 
		node.localName == "float3"   || 
		node.localName == "float4"   || 
		node.localName == "float4x4" ||
		node.localName == "int"      ||
		node.localName == "bool"     ||
		node.localName == "texture")
	{
		return new org.xml3d.webgl.ValueDataAdapter(this, node);
	}
		
	if (node.localName == "data")
	{
		return new org.xml3d.webgl.DataAdapter(this, node);
	}
		
	//org.xml3d.debug.logError("org.xml3d.webgl.XML3DDataAdapterFactory.prototype.createAdapter: " + 
	//		                 node.localName + " is not supported");
	return null;
};

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class org.xml3d.webgl.DataAdapter 
 * extends: org.xml3d.data.Adapter
 * 
 * The DataAdapter implements the DataCollector concept and serves as basis of all DataAdapter classes.
 * In general, a DataAdapter is associated with an element node which uses generic data and should be
 * instantiated via org.xml3d.webgl.XML3DDataAdapterFactory to ensure proper functionality.
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
	
	/* Creates DataAdapter instances for the node's children and registers 
	 * itself as observer in those children instances. This approach is needed
	 * for being notified about changes in the child elements. If the data of
	 * a children is changed, the whole parent element must be considered as
	 * changed.  
	 */
	this.init = function()
	{
		for ( var i = 0; i < this.node.childNodes.length; i++) 
		{
			var childNode = this.node.childNodes[i];
		
			if(childNode  && childNode.nodeType === Node.ELEMENT_NODE)
			{				
				dataCollector = this.factory.getAdapter(childNode, org.xml3d.webgl.XML3DDataAdapterFactory.prototype);			
				
				if(dataCollector)
				{
					dataCollector.registerObserver(this);
				}
			}
		}
		
		this.createDataTable(true);
	};	
	
};
org.xml3d.webgl.DataAdapter.prototype             = new org.xml3d.data.Adapter();
org.xml3d.webgl.DataAdapter.prototype.constructor = org.xml3d.webgl.DataAdapter;

/**
 * 
 * @param aType
 * @returns
 */
org.xml3d.webgl.DataAdapter.prototype.isAdapterFor = function(aType) 
{
	return aType == org.xml3d.webgl.XML3DDataAdapterFactory.prototype;
};

/**
 * Notifies all observers about data changes by calling their notifyDataChanged() method.
 */
org.xml3d.webgl.DataAdapter.prototype.notifyObservers = function() 
{	
	for(var i = 0; i < this.observers.length; i++)
	{
		this.observers[i].notifyDataChanged();
	}
};

/**
 * The notifyChanged() method is called by the XML3D data structure to notify the DataAdapter about 
 * data changes (DOM mustation events) in its associating node. When this method is called, all observers 
 * of the DataAdapter are notified about data changes via their notifyDataChanged() method.
 * 
 * @param e  notification of type org.xml3d.Notification
 */
org.xml3d.webgl.DataAdapter.prototype.notifyChanged = function(e) 
{	
	// this is the DataAdapter where an actual change occurs, therefore
	// the dataTable must be recreated
	this.notifyDataChanged();
};

/**
 * Is called when the observed DataAdapter has changed. This basic implementation
 * recreates its data table and notifies all its observers about changes. The recreation
 * of the data table is necessary as the notification usually comes from a child DataAdapter.
 * This means when a child element changes, its parent changes simultaneously.
 */
org.xml3d.webgl.DataAdapter.prototype.notifyDataChanged = function()
{
	// Notification can only come from a child DataAdapter. That's why dataTable 
	// can be merged with this instance's datatable
	this.createDataTable(true);
	this.notifyObservers();
};

/**
 * Registers an observer which is notified when the element node associated with the 
 * data adapter changes. If the given object is already registered as observer, it
 * is ignored.
 * 
 * <b>Note that there must be a notifyDataChanged() method without parameters.</b>
 * 
 * @param observer  
 * 			object which shall be notified when the node associated with the
 * 			DataAdapter changes		  
 */
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

/**
 * Unregisters the given observer. If the given object is not registered as observer, it is irgnored.
 * 
 * @param observer
 * 			which shall be unregistered
 */
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

/**
 * Returns datatable retrieved from the DataAdapter's children.
 * In doing so, only the cached datatables are fetched since 
 * the value of the changed child should already be adapted
 * and the values of the remaining children do not vary.
 * 
 * @returns datatable retrieved from the DataAdapter's children 
 */
org.xml3d.webgl.DataAdapter.prototype.getDataFromChildren = function()
{
	var dataTable = new Array();
	
	for ( var i = 0; i < this.node.childNodes.length; i++) 
	{
		var childNode = this.node.childNodes[i];

		if(childNode  && childNode.nodeType === Node.ELEMENT_NODE)
		{
			var dataCollector = this.factory.getAdapter(childNode, org.xml3d.webgl.XML3DDataAdapterFactory.prototype);
			
			if(! dataCollector) // This can happen, i.e. a child node in a seperate namespace
				continue;
			
			/* A RootAdapter must not be a chilrden of another DataAdapter.
			 * Therefore, its data is ignored, if it is specified as child.	 
			 * Example: <mesh>, <shader> and <lightshader> */
			if(dataCollector.isRootAdapter())
			{
				org.xml3d.debug.logWarning(childNode.localName + 
						                   " can not be a children of another DataCollector element ==> ignored");
				continue;
			}

			var tmpDataTable = dataCollector.createDataTable();
			
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

/**
 * Creates datatable. If the parameter 'forceNewInstance' is specified with 'true', 
 * createDataTable() creates a new datatable, caches and returns it. If no
 * parameter is specified or 'forceNewInstance' is specified with 'false', the
 * cashed datatable is returned.<br/>
 * Each datatable has the following format:<br/>
 * <br/>
 * datatable['name']['tupleSize'] : tuple size of the data element with name 'name' <br/>
 * datatable['name']['data']      : typed array (https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/TypedArray-spec.html)
 * 								  associated with the data element with name 'name'
 * 
 * @param   forceNewInstance 
 * 				indicates whether a new instance shall be created or the cached
 * 				datatable shall be returned			
 * @returns datatable
 */
org.xml3d.webgl.DataAdapter.prototype.createDataTable = function(forceNewInstance)
{
	if(forceNewInstance == undefined ? true : ! forceNewInstance)
	{
	   return this.dataTable;
	}
	
	var srcElement = this.node.getSrc();
	var dataTable;
	
	if(srcElement == null)
	{
		dataTable = this.getDataFromChildren();
	}
	else
	{
		// If the "src" attribute is used, reuse the datatable of the referred <data> element (or file) 
		// and ignore the element's content
		srcElement = this.factory.getAdapter(srcElement);
		dataTable  = srcElement.createDataTable();
	}
	
	this.dataTable = dataTable;
	
	return dataTable;
};

/**
 * Indicates whether this DataAdapter is a RootAdapter (has no parent DataAdapter).
 * 
 * @returns true if this DataAdapter is a RootAdapter, otherwise false.
 */
org.xml3d.webgl.DataAdapter.prototype.isRootAdapter = function()
{
	return false;
};

/**
 * Returns String representation of this DataAdapter
 */
org.xml3d.webgl.DataAdapter.prototype.toString = function()
{
	return "org.xml3d.webgl.DataAdapter";
};

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class org.xml3d.webgl.ValueDataAdapter
 * extends: org.xml3d.webgl.DataAdapter
 * 
 * ValueDataAdapter represents a leaf in the DataAdapter hierarchy. A
 * ValueDataAdapter is associated with the XML3D data elements having
 * no children besides a text node such as <bool>, <float>, <float2>,... .
 * 
 * @author  Benjamin Friedrich
 * @version 10/2010  1.0
 */

/**
 * Constructor of org.xml3d.webgl.ValueDataAdapter
 * 
 * @augments org.xml3d.webgl.DataAdapter
 * @constructor
 * 
 * @param factory
 * @param node
 */
org.xml3d.webgl.ValueDataAdapter = function(factory, node) 
{
	org.xml3d.webgl.DataAdapter.call(this, factory, node);
	this.init = function()
	{
		this.createDataTable(true);
	};	
};
org.xml3d.webgl.ValueDataAdapter.prototype             = new org.xml3d.webgl.DataAdapter();
org.xml3d.webgl.ValueDataAdapter.prototype.constructor = org.xml3d.webgl.ValueDataAdapter;

/**
 * Returns the tuple size of the associated XML3D data element. 
 * 
 * @returns the tuples size of the associated node or -1 if the tuple size 
 * 			of the associated node can not be determined
 */
org.xml3d.webgl.ValueDataAdapter.prototype.getTupleSize = function() 
{
	if (this.node.localName == "float" ||
		this.node.localName == "int"   ||
		this.node.localName == "bool"  ||
		this.node.localName == "texture")
	{
		return 1;
	}
			
	if (this.node.localName == "float2")
	{
		return 2;
	}
	
	if (this.node.localName == "float3")
	{
		return 3;
	}
	
	if (this.node.localName == "float4")
	{
		return 4;
	}

	if (this.node.localName == "float4x4")
	{
		return 16;
	}
	
	org.xml3d.debug.logWarning("Can not determine tuple size of element " + this.node.localName);
	return -1;
};

/**
 * Extracts the texture data of a node. For example: 
 * 
 * <code>
 *	<texture name="...">
 * 		<img src="textureData.jpg"/>
 * 	</texture
 * </code>
 * 
 * In this case, "textureData.jpg" is returned as texture data.
 * 
 * @param   node  XML3D texture node
 * @returns texture data or null, if the given node is not a XML3D texture element
 */
org.xml3d.webgl.ValueDataAdapter.prototype.extractTextureData = function(node) 
{
	if(node.localName != "texture")
	{
		return null;
	}
	
	var textureChild = node.firstElementChild;
	if(textureChild.localName != "img")
	{
		org.xml3d.debug.logWarning("child of texture element is not an img element");
		return null;
	}
	
	return textureChild.src;
};

/**
 * Creates datatable. If the parameter 'forceNewInstance' is specified with 'true', 
 * createDataTable() creates a new datatable, caches and returns it. If no
 * parameter is specified or 'forceNewInstance' is specified with 'false', the
 * cashed datatable is returned.<br/>
 * Each datatable has the following format:<br/>
 * <br/>
 * datatable['name']['tupleSize'] : tuple size of the data element with name 'name' <br/>
 * datatable['name']['data']      : typed array (https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/TypedArray-spec.html)
 * 								    associated with the data element with name 'name'
 * 
 * @param   forceNewInstance 
 * 				indicates whether a new instance shall be created or the cached
 * 				datatable shall be returned			
 * @returns datatable
 */
org.xml3d.webgl.ValueDataAdapter.prototype.createDataTable = function(forceNewInstance)
{	
	if(forceNewInstance == undefined ? true : ! forceNewInstance)
	{
	   return this.dataTable;
	}
	
	var value;

	if(this.node.localName == "texture")
	{
		value = this.extractTextureData(this.node);
	}
	else
	{
		value = this.node.value;
	}

	var name    		 = this.node.name;		
	var result 			 = new Array(1);
	var content          = new Array();
	content['tupleSize'] = this.getTupleSize();
		
	result[name]    = content;
	content['data'] = value;
	result[name]    = content; 
	this.dataTable  = result;

	return result;
};

/**
 * Returns String representation of this DataAdapter
 */
org.xml3d.webgl.ValueDataAdapter.prototype.toString = function()
{
	return "org.xml3d.webgl.ValueDataAdapter";
};

//---------------------------------------------------------------------------------------------------------------------------

/**
 * Class    org.xml3d.webgl.RootDataAdapter
 * extends: org.xml3d.webgl.DataAdapter
 * 
 * RootDataAdapter represents the root in the DataAdapter hierarchy (no parents).
 * 
 * @author  Benjamin Friedrich
 * @version 10/2010  1.0
 */

/**
 * Constructor of org.xml3d.webgl.RootDataAdapter
 * 
 * @augments org.xml3d.webgl.DataAdapter
 * @constructor
 * 
 * @param factory
 * @param node
 */
org.xml3d.webgl.RootDataAdapter = function(factory, node) 
{
	org.xml3d.webgl.DataAdapter.call(this, factory, node);
};
org.xml3d.webgl.RootDataAdapter.prototype             = new org.xml3d.webgl.DataAdapter();
org.xml3d.webgl.RootDataAdapter.prototype.constructor = org.xml3d.webgl.RootDataAdapter;

/**
 * Indicates whether this DataAdapter is a RootAdapter (has no parent DataAdapter).
 * 
 * @returns true if this DataAdapter is a RootAdapter, otherwise false.
 */
org.xml3d.webgl.RootDataAdapter.prototype.isRootAdapter = function()
{
	return true;
};

/**
 * Returns String representation of this DataAdapter
 */
org.xml3d.webgl.RootDataAdapter.prototype.toString = function()
{
	return "org.xml3d.webgl.RootDataAdapter";
};

/***********************************************************************/
