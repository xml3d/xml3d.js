(function(webgl){
    /**
     * @interface
     */
    var IRenderer = function() {

    };

    IRenderer.prototype.renderToCanvas = function() {};
    IRenderer.prototype.resizeCanvas = function(width, height) {};
    IRenderer.prototype.requestRedraw = function(reason, forcePickingRedraw) {};
    IRenderer.prototype.needsRedraw = function() {};
    IRenderer.prototype.getWorldSpaceNormalByPoint = function(obj, x, y) {};
    IRenderer.prototype.getWorldSpacePositionByPoint = function(obj, x, y) {};
    IRenderer.prototype.getRenderObjectFromPickingBuffer = function(x,y) {};
    IRenderer.prototype.dispose = function() {};

    /**
     * @implements {IRenderer}
     * @constructor
     */
    var GLRenderer = function(context, scene, canvas) {
        this.context = context;
        this.scene = scene;
        this.canvas = canvas;
        this.width = canvas.clientWidth;
        this.height = canvas.clientHeight;

        /** @type {XML3D.webgl.RenderObject} */
        this.pickedObject = null;

        this.needsDraw = true;
        this.needPickingDraw = true;
        this.pickingDisabled = false;

        this.context.requestRedraw = this.requestRedraw.bind(this);
        this.mainPass = new webgl.ForwardRenderPass(context);
        var pickingTarget = this.createPickingTarget();
        this.pickingPass = new webgl.PickingRenderPass(this.context, { target: pickingTarget });
        this.pickPositionPass = new webgl.PickPositionRenderPass(this.context, { target: pickingTarget });
        this.pickNormalPass = new webgl.PickNormalRenderPass(this.context, { target: pickingTarget });

        this.init();
    };

    XML3D.extend(GLRenderer.prototype, {
        init: function() {
            var gl = this.context.gl;

            gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);

            this.changeListener = new XML3D.webgl.DataChangeListener(this);

        },
        resizeCanvas : function (width, height) {
            this.width = width;
            this.height = height;
            this.initFrameBuffers();
            this.camera && (this.camera.setTransformDirty());
        },
        initFrameBuffers: function() {
            /*var fbos = {};

            fbos.picking = this.bufferHandler.createPickingBuffer(this.width, this.height);
            fbos.vectorPicking = this.bufferHandler.createPickingBuffer(this.width, this.height);
            if (!fbos.picking.valid || !fbos.vectorPicking.valid) {
                XML3D.debug.logError("Picking buffer creation failed. Disabled picking");
                this.pickingDisabled = true;
            } */
        },
        requestRedraw: function(reason, forcePickingRedraw) {
            XML3D.debug.logDebug("Request redraw because:", reason);
            this.needsDraw = true;
        },
        getWorldSpaceNormalByPoint: function(obj, x,y) {
            obj = obj || this.pickedObject;
            if (!obj)
                return null;
            y = webgl.canvasToGlY(this.canvas, y);
            this.pickNormalPass.renderObject(obj);
            return this.pickNormalPass.readNormalFromPickingBuffer(x, y);
        },
        getWorldSpacePositionByPoint: function(obj,x,y) {
            obj = obj || this.pickedObject;
            if (!obj)
                return null;
            y = webgl.canvasToGlY(this.canvas, y);
            this.pickPositionPass.renderObject(obj);
            return this.pickPositionPass.readPositionFromPickingBuffer(x, y);
        },

        needsRedraw : function() {
            return this.needsDraw;
        },
        renderToCanvas : function() {
            this.prepareRendering();
            var stats = this.mainPass.renderScene(this.scene);
            this.needsDraw = false;
            return stats;
        },
        getRenderObjectFromPickingBuffer : function(x,y) {
            y = webgl.canvasToGlY(this.canvas, y);
            //if(this.needsDraw) {
                this.prepareRendering();
                this.pickingPass.renderScene(this.scene);
                this.pickedObject = this.pickingPass.getRenderObjectFromPickingBuffer(x,y,this.scene);
            //}
            return this.pickedObject;
        },
        prepareRendering : function() {
            this.scene.update();
        },
        createPickingTarget : function() {
            var gl = this.context.gl;

            var target = new webgl.GLScaledRenderTarget(this.context, webgl.MAX_PICK_BUFFER_DIMENSION, {
                width: this.width,
                height: this.height,
                colorFormat: gl.RGBA,
                depthFormat: gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer : true
            });
            return target;
        },
        createPickPositionPass : function() {


            return new webgl.PickPositionPass(this.context);
        },
        dispose: function() {
            this.scene.clear();
        }
    })

    webgl.GLRenderer = GLRenderer;

}(XML3D.webgl));