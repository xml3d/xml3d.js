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


org.xml3d.webgl.supported = function() {
	var canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	try {
		var gl = canvas.getContext("experimental-webgl");
	} catch(e) {
		var gl = null;
	}
	return !!gl;
};

org.xml3d.webgl.configure = function(xml3ds) {
	var handlers = {};
	for(var i in xml3ds) {
		// Creates a HTML <canvas> using the style of the <xml3d> Element
		var canvas = org.xml3d.webgl.createCanvas(xml3ds[i], i);
		// Creates the gl XML3DHandler for the <canvas>  Element
		var XML3DHandler = org.xml3d.webgl.createXML3DHandler(canvas, xml3ds[i]);
		xml3ds[i].canvas = canvas;
		
		//Check for event listener attributes for the xml3d node
		if (xml3ds[i].hasAttribute("contextmenu") && xml3ds[i].getAttribute("contextmenu") == "false")
			xml3ds[i].canvas.addEventListener("contextmenu", function(e) {org.xml3d.webgl.stopEvent(e);}, false);
		if (xml3ds[i].hasAttribute("framedrawn"))
			XML3DHandler.addEventListener(xml3ds[i], "framedrawn", xml3ds[i].getAttribute("framedrawn"), false);
		
		if (xml3ds[i].hasAttribute("disablepicking"))
			XML3DHandler._pickingDisabled = xml3ds[i].getAttribute("disablepicking") == "true" ? true : false;

		XML3DHandler.start();
		handlers[i] = XML3DHandler;
		org.xml3d._rendererFound = true;
	}
	
	//Update listening should be deferred until all canvases are created and configured or it may interfere with the 
	//configuration process
	for (var i in xml3ds) {
		if (xml3ds[i].hasAttribute("onupdate"))
			handlers[i].addEventListener(xml3ds[i], "update", xml3ds[i].getAttribute("onupdate"), false);
		
	}
};

org.xml3d.webgl.stopEvent = function(ev) {
	if (ev.preventDefault)
		ev.preventDefault();
	if (ev.stopPropagation) 
		ev.stopPropagation();
	ev.returnValue = false;
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

	
	// Try to transfer all CSS attributes from the xml3d element to the canvas element
	
	// transfer style attribute as it's not in the computed style and has
	// higher priority
	if (xml3dElement.hasAttribute("style"))
		canvas.setAttribute("style", xml3dElement.getAttribute("style"));

	// First set the computed for some important attributes, they might be overwritten 
	// by class attribute later
	var sides = [ "top", "right", "bottom", "left" ];
	var colorStr = ""; var styleStr = ""; var widthStr = ""; var paddingStr = "";
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
	
	if(!canvas.style.width)
		canvas.style.width = org.xml3d.util.getStyle(xml3dElement, "width");
	if(!canvas.style.height)
		canvas.style.height = org.xml3d.util.getStyle(xml3dElement, "height");
	
	if (!canvas.style.backgroundColor) {
	var bgcolor = org.xml3d.util.getStyle(xml3dElement, "background-color");
	if (bgcolor && bgcolor != "transparent")
		canvas.style.backgroundColor = bgcolor;
	}

	// transfer class attributes and add xml3d-canvas-style for special canvas styling
	var classString = "xml3d-canvas-style";
	if (xml3dElement.hasAttribute("class"))
		classString = xml3dElement.getAttribute("class") + " " + classString;
	canvas.setAttribute("class", classString);


	// Width and height are can also be specified as attributes, then they have
	// the highest priority
	var h, w;
	
	if ((w = xml3dElement.getAttribute("width")) !== null) {
		canvas.style.width = w;
	} else if ((w = org.xml3d.util.getStyle(xml3dElement, "width")) != "auto"){
		canvas.style.width = w;
	}
	if ((h = xml3dElement.getAttribute("height")) !== null) {
		canvas.style.height = h;
	} else if ((h = org.xml3d.util.getStyle(xml3dElement, "height")) != "auto"){
		canvas.style.height = h;
	}
	canvas.id = "canvas"+index;
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	
	return canvas;
};


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

/**
 * Constructor for the Renderer.
 * 
 * The renderer is responsible for drawing the scene and determining which object was
 * picked when the user clicks on elements of the canvas.
 */
org.xml3d.webgl.Renderer = function(handler, width, height) {
	this.handler = handler;
	this.currentView = null;
	this.scene = handler.scene;
	this.factory = new org.xml3d.webgl.XML3DRenderAdapterFactory(handler, this);
	this.dataFactory = new org.xml3d.webgl.XML3DDataAdapterFactory(handler);
	this.lights = [];
	this.camera = this.initCamera();
	this.shaderMap = {};
	this.width = width;
	this.height = height;
	this.opaqueObjects = [];
	this.transparentObjects = [];
	this.zPos = [];
	this.viewMatrix = new XML3DMatrix(); // view matrix of last call to render()
	this.projMatrix = new XML3DMatrix(); // projection matrix of last call to render()
	
	
	this.collectDrawableObjects(new XML3DMatrix(), this.opaqueObjects, this.transparentObjects, this.lights, null, true);
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
		opaqueObjects, transparentObjects, lights, shader, visible) {
	var adapter = this.factory.getAdapter(this.scene.xml3d, org.xml3d.webgl.Renderer.prototype);
	if (adapter)
		return adapter.collectDrawableObjects(transform, opaqueObjects, transparentObjects, lights, shader, visible);
	return [];
};

org.xml3d.webgl.Renderer.prototype.resizeCanvas = function (width, height) {
	this.width = width;
	this.height = height;
};

org.xml3d.webgl.Renderer.prototype.requestRedraw = function(reason) {
	this.handler.redraw(reason);
};

org.xml3d.webgl.Renderer.prototype.sceneTreeAddition = function(evt) {
	var adapter = this.factory.getAdapter(evt.newValue, org.xml3d.webgl.Renderer.prototype);
	
	//Traverse parent nodes to build any inherited shader and transform elements
	var transform = adapter.applyTransformMatrix(new XML3DMatrix());
	var visible = true;
	var shader = null;	
	if (adapter.getShader)
		shader = adapter.getShader();
	
	var currentNode = evt.newValue;
	var didListener = false;
	while (currentNode.parentNode) {
		currentNode = currentNode.parentNode;
		if (currentNode.nodeName == "group") {
			var parentAdapter = this.factory.getAdapter(currentNode, org.xml3d.webgl.Renderer.prototype);	
			
			if (!didListener) { 
				parentAdapter.listeners.push(adapter); 
				didListener = true; 
			}
			transform = parentAdapter.applyTransformMatrix(transform);
			if (!shader)
				shader = parentAdapter.getShader();
			if (currentNode.getAttribute("visible") == "false")
				visible = false;
		}
	}

	adapter.collectDrawableObjects(transform, this.drawableObjects, this.lights, shader, visible);
	this.requestRedraw("A node was added.");
	
};

org.xml3d.webgl.Renderer.prototype.sceneTreeRemoval = function (evt) {
	//References to the adapters of the removed node are automatically cleaned up
	//as they're encountered during the render phase or notifyChanged methods
	var adapter = this.factory.getAdapter(evt.oldValue, org.xml3d.webgl.Renderer.prototype);
	if (adapter && adapter.dispose)
		adapter.dispose();
	this.requestRedraw("A node was removed.");

};

/**
 * Creates and returns the requested shader. Custom user defined shaders are handled in 
 * org.xml3d.webgl.XML3DShaderRenderAdapter.prototype.createShaderProgram
 * 
 * @param gl
 * @param name
 * @return
 */
org.xml3d.webgl.Renderer.prototype.getStandardShaderProgram = function(gl, name) {
	var shader = this.shaderMap[name];
	if (!shader) {
		var sp = {program:null, vSource:"", fSource:""};
		
		if (g_shaders[name] === undefined)
		{
			org.xml3d.debug.logError("Could not find standard shader: " + name);
			return sp;
		}
		//org.xml3d.webgl.checkError(gl, "Before creating shader");
		var prog = null;

		if (name == "urn:xml3d:shader:phong" || name == "urn:xml3d:shader:phongvcolor" || name == "urn:xml3d:shader:texturedphong")
		{
			// Workaround for lack of dynamic loops on ATI cards below the HD 5000 line
			var sfrag = g_shaders[name].fragment;
			var tail = sfrag.substring(68, sfrag.length);
			if (!this.lights)
				var maxLights = "#ifdef GL_ES\nprecision highp float;\n" +
						"#endif\n\nconst int MAXLIGHTS = ;\n";
			else
				var maxLights = "#ifdef GL_ES\nprecision highp float;\n" +
						"#endif\n\n const int MAXLIGHTS = "+ this.lights.length.toString() + ";\n";

			var frag = maxLights + tail;
			prog = new SglProgram(gl, [g_shaders[name].vertex], [frag]);
			sp.vSource = g_shaders[name].vertex;
			sp.fSource = frag;
			//org.xml3d.webgl.checkError(gl, "After creating shader");
		} else {
			prog = new SglProgram(gl, [g_shaders[name].vertex], [g_shaders[name].fragment]);
			sp.vSource = g_shaders[name].vertex;
			sp.fSource = g_shaders[name].fragment;
			//org.xml3d.webgl.checkError(gl, "After creating shader");
		}
		if (!prog)
		{
			org.xml3d.debug.logError("Could not create shader program: " + name);
			return sp;
		}
		sp.program = prog;
		this.shaderMap[name] = sp;
		shader = sp;
	}
	return shader;
};

org.xml3d.webgl.Renderer.prototype.render = function() {
	var gl = this.handler.gl;
	var sp = null;
	

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	gl.viewport(0, 0, this.width, this.height);
	//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE,
	//		gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
	
	if (this.currentView != this.scene.getActiveView())
		this.camera = this.initCamera();
	
	//TODO: port matrix calculations away from SpiderGL
	/*var xform = new SglTransformStack();
	xform.view.load(this.camera.getViewMatrix());
	this.projMatrix = this.camera.getProjectionMatrix(this.width / this.height);
	this.viewMatrix = this.camera.getViewMatrix();
	xform.projection.load(this.projMatrix);*/
	
	var xform = {};
	xform.view = this.camera.getViewMatrix();
	xform.proj = this.camera.getProjectionMatrix(this.width / this.height);
	
	//Setup lights
	var light, lightOn;
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
		var params = light.getParameters(xform.view);
		if (!params)
			continue; // TODO: Shrink array
		lightParams.positions.set(params.position, j*3);
		lightParams.attenuations.set(params.attenuation, j*3);
		lightParams.diffuseColors.set(params.intensity, j*3);
		lightParams.visible.set(params.visibility, j*3);
	}
	
	//TODO: Remove sorting for opaque objects?
	//Sort opaque objects, back to front
	var zPosOpaque = [];
	this.sortObjects(this.opaqueObjects, zPosOpaque, xform, false);
	
	//Sort transparent objects, back to front
	var zPosTransparent = [];
	this.sortObjects(this.transparentObjects, zPosTransparent, xform, false);
	
	//Render opaque objects
	this.drawObjects(this.opaqueObjects, zPosOpaque, xform, lightParams);
	
	//Render transparent objects
	if (this.transparentObjects.length > 0) {
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
		gl.depthMask(gl.FALSE);
	
		this.drawObjects(this.transparentObjects, zPosTransparent, xform, lightParams);
		
		gl.disable(gl.BLEND);
		gl.depthMask(gl.TRUE);
	}
	
	return [this.opaqueObjects.length + this.transparentObjects.length, 1]; //TODO: Num triangles
};

org.xml3d.webgl.Renderer.prototype.sortObjects = function(sourceObjectArray, sortedObjectArray, xform, backToFront) {
	for (i = 0, n = sourceObjectArray.length; i < n; i++) {
		var meshAdapter = sourceObjectArray[i];
		
		if (!meshAdapter.isValid) {
			sourceObjectArray.splice(i, 1);
			i--;
			n--;
			continue;
		}
		
		var trafo = meshAdapter._transform;
		var center = meshAdapter.bbox.center();
		center = trafo.multiply(new XML3DRotation(center.x, center.y, center.z, 1.0));
		center = xform.view.multiply(new XML3DRotation(center.x, center.y, center.z, 1.0));
		sortedObjectArray[i] = [ i, center.z ]; 
	}
	
	if (backToFront) {
		sortedObjectArray.sort(function(a, b) {
			return a[1] - b[1];
		});
	} else {
		sortedObjectArray.sort(function(a, b) {
			return b[1] - a[1];
		});
	}
};

org.xml3d.webgl.Renderer.prototype.drawObjects = function(objectArray, zPosArray, xform, lightParams) {

	var parameters = {};
	
	parameters["lightPositions[0]"] = lightParams.positions;
	parameters["lightVisibility[0]"] = lightParams.visible;
	parameters["lightDiffuseColors[0]"] = lightParams.diffuseColors;
	parameters["lightAmbientColors[0]"] = lightParams.ambientColors;
	parameters["lightAttenuations[0]"] = lightParams.attenuations;
	
	for (var i = 0; i < zPosArray.length; i++) {
		var obj = objectArray[zPosArray[i][0]];
		var transform = obj._transform;
		var shape = obj;
		var shader = obj._shader;
		
		if (shape._visible == false)
			continue;
		
		//xform.model.load(transform);
		xform.model = transform;
		xform.modelView = this.camera.getModelViewMatrix(xform.model);
		
		if (!shader)
		{			
			//TODO: Find a way to bind a default shader program if none is given
			this.bindDefaultShaderProgram(this.handler.gl, "urn:xml3d:shader:flat");
			
			/*if (sp) {
				if (RGBColor && document.defaultView
					&& document.defaultView.getComputedStyle) {
					var colorStr = document.defaultView.getComputedStyle(
						shape.node, "").getPropertyValue("color");
					var color = new RGBColor(colorStr);
					//parameters["diffuseColor"] = [0.0,0.0,0.80];
					}
			}*/
			
		}

		parameters["modelViewMatrix"] = xform.modelView.toGL();
		parameters["modelViewProjectionMatrix"] = this.camera.getModelViewProjectionMatrix(xform.modelView).toGL();
		parameters["normalMatrix"] = this.camera.getNormalMatrixGL(xform.modelView);
		parameters["cameraPosition"] = xform.modelView.inverse().getColumnV3(3);
		
		if (!shader)
			continue; //TODO: remove once default shader program is in place
		shader.enable(parameters);		
		shape.draw(shader);
		shader.disable();
		
	}
	
	
	
};


/**
 * The main rendering method that will redraw the scene
 * @return
 */
/*
org.xml3d.webgl.Renderer.prototype.render = function() {
	var gl = this.handler.gl;
	var sp = null;

	gl.clearDepth(1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	gl.viewport(0, 0, this.width, this.height);
	gl.disable(gl.DEPTH_TEST);
	gl.disable(gl.CULL_FACE);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE,
			gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);

	if (!this.camera)
		return 0;
	if (this.currentView != this.scene.getActiveView())
		this.camera = this.initCamera();

	var start = Date.now() / 1000.0;
	
	var xform = new SglTransformStack();
	xform.view.load(this.camera.getViewMatrix());
	this.projMatrix = this.camera.getProjectionMatrix(this.width / this.height);
	this.viewMatrix = this.camera.getViewMatrix();
	xform.projection.load(this.projMatrix);

	//Setup lights
	var light, lightOn;
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
		var params = light.getParameters(this.viewMatrix);
		if (!params)
			continue; // TODO: Shrink array
		lightParams.positions.set(params.position, j*3);
		lightParams.attenuations.set(params.attenuation, j*3);
		lightParams.diffuseColors.set(params.intensity, j*3);
		lightParams.visible.set(params.visibility, j*3);
	}

	this.zPos = new Array();
	for (i = 0, n = this.opaqueObjects.length; i < n; i++) {
		var meshAdapter = this.opaqueObjects[i];
		
		//Check if this mesh was removed from the scene since last rendering pass
		if (!meshAdapter.isValid) {
			this.opaqueObjects.splice(i, 1);
			i--;
			n--;
			continue;
		}
		
		var trafo = meshAdapter._transform;
		var center = new SglVec3(meshAdapter.bbox.center);
		center.v = sglMulM4V3(trafo, center.v, 1.0);
		center.v = sglMulM4V3(xform.view._s[0], center.v, 1.0);
		this.zPos[i] = [ i, center.z ]; 
	}
	this.zPos.sort(function(a, b) {
		return a[1] - b[1];
	});

	var end = Date.now() / 1000.0;
	//console.log("Sort Time:" + (end-start));
	start = end;
	
	var numTrianglesDrawn = 0;
	
	//Draw opaque objects
	for (var i = 0, n = this.zPos.length; i < n; i++) {
		var obj = this.opaqueObjects[this.zPos[i][0]];
		var transform = obj._transform;
		var shape = obj;
		var shader = obj._shader;
		
		if (shape._visible == false)
			continue;

		sp = null;
		xform.model.load(transform);
		var parameters = {};

		if (shader) {
			sp = shader.shaderProgram;
		}

		if (!sp)
		{
			//org.xml3d.webgl.checkError(gl, "Before default shader");
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
					parameters["diffuseColor"] = [0.0,0.0,0.80];
					}
			}
		}

		//Begin setting up uniforms for rendering
		parameters["lightPositions[0]"] = lightParams.positions;
		parameters["lightVisibility[0]"] = lightParams.visible;
		parameters["lightDiffuseColors[0]"] = lightParams.diffuseColors;
		parameters["lightAmbientColors[0]"] = lightParams.ambientColors;
		parameters["lightAttenuations[0]"] = lightParams.attenuations;
		parameters["modelViewMatrix"] = xform.modelViewMatrix;
		parameters["modelViewProjectionMatrix"] = xform.modelViewProjectionMatrix;
		parameters["normalMatrix"] = xform.viewSpaceNormalMatrix;
		parameters["cameraPosition"] = xform.modelSpaceViewerPosition;

		if (shader)
		{
			//Add uniforms from the shader to the parameters package
			shader.setParameters(parameters);
			var prims = shape.mesh.connectivity.primitives;
			if (prims && prims.triangles)
				numTrianglesDrawn += prims.triangles.length / 3;
			
			shape.render(shader, parameters);
		} else {
			shader = {};
			shader.sp = sp;
			shape.render(shader, parameters);
		}
		xform.model.pop();

	}
	
	//Draw transparent objects
	for (var i = 0, n = origLength; i < n; i++) {
		
	}
	
	
	end = Date.now() / 1000.0;
	//console.log("Render Time:" + (end-start));
	start = end;

	xform.view.pop();
	xform.projection.pop();

	gl.disable(gl.CULL_FACE);
	
	return [origLength, numTrianglesDrawn];
};
*/
/**
 * Render the scene using the picking shader and determine which object, if any, was picked
 * 
 * @param x
 * @param y
 * @param needPickingDraw
 * @return
 */
org.xml3d.webgl.Renderer.prototype.renderPickingPass = function(x, y, needPickingDraw) {
		if (x<0 || y<0 || x>=this.width || y>=this.height)
			return;
		gl = this.handler.gl;
		
		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);
		gl.disable(gl.BLEND);
		
		if (needPickingDraw ) {
			var volumeMax = new XML3DVec3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
			var volumeMin = new XML3DVec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

			var xform = {};
			xform.view = this.camera.getViewMatrix();
			xform.proj = this.camera.getProjectionMatrix(this.width / this.height);

			for (var i = 0; i < this.zPos.length; i++) {
				var meshAdapter = this.drawableObjects[this.zPos[i][0]];
				var trafo = meshAdapter._transform;
				this.adjustMinMax(meshAdapter.bbox, volumeMin, volumeMax, trafo);
			}
			this.bbMin = volumeMin;
			this.bbMax = volumeMax;
			var sp = this.getStandardShaderProgram(gl, "urn:xml3d:shader:picking");
			shader = {};
			shader.sp = sp;
			
			for (j = 0, n = this.zPos.length; j < n; j++) {
				var obj = this.drawableObjects[this.zPos[j][0]];
				var transform = obj._transform;
				var shape = obj;
				
				if (obj.isValid == false)
					continue;
				xform.model = transform;
				xform.modelView = this.camera.getModelViewMatrix(xform.model);

				var id = 1.0 - (1+j) / 255.0;

				var parameters = {
						id : id,
						min : volumeMin.toGL(),
						max : volumeMax.toGL(),
						modelMatrix : transform,
						modelViewProjectionMatrix : this.camera.getModelViewProjectionMatrix(xform.modelView).toGL(),
						normalMatrix : this.camera.getNormalMatrixGL(xform.modelView)
				};
				
				shape.render(shader, parameters);
			}			
		}
		this.readPixels(false, x, y);
		gl.disable(gl.DEPTH_TEST);
};

/**
 * Render the picked object using the normal picking shader and return the normal at
 * the point where the object was clicked.
 * 
 * @param pickedObj
 * @param screenX
 * @param screenY
 * @return
 */
org.xml3d.webgl.Renderer.prototype.renderPickedNormals = function(pickedObj, screenX, screenY) {
	gl = this.handler.gl;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.CULL_FACE);
	gl.disable(gl.BLEND);
	
	var transform = pickedObj._transform;
	var shape = pickedObj;
	var sp = this.getStandardShaderProgram(gl, "urn:xml3d:shader:pickedNormals");
	
	var xform = {};
	xform.view = this.camera.getViewMatrix();
	xform.proj = this.camera.getProjectionMatrix(this.width / this.height);
	xform.model = transform;
	xform.modelView = this.camera.getModelViewMatrix(xform.model);
	
	var parameters = {
		modelViewMatrix : transform,
		modelViewProjectionMatrix : this.camera.getModelViewProjectionMatrix(xform.modelView).toGL(),
		normalMatrix : this.camera.getNormalMatrixGL(xform.modelView)
	};

	shader = {};
	shader.sp = sp;
	shape.render(shader, parameters);
	
	this.readPixels(true, screenX, screenY);

	gl.disable(gl.DEPTH_TEST);
};

/**
 * Reads pixels from the screenbuffer to determine picked object or normals.
 * 
 * @param normals
 * 			How the read pixel data will be interpreted.
 * @return
 */
org.xml3d.webgl.Renderer.prototype.readPixels = function(normals, screenX, screenY) {
	//org.xml3d.webgl.checkError(gl, "Before readpixels");
	var data = new Uint8Array(8);
	
	try {
		gl.readPixels(screenX, screenY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
		
		var vec = new XML3DVec3(0, 0, 0);
		vec.x = data[0] / 255;
		vec.y = data[1] / 255;
		vec.z = data[2] / 255;
		
		if(normals) {
			vec = vec.scale(2.0).subtract(new XML3DVec3(1.0));
			this.scene.xml3d.currentPickNormal = vec;
		} else {		
			var objId = 255 - data[3] - 1;
			if (objId >= 0 && data[3] > 0) {
				vec = vec.multiply(this.bbMax.subtract(this.bbMin)).add(this.bbMin);
				this.scene.xml3d.currentPickPos = vec;
				var pickedObj = this.drawableObjects[this.zPos[objId][0]];
				this.scene.xml3d.currentPickObj = pickedObj;
			} else {
				this.scene.xml3d.currentPickPos = null;
				this.scene.xml3d.currentPickObj = null;	
			}
	}
	} catch(e) {org.xml3d.debug.logError(e);}
	
};

/**
 * Renders a single shader to a fullscreen quad

 * 
 * @param gl
 * @param quadMesh
 *     The fullscreen quad
 * @param shader
 *     The shader to be used for this pass. 
 * @param buffer
 *     The SGLTexture that the previous drawing or post-processing pass rendered to
 * @return
 */
org.xml3d.webgl.Renderer.prototype.renderShader = function(gl, quadMesh, shader, buffer, original) {
	if (!shader || !buffer || !original)
		return;
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	gl.viewport(0, 0, this.width, this.height);	
	gl.disable(gl.CULL_FACE);
	
	var parameters = {};
	var samplers = {};
	var sp;
	
	if (shader === null) {
		sp = this.ppShader.program;
	} else {		
		if (!shader.setParameters) {
			shader = this.factory.getAdapter(shader, org.xml3d.webgl.Renderer.prototype);
		}
		shader.setParameters(parameters);
		if (shader.textures.length > 0) {
			var st = shader.textures;
			for (var i=0; i<st.length; i++) {
				samplers[st[i].name] = st[i].tex;
			}
		}
		sp = shader.shaderProgram;
	}

	samplers.backBuffer = buffer.colorTargets[0];
	samplers.backBufferOrig = original.colorTargets[0];
	sglRenderMeshGLPrimitives(quadMesh, "tristrip", sp, null, parameters, samplers);
};

//Helper to expand an axis aligned bounding box around another object's bounding box
org.xml3d.webgl.Renderer.prototype.adjustMinMax = function(bbox, min, max, trafo) {
	var bmin = new XML3DVec3(bbox.min);
	var bmax = new XML3DVec3(bbox.max);
	var bbmin = trafo.mulVec3(bmin, 1.0);
	var bbmax = trafo.mulVec3(bmax, 1.0);

	if (bbmin.x < min.x)
		min.x = bbmin.x;
	if (bbmin.y < min.y)
		min.y = bbmin.y;
	if (bbmin.z < min.z)
		min.z = bbmin.z;
	if (bbmax.x > max.x)
		max.x = bbmax.x;
	if (bbmax.y > max.y)
		max.y = bbmax.y;
	if (bbmax.z > max.z)
		max.z = bbmax.z;
};

org.xml3d.webgl.Renderer.prototype.bindDefaultShaderProgram = function(gl, name) {
	

};

/**
 * Walks through the drawable objects and destroys each shape and shader
 * @return
 */
org.xml3d.webgl.Renderer.prototype.dispose = function() {
	for ( var i = 0, n = this.drawableObjects.length; i < n; i++) {
		var shape = this.drawableObjects[i][1];
		var shader = this.drawableObjects[i][2];
		shape.dispose();
		if (shader)
			shader.dispose();
	}
};

/**
 * Requests a redraw from the handler
 * @return
 */
org.xml3d.webgl.Renderer.prototype.notifyDataChanged = function() {
	this.handler.redraw("Unspecified data change.");
};


org.xml3d.webgl.XML3DRenderAdapterFactory = function(handler, renderer) {
	org.xml3d.data.AdapterFactory.call(this);
	this.handler = handler;
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
	if (node.localName == "defs")
		return new org.xml3d.webgl.XML3DDefsRenderAdapter(this, node);
	if (node.localName == "group")
		return new org.xml3d.webgl.XML3DGroupRenderAdapter(this, node);
	if (node.localName == "mesh")
		return new org.xml3d.webgl.XML3DMeshRenderAdapter(this, node);
	if (node.localName == "transform")
		return new org.xml3d.webgl.XML3DTransformRenderAdapter(this, node);
	if (node.localName == "shader")
		return new org.xml3d.webgl.XML3DShaderRenderAdapter(this, node);
	if (node.localName == "texture")
		return new org.xml3d.webgl.XML3DTextureRenderAdapter(this, node);
	if (node.localName == "img")
		return new org.xml3d.webgl.XML3DImgRenderAdapter(this, node);
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
		transform, opaqueObjects, transparentObjects, outLights, parentShader, visible) {
	var adapter = this.factory.getAdapter(this.node, org.xml3d.webgl.Renderer.prototype);
	if (adapter._parentShader !== undefined)
		adapter._parentShader = parentShader;
	
	var child = this.node.firstElementChild;
	
	while (child !== null) {
			var isVisible = visible;
			var childAdapter = this.factory.getAdapter(child, org.xml3d.webgl.Renderer.prototype);
			if (childAdapter) {
				var childTransform = childAdapter.applyTransformMatrix(transform);
				if (childAdapter.parentTransform !== undefined || childAdapter._parentTransform !== undefined) {
					childAdapter.parentTransform = transform;
				}
				var shader = childAdapter.getShader();
				
				if (!shader)
					shader = parentShader;
				if (adapter.listeners) {
					adapter.listeners.push(childAdapter);
				}
				if (child.getAttribute("visible") == "false")
					isVisible = false;
				childAdapter.collectDrawableObjects(childTransform, opaqueObjects, transparentObjects, outLights, shader, isVisible);
			}
			child = child.nextElementSibling;
		}
	
};


org.xml3d.webgl.RenderAdapter.prototype.applyTransformMatrix = function(
		transform) {
	return transform;
};


//Adapter for <defs>
org.xml3d.webgl.XML3DDefsRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DDefsRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DDefsRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DDefsRenderAdapter;
org.xml3d.webgl.XML3DDefsRenderAdapter.prototype.notifyChanged = function(evt) {
	
};

//Adapter for <img>
org.xml3d.webgl.XML3DImgRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.textureAdapter = factory.getAdapter(node.parentNode, org.xml3d.webgl.Renderer.prototype);
};
org.xml3d.webgl.XML3DImgRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DImgRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DImgRenderAdapter;
org.xml3d.webgl.XML3DImgRenderAdapter.prototype.notifyChanged = function(evt) {
	this.textureAdapter.notifyChanged(evt);
};


// Adapter for <transform>
org.xml3d.webgl.XML3DTransformRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.matrix = null;
	this.listeners = new Array();
	this.isValid = true;
};
org.xml3d.webgl.XML3DTransformRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DTransformRenderAdapter;

org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.getMatrix = function() {
	if (!this.matrix) {
		var n         = this.node;
		//TODO: Port calculation away from SpiderGL
		var t = sglTranslationM4C(n.translation.x, n.translation.y, n.translation.z);
		var c = sglTranslationM4C(n.center.x, n.center.y, n.center.z);
		var nc = sglTranslationM4C(-n.center.x, -n.center.y, -n.center.z);
		var s = sglScalingM4C(n.scale.x, n.scale.y, n.scale.z);
		var r = sglRotationAngleAxisM4V(n.rotation.angle, n.rotation.axis.toGL());
		var so = sglRotationAngleAxisM4V(n.scaleOrientation.angle, n.scaleOrientation.axis.toGL() );
		
		var m = sglMulM4(sglMulM4(sglMulM4(sglMulM4(sglMulM4(t, c), r), so),s), sglInverseM4(so), nc);
		this.matrix = new XML3DMatrix(m);
	}
	return this.matrix;
};

org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.notifyChanged = function(e) {
	this.matrix = null;
	this.matrix = this.getMatrix();
	for (var i=0; i<this.listeners.length; i++) {
		if (this.listeners[i].isValid)
			this.listeners[i].internalNotifyChanged("transform", this.matrix);
		else {
			this.listeners.splice(i,1);
			i--;
		}
	}
	this.factory.renderer.requestRedraw("Transformation changed.");
};
org.xml3d.webgl.XML3DTransformRenderAdapter.prototype.dispose = function() {
	this.isValid = false;
};



// Adapter for <lightshader>
org.xml3d.webgl.XML3DLightShaderRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
};
org.xml3d.webgl.XML3DLightShaderRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DLightShaderRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DLightShaderRenderAdapter;

// Utility functions
org.xml3d.webgl.calculateBoundingBox = function(tArray) {
	var bbox = new XML3DBox();
	
	if (!tArray || tArray.length < 3)
		return bbox;

	// Initialize with first position
	bbox.extend(tArray[0], tArray[1], tArray[2]);

	var val = 0.0;
	for (var i=3; i<tArray.length; i+=3) {
		bbox.extend(new XML3DVec3(tArray[i], tArray[i+1], tArray[i+2]));
	}
	return bbox;
};








