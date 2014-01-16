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
        this.rayCamera = this.scene.createRenderView();

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

        getRenderObjectByRay: function(xml3dRay, viewMat, projMat) {
            var intersectedObjects = this.scene.findRayIntersections(xml3dRay);
            this.pickObjectPass.renderObjects(intersectedObjects, viewMat, projMat);
            //Target the middle of the buffer
            var x = Math.floor(this.pickObjectPass.target.getWidth() / 2 / this.pickObjectPass.target.getScale());
            var y = Math.floor(this.pickObjectPass.target.getHeight() / 2 / this.pickObjectPass.target.getScale());
            return this.pickObjectPass.getRenderObjectFromPickingBuffer(x, y, intersectedObjects);

        },

        getWorldSpaceNormalByRay: function (ray, intersectedObject, viewMat, projMat) {
            if (!intersectedObject)
                return null;
            this.pickNormalPass.renderObject(intersectedObject, viewMat, projMat);
            var x = Math.floor(this.pickNormalPass.target.getWidth() / 2 / this.pickNormalPass.target.getScale());
            var y = Math.floor(this.pickNormalPass.target.getHeight() / 2 / this.pickNormalPass.target.getScale());
            return this.pickNormalPass.readNormalFromPickingBuffer(x, y);

        },
        getWorldSpacePositionByRay: function (ray, intersectedObject, viewMat, projMat) {
            if (!intersectedObject)
                return null;
            this.pickPositionPass.renderObject(intersectedObject, viewMat, projMat);
            var x = Math.floor(this.pickPositionPass.target.getWidth() / 2 / this.pickPositionPass.target.getScale());
            var y = Math.floor(this.pickPositionPass.target.getHeight() / 2 / this.pickPositionPass.target.getScale());
            return this.pickPositionPass.readPositionFromPickingBuffer(x, y);

        },

        calculateMatricesForRay: function(ray, viewMat, projMat) {
            this.rayCamera.updatePosition(ray.origin._data);
            this.rayCamera.updateOrientation( this.calculateOrientationForRayDirection(ray) );
            this.rayCamera.getWorldToViewMatrix(viewMat);
            var aspect = this.pickObjectPass.target.getWidth() / this.pickObjectPass.target.getHeight();
            this.rayCamera.getProjectionMatrix(projMat, aspect);
        },

        calculateOrientationForRayDirection: (function() {
            var tmpX = XML3D.math.vec3.create();
            var tmpY = XML3D.math.vec3.create();
            var tmpZ = XML3D.math.vec3.create();
            var up = XML3D.math.vec3.create();
            var q = XML3D.math.quat.create();
            var m = XML3D.math.mat4.create();

            return function(ray) {
                XML3D.math.vec3.set(up, 0, 1, 0);
                XML3D.math.vec3.cross(tmpX, ray.direction._data, up);
                if(!XML3D.math.vec3.length(tmpX)) {
                    XML3D.math.vec3.set(tmpX, 1,0,0);
                }
                XML3D.math.vec3.cross(tmpY, tmpX, ray.direction._data);
                XML3D.math.vec3.negate(tmpZ, ray.direction._data);

                XML3D.math.quat.setFromBasis(tmpX, tmpY, tmpZ, q);
                XML3D.math.mat4.fromRotationTranslation(m, q, [0, 0, 0]);
                return m;
            }
        })(),

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
                this.scene.updateReadyObjectsFromActiveView(this.pickObjectPass.target.getWidth() / this.pickObjectPass.target.getHeight());
                this.pickObjectPass.renderObjects(this.scene.ready);
                this.needsPickingDraw = false;
                XML3D.debug.logDebug("Rendered Picking Buffer");
            }
            this.pickedObject = this.pickObjectPass.getRenderObjectFromPickingBuffer(x, y, this.scene.ready);
            return this.pickedObject;
        },
        prepareRendering: function () {
            this.scene.update();
        },
        createPickingTarget: function () {
            var gl = this.context.gl;

            return new webgl.GLScaledRenderTarget(this.context, webgl.MAX_PICK_BUFFER_DIMENSION, {
                width: this.width,
                height: this.height,
                colorFormat: gl.RGBA,
                depthFormat: gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });
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

    });

    webgl.GLRenderer = GLRenderer;

}(XML3D.webgl));
