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
 * Represents a drawable object in the scene.
 * 
 * This object holds references to a mesh and shader stored in their respective managers, or in the 
 * case of XFlow a local instance of these objects, since XFlow may be applied differently to different 
 * instances of the same <data> element. It also holds the current transformation matrix for the object,
 * a flag to indicate visibility (not visible = will not be rendered), and a callback function to be used by
 * any adapters associated with this object (eg. the mesh's parent Group) to propogate changes (eg. when the 
 * parent group's shader is changed).
 */
 


/**
 * Constructor for the Renderer.
 * 
 * The renderer is responsible for drawing the scene and determining which object was
 * picked when the user clicks on elements of the canvas.
 */
org.xml3d.webgl.Renderer = function(handler, width, height) {
	this.handler = handler;
	this.currentView = null;
	this.xml3dNode = handler.scene.xml3d;
	this.factory = new org.xml3d.webgl.XML3DRenderAdapterFactory(handler, this);
	this.dataFactory = new org.xml3d.webgl.XML3DDataAdapterFactory(handler);
	this.bufferHandler = new org.xml3d.webgl.XML3DBufferHandler(handler.gl, this);
	this.shaderManager = new org.xml3d.webgl.XML3DShaderManager(handler.gl, this, this.dataFactory, this.factory);
	this.meshManager = new org.xml3d.webgl.XML3DMeshManager(handler.gl, this, this.dataFactory, this.factory);
	this.camera = this.initCamera();
	this.shaderMap = this._initInternalShaders();
	this.width = width;
	this.height = height;
	this.fbos = this._initFrameBuffers(handler.gl);
	
	//Light information is needed to create shaders, so process them first
	this.lights = [];
	this.drawableObjects = this.processScene(this.xml3dNode);
};

org.xml3d.webgl.Renderer.drawableObject = function() {
	this.mesh = null;
	this.shader = null;
	this.transform = null;
	this.visible = true;
	this.meshNode = null;
	this.callback = function(evt) {
		//do stuff

	};
};

org.xml3d.webgl.Renderer.prototype.initCamera = function() {
	var avLink = this.xml3dNode.activeView;
	var av = null;
	if (avLink != "")
		av = org.xml3d.URIResolver.resolve(avLink);

	if (av == null)
	{
		av =  document.evaluate('//xml3d:xml3d/xml3d:view[1]', document, function() {
			return org.xml3d.xml3dNS;
		}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		if (av == null)
			org.xml3d.debug.logError("No view defined.");
		this.currentView = av;
		return this.factory.getAdapter(av);
	}
	this.currentView = av;
	return this.factory.getAdapter(av);
};

org.xml3d.webgl.Renderer.prototype.processScene = function(xml3dNode) {
	var scene = new Array();
    var renderer = this;
    
	//Build scene
	var recursiveBuild = function(currentNode, visible, transform, parentShader) {
		var adapter = renderer.factory.getAdapter(currentNode);
		var downstreamShader = parentShader;
		var downstreamTransform = transform;
		
		var nodeTypes = {};
		nodeTypes["group"] = function() {
			if (currentNode.getAttribute("visible") == "false")
				visible = false;
			if (currentNode.hasAttribute("onmousemove") || currentNode.hasAttribute("onmouseout"))
				this.handler.setMouseMovePicking(true);	
				
			var shader = adapter.getShader();
			downstreamShader = shader ? shader : parentShader;				
			downstreamTransform = adapter.applyTransformMatrix(transform);
			
		};
		
		nodeTypes["mesh"] = function() {
			if (currentNode.getAttribute("visible") == "false")
				visible = false;
			if (currentNode.hasAttribute("onmousemove") || currentNode.hasAttribute("onmouseout"))
				this.handler.setMouseMovePicking(true);	
				
			// Add a new drawable object to the scene
			var newObject = new org.xml3d.webgl.Renderer.drawableObject(renderer);
			newObject.mesh = renderer.meshManager.createMesh(currentNode);
			newObject.meshNode = currentNode;
			newObject.visible = visible;
			
			// Defer creation of the shaders until after the entire scene is processed, this is
			// to ensure all lights and other shader information is available
			newObject.shader = null;
			newObject.transform = transform; 
			adapter.registerCallback(newObject.callback); 
			
			scene.push(newObject);
		};
			
		nodeTypes["light"] = function() {
			renderer.lights.push( { adapter : adapter , transform : transform} );
			adapter._transform = transform;
		};
		
		if (nodeTypes[currentNode.nodeName])
			nodeTypes[currentNode.nodeName]();
		
		var child = currentNode.firstElementChild;
		while (child) {
			recursiveBuild(child, visible, downstreamTransform, downstreamShader);
			child = child.nextSibling;
		}
		
	};
	
	recursiveBuild(xml3dNode, true, mat4.identity(mat4.create()), null);
	
	for (var i=0; i < scene.length; i++) {
		var obj = scene[i];
		obj.shader = this.shaderManager.createShaderForObject(obj, this.lights);
	}
	
	return scene;
};

org.xml3d.webgl.Renderer.prototype._initFrameBuffers = function(gl) {
	var fbos = {};
	
	fbos.picking = this.bufferHandler.createPickingBuffer(this.width, this.height);
	if (!fbos.picking.valid)
		this.handler._pickingDisabled = true;
	
	return fbos;
};

org.xml3d.webgl.Renderer.prototype._initInternalShaders = function() {
	var shaderMap = {};
	shaderMap.picking = this.shaderManager.getStandardShaderProgram("urn:xml3d:shader:picking");
	shaderMap.normalsPicking = this.shaderManager.getStandardShaderProgram("urn:xml3d:shader:pickedNormals");
	//TODO: Shadow map, reflection, etc
	
	return shaderMap;
};

org.xml3d.webgl.Renderer.prototype.getGLContext = function() {
	return handler.gl;
};

org.xml3d.webgl.Renderer.prototype.applyChangeToObject = function(evt, drawableObject) {
	// TODO: this
};

/**
 * Propogates a change in the WebGL context to everyone who needs to know
 **/
org.xml3d.webgl.Renderer.prototype.setGLContext = function(gl) {
	this.shaderManager.setGLContext(gl);
	this.meshManager.setGLContext(gl);
};

org.xml3d.webgl.Renderer.prototype.resizeCanvas = function (width, height) {
	this.width = width;
	this.height = height;
};

org.xml3d.webgl.Renderer.prototype.requestRedraw = function(reason) {
	this.handler.redraw(reason);
};

org.xml3d.webgl.Renderer.prototype.sceneTreeAddition = function(evt) {
	var adapter = this.factory.getAdapter(evt.newValue);
	
	//Traverse parent nodes to build any inherited shader and transform elements
	var transform = adapter.applyTransformMatrix(new XML3DMatrix());
	var visible = true;
	var shader = null;	
	if (adapter.getShader)
		shader = adapter.getShader();
	
	var currentNode = evt.newValue;
	var didListener = false;
	adapter.isValid = true;
	
	if (currentNode.hasAttribute("onmousemove") || currentNode.hasAttribute("onmouseout"))
		this.factory.handler.setMouseMovePicking(true);
	
	while (currentNode.parentNode) {	
		currentNode = currentNode.parentNode;
		if (currentNode.nodeName == "group") {
			if (currentNode.hasAttribute("onmousemove") || currentNode.hasAttribute("onmouseout"))
				this.factory.handler.setMouseMovePicking(true);
			
			var parentAdapter = this.factory.getAdapter(currentNode);	
			
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

	adapter.collectDrawableObjects(transform, this.opaqueObjects, this.transparentObjects, this.lights, shader, visible);
	this.requestRedraw("A node was added.");	
};

org.xml3d.webgl.Renderer.prototype.sceneTreeRemoval = function (evt) {
	//References to the adapters of the removed node are automatically cleaned up
	//as they're encountered during the render phase or notifyChanged methods
	var adapter = this.factory.getAdapter(evt.oldValue);
	if (adapter && adapter.dispose)
		adapter.dispose();
	this.requestRedraw("A node was removed.");

};

org.xml3d.webgl.Renderer.prototype.render = function() {
	var gl = this.handler.gl;
	var sp = null;
	

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	gl.viewport(0, 0, this.width, this.height);
	//gl.enable(gl.BLEND);
	//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE,
	//		gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
	
    // If the view has changed or we don't have a camera, then compute it.
    //TODO: Implement better notification system for view changes
    var av = this.xml3dNode.activeView;
	if (this.currentView != org.xml3d.URIResolver.resolve(av) || !this.camera)
		this.camera = this.initCamera();

    // Check if we still don't have a camera.
    if (!this.camera)
        return [0, 0];
	
	var xform = {};
	xform.view = this.getViewMatrix();  
	xform.proj = this.getProjectionMatrix(); 
	
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
	for ( var j = 0, length = slights.length; j < length; j++) {
		light = slights[j].adapter;
		var params = light.getParameters(xform.view);
		if (!params)
			continue; // TODO: Shrink array
		lightParams.positions.set(params.position, j*3);
		lightParams.attenuations.set(params.attenuation, j*3);
		lightParams.diffuseColors.set(params.intensity, j*3);
		lightParams.visible.set(params.visibility, j*3);
	}
	
	var stats = { objCount : 0, triCount : 0 };
	
	//TODO: Remove sorting for opaque objects?
	//Sort opaque objects, back to front
	//var zPosOpaque = [];
	//this.sortObjects(this.opaqueObjects, zPosOpaque, xform, false);
	
	//Sort transparent objects, back to front
	//var zPosTransparent = [];
	//this.sortObjects(this.transparentObjects, zPosTransparent, xform, false);
	
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);
	
	//Render opaque objects
	this.drawObjects(this.drawableObjects, xform, lightParams, stats);
	
	gl.disable(gl.BLEND);
    //TODO: transparent objects
    
	//Render transparent objects
	/*if (this.transparentObjects.length > 0) {
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
		gl.depthMask(gl.FALSE);
	
		this.drawObjects(this.transparentObjects, zPosTransparent, xform, lightParams, stats);
		
		gl.disable(gl.BLEND);
		gl.depthMask(gl.TRUE);
	}*/
	
	return [stats.objCount, stats.triCount]; 
};

org.xml3d.webgl.Renderer.prototype.sortObjects = function(sourceObjectArray, sortedObjectArray, xform, backToFront) {
    // TODO: sort objects by shader
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

org.xml3d.webgl.Renderer.prototype.drawObjects = function(objectArray, xform, lightParams, stats) {
	var objCount = 0;
	var triCount = 0;
	var parameters = {};
	
	parameters["lightPositions[0]"] = lightParams.positions;
	parameters["lightVisibility[0]"] = lightParams.visible;
	parameters["lightDiffuseColors[0]"] = lightParams.diffuseColors;
	parameters["lightAmbientColors[0]"] = lightParams.ambientColors;
	parameters["lightAttenuations[0]"] = lightParams.attenuations;
	
	for (var i = 0, n = objectArray.length; i < n; i++) {
		var obj = objectArray[i];
		var transform = obj.transform;
		var mesh = obj.mesh;
		var shader = obj.shader;
		
		if (obj.visible == false)
			continue;
		
		//xform.model.load(transform);
		xform.model = transform;
		xform.modelView = this.camera.getModelViewMatrix(xform.model);
        parameters["modelMatrix"] = xform.model;
		parameters["modelViewMatrix"] = xform.modelView;
		parameters["modelViewProjectionMatrix"] = this.camera.getModelViewProjectionMatrix(xform.modelView);
		parameters["normalMatrix"] = this.camera.getNormalMatrix(xform.modelView);
		//parameters["cameraPosition"] = xform.modelView.inverse().getColumnV3(3); //TODO: Fix me
		
		if (!shader)
		{			
			shader = this.shaderManager.bindDefaultShader();
			this.shaderManager.setUniformVariables(shader, parameters);
			triCount += this.drawObject(shader, mesh);
			this.shaderManager.unbindDefaultShader();
		} else {
			this.shaderManager.bindShader(shader, parameters);
			//shape.applyXFlow(shader, parameters);			
			this.shaderManager.setUniformVariables(shader, parameters);
			triCount += this.drawObject(shader, mesh);
		}
		objCount++;
	}
	
	stats.objCount = objCount;
	stats.triCount = triCount;
	
};


org.xml3d.webgl.Renderer.prototype.drawObject = function(shaderProgram, meshInfo) { 
	var sAttributes = shaderProgram.attributes;
	var gl = this.handler.gl;
	var triCount = 0;
    var vbos = meshInfo.vbos;

	var numBins = meshInfo.isIndexed ? vbos.index.length : vbos.position.length;
	
	for (var i = 0; i < numBins; i++) {
	//Bind vertex buffers
		for (var name in sAttributes) {
			var shaderAttribute = sAttributes[name];
			var vbo;
			
			if (vbos[name].length > 1)
				vbo = vbos[name][i];
			else
				vbo = vbos[name][0];
			
			if (!vbo) {
				org.xml3d.debug.logWarning("Missing required mesh data [ "+name+" ], the object may not render correctly.");
			}
	
			gl.enableVertexAttribArray(shaderAttribute.location);		
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
			
            //TODO: handle changes to data node through renderer.applyChangeToObject system
			/*if (dataTable[name] && dataTable[name].forcedUpdate) {
				gl.bufferData(gl.ARRAY_BUFFER, dataTable[name].data, gl.STATIC_DRAW);
				dataTable[name].forcedUpdate = false;
			}*/    
			
			gl.vertexAttribPointer(shaderAttribute.location, vbo.tupleSize, vbo.glType, false, 0, 0);
		}
		
	//Draw the object
		if (meshInfo.isIndexed) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbos.index[i]);
			
			if (meshInfo.size) {
				var offset = 0;
				var sd = meshInfo.size.data;
				for (var j = 0; j < sd.length; j++) {
					gl.drawElements(meshInfo.glType, sd[j], gl.UNSIGNED_SHORT, offset);
					offset += sd[j] * 2; //GL size for UNSIGNED_SHORT is 2 bytes
				}
			} else {
				gl.drawElements(meshInfo.glType, vbos.index[i].length, gl.UNSIGNED_SHORT, 0);
			}
			
			triCount = vbos.index[i].length / 3;
		} else {
			if (meshInfo.size) {
				var offset = 0;
				var sd = meshInfo.size.data;
				for (var j = 0; j < sd.length; j++) {
					gl.drawArrays(meshInfo.glType, offset, sd[j]);
					offset += sd[j] * 2; //GL size for UNSIGNED_SHORT is 2 bytes
				}
			} else {
				gl.drawArrays(meshInfo.glType, 0, vbos.position[i].length);
			}
			triCount = vbos.position[i].length / 3;
		}
		
	//Unbind vertex buffers
		for (var name in sAttributes) {
			var shaderAttribute = sAttributes[name];
			
			gl.disableVertexAttribArray(shaderAttribute.location);
		}
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	return triCount;
};


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
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos.picking.handle);
		
		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);
		gl.disable(gl.BLEND);
		
		var shader = {};
		
		if (needPickingDraw ) {
			var volumeMax = new XML3DVec3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE)._data;
			var volumeMin = new XML3DVec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE)._data;
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

			var xform = {};
			xform.view = this.camera.getViewMatrix();
			xform.proj = this.camera.getProjectionMatrix(this.width / this.height);

			for (var i = 0; i < this.drawableObjects.length; i++) {
				var obj = this.drawableObjects[i];
				var trafo = obj.transform;
				this.adjustMinMax(obj.mesh.bbox, volumeMin, volumeMax, trafo);
			}
			
			this.bbMin = volumeMin;
			this.bbMax = volumeMax;
			
			shader.program = this.shaderMap.picking;
			this.shaderManager.bindShader(shader.program);
			
			for (j = 0, n = this.drawableObjects.length; j < n; j++) {
				var obj = this.drawableObjects[j];
				var transform = obj.transform;
				var mesh = obj.mesh;
				
				if (mesh.isValid == false)
					continue;
				xform.model = transform;
				xform.modelView = this.camera.getModelViewMatrix(xform.model);

				var id = 1.0 - (1+j) / 255.0;

				var parameters = {
						id : id,
						min : volumeMin,
						max : volumeMax,
						modelMatrix : mat4.transpose(transform),
						modelViewProjectionMatrix : this.camera.getModelViewProjectionMatrix(xform.modelView),
						normalMatrix : this.camera.getNormalMatrix(xform.modelView)
				};
				
				this.shaderManager.setUniformVariables(shader.program, parameters);
				this.drawObject(shader.program, mesh);
			}
		}
		
		this.readPixels(false, x, y);
		this.shaderManager.unbindShader(shader.program);
		
		gl.disable(gl.DEPTH_TEST);
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos.picking.handle);
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.CULL_FACE);
	gl.disable(gl.BLEND);
	
	var transform = pickedObj.transform;
	var mesh = pickedObj.mesh;
	var sp = this.shaderMap.normalsPicking;
	this.shaderManager.bindShader(sp);
	
	var xform = {};
	xform.model = transform;
	xform.modelView = this.camera.getModelViewMatrix(xform.model);
	
	var parameters = {
		modelViewMatrix : transform,
		modelViewProjectionMatrix : this.camera.getModelViewProjectionMatrix(xform.modelView),
		normalMatrix : this.camera.getNormalMatrix(xform.modelView)
	};

	shader = {};
	shader.program = sp;
	this.shaderManager.setUniformVariables(shader.program, parameters);
	this.drawObject(shader, mesh);
	
	this.shaderManager.unbindShader(shader.program);
	this.readPixels(true, screenX, screenY);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	this.handler.needPickingDraw = true;

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
	var scale = this.fbos.picking.scale;
	var x = screenX * scale;
	var y = screenY * scale;
	
	try {
		gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
		
		var vec = vec3.create();
		vec.x = data[0] / 255;
		vec.y = data[1] / 255;
		vec.z = data[2] / 255;
		
		if(normals) {
			vec = vec3.subtract(vec3.scale(vec,2.0), vec3.create([1,1,1]));
			this.xml3dNode.currentPickNormal = vec;
		} else {		
			var objId = 255 - data[3] - 1;
			if (objId >= 0 && data[3] > 0) {
				var tmp = vec3.add(vec3.subtract(this.bbMax, this.bbMin),this.bbMin);
				vec = vec3.create([ vec[0]*tmp[0], vec[1]*tmp[1], vec[2]*tmp[2] ]);
				var pickedObj = this.drawableObjects[objId];
				this.xml3dNode.currentPickPos = vec;
				this.xml3dNode.currentPickObj = pickedObj.meshNode;
			} else {
				this.xml3dNode.currentPickPos = null;
				this.xml3dNode.currentPickObj = null;	
			}
	}
	} catch(e) {org.xml3d.debug.logError(e);}
	
};

//Helper to expand an axis aligned bounding box around another object's bounding box
org.xml3d.webgl.Renderer.prototype.adjustMinMax = function(bbox, min, max, trafo) {
	var bmin = bbox.min._data;
	var bmax = bbox.max._data;
	var t = trafo;
	var bbmin = mat4.multiplyVec3(trafo, bmin);
	var bbmax = mat4.multiplyVec3(trafo, bmax);

	if (bbmin[0] < min[0])
		min[0] = bbmin[0];
	if (bbmin[1] < min[1])
		min[1] = bbmin[1];
	if (bbmin[2] < min[2])
		min[2] = bbmin[2];
	if (bbmax[0] > max[0])
		max[0] = bbmax[0];
	if (bbmax[1] > max[1])
		max[1] = bbmax[1];
	if (bbmax[2] > max[2])
		max[2] = bbmax[2];
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

/**
 * Retrieve the camera's view matrix.
 * 
 * @return camera's current view matrix  
 */
org.xml3d.webgl.Renderer.prototype.getViewMatrix = function() { 

	// recompute if view changed
	//TODO: better view change notification system
	var av = this.xml3dNode.activeView;
	if (this.currentView != org.xml3d.URIResolver.resolve(av))
		this.camera = this.initCamera();

	this._viewMatrix = this.camera.getViewMatrix();
	
	return this._viewMatrix; 
}; 

/**
 * Retrieve the camera's projection matrix. 
 * 
 * @return camera's projection matrix based on current width and height
 */
org.xml3d.webgl.Renderer.prototype.getProjectionMatrix = function() { 

	if(!this._projMatrix)
	{
		//TODO: better view change notification system
		var av = this.xml3dNode.activeView;
		if (this.currentView != org.xml3d.URIResolver.resolve(av))
			this.camera = this.initCamera();
		
		this._projMatrix = this.camera.getProjectionMatrix(this.width / this.height);
	}
	
	return this._projMatrix;
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
	this.textureAdapter = factory.getAdapter(node.parentNode);
};
org.xml3d.webgl.XML3DImgRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DImgRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DImgRenderAdapter;
org.xml3d.webgl.XML3DImgRenderAdapter.prototype.notifyChanged = function(evt) {
	this.textureAdapter.notifyChanged(evt);
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
	
	//TODO: Fix bounding box
	//return bbox;
	
	if (!tArray || tArray.length < 3)
		return bbox;

	// Initialize with first position
	bbox.extend(new XML3DVec3(tArray[0], tArray[1], tArray[2]));

	var val = 0.0;
	for (var i=3; i<tArray.length; i+=3) {
		bbox.extend(new XML3DVec3(tArray[i], tArray[i+1], tArray[i+2]));
	}
	return bbox;
};








