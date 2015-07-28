var GLContext = require("./base/context.js");
var GLScene = require("./scene/glscene.js");
var GLScaledRenderTarget = require("./base/rendertarget.js").GLScaledRenderTarget;
var DataChangeListener = require("../renderer/tools/datachangelistener.js");
var RenderInterface = require("./render-interface.js");
var PickObjectRenderPass= require("./render-passes/pick-object.js");
var PickPositionRenderPass = require("./render-passes/pick-position.js");
var PickNormalRenderPass = require("./render-passes/pick-normal.js");
var ForwardRenderTree = require("./render-trees/forward.js");
var GLU = require("../../contrib/glu.js");
var Options = require("../../utils/options.js");
var xml3dFormatHandler = require("../../base/formathandler.js").xml3dFormatHandler;
var MAX_PICK_BUFFER_DIMENSION = 512;
var vec3 = require("gl-matrix").vec3;
var quat = require("gl-matrix").quat;
var mat4 = require("gl-matrix").mat4;

var OPTION_SSAO = "renderer-ssao";
var FLAGS = {};
FLAGS[OPTION_SSAO] = {defaultValue: false, recompileOnChange: true};
for (var flag in FLAGS) {
    Options.register(flag, FLAGS[flag].defaultValue);
}

/**
 * Convert the given y-coordinate on the canvas to a y-coordinate appropriate in
 * the GL context. The y-coordinate gets turned upside-down. The lowest possible
 * canvas coordinate is 0, so we need to subtract 1 from the height, too.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} y
 * @return {number} the converted y-coordinate
 */
var canvasToGlY = function (canvas, y) {
    return canvas.height - y - 1;
};
/**
 * @interface
 */
var IRenderer = function () {
};

IRenderer.prototype.renderToCanvas = function () {
};
IRenderer.prototype.handleResizeEvent = function (width, height) {
};
IRenderer.prototype.requestRedraw = function (reason) {
};
IRenderer.prototype.needsRedraw = function () {
};
IRenderer.prototype.getWorldSpaceNormalByPoint = function (obj, x, y) {
};
IRenderer.prototype.getWorldSpacePositionByPoint = function (obj, x, y) {
};
IRenderer.prototype.getRenderObjectFromPickingBuffer = function (x, y) {
};
IRenderer.prototype.generateRay = function (x, y) {
};
IRenderer.prototype.dispose = function () {
};

/**
 * @param {Element} element The <xml3d> Element
 * @implements {IRenderer}
 * @constructor
 */
var GLRenderer = function (element, canvasHandler) {

    this._canvasHandler = canvasHandler;
    var canvas = this._canvasHandler.getCanvas();
    this.context = new GLContext(canvas, this._canvasHandler.id);
    this.scene = new GLScene(this.context);

    var factory = xml3dFormatHandler.getFactory("webgl", this._canvasHandler.id);
    factory.setScene(this.scene);
    factory.setRenderer(this);

    var xml3dAdapter = factory.getAdapter(element);
    xml3dAdapter.traverse(function () {
    });

    /** @type {RenderObject} */
    this.pickedObject = null;

    this.needsDraw = true;
    this.needsPickingDraw = true;
    this.context.requestRedraw = this.requestRedraw.bind(this);

    //Currently used as a helper to calculate view and projection matrices for ray casting, since the scene
    //must be rendered from the point of view of the ray
    this.rayCamera = this.scene.createRenderView();

    this.initGL();
    this.changeListener = new DataChangeListener(this);

    this.renderInterface = this.createRenderInterface();

    this.handleResizeEvent(canvas.clientWidth, canvas.clientHeight);

    Options.addObserver(this.onFlagsChange.bind(this));
};

// Just to satisfy jslint
GLRenderer.prototype.generateRay = function () {
};

XML3D.extend(GLRenderer.prototype, {
    initGL: function () {
        var gl = this.context.gl;

        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.clearStencil(0);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.frontFace(gl.CCW);
        gl.cullFace(gl.BACK);
        gl.disable(gl.CULL_FACE);

        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.BLEND);

        gl.viewport(0, 0, this.width, this.height);

        gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);

    },

    handleResizeEvent: function (width, height) {
        this.width = width;
        this.height = height;
        this.context.handleResizeEvent(width, height);
        this.createDefaultPipelines();
        this.scene.handleResizeEvent(width, height);
        this.needsDraw = this.needsPickingDraw = true;
    },

    createDefaultPipelines: function () {
        var pipeline = new ForwardRenderTree(this.renderInterface, Options.getValue(OPTION_SSAO));
        this.renderInterface.setRenderPipeline(pipeline);

        var pickTarget = new GLScaledRenderTarget(this.context, MAX_PICK_BUFFER_DIMENSION, {
            width: this.context.canvasTarget.width,
            height: this.context.canvasTarget.height,
            colorFormat: this.context.gl.RGBA,
            depthFormat: this.context.gl.DEPTH_COMPONENT16,
            stencilFormat: null,
            depthAsRenderbuffer: true
        });
        this.pickObjectPass = new PickObjectRenderPass(this.renderInterface, pickTarget);
        this.pickPositionPass = new PickPositionRenderPass(this.renderInterface, pickTarget);
        this.pickNormalPass = new PickNormalRenderPass(this.renderInterface, pickTarget);
    },

    createRenderInterface: function () {
        return new RenderInterface(this.context, this.scene);
        //TODO need to provide an interface for creating shaders, buffers and so on
    },

    requestRedraw: function (reason) {
        XML3D.debug.logDebug("Request redraw because:", reason);
        this.needsDraw = true;
        this.needsPickingDraw = true;
    },

    getWorldSpaceNormalByPoint: function (x, y, object) {
        var obj = object || this.pickedObject;
        if (!obj)
            return null;
        y = canvasToGlY(this._canvasHandler.getCanvas(), y);
        this.pickNormalPass.render(obj);
        this.needsPickingDraw = true;
        return this.pickNormalPass.readNormalFromPickingBuffer(x, y);
    },

    getWorldSpacePositionByPoint: function (x, y, object) {
        var obj = object || this.pickedObject;
        if (!obj)
            return null;
        y = canvasToGlY(this._canvasHandler.getCanvas(), y);
        this.pickPositionPass.render(obj);
        this.needsPickingDraw = true;
        return this.pickPositionPass.readPositionFromPickingBuffer(x, y);
    },

    getRenderObjectByRay: function (xml3dRay, viewMat, projMat) {
        var intersectedObjects = this.scene.findRayIntersections(xml3dRay);
        this.pickObjectPass.render(intersectedObjects, viewMat, projMat);
        //Target the middle of the buffer
        var x = Math.floor(this.pickObjectPass.output.getWidth() / 2 / this.pickObjectPass.output.getScale());
        var y = Math.floor(this.pickObjectPass.output.getHeight() / 2 / this.pickObjectPass.output.getScale());
        return this.pickObjectPass.getRenderObjectFromPickingBuffer(x, y, intersectedObjects);

    },

    getWorldSpaceNormalByRay: function (ray, intersectedObject, viewMat, projMat) {
        if (!intersectedObject)
            return null;
        this.pickNormalPass.render(intersectedObject, viewMat, projMat);
        var x = Math.floor(this.pickNormalPass.output.getWidth() / 2 / this.pickNormalPass.output.getScale());
        var y = Math.floor(this.pickNormalPass.output.getHeight() / 2 / this.pickNormalPass.output.getScale());
        return this.pickNormalPass.readNormalFromPickingBuffer(x, y);

    }, getWorldSpacePositionByRay: function (ray, intersectedObject, viewMat, projMat) {
        if (!intersectedObject)
            return null;
        this.pickPositionPass.render(intersectedObject, viewMat, projMat);
        var x = Math.floor(this.pickPositionPass.output.getWidth() / 2 / this.pickPositionPass.output.getScale());
        var y = Math.floor(this.pickPositionPass.output.getHeight() / 2 / this.pickPositionPass.output.getScale());
        return this.pickPositionPass.readPositionFromPickingBuffer(x, y);

    },

    calculateMatricesForRay: function (ray, viewMat, projMat) {
        mat4.multiply(viewMat, mat4.fromTranslation(viewMat, ray.origin.data), this.calculateOrientationForRayDirection(ray));
        this.rayCamera.setLocalMatrix(viewMat);
        this.rayCamera.getWorldToViewMatrix(viewMat);
        var aspect = this.pickObjectPass.output.getWidth() / this.pickObjectPass.output.getHeight();
        this.rayCamera.getProjectionMatrix(projMat, aspect);
    },

    calculateOrientationForRayDirection: (function () {
        var tmpX = vec3.create();
        var tmpY = vec3.create();
        var tmpZ = vec3.create();
        var up = vec3.create();
        var q = quat.create();
        var m = mat4.create();

        return function (ray) {
            vec3.set(up, 0, 1, 0);
            vec3.cross(tmpX, ray.direction.data, up);
            if (!vec3.length(tmpX)) {
                vec3.set(tmpX, 1, 0, 0);
            }
            vec3.cross(tmpY, tmpX, ray.direction.data);
            vec3.negate(tmpZ, ray.direction.data);

            XML3D.math.quat.setFromBasis(q, tmpX, tmpY, tmpZ);
            mat4.fromRotationTranslation(m, q, [0,0,0]);
            return m;
        }
    })(),

    needsRedraw: function () {
        return this.needsDraw;
    },

    renderToCanvas: function () {
        this.needsDraw = false; //Set this early to avoid endless rendering if an exception is thrown during rendering
        this.prepareRendering();
        this.renderInterface.getRenderPipeline().render(this.scene);
        var stats = this.renderInterface.getRenderPipeline().getRenderStats();
        XML3D.debug.logDebug("Rendered to Canvas");
        return stats;
    },

    getRenderObjectFromPickingBuffer: function (x, y) {
        y = canvasToGlY(this._canvasHandler.getCanvas(), y);
        if (this.needsPickingDraw) {
            this.needsPickingDraw = false;
            this.prepareRendering();
            this.scene.updateReadyObjectsFromActiveView(this.pickObjectPass.output.getWidth() / this.pickObjectPass.output.getHeight());
            this.pickObjectPass.render(this.scene.ready);
            XML3D.debug.logDebug("Rendered Picking Buffer");
        }
        this.pickedObject = this.pickObjectPass.getRenderObjectFromPickingBuffer(x, y, this.scene.ready);
        return this.pickedObject;
    },

    prepareRendering: function () {
        this.scene.update();
    },

    /**
     * Uses gluUnProject() to transform the 2D screen point to a 3D ray.
     * Not tested!!
     *
     * @param {number} canvasX
     * @param {number} canvasY
     */
    generateRay: (function () {

        var c_viewMatrix = mat4.create();
        var c_projectionMatrix = mat4.create();

        return function (canvasX, canvasY) {

            var glY = canvasToGlY(this._canvasHandler.getCanvas(), canvasY);

            // setup input to unproject
            var viewport = new Float32Array(4);
            viewport[0] = 0;
            viewport[1] = 0;
            viewport[2] = this.width;
            viewport[3] = this.height;

            // get view and projection matrix arrays
            var view = this.scene.getActiveView();
            view.getWorldToViewMatrix(c_viewMatrix);
            view.getProjectionMatrix(c_projectionMatrix, viewport[2] / viewport[3]);

            var ray = new XML3D.Ray();

            var nearHit = new Float32Array(3);
            var farHit = new Float32Array(3);

            // do unprojections
            if (false === GLU.unProject(canvasX, glY, 0, c_viewMatrix, c_projectionMatrix, viewport, nearHit)) {
                return ray;
            }

            if (false === GLU.unProject(canvasX, glY, 1, c_viewMatrix, c_projectionMatrix, viewport, farHit)) {
                return ray;
            }

            // calculate ray
            mat4.invert(c_viewMatrix, c_viewMatrix);
            ray.origin = vec3.fromValues(c_viewMatrix[12], c_viewMatrix[13], c_viewMatrix[14]);
            ray.direction = vec3.fromValues(farHit[0] - nearHit[0], farHit[1] - nearHit[1], farHit[2] - nearHit[2]);

            return ray;
        }
    }()),

    dispose: function () {
        this.scene.clear();
    },

    getRenderInterface: function () {
        return this.renderInterface;
    },

    onFlagsChange: function (key) {
        if (key == OPTION_SSAO) {
            this.scene.shaderFactory.setShaderRecompile();
            this.createDefaultPipelines();
        }
    }
});

module.exports = GLRenderer;
