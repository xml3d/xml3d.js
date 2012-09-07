// renderer/renderer.js

(function() {

/**
 * Constructor for the Renderer.
 *
 * The renderer is responsible for drawing the scene and determining which object was
 * picked when the user clicks on elements of the canvas.
 * @constructor
 * @param handler The canvas handler
 * @param {number} width Initial width of renderer areas
 * @param {number} height Initial height of renderer areas
 */
var Renderer = function(handler, width, height) {
    this.handler = handler;
    // TODO: Safe creation and what happens if this fails?
    this.gl = handler.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});

    this.setGlobalStates();
    this.currentView = null;
    this.xml3dNode = handler.xml3dElem;
    this.factory = new XML3D.webgl.XML3DRenderAdapterFactory(handler, this);
	this.dataFactory = new XML3D.data.XML3DDataAdapterFactory(handler);
    this.shaderManager = new XML3D.webgl.XML3DShaderManager(this, this.dataFactory, this.factory);
    this.bufferHandler = new XML3D.webgl.XML3DBufferHandler(this.gl, this, this.shaderManager);
    this.changeListener = new XML3D.webgl.DataChangeListener(this);
    this.camera = this.initCamera();
    this.width = width;
    this.height = height;
    this.fbos = this.initFrameBuffers(this.gl);

    //Light information is needed to create shaders, so process them first
	this.lights = {
	        changed : true,
	        point: { length: 0, adapter: [], intensity: [], position: [], attenuation: [], visibility: [] },
	        directional: { length: 0, adapter: [], intensity: [], direction: [], attenuation: [], visibility: [] }
	};

    this.drawableObjects = new Array();
	this.recursiveBuildScene(this.drawableObjects, this.xml3dNode, true, mat4.identity(mat4.create()), null, false);
    if (this.lights.length < 1) {
        XML3D.debug.logWarning("No lights were found. The scene will be rendered without lighting!");
    }
    this.processShaders(this.drawableObjects);
};

/**
 * Represents a drawable object in the scene.
 *
 * This object holds references to a mesh and shader stored in their respective managers, or in the
 * case of XFlow a local instance of these objects, since XFlow may be applied differently to different
 * instances of the same <data> element. It also holds the current transformation matrix for the object,
 * a flag to indicate visibility (not visible = will not be rendered), and a callback function to be used by
 * any adapters associated with this object (eg. the mesh adapter) to propagate changes (eg. when the
 * parent group's shader is changed).
 *
 * @constructor
 */
Renderer.drawableObject = function() {
    this.mesh = null;
    this.shader = null;
    this.transform = null;
    this.visible = true;
    this.meshNode = null;
    var me = this;

    // A getter for this particular drawableObject. Rather than storing a reference to the drawableObject
    // mesh adapters will store a reference to this function and call it when they need to apply a change.
    // This is just an arbitrary separation to aid in development.
    this.getObject = function() {
        return me;
    };
};

/**
 *
 */
Renderer.prototype.setGlobalStates = function() {
    var gl = this.gl;

    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
};

Renderer.prototype.initCamera = function() {
    var avLink = this.xml3dNode.activeView;
    var av = null;
    if (avLink != "")
        av = XML3D.URIResolver.resolve(avLink);

    if (av == null)
    {
        av =  document.evaluate('.//xml3d:view[1]', this.xml3dNode, function() {
            return XML3D.xml3dNS;
        }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (av == null)
            XML3D.debug.logError("No view defined.");
        this.currentView = av;
        return this.factory.getAdapter(av);
    }
    this.currentView = av;
    return this.factory.getAdapter(av);
};

Renderer.prototype.processShaders = function(objects) {
    for (var i=0, l=objects.length; i < l; i++) {
        var obj = objects[i];
        var groupAdapter = this.factory.getAdapter(obj.meshNode.parentNode);
        var shader = groupAdapter ? groupAdapter.getShader() : null;
        var shaderName = this.shaderManager.createShader(shader, this.lights);
        obj.shader = shaderName;
    }
};

Renderer.prototype.recursiveBuildScene = function(scene, currentNode, visible, transform, parentShader, pickable) {
    var adapter = this.factory.getAdapter(currentNode);
    var downstreamShader = parentShader;
    var downstreamTransform = transform;

    switch(currentNode.nodeName) {
    case "group":
        adapter.parentVisible = visible;
        visible = visible && currentNode.visible;
        if (currentNode.onmouseover || currentNode.onmouseout)
            this.handler.setMouseMovePicking(true);
		if (currentNode.hasAttribute("interactive"))
			pickable = currentNode.getAttribute("interactive") == "true";

        var shader = adapter.getShader();
        downstreamShader = shader ? shader : parentShader;
        adapter.parentTransform = transform;
        adapter.parentShader = parentShader;
        adapter.isVisible = visible;
        downstreamTransform = adapter.applyTransformMatrix(mat4.identity(mat4.create()));
        break;

    case "mesh":
        if (currentNode.onmouseover || currentNode.onmouseout)
            this.handler.setMouseMovePicking(true);
	    if (currentNode.hasAttribute("interactive"))
	    	pickable = currentNode.getAttribute("interactive") == "true";

        var meshAdapter = this.factory.getAdapter(currentNode);
        if (!meshAdapter)
            break; //TODO: error handling

        adapter.parentVisible = visible;

        // Add a new drawable object to the scene
        var newObject = new Renderer.drawableObject();
        newObject.meshNode = currentNode;
        newObject.visible = visible && currentNode.visible;

        // Defer creation of the shaders until after the entire scene is processed, this is
        // to ensure all lights and other shader information is available
        newObject.shader = null;
        newObject.transform = transform;
		newObject.pickable = pickable;
		adapter.registerCallback(newObject.getObject);
		meshAdapter.createMesh();

        scene.push(newObject);
        break;

    case "light":
        adapter.transform = transform;
        adapter.visible = visible && currentNode.visible;
		adapter.addLight(this.lights);
        break;

    case "view":
        adapter.parentTransform = transform;
        adapter.updateViewMatrix();
        break;
    default:
        break;
    }

    var child = currentNode.firstElementChild;
    while (child) {
		this.recursiveBuildScene(scene, child, visible, downstreamTransform, downstreamShader, pickable);
        child = child.nextSibling;
    }
};

Renderer.prototype.initFrameBuffers = function(gl) {
    var fbos = {};

    fbos.picking = this.bufferHandler.createPickingBuffer(this.width, this.height);
    fbos.vectorPicking = this.bufferHandler.createPickingBuffer(this.width, this.height);
    if (!fbos.picking.valid || !fbos.vectorPicking.valid)
        this.handler._pickingDisabled = true;

    return fbos;
};

Renderer.prototype.recompileShader = function(shaderAdapter) {
    this.shaderManager.recompileShader(shaderAdapter, this.lights);
    this.handler.redraw("A shader was recompiled");
};


/**
 *
 * @param {string} lightType
 * @param {string} field
 * @param {number} offset
 * @param {Array.<number>} newValue
 * @return
 */
Renderer.prototype.changeLightData = function(lightType, field, offset, newValue) {
        var data = this.lights[lightType][field];
        if (!data) return;
        Array.set(data, offset, newValue);
        this.lights.changed = true;
};

Renderer.prototype.removeDrawableObject = function(obj) {
    var index = this.drawableObjects.indexOf(obj);
    this.drawableObjects.splice(index, 1);
};

/**
 * Propogates a change in the WebGL context to everyone who needs to know
 **/
Renderer.prototype.setGLContext = function(gl) {
    this.shaderManager.setGLContext(gl);
    this.meshManager.setGLContext(gl);
};

Renderer.prototype.resizeCanvas = function (width, height) {
    this.width = width;
    this.height = height;
};

Renderer.prototype.activeViewChanged = function () {
    this._projMatrix = null;
    this._viewMatrix = null;
    this.camera = this.initCamera();
    this.requestRedraw("Active view changed", true);
};

Renderer.prototype.requestRedraw = function(reason, forcePickingRedraw) {
    this.handler.redraw(reason, forcePickingRedraw);
};

Renderer.prototype.sceneTreeAddition = function(evt) {
    var target = evt.wrapped.target;
    var adapter = this.factory.getAdapter(target);

    //If no adapter is found the added node must be a text node, or something else
    //we're not interested in
    if (!adapter)
        return;

    var transform = mat4.identity(mat4.create());
    var shader = null;
    if (adapter.getShader)
        shader = adapter.getShader();

    var currentNode = evt.wrapped.target;
	var pickable = null;
	var visible = null;
    var didListener = false;
    adapter.isValid = true;

    //Traverse parent group nodes to build any inherited shader and transform elements
    while (currentNode.parentElement) {
        currentNode = currentNode.parentElement;
        if (currentNode.nodeName == "group") {
			var parentAdapter = this.factory.getAdapter(currentNode);
            transform = parentAdapter.applyTransformMatrix(transform);
            if (!shader)
                shader = parentAdapter.getShader();
			if (currentNode.hasAttribute("visible")) {
				var visibleFlag = currentNode.getAttribute("visible");
				visible = visible !== null ? visible : visibleFlag == "true";
			}

			if (currentNode.hasAttribute("interactive")) {
				var pickFlag = currentNode.getAttribute("interactive");
				pickable = pickable !== null ? pickable : pickFlag == "true";
			}

        } else {
            break; //End of nested groups
        }
    }
	visible = visible === null ? true : visible;
    //Build any new objects and add them to the scene
    var newObjects = new Array();
	this.recursiveBuildScene(newObjects, evt.wrapped.target, visible, transform, shader, pickable);
    this.processShaders(newObjects);
    this.drawableObjects = this.drawableObjects.concat(newObjects);

    this.requestRedraw("A node was added.");
};

Renderer.prototype.sceneTreeRemoval = function (evt) {
    var currentNode = evt.wrapped.target;
    var adapter = this.factory.getAdapter(currentNode);
    if (adapter && adapter.destroy)
        adapter.destroy();

    this.requestRedraw("A node was removed.");

};

/**
 *
 * @returns {Array}
 */
Renderer.prototype.render = function() {
    var gl = this.gl;
	var sp = null;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.viewport(0, 0, this.width, this.height);
    gl.enable(gl.DEPTH_TEST);

    // Check if we still don't have a camera.
    if (!this.camera)
        return [0, 0];

    var xform = {};
    xform.view = this.camera.viewMatrix;
    xform.proj = this.camera.getProjectionMatrix(this.width / this.height);

    var stats = { objCount : 0, triCount : 0 };
	// Update mesh objects
	var objects = this.drawableObjects;
	for (var i = 0, l = objects.length; i < l; i++)
    {
	    var o = objects[i];
	    o && o.mesh && o.mesh.update();
    }
    //Sort objects by shader/transparency
    var opaqueObjects = {};
    var transparentObjects = [];
    this.sortObjects(this.drawableObjects, opaqueObjects, transparentObjects, xform);

    //Render opaque objects
    for (var shaderName in opaqueObjects) {
        var objectArray = opaqueObjects[shaderName];
		this.drawObjects(objectArray, shaderName, xform, this.lights, stats);
    }

	if (transparentObjects.length > 0) {
        //Render transparent objects
        //gl.depthMask(gl.FALSE);
        gl.enable(gl.BLEND);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        for (var k=0; k < transparentObjects.length; k++) {
            var objectArray = [transparentObjects[k]];
			this.drawObjects(objectArray, objectArray[0].shader, xform, this.lights, stats);
        }
        gl.disable(gl.BLEND);
        //gl.depthMask(gl.TRUE);
    }

	this.lights.changed = false;

    return [stats.objCount, stats.triCount];
};

Renderer.prototype.sortObjects = function(sourceObjectArray, opaque, transparent, xform) {
    var tempArray = [];
    for (var i = 0, l = sourceObjectArray.length; i < l; i++) {
        var obj = sourceObjectArray[i];
        var shaderName = obj.shader;
        var shader = this.shaderManager.getShaderById(shaderName);

        if (shader.hasTransparency) {
            tempArray.push(obj);
        } else {
            opaque[shaderName] = opaque[shaderName] || [];
            opaque[shaderName].push(obj);
        }
    }

    //Sort transparent objects from back to front
    var tlength = tempArray.length;
    if (tlength > 1) {
        for (i = 0; i < tlength; i++) {
            var obj = tempArray[i];
            var trafo = obj.transform;
            var center = obj.mesh.bbox.center()._data;
            center = mat4.multiplyVec4(trafo, quat4.create([center[0], center[1], center[2], 1.0]));
            center = mat4.multiplyVec4(xform.view, quat4.create([center[0], center[1], center[2], 1.0]));
            tempArray[i] = [ obj, center[2] ];
        }

        tempArray.sort(function(a, b) {
            return a[1] - b[1];
        });

        for (var i=0; i < tlength; i++) {
            transparent[i] = tempArray[i][0];
        }
    } else if (tlength == 1) {
        transparent[0] = tempArray[0];
    }

};

var tmpModelView = mat4.create();
var tmpModelViewProjection = mat4.create();
var identMat3 = mat3.identity(mat3.create());

Renderer.prototype.drawObjects = function(objectArray, shaderId, xform, lights, stats) {
    var objCount = 0;
    var triCount = 0;
    var parameters = {};

    shaderId = shaderId || objectArray[0].shader || "defaultShader";
    var shader = this.shaderManager.getShaderById(shaderId);

    if(shader.needsLights || lights.changed) {
        parameters["pointLightPosition[0]"] = lights.point.position;
        parameters["pointLightAttenuation[0]"] = lights.point.attenuation;
        parameters["pointLightVisibility[0]"] = lights.point.visibility;
        parameters["pointLightIntensity[0]"] = lights.point.intensity;
        parameters["directionalLightDirection[0]"] = lights.directional.direction;
        parameters["directionalLightVisibility[0]"] = lights.directional.visibility;
        parameters["directionalLightIntensity[0]"] = lights.directional.intensity;
        shader.needsLights = false;
    }



    this.shaderManager.bindShader(shader);
    this.shaderManager.updateShader(shader);

    parameters["viewMatrix"] = this.camera.viewMatrix;
    parameters["cameraPosition"] = this.camera.getWorldSpacePosition();

    //Set global data that is shared between all objects using this shader
    this.shaderManager.setUniformVariables(shader, parameters);
    parameters = {};

    for (var i = 0, n = objectArray.length; i < n; i++) {
        var obj = objectArray[i];
        var transform = obj.transform;
        var mesh = obj.mesh;

		if (!mesh || !mesh.valid || !obj.visible)
            continue;

        xform.model = transform;
        xform.modelView = mat4.multiply(this.camera.viewMatrix, xform.model, tmpModelView);
        parameters["modelMatrix"] = xform.model;
        parameters["modelViewMatrix"] = xform.modelView;
        parameters["modelViewProjectionMatrix"] = mat4.multiply(this.camera.projMatrix, xform.modelView, tmpModelViewProjection);
        var normalMatrix = mat4.toInverseMat3(xform.modelView);
        parameters["normalMatrix"] = normalMatrix ? mat3.transpose(normalMatrix) : identMat3;

        this.shaderManager.setUniformVariables(shader, parameters);
        triCount += this.drawObject(shader, mesh);
        objCount++;
    }

    stats.objCount += objCount;
    stats.triCount += triCount;

};


Renderer.prototype.drawObject = function(shader, meshInfo) {
    var sAttributes = shader.attributes;
    var gl = this.gl;
    var triCount = 0;
    var vbos = meshInfo.vbos;

    var numBins = meshInfo.isIndexed ? vbos.index.length : vbos.position.length;

    for (var i = 0; i < numBins; i++) {
    //Bind vertex buffers
        for (var name in sAttributes) {
            var shaderAttribute = sAttributes[name];
            var vbo;

            if (!vbos[name]) {
                XML3D.debug.logWarning("Missing required mesh data [ "+name+" ], the object may not render correctly.");
                continue;
            }

            if (vbos[name].length > 1)
                vbo = vbos[name][i];
            else
                vbo = vbos[name][0];

            gl.enableVertexAttribArray(shaderAttribute.location);
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.vertexAttribPointer(shaderAttribute.location, vbo.tupleSize, vbo.glType, false, 0, 0);
        }

    //Draw the object
        if (meshInfo.isIndexed) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbos.index[i]);

            if (meshInfo.segments) {
                //This is a segmented mesh (eg. a collection of disjunct line strips)
                var offset = 0;
				var sd = meshInfo.segments.value;
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
 * Render the scene using the picking shader.
 * Modifies current picking buffer.
 */
Renderer.prototype.renderSceneToPickingBuffer = function() {
    var gl = this.gl;
    var fbo = this.fbos.picking;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.handle);

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);

    gl.viewport(0, 0, fbo.width, fbo.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    var viewMatrix = this.camera.viewMatrix;
    var projMatrix = this.camera.getProjectionMatrix(fbo.width / fbo.height);
    var mvp = mat4.create();

    var shader = this.shaderManager.getShaderById("pickobjectid");
    this.shaderManager.bindShader(shader);

    for ( var j = 0, n = this.drawableObjects.length; j < n; j++) {
        var obj = this.drawableObjects[j];
        var transform = obj.transform;
        var mesh = obj.mesh;

        if (!mesh.valid  || !obj.visible)
            continue;

        var parameters = {};

        mat4.multiply(viewMatrix, transform, mvp);
        mat4.multiply(projMatrix, mvp, mvp);

        var objId = j+1;
        var c1 = objId & 255;
        objId = objId >> 8;
        var c2 = objId & 255;
        objId = objId >> 8;
        var c3 = objId & 255;

        parameters.id = [c3 / 255.0, c2 / 255.0, c1 / 255.0];
        parameters.modelViewProjectionMatrix = mvp;

        this.shaderManager.setUniformVariables(shader, parameters);
        this.drawObject(shader, mesh);
    }
    this.shaderManager.unbindShader(shader);

    gl.disable(gl.DEPTH_TEST);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

/**
 * Render the picked object using the normal picking shader
 *
 * @param {Object} pickedObj
 */
Renderer.prototype.renderPickedPosition = function(pickedObj) {
    var gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos.vectorPicking.handle);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);

    this.bbMax = new window.XML3DVec3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE)._data;
    this.bbMin = new window.XML3DVec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE)._data;
    XML3D.webgl.adjustMinMax(pickedObj.mesh.bbox, this.bbMin, this.bbMax, pickedObj.transform);

    var shader = this.shaderManager.getShaderById("pickedposition");
    this.shaderManager.bindShader(shader);

    var xform = {};
    xform.model = pickedObj.transform;
    xform.modelView = this.camera.getModelViewMatrix(xform.model);

    var parameters = {
    	min : this.bbMin,
    	max : this.bbMax,
        modelMatrix : xform.model,
        modelViewProjectionMatrix : this.camera.getModelViewProjectionMatrix(xform.modelView)
    };

    this.shaderManager.setUniformVariables(shader, parameters);
    this.drawObject(shader, pickedObj.mesh);

    this.shaderManager.unbindShader(shader);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

/**
 * Render the picked object using the normal picking shader and return the
 * normal at the point where the object was clicked.
 *
 * @param pickedObj
 * @param screenX
 * @param screenY
 * @return
 */
Renderer.prototype.renderPickedNormals = function(pickedObj) {
    var gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos.vectorPicking.handle);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);

    var transform = pickedObj.transform;
    var mesh = pickedObj.mesh;

    var shader = this.shaderManager.getShaderById("pickedNormals");
    this.shaderManager.bindShader(shader);

    var xform = {};
    xform.model = transform;
    xform.modelView = this.camera.getModelViewMatrix(xform.model);

    var normalMatrix = mat4.toInverseMat3(xform.modelView);

    var parameters = {
        modelViewMatrix : transform,
        modelViewProjectionMatrix : this.camera.getModelViewProjectionMatrix(xform.modelView),
        normalMatrix : normalMatrix ? mat3.transpose(normalMatrix) : identMat3
    };

    this.shaderManager.setUniformVariables(shader, parameters);
    this.drawObject(shader, mesh);

    this.shaderManager.unbindShader(shader);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

var pickVector = vec3.create();
var data = new Uint8Array(8);

/**
 * Reads pixels from the screenbuffer to determine picked object or normals.
 *
 * @param {number} screenX Screen Coordinate of color buffer
 * @param {number} screenY Screen Coordinate of color buffer
 * @returns {Element|null} Picked Object
 *
 */
Renderer.prototype.getDrawableFromPickingBuffer = function(screenX, screenY) {
    var data = this.readPixelDataFromBuffer(screenX, screenY, this.fbos.picking);

    if (!data)
        return null;

    var result = null;
    var objId = data[0] * 65536 + data[1] * 256 + data[2];

    if (objId > 0) {
        var pickedObj = this.drawableObjects[objId - 1];
        result = pickedObj;
    }
    return result;
};

/**
 * Reads pixels from the provided buffer
 *
 * @param {number} glX OpenGL Coordinate of color buffer
 * @param {number} glY OpenGL Coordinate of color buffer
 * @param {Object} buffer Buffer to read pixels from
 * @returns {Uint8Array} pixel data
 */
Renderer.prototype.readPixelDataFromBuffer = function(glX, glY, buffer){
    var fbo = buffer;
    var scale = fbo.scale;
    var x = glX * scale;
    var y = glY * scale;
    var gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.handle);
    try {
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return data;
    } catch (e) {
        XML3D.debug.logError(e);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return null;
    }
};

/**
 * Read normal from picking buffer
 * @param {number} glX OpenGL Coordinate of color buffer
 * @param {number} glY OpenGL Coordinate of color buffer
 * @returns {Object} Vector with normal data
 */
Renderer.prototype.readNormalFromPickingBuffer = function(glX, glY){
    var data = this.readPixelDataFromBuffer(glX, glY, this.fbos.vectorPicking);
    if(data){
        pickVector[0] = data[0] / 254;
        pickVector[1] = data[1] / 254;
        pickVector[2] = data[2] / 254;

        pickVector = vec3.subtract(vec3.scale(pickVector, 2.0), vec3.create([ 1, 1, 1 ]));

        return pickVector;
    }
    else{
        return null;
    }
};

/**
 * Read position from picking buffer
 * @param {number} glX OpenGL Coordinate of color buffer
 * @param {number} glY OpenGL Coordinate of color buffer
 * @returns {vec3} The world position at the given coordinates
 */
Renderer.prototype.readPositionFromPickingBuffer = function(glX, glY){
    var data = this.readPixelDataFromBuffer(glX, glY, this.fbos.vectorPicking);
    if(data){
        pickVector[0] = data[0] / 255;
        pickVector[1] = data[1] / 255;
        pickVector[2] = data[2] / 255;

        var result = vec3.subtract(this.bbMax, this.bbMin, vec3.create());
        result = vec3.create([ pickVector[0]*result[0], pickVector[1]*result[1], pickVector[2]*result[2] ]);
        vec3.add(result, this.bbMin, result);

        return result;
    }
    else{
        return null;
    }
};


/**
 * Walks through the drawable objects and destroys each shape and shader
 * @return
 */
Renderer.prototype.dispose = function() {
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
Renderer.prototype.notifyDataChanged = function() {
    this.handler.redraw("Unspecified data change.");
};

    // Export
    XML3D.webgl['Renderer'] = Renderer;
})();






