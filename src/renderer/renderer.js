// renderer/renderer.js

(function() {
    var canvas = document.createElement("canvas");
    xml3d.webgl.supported = function() {
        try {
            return !!(window.WebGLRenderingContext && (canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    };


xml3d.webgl.configure = function(xml3ds) {
	var handlers = {};
	for(var i in xml3ds) {
		// Creates a HTML <canvas> using the style of the <xml3d> Element
		var canvas = xml3d.webgl.createCanvas(xml3ds[i], i);
		// Creates the CanvasHandler for the <canvas>  Element
		var canvasHandler = new xml3d.webgl.CanvasHandler(canvas, xml3ds[i]);
		
		// TODO: Move this to XML3DAdapter
		//Check for event listener attributes for the xml3d node
		if (xml3ds[i].hasAttribute("contextmenu") && xml3ds[i].getAttribute("contextmenu") == "false")
			xml3ds[i].canvas.addEventListener("contextmenu", function(e) {xml3d.webgl.stopEvent(e);}, false);
		if (xml3ds[i].hasAttribute("framedrawn"))
			canvasHandler.addEventListener(xml3ds[i], "framedrawn", xml3ds[i].getAttribute("framedrawn"), false);
		
		if (xml3ds[i].hasAttribute("disablepicking"))
			canvasHandler._pickingDisabled = xml3ds[i].getAttribute("disablepicking") == "true" ? true : false;

		canvasHandler.start();
		handlers[i] = canvasHandler;
	}
	
	//Update listening should be deferred until all canvases are created and configured or it may interfere with the 
	//configuration process
	for (var i in xml3ds) {
		if (xml3ds[i].hasAttribute("onupdate"))
			handlers[i].addEventListener(xml3ds[i], "update", xml3ds[i].getAttribute("onupdate"), false);
		
	}
};


xml3d.webgl.checkError = function(gl, text)
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
		xml3d.debug.logError(msg);
	}
};

/**
 * Constructor for the Renderer.
 * 
 * The renderer is responsible for drawing the scene and determining which object was
 * picked when the user clicks on elements of the canvas.
 */
xml3d.webgl.Renderer = function(handler, width, height) {
	this.handler = handler;
	this.currentView = null;
	this.xml3dNode = handler.xml3dElem;
	this.factory = new xml3d.webgl.XML3DRenderAdapterFactory(handler, this);
	this.dataFactory = new xml3d.webgl.XML3DDataAdapterFactory(handler);
	this.shaderManager = new xml3d.webgl.XML3DShaderManager(handler.gl, this, this.dataFactory, this.factory);
	this.bufferHandler = new xml3d.webgl.XML3DBufferHandler(handler.gl, this, this.shaderManager);
	this.camera = this.initCamera();
	this.shaderMap = this._initInternalShaders();
	this.width = width;
	this.height = height;
	// TODO: Remove _ prefix from methods
	this.fbos = this._initFrameBuffers(handler.gl);
	
	//Light information is needed to create shaders, so process them first
	this.lights = [];
	this.drawableObjects = new Array();
	this.recursiveBuildScene(this.drawableObjects, this.xml3dNode, true, mat4.identity(mat4.create()), null);
	this.processShaders(this.drawableObjects);
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
 
xml3d.webgl.Renderer.drawableObject = function(renderer) {
	this.mesh = null;
	this.shader = null;
	this.transform = null;
	this.visible = true;
	this.meshNode = null;
	var me = this;
	var renderer = renderer;
	this.callback = function(evt) {
		renderer.applyChangeToObject(evt, me);
	};
};

xml3d.webgl.Renderer.prototype.initCamera = function() {
	var avLink = this.xml3dNode.activeView;
	var av = null;
	if (avLink != "")
		av = xml3d.URIResolver.resolve(avLink);

	if (av == null)
	{
		av =  document.evaluate('//xml3d:xml3d/xml3d:view[1]', document, function() {
			return xml3d.xml3dNS;
		}, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		if (av == null)
			xml3d.debug.logError("No view defined.");
		this.currentView = av;
		return this.factory.getAdapter(av);
	}
	this.currentView = av;
	return this.factory.getAdapter(av);
};

xml3d.webgl.Renderer.prototype.processShaders = function(scene) {
    for (var i=0; i < scene.length; i++) {
		var obj = scene[i];
		obj.shader = this.shaderManager.createShaderForObject(obj, this.lights);
	}
};

xml3d.webgl.Renderer.prototype.recursiveBuildScene = function(scene, currentNode, visible, transform, parentShader) {
	var adapter = this.factory.getAdapter(currentNode);
	var downstreamShader = parentShader;
	var downstreamTransform = transform;
	
	switch(currentNode.nodeName) {
	case "group":
		if (currentNode.getAttribute("visible") == "false")
			visible = false;
		if (currentNode.hasAttribute("onmousemove") || currentNode.hasAttribute("onmouseout"))
			this.handler.setMouseMovePicking(true);	
		
		var shader = adapter.getShader();
		downstreamShader = shader ? shader : parentShader;	
		adapter.parentTransform = transform;
		downstreamTransform = adapter.applyTransformMatrix(mat4.identity(mat4.create()));
		break;	

	case "mesh":
		if (currentNode.getAttribute("visible") == "false")
			visible = false;
		if (currentNode.hasAttribute("onmousemove") || currentNode.hasAttribute("onmouseout"))
			this.handler.setMouseMovePicking(true);	
		
		var meshAdapter = this.factory.getAdapter(currentNode);
		if (!meshAdapter)
			break; //TODO: error handling
		
		// Add a new drawable object to the scene
		var newObject = new xml3d.webgl.Renderer.drawableObject(this);
		newObject.mesh = meshAdapter.createMesh(this.handler.gl);
		newObject.meshNode = currentNode;
		newObject.visible = visible;
		
		// Defer creation of the shaders until after the entire scene is processed, this is
		// to ensure all lights and other shader information is available
		newObject.shader = null;
		newObject.transform = transform; 
		adapter.registerCallback(newObject.callback); 
		
		scene.push(newObject);
		break;
		
	case "light":
		this.lights.push( { adapter : adapter , transform : transform} );
		adapter.transform = transform;
		adapter.visible = visible;
		break;
	
	default:
		break;
	}

	var child = currentNode.firstElementChild;
	while (child) {
		this.recursiveBuildScene(scene, child, visible, downstreamTransform, downstreamShader);
		child = child.nextSibling;
	}
};

xml3d.webgl.Renderer.prototype.initFrameBuffers = function(gl) {
	var fbos = {};
	
	fbos.picking = this.bufferHandler.createPickingBuffer(this.width, this.height);
	if (!fbos.picking.valid)
		this.handler._pickingDisabled = true;
	
	return fbos;
};

xml3d.webgl.Renderer.prototype._initInternalShaders = function() {
	var shaderMap = {};
	shaderMap.picking = this.shaderManager.getStandardShaderProgram("urn:xml3d:shader:picking");
	shaderMap.normalsPicking = this.shaderManager.getStandardShaderProgram("urn:xml3d:shader:pickedNormals");
	//TODO: Shadow map, reflection, etc
	
	return shaderMap;
};

xml3d.webgl.Renderer.prototype.getGLContext = function() {
	return handler.gl;
};

xml3d.webgl.Renderer.prototype.applyChangeToObject = function(evt, drawableObject) {
	var eventTypes = {};
	var renderer = this;
	
	eventTypes["shader"] = function() {
		//TODO: react to shader changes, eg. uniform variable has a new value
		if (evt.parameter == "shader") {
			//change shader reference
			return;
		}
		
	};
	eventTypes["transform"] = function() {
		drawableObject.transform = evt.newValue;
	};
	eventTypes["mesh"] = function() {
		//TODO: react to mesh changes 
		//src change will require disposing old GL components then creating new
		//Needs: 'src', 'visible', 'gltype'
	};
	
	eventTypes[MutationEvent.REMOVAL] = function() {
		//TODO: Handle removal of shader nodes
		renderer.meshManager.destroyMesh(drawableObject.mesh);
		var index = renderer.drawableObjects.indexOf(drawableObject);
		if (index != -1)
			renderer.drawableObjects.splice(index, 1);
	};
	
	var eventType = evt.type || evt.eventType;
	
	if (eventTypes[eventType]) {
		eventTypes[eventType]();
	}

};

/**
 * Propogates a change in the WebGL context to everyone who needs to know
 **/
xml3d.webgl.Renderer.prototype.setGLContext = function(gl) {
	this.shaderManager.setGLContext(gl);
	this.meshManager.setGLContext(gl);
};

xml3d.webgl.Renderer.prototype.resizeCanvas = function (width, height) {
	this.width = width;
	this.height = height;
};

xml3d.webgl.Renderer.prototype.requestRedraw = function(reason) {
	this.handler.redraw(reason);
};

xml3d.webgl.Renderer.prototype.sceneTreeAddition = function(evt) {
	var adapter = this.factory.getAdapter(evt.target);
	var transform = adapter.applyTransformMatrix(mat4.identity(mat4.create()));
	var visible = true;
	var shader = null;	
	if (adapter.getShader)
		shader = adapter.getShader();
	
	var currentNode = evt.newValue;
	var didListener = false;
	adapter.isValid = true;
	
	if (currentNode.hasAttribute("onmousemove") || currentNode.hasAttribute("onmouseout"))
		this.factory.handler.setMouseMovePicking(true);

	//Traverse parent group nodes to build any inherited shader and transform elements
	while (currentNode.parentElement) {	
		currentNode = currentNode.parentElement;
		if (currentNode.nodeName == "group") {
			//Can we get rid of these checks?
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
		} else {
			break; //End of nested groups
		}
	}
	//Build any new objects and add them to the scene
	var newObjects = new Array();
	this.recursiveBuildScene(newObjects, evt.target, visible, transform, shader);
	this.processShaders(newObjects);	
	this.drawableObjects.concat(newObjects);
	
	this.requestRedraw("A node was added.");	
};

xml3d.webgl.Renderer.prototype.sceneTreeRemoval = function (evt) {
	//References to the adapters of the removed node are automatically cleaned up
	//as they're encountered during the render phase or notifyChanged methods
	// TODO: This method needs to make sure GL components are disposed for removed mesh/shader nodes
	
	var currentNode = evt.target;
	var adapter = this.factory.getAdapter(currentNode);
	if (adapter && adapter.dispose)
		adapter.dispose(evt);

	this.requestRedraw("A node was removed.");

};

xml3d.webgl.Renderer.prototype.render = function() {
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
	if (this.currentView != xml3d.URIResolver.resolve(av) || !this.camera)
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

xml3d.webgl.Renderer.prototype.sortObjects = function(sourceObjectArray, sortedObjectArray, xform, backToFront) {
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

xml3d.webgl.Renderer.prototype.drawObjects = function(objectArray, xform, lightParams, stats) {
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


xml3d.webgl.Renderer.prototype.drawObject = function(shaderProgram, meshInfo) { 
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
				xml3d.debug.logWarning("Missing required mesh data [ "+name+" ], the object may not render correctly.");
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
			
			if (meshInfo.segments) {
				//This is a segmented mesh (eg. a collection of disjunct line strips)
				var offset = 0;
				var sd = meshInfo.segments.data;
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
xml3d.webgl.Renderer.prototype.renderPickingPass = function(x, y, needPickingDraw) {
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
			xform.view = this.camera.viewMatrix;
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
						modelMatrix : transform,
						modelViewProjectionMatrix : this.camera.getModelViewProjectionMatrix(xform.modelView),
						normalMatrix : this.camera.getNormalMatrix(xform.modelView)
				};
				
				this.shaderManager.setUniformVariables(shader.program, parameters);
				this.drawObject(shader.program, mesh);
			}
			this.shaderManager.unbindShader(shader.program);
		}
		
		this.readPixels(false, x, y);			
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
xml3d.webgl.Renderer.prototype.renderPickedNormals = function(pickedObj, screenX, screenY) {
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
xml3d.webgl.Renderer.prototype.readPixels = function(normals, screenX, screenY) {
	//xml3d.webgl.checkError(gl, "Before readpixels");
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
	} catch(e) {xml3d.debug.logError(e);}
	
};

//Helper to expand an axis aligned bounding box around another object's bounding box
xml3d.webgl.Renderer.prototype.adjustMinMax = function(bbox, min, max, trafo) {
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
xml3d.webgl.Renderer.prototype.dispose = function() {
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
xml3d.webgl.Renderer.prototype.notifyDataChanged = function() {
	this.handler.redraw("Unspecified data change.");
};

/**
 * Retrieve the camera's view matrix.
 * 
 * @return camera's current view matrix  
 */
xml3d.webgl.Renderer.prototype.getViewMatrix = function() { 

	// recompute if view changed
	//TODO: better view change notification system
	var av = this.xml3dNode.activeView;
	if (this.currentView != xml3d.URIResolver.resolve(av))
		this.camera = this.initCamera();

	this._viewMatrix = this.camera.viewMatrix;
	
	return this._viewMatrix; 
}; 

/**
 * Retrieve the camera's projection matrix. 
 * 
 * @return camera's projection matrix based on current width and height
 */
xml3d.webgl.Renderer.prototype.getProjectionMatrix = function() { 

	if(!this._projMatrix)
	{
		//TODO: better view change notification system
		var av = this.xml3dNode.activeView;
		if (this.currentView != xml3d.URIResolver.resolve(av))
			this.camera = this.initCamera();
		
		this._projMatrix = this.camera.getProjectionMatrix(this.width / this.height);
	}
	
	return this._projMatrix;
}; 

// TODO: Move all these stuff to a good place

xml3d.webgl.RenderAdapter = function(factory, node) {
	xml3d.data.Adapter.call(this, factory, node);
};
xml3d.webgl.RenderAdapter.prototype = new xml3d.data.Adapter();
xml3d.webgl.RenderAdapter.prototype.constructor = xml3d.webgl.RenderAdapter;

xml3d.webgl.RenderAdapter.prototype.isAdapterFor = function(protoType) {
	return protoType == xml3d.webgl.Renderer.prototype;
};

xml3d.webgl.RenderAdapter.prototype.getShader = function() {
	return null;
};

xml3d.webgl.RenderAdapter.prototype.applyTransformMatrix = function(
		transform) {
	return transform;
};


//Adapter for <defs>
xml3d.webgl.XML3DDefsRenderAdapter = function(factory, node) {
	xml3d.webgl.RenderAdapter.call(this, factory, node);
};
xml3d.webgl.XML3DDefsRenderAdapter.prototype = new xml3d.webgl.RenderAdapter();
xml3d.webgl.XML3DDefsRenderAdapter.prototype.constructor = xml3d.webgl.XML3DDefsRenderAdapter;
xml3d.webgl.XML3DDefsRenderAdapter.prototype.notifyChanged = function(evt) {
	
};

//Adapter for <img>
xml3d.webgl.XML3DImgRenderAdapter = function(factory, node) {
	xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.textureAdapter = factory.getAdapter(node.parentNode);
};
xml3d.webgl.XML3DImgRenderAdapter.prototype = new xml3d.webgl.RenderAdapter();
xml3d.webgl.XML3DImgRenderAdapter.prototype.constructor = xml3d.webgl.XML3DImgRenderAdapter;
xml3d.webgl.XML3DImgRenderAdapter.prototype.notifyChanged = function(evt) {
	this.textureAdapter.notifyChanged(evt);
};

// Adapter for <lightshader>
xml3d.webgl.XML3DLightShaderRenderAdapter = function(factory, node) {
	xml3d.webgl.RenderAdapter.call(this, factory, node);
};
xml3d.webgl.XML3DLightShaderRenderAdapter.prototype = new xml3d.webgl.RenderAdapter();
xml3d.webgl.XML3DLightShaderRenderAdapter.prototype.constructor = xml3d.webgl.XML3DLightShaderRenderAdapter;

})();






