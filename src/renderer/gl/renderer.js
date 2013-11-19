(function (webgl) {
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
     * @implements {IRenderer}
     * @constructor
     */
    var GLRenderer = function (context, scene, canvas) {
        this.context = context;
        this.scene = scene;
        this.canvas = canvas;
        this.width = canvas.clientWidth;
        this.height = canvas.clientHeight;

        /** @type {XML3D.webgl.RenderObject} */
        this.pickedObject = null;

        this.needsDraw = true;
        this.needsPickingDraw = true;
        this.context.requestRedraw = this.requestRedraw.bind(this);


        this.initGL();
        this.changeListener = new XML3D.webgl.DataChangeListener(this);

        this.createRenderPasses(context);
    };

    // Just to satisfy jslint
    GLRenderer.prototype.generateRay = function() {};

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
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);

        },
        handleResizeEvent: function (width, height) {
            this.width = width;
            this.height = height;
            this.context.handleResizeEvent(width, height);
            this.createRenderPasses(this.context);
            this.scene.handleResizeEvent(width, height);
            this.needsDraw = this.needsPickingDraw = true;
        },
        createRenderPasses: function (context) {
            var pickingTarget = this.createPickingTarget();
            this.mainPass = new webgl.ForwardRenderPass(context, { target:  context.canvasTarget });
            this.pickObjectPass = new webgl.PickObjectRenderPass(context, { target:  this.createPickingTarget() });
            this.pickPositionPass = new webgl.PickPositionRenderPass(context, { target: pickingTarget });
            this.pickNormalPass = new webgl.PickNormalRenderPass(context, { target: pickingTarget });
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
            y = webgl.canvasToGlY(this.canvas, y);
            this.pickNormalPass.renderObject(obj);
            return this.pickNormalPass.readNormalFromPickingBuffer(x, y);
        },
        getWorldSpacePositionByPoint: function (x, y, object) {
            var obj = object || this.pickedObject;
            if (!obj)
                return null;
            y = webgl.canvasToGlY(this.canvas, y);
            this.pickPositionPass.renderObject(obj);
            return this.pickPositionPass.readPositionFromPickingBuffer(x, y);
        },

        needsRedraw: function () {
            return this.needsDraw;
        },
        renderToCanvas: function () {
            this.prepareRendering();
            var stats = this.mainPass.renderScene(this.scene);
            XML3D.debug.logDebug("Rendered to Canvas");
            this.needsDraw = false;
            return stats;
        },
        getRenderObjectFromPickingBuffer: function (x, y) {
            y = webgl.canvasToGlY(this.canvas, y);
            if(this.needsPickingDraw) {
                this.prepareRendering();
                this.pickObjectPass.renderScene(this.scene);
                this.needsPickingDraw = false;
                XML3D.debug.logDebug("Rendered Picking Buffer");
            }
            this.pickedObject = this.pickObjectPass.getRenderObjectFromPickingBuffer(x, y, this.scene);
            return this.pickedObject;
        },
        prepareRendering: function () {
            this.scene.update();
        },
        createPickingTarget: function () {
            var gl = this.context.gl;

            var target = new webgl.GLScaledRenderTarget(this.context, webgl.MAX_PICK_BUFFER_DIMENSION, {
                width: this.width,
                height: this.height,
                colorFormat: gl.RGBA,
                depthFormat: gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });
            return target;
        },
        /**
         * Uses gluUnProject() to transform the 2D screen point to a 3D ray.
         * Not tested!!
         *
         * @param {number} canvasX
         * @param {number} canvasY
         */
        generateRay: (function () {

            var c_viewMatrix = XML3D.math.mat4.create();
            var c_projectionMatrix = XML3D.math.mat4.create();

            return function (canvasX, canvasY) {

                var glY = XML3D.webgl.canvasToGlY(this.canvas, canvasY);

                // setup input to unproject
                var viewport = new Array();
                viewport[0] = 0;
                viewport[1] = 0;
                viewport[2] = this.width;
                viewport[3] = this.height;

                // get view and projection matrix arrays
                var view = this.scene.getActiveView();
                view.getWorldToViewMatrix(c_viewMatrix);
                view.getProjectionMatrix(c_projectionMatrix, viewport[2] / viewport[3]);

                var ray = new window.XML3DRay();

                var nearHit = new Array();
                var farHit = new Array();

                // do unprojections
                if (false === GLU.unProject(canvasX, glY, 0, c_viewMatrix, c_projectionMatrix, viewport, nearHit)) {
                    return ray;
                }

                if (false === GLU.unProject(canvasX, glY, 1, c_viewMatrix, c_projectionMatrix, viewport, farHit)) {
                    return ray;
                }

                // calculate ray
                XML3D.math.mat4.invert(c_viewMatrix, c_viewMatrix);
                var viewPos = new window.XML3DVec3(c_viewMatrix[12], c_viewMatrix[13], c_viewMatrix[14]);

                ray.origin.set(viewPos);
                ray.direction.set(farHit[0] - nearHit[0], farHit[1] - nearHit[1], farHit[2] - nearHit[2]);
                ray.direction.set(ray.direction.normalize());

                return ray;
            }
        }()),
        dispose: function () {
            this.scene.clear();
        }

    })

    webgl.GLRenderer = GLRenderer;

}(XML3D.webgl));
