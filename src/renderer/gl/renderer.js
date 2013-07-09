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
    IRenderer.prototype.getWorldSpaceNormalByPoint = function(x,y) {};
    IRenderer.prototype.getWorldSpacePositionByPoint = function(x,y) {};
    IRenderer.prototype.dispose = function() {};


    /** @interface */
    XML3D.webgl.IRenderer = IRenderer;

    /**
     * @implements {IRenderer}
     * @constructor
     */
    var GLRenderer = function(context, scene, canvas) {
        this.context = context;
        this.scene = scene;
        this.width = canvas.clientWidth;
        this.height = canvas.clientHeight;
        this.pickedObject = null;
        this.needsDraw = true;
        this.needPickingDraw = true;
        this.pickingDisabled = false;

        this.mainPass = new webgl.ForwardRenderPass(context);

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

            this.bufferHandler = new XML3D.webgl.XML3DBufferHandler(this.context.gl, this);
            this.changeListener = new XML3D.webgl.DataChangeListener(this);

            this.initFrameBuffers();
        },
        resizeCanvas : function (width, height) {
            this.width = width;
            this.height = height;
            this.initFrameBuffers();
            this.camera && (this.camera.setTransformDirty());
        },
        initFrameBuffers: function() {
            var fbos = {};

            fbos.picking = this.bufferHandler.createPickingBuffer(this.width, this.height);
            fbos.vectorPicking = this.bufferHandler.createPickingBuffer(this.width, this.height);
            if (!fbos.picking.valid || !fbos.vectorPicking.valid) {
                XML3D.debug.logError("Picking buffer creation failed. Disabled picking");
                this.pickingDisabled = true;
            }

            this.fbos = fbos;
        },
        requestRedraw: function(reason, forcePickingRedraw) {

        },
        getWorldSpaceNormalByPoint: function(x,y) {
            if (!this.pickedObject || this._pickingDisabled)
                return null;

            this.renderPickedNormals(this.pickedObject);
            return; // Something
        },
        getWorldSpacePositionByPoint: function(x,y) {
            if (!this.pickedObject)
                return null;

            this.renderPickedPosition(this.pickedObject);
            return this.readPositionFromPickingBuffer(x, y);
        },
        needsRedraw : function() {
            return this.needsDraw;
        },
        renderToCanvas : function() {
            this.prepareRendering();
            var stats = this.mainPass.renderToCanvas(this.scene, this.width, this.height);
            this.needDraw = false;
            return stats;
        },
        prepareRendering : function() {
            this.scene.update();
        }
    })

    webgl.GLRenderer = GLRenderer;

}(XML3D.webgl));