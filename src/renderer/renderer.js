// renderer/renderer.js
(function() {

XML3D.webgl.renderers = [];

    var RendererFactory = function() {
        this.createRenderer = function(context, scene, canvas) {
            return new XML3D.webgl.GLRenderer(context, scene, canvas);
        }
    }


    XML3D.webgl.rendererFactory = new RendererFactory();



/*GLRenderer.prototype.initializeScenegraph = function() {
    this.recursiveBuildScene(this.xml3dNode, this.scene.queue);
    this.scene.rootNode.setVisible(true);
    if (this.scene.lights.length() < 1) {
        XML3D.debug.logWarning("No lights were found. The scene will be rendered without lighting!");
    }
};

GLRenderer.prototype.initCamera = function() {
    var av = XML3D.util.getOrCreateActiveView(this.xml3dNode);
    var adapter = this.getAdapter(av);
    this.scene.activeView = adapter.getRenderNode();
    return this.scene.activeView;
};

GLRenderer.prototype.recursiveBuildScene = function(currentNode, renderObjectArray) {
    var adapter = this.getAdapter(currentNode);
    var child = currentNode.firstElementChild;
    while (child) {
        this.recursiveBuildScene(child, renderObjectArray);
        child = child.nextElementSibling;
    }
};*/

var GLRenderer = function() {};

/**
 *
 * @param {string} lightType
 * @param {string} field
 * @param {number} offset
 * @param {Array.<number>} newValue
 * @return
 */
GLRenderer.prototype.changeLightData = function(lightType, field, offset, newValue) {
    var data = this.scene.lights[lightType][field];
    if (!data) return;
    if(field=="falloffAngle" || field=="softness") offset/=3; //some parameters are scalar
    Array.set(data, offset, newValue);
    this.scene.lights.changed = true;
};

GLRenderer.prototype.sceneTreeAddition = function(evt) {
    this.recursiveBuildScene(evt.wrapped.target, this.scene.queue);
    this.requestRedraw("A node was added.");
};

GLRenderer.prototype.sceneTreeRemoval = function (evt) {
    var currentNode = evt.wrapped.target;
    var adapter = this.getAdapter(currentNode);
    if (adapter && adapter.destroy)
        adapter.destroy();

    this.requestRedraw("A node was removed.");
};




/**
 * Render the scene using the picking shader.
 * Modifies current picking buffer.
 */
GLRenderer.prototype.renderSceneToPickingBuffer = (function () {

    var c_mvp = XML3D.math.mat4.create();

    return function () {
        var gl = this.context.gl;
        var fbo = this.fbos.picking;

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.handle);

        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);

        gl.viewport(0, 0, fbo.width, fbo.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    var shader = this.context.programFactory.getPickingObjectIdProgram();
    shader.bind();
        var objects = this.scene.ready;

        for (var j = 0, n = objects.length; j < n; j++) {
            var obj = objects[j];
            var mesh = obj.mesh;

            if (!mesh.valid || !obj.visible)
                continue;

            var parameters = {};

            obj.getModelViewProjectionMatrix(c_mvp);

            var objId = j + 1;
            var c1 = objId & 255;
            objId = objId >> 8;
            var c2 = objId & 255;
            objId = objId >> 8;
            var c3 = objId & 255;

            parameters.id = [c3 / 255.0, c2 / 255.0, c1 / 255.0];
            parameters.modelViewProjectionMatrix = c_mvp;

        shader.setUniformVariables(parameters);
            this.drawObject(shader, mesh);
        }
    shader.unbind(shader);

        gl.disable(gl.DEPTH_TEST);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
}());

    /**
 * Render the picked object using the normal picking shader
 *
 * @param {Object} pickedObj
 */
GLRenderer.prototype.renderPickedPosition = function(pickedObj) {
    var gl = this.context.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos.vectorPicking.handle);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);

    pickedObj.getWorldMatrix(tmpModelMatrix);
    this.bbMax = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];
    this.bbMin = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
    var objBB = new XML3D.webgl.BoundingBox();
    pickedObj.getObjectSpaceBoundingBox(objBB.min, objBB.max);
    XML3D.webgl.adjustMinMax(objBB, this.bbMin, this.bbMax, tmpModelMatrix);

    var shader = this.programFactory.getPickingPositionProgram();
    shader.bind();

    var modelViewProjMat = XML3D.math.mat4.create();
    pickedObj.getModelViewProjectionMatrix(modelViewProjMat);

    var parameters = {
        bbMin : this.bbMin,
        bbMax : this.bbMax,
        modelMatrix : tmpModelMatrix,
        modelViewProjectionMatrix : modelViewProjMat
    };

    shader.setUniformVariables(parameters);
    this.drawObject(shader, pickedObj.mesh);

    shader.unbind();

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
GLRenderer.prototype.renderPickedNormals = (function () {

    var c_mvp = XML3D.math.mat4.create();
    var c_world = XML3D.math.mat4.create();
    var c_normalMatrix3 = XML3D.math.mat3.create();

    return function (pickedObj) {
        var gl = this.context.gl;
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

    var shader = this.programFactory.getPickingNormalProgram();
    shader.bind();

        var parameters = {
            modelViewProjectionMatrix: c_mvp,
            normalMatrix: c_normalMatrix3
        };

    shader.setUniformVariables(shader);
        this.drawObject(shader, pickedObj.mesh);
    shader.unbind();
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
GLRenderer.prototype.getRenderObjectFromPickingBuffer = function(screenX, screenY) {
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
GLRenderer.prototype.readPixelDataFromBuffer = function(glX, glY, buffer){
    var fbo = buffer;
    var scale = fbo.scale;
    var x = glX * scale;
    var y = glY * scale;
    var gl = this.context.gl;

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
GLRenderer.prototype.readNormalFromPickingBuffer = function(glX, glY){
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
GLRenderer.prototype.readPositionFromPickingBuffer = function(glX, glY){
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

})();






