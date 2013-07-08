// renderer/renderer.js

(function() {

XML3D.webgl.renderers = [];
var c_tmpVec4 = XML3D.math.vec4.create();


/**
 * Constructor for the Renderer.
 *
 * The renderer is responsible for drawing the scene and determining which object was
 * picked when the user clicks on elements of the canvas.
 * @constructor
 * @param handler The canvas handler
 * @param {WebGLRenderingContext} context Initial width of renderer areas
 * @param {dimensions} width and height of renderer areas
 */
var Renderer = function(handler, context, dimensions) {
    this.handler = handler;
    this.gl = context;
    XML3D.webgl.renderers[handler.id] = this;

    this.setGlobalGLStates();

    this.xml3dNode = handler.xml3dElem;
    this.width = dimensions.width;
    this.height = dimensions.height;

    this.scene = new XML3D.webgl.Scene();

    this.initialize();
};

Renderer.prototype.initialize = function() {
    this.shaderManager = new XML3D.webgl.XML3DShaderManager(this, this.handler.id);
    this.bufferHandler = new XML3D.webgl.XML3DBufferHandler(this.gl, this, this.shaderManager);
    this.changeListener = new XML3D.webgl.DataChangeListener(this);
    this.camera = this.initCamera();
    this.fbos = this.initFrameBuffers(this.gl);

    this.initializeScenegraph();
};

Renderer.prototype.initializeScenegraph = function() {
    this.recursiveBuildScene(this.xml3dNode, this.scene.queue, null);
    this.scene.rootNode.setVisible(true);
    if (this.scene.lights.length < 1) {
        XML3D.debug.logWarning("No lights were found. The scene will be rendered without lighting!");
    }
};


/**
 *
 */
Renderer.prototype.setGlobalGLStates = function() {
    var gl = this.gl;

    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
};

Renderer.prototype.getAdapter = function(node){
    return XML3D.base.resourceManager.getAdapter(node, XML3D.webgl, this.handler.id);
}

Renderer.prototype.initCamera = function() {
    var av = XML3D.util.getOrCreateActiveView(this.xml3dNode);
    var adapter = this.getAdapter(av);
    this.scene.activeView = adapter.getRenderNode();
    return this.scene.activeView;
};

var TraversalState = function(parent) {
    parent = parent || {};
    this.visible = parent.visible !== undefined ? parent.visible : true;
    this.pickable = parent.pickable !== undefined ? parent.visible : true;
    this.transform = parent.transform ? XML3D.math.mat4.copy(XML3D.math.mat4.create(), parent.transform) : XML3D.math.mat4.identity(XML3D.math.mat4.create());
    this.shader = parent.shader || null;
};

Renderer.prototype.recursiveBuildScene = function(currentNode, renderObjectArray, parent) {
    var adapter = this.getAdapter(currentNode);

    parent = parent || new TraversalState();
    var downstream = new TraversalState(parent);

    /*switch(currentNode.nodeName.toLowerCase()) {
    case "group":
        downstream.visible = parent.visible && currentNode.visible;
        if (currentNode.onmouseover || currentNode.onmouseout)
            this.handler.setMouseMovePicking(true);

        var shaderHandle = adapter.getShaderHandle();
        if (shaderHandle)
            downstream.shader = shaderHandle;

        //downstream.transform = adapter.applyTransformMatrix(XML3D.math.mat4.identity(XML3D.math.mat4.create()));
        break;

    case "mesh":

        if (currentNode.onmouseover || currentNode.onmouseout)
            this.handler.setMouseMovePicking(true);

        var meshAdapter = this.getAdapter(currentNode);
        if (!meshAdapter)
            break; //TODO: error handling

        adapter.setShaderHandle(parent.shader);

        // Add a new RenderObject to the scene
//        var newObject = this.scene.createRenderObject({
//            meshAdapter : adapter,
//            visible: parent.visible && currentNode.visible,
//            transform: parent.transform,
//            pickable: parent.pickable
//        });
       // renderObjectArray.push(meshAdapter.renderNode);
        break;

    case "light":
        break;

    case "view":
        adapter.parentTransform = XML3D.math.mat4.copy(XML3D.math.mat4.create(), parent.transform);
        adapter.updateViewMatrix();
        break;
    default:
        break;
    }*/

    var child = currentNode.firstElementChild;
    while (child) {
        this.recursiveBuildScene(child, renderObjectArray, downstream);
        child = child.nextElementSibling;
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
    this.shaderManager.recompileShader(shaderAdapter, this.scene.lights);
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
    var data = this.scene.lights[lightType][field];
    if (!data) return;
    if(field=="falloffAngle" || field=="softness") offset/=3; //some parameters are scalar
    Array.set(data, offset, newValue);
    this.scene.lights.changed = true;
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
	this.fbos = this.initFrameBuffers(this.gl);
    this.camera && (this.camera.setTransformDirty());
};

Renderer.prototype.activeViewChanged = function () {
    this.camera = this.initCamera();
    this.requestRedraw("Active view changed", true);
};

Renderer.prototype.requestRedraw = function(reason, forcePickingRedraw) {
    this.handler.redraw(reason, forcePickingRedraw);
};

Renderer.prototype.sceneTreeAddition = function(evt) {
    var target = evt.wrapped.target;
    var adapter = this.getAdapter(target);

    //If no adapter is found the added node must be a text node, or something else
    //we're not interested in
    if (!adapter)
        return;

    var shaderHandle = adapter.getShaderHandle ? adapter.getShaderHandle() : null;
    if(adapter.updateTransformAdapter)
        adapter.updateTransformAdapter();

    var visible = target.visible;

    var parentNode = target.parentElement;
    var parentTransform = XML3D.math.mat4.identity(XML3D.math.mat4.create());
    if(parentNode && parentNode.nodeName.toLowerCase() == "group")
    {
        var parentAdapter = this.getAdapter(parentNode);
        parentTransform = parentAdapter.applyTransformMatrix(parentTransform);
        if (!shaderHandle)
            shaderHandle = parentAdapter.getShaderHandle();
        visible = parentNode.visible && parentAdapter.parentVisible;
    }

    //Build any new objects and add them to the scene
    var state = new TraversalState({ visible: visible, pickable: true, transform: parentTransform, shader: shaderHandle });
    this.recursiveBuildScene(evt.wrapped.target, this.scene.queue, state);
    this.requestRedraw("A node was added.");
};

Renderer.prototype.sceneTreeRemoval = function (evt) {
    var currentNode = evt.wrapped.target;
    var adapter = this.getAdapter(currentNode);
    if (adapter && adapter.destroy)
        adapter.destroy();

    this.requestRedraw("A node was removed.");
};

Renderer.prototype.prepareRendering = function() {
    var scene = this.scene;
    scene.updateLights(this.scene.lights, this.shaderManager);
    scene.consolidate();
    //scene.updateDirtyObjects();
};


var c_viewMat_tmp = XML3D.math.mat4.create();
var c_projMat_tmp = XML3D.math.mat4.create();
/**
 *
 * @returns {Array}
 */
Renderer.prototype.renderToCanvas = function() {
    var gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.viewport(0, 0, this.width, this.height);
    gl.enable(gl.DEPTH_TEST);

    // Check if we still don't have a camera.
    if (!this.camera)
        return [0, 0];

    var camera = {};
    this.camera.getViewMatrix(c_viewMat_tmp);
    camera.view = c_viewMat_tmp;

    this.scene.ready.forEach( function(obj) {
        obj.updateModelViewMatrix(camera.view);
        obj.updateNormalMatrix();
    });

    this.scene.updateBoundingBox();
    this.camera.getProjectionMatrix(c_projMat_tmp, this.width / this.height);
    camera.proj = c_projMat_tmp;

    this.scene.ready.forEach( function(obj) {
        obj.updateModelViewProjectionMatrix(camera.proj);
    });

    var stats = { objCount : 0, triCount : 0 };

    //Sort objects by shader/transparency
    var opaqueObjects = [];
    var transparentObjects = [];
    this.sortObjects(this.scene.ready, this.scene.firstOpaqueIndex, opaqueObjects, transparentObjects);

    //Render opaque objects
    for (var shaderName in opaqueObjects) {
        var objectArray = opaqueObjects[shaderName];
		this.renderObjectsToActiveBuffer(objectArray, shaderName, this.scene.lights, { transparent: false, stats: stats });
    }

    //Render transparent objects
	if (transparentObjects.length > 0) {
        for (var k=0; k < transparentObjects.length; k++) {
            var objectArray = [transparentObjects[k]];
			this.renderObjectsToActiveBuffer(objectArray, objectArray[0].shader, this.scene.lights, { transparent: true, stats: stats });
        }
    }
	this.scene.lights.changed = false;
    return [stats.objCount, stats.triCount];
};


Renderer.prototype.sortObjects = function(sourceObjectArray, firstOpaque, opaque, transparent) {
    var tempArray = [];
    for (var i = 0, l = sourceObjectArray.length; i < l; i++) {
        var obj = sourceObjectArray[i];
        if(i < firstOpaque) {
            tempArray.push(obj);
        } else {
            opaque[obj.shader.url] = opaque[obj.shader.url] || [];
            opaque[obj.shader.url].push(obj);
        }
    }

    //Sort transparent objects from back to front
    var tlength = tempArray.length;
    if (tlength > 1) {
        for (i = 0; i < tlength; i++) {
            var obj = tempArray[i];
            obj.getWorldMatrix(tmpModelMatrix);
            XML3D.math.vec3.set(obj.mesh.bbox.center()._data, c_tmpVec4);
            c_tmpVec4[3] = 1.0;
            XML3D.math.vec4.transformMat4(c_tmpVec4, c_tmpVec4, tmpModelMatrix);
            c_tmpVec4[3] = 1.0;
            var center = XML3D.math.vec4.transformMat4(c_tmpVec4, c_tmpVec4, tmpModelMatrix);
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
    //console.log("Sorted: " + transparent.length);
};

var tmpModelMatrix = XML3D.math.mat4.create();
var tmpModelView = XML3D.math.mat4.create();
var tmpModelViewProjection = XML3D.math.mat4.create();
var tmpNormalMatrix = XML3D.math.mat3.create();

var identMat3 = XML3D.math.mat3.create();
var identMat4 = XML3D.math.mat4.create();

Renderer.prototype.renderObjectsToActiveBuffer = function(objectArray, shaderId, lights, opts) {
    var objCount = 0;
    var triCount = 0;
    var parameters = {};
    var stats = opts.stats || {};
    var transparent = opts.transparent === true || false;
    var gl = this.gl;

    if (objectArray.length == 0) {
        return;
    }

    if (transparent) {
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }

    // At this point, we have to gurantee (via FSM), that the RenderObject has a valid shader
    var shader = objectArray[0].shader.program;

    if(shader.needsLights || lights.changed) {
        parameters["pointLightPosition"] = lights.point.position;
        parameters["pointLightAttenuation"] = lights.point.attenuation;
        parameters["pointLightVisibility"] = lights.point.visibility;
        parameters["pointLightIntensity"] = lights.point.intensity;
        parameters["directionalLightDirection"] = lights.directional.direction;
        parameters["directionalLightVisibility"] = lights.directional.visibility;
        parameters["directionalLightIntensity"] = lights.directional.intensity;
        parameters["spotLightAttenuation"] = lights.spot.attenuation;
        parameters["spotLightPosition"] = lights.spot.position;
        parameters["spotLightIntensity"] = lights.spot.intensity;
        parameters["spotLightVisibility"] = lights.spot.visibility;
        parameters["spotLightDirection"] = lights.spot.direction;
        parameters["spotLightCosFalloffAngle"] = lights.spot.falloffAngle.map(Math.cos);

        var softFalloffAngle = lights.spot.falloffAngle.slice();
        for(var i = 0; i < softFalloffAngle.length; i++)
            softFalloffAngle[i] = softFalloffAngle[i] * (1.0 - lights.spot.softness[i]);
        parameters["spotLightCosSoftFalloffAngle"] = softFalloffAngle.map(Math.cos);

        parameters["spotLightSoftness"] = lights.spot.softness;
        shader.needsLights = false;
    }



    this.shaderManager.bindShader(shader);
    this.shaderManager.updateActiveShader(shader);
    this.camera.getViewMatrix(c_viewMat_tmp);
    this.camera.getProjectionMatrix(c_projMat_tmp, this.width / this.height);

    parameters["viewMatrix"] = c_viewMat_tmp;
    parameters["projectionMatrix"] = c_projMat_tmp;
    parameters["cameraPosition"] = this.camera.getWorldSpacePosition();
    parameters["screenWidth"] = this.width;

    //Set global data that is shared between all objects using this shader
    this.shaderManager.setUniformVariables(shader, parameters);
    parameters = {};

    for (var i = 0, n = objectArray.length; i < n; i++) {
        var obj = objectArray[i];
        if (!obj.isVisible())
            continue;

        var mesh = obj.mesh;
        XML3D.debug.assert(mesh && mesh.valid, "Mesh has to be valid at his point.");

        obj.getWorldMatrix(tmpModelMatrix);
        parameters["modelMatrix"] = tmpModelMatrix;

        obj.getModelViewMatrix(tmpModelView);
        parameters["modelViewMatrix"] = tmpModelView;

        obj.getModelViewProjectionMatrix(tmpModelViewProjection);
        parameters["modelViewProjectionMatrix"] = tmpModelViewProjection;

        obj.getNormalMatrix(tmpNormalMatrix);
        parameters["normalMatrix"] = tmpNormalMatrix;

        this.shaderManager.setUniformVariables(shader, parameters);
        if(obj.override !== null) {
            this.shaderManager.setUniformVariables(shader, obj.override);
        }

        triCount += this.drawObject(shader, mesh);
        objCount++;

        if(obj.override !== null) {
            this.shaderManager.resetUniformVariables(obj.parent.getShaderHandle(), shader, Object.keys(obj.override));
        }
        if (transparent) {
            gl.disable(gl.BLEND);
        }

    }

    stats.objCount += objCount;
    stats.triCount += triCount;

};

/**
 *
 * @param shader
 * @param {MeshInfo} meshInfo
 * @return {*}
 */
Renderer.prototype.drawObject = function(shader, meshInfo) {
    var sAttributes = shader.attributes;
    var gl = this.gl;
    var triCount = 0;
    var vbos = meshInfo.vbos;

    if(!meshInfo.complete)
        return;

    var numBins = meshInfo.isIndexed ? vbos.index.length : (vbos.position ? vbos.position.length : 1);

    for (var i = 0; i < numBins; i++) {
    //Bind vertex buffers
    for (var name in sAttributes) {
        var shaderAttribute = sAttributes[name];

        if (!vbos[name]) {
            //XML3D.debug.logWarning("Missing required mesh data [ "+name+" ], the object may not render correctly.");
            continue;
        }

        var vbo;
        if (vbos[name].length > 1)
            vbo = vbos[name][i];
        else
            vbo = vbos[name][0];

        //console.log("bindBuffer: ", name , vbo);
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
            gl.drawElements(meshInfo.glType, meshInfo.getElementCount(), gl.UNSIGNED_SHORT, 0);
        }

        triCount = meshInfo.getElementCount() / 3;
    } else {
        if (meshInfo.size) {
            var offset = 0;
            var sd = meshInfo.size.data;
            for (var j = 0; j < sd.length; j++) {
                gl.drawArrays(meshInfo.glType, offset, sd[j]);
                offset += sd[j] * 2; //GL size for UNSIGNED_SHORT is 2 bytes
            }
        } else {
                // console.log("drawArrays: " + meshInfo.getVertexCount());
                gl.drawArrays(meshInfo.glType, 0, meshInfo.getVertexCount());
        }
        triCount = vbos.position ? vbos.position[i].length / 3 : 0;
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

    this.camera.getViewMatrix(c_viewMat_tmp);
    this.camera.getProjectionMatrix(c_projMat_tmp, fbo.width / fbo.height);
    var mvp = XML3D.math.mat4.create();

    var shader = this.shaderManager.getShaderByURL("pickobjectid");
    this.shaderManager.bindShader(shader);
    var objects = this.scene.ready;

    for ( var j = 0, n = objects.length; j < n; j++) {
        var obj = objects[j];
        var mesh = obj.mesh;

        if (!mesh.valid  || !obj.visible)
            continue;

        var parameters = {};

        obj.getWorldMatrix(tmpModelMatrix);
        XML3D.math.mat4.multiply(mvp, c_viewMat_tmp, tmpModelMatrix);
        XML3D.math.mat4.multiply(mvp, c_projMat_tmp, mvp);

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

    pickedObj.getWorldMatrix(tmpModelMatrix);
    this.bbMax = new window.XML3DVec3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE)._data;
    this.bbMin = new window.XML3DVec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE)._data;
    XML3D.webgl.adjustMinMax(pickedObj.mesh.bbox, this.bbMin, this.bbMax, tmpModelMatrix);

    var shader = this.shaderManager.getShaderByURL("pickedposition");
    this.shaderManager.bindShader(shader);

    var modelViewProjMat = XML3D.math.mat4.create();
    pickedObj.getModelViewProjectionMatrix(modelViewProjMat);

    var parameters = {
<<<<<<< HEAD
        bbMin : this.bbMin,
        bbMax : this.bbMax,
        modelMatrix : xform.model,
        modelViewProjectionMatrix : this.camera.getModelViewProjectionMatrix(xform.modelView)
=======
    	min : this.bbMin,
    	max : this.bbMax,
        modelMatrix : tmpModelMatrix,
        modelViewProjectionMatrix : modelViewProjMat
>>>>>>> Added RenderView nodes and adapted renderer
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
Renderer.prototype.renderPickedNormals = (function () {

    var c_mvp = XML3D.math.mat4.create();
    var c_world = XML3D.math.mat4.create();
    var c_normalMatrix3 = XML3D.math.mat3.create();

    return function (pickedObj) {
        var gl = this.gl;
        var fbo = this.fbos.vectorPicking;

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.handle);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);

        pickedObj.getModelViewProjectionMatrix(c_mvp);
        pickedObj.getWorldMatrix(c_world);

        if(XML3D.math.mat4.invert(c_world, c_world)) {
            XML3D.math.mat3.fromMat4(c_normalMatrix3, c_world);
            XML3D.math.mat3.transpose(c_normalMatrix3,c_normalMatrix3);
        } else {
            XML3D.math.mat3.identity(c_normalMatrix3);
        }

        var shader = this.shaderManager.getShaderByURL("pickedNormals");
        this.shaderManager.bindShader(shader);

        var parameters = {
            modelViewProjectionMatrix: c_mvp,
            normalMatrix: c_normalMatrix3
        };

        this.shaderManager.setUniformVariables(shader, parameters);
        this.drawObject(shader, pickedObj.mesh);

        this.shaderManager.unbindShader(shader);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}());

var pickVector = XML3D.math.vec3.create();
var data = new Uint8Array(8);

/**
 * Reads pixels from the screenbuffer to determine picked object or normals.
 *
 * @param {number} screenX Screen Coordinate of color buffer
 * @param {number} screenY Screen Coordinate of color buffer
 * @returns {Element|null} Picked Object
 *
 */
Renderer.prototype.getRenderObjectFromPickingBuffer = function(screenX, screenY) {
    var data = this.readPixelDataFromBuffer(screenX, screenY, this.fbos.picking);

    if (!data)
        return null;

    var result = null;
    var objId = data[0] * 65536 + data[1] * 256 + data[2];

    if (objId > 0) {
        var pickedObj = this.scene.ready[objId - 1];
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
        XML3D.debug.logException(e);
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

        pickVector = XML3D.math.vec3.subtract(XML3D.math.vec3.create(), XML3D.math.vec3.scale(XML3D.math.vec3.create(), pickVector, 2.0), [ 1, 1, 1 ]);

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

        var result = XML3D.math.vec3.subtract(XML3D.math.vec3.create(), this.bbMax, this.bbMin);
        result = XML3D.math.vec3.fromValues(pickVector[0]*result[0], pickVector[1]*result[1], pickVector[2]*result[2]);
        XML3D.math.vec3.add(result, this.bbMin, result);

        return result;
    }
    else{
        return null;
    }
};


/**
 * Frees all resources
 * @return
 */
Renderer.prototype.dispose = function() {
    this.scene.clear();
};

/**
 * Requests a redraw from the handler
 * @return
 */
Renderer.prototype.notifyDataChanged = function() {
    this.handler.redraw("Unspecified data change.");
};

    // Export
    XML3D.webgl.Renderer = Renderer;
})();






