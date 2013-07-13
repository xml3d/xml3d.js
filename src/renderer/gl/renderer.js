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
    IRenderer.prototype.getRenderObjectFromPickingBuffer = function(x,y) {};
    IRenderer.prototype.dispose = function() {};

    /**
     * @param {number} width
     * @param {number} height
     * @returns {{width: number, height: number, scale: number}}
     */
    var calcPickingBufferDimension = function (width, height) {
        var scale = 1.0;

        var hDiff = height - XML3D.webgl.MAX_PICK_BUFFER_HEIGHT;
        var wDiff = width - XML3D.webgl.MAX_PICK_BUFFER_WIDTH;

        if (hDiff > 0 || wDiff > 0) {
            if (hDiff > wDiff) {
                scale = XML3D.webgl.MAX_PICK_BUFFER_HEIGHT / height;
            } else {
                scale = XML3D.webgl.MAX_PICK_BUFFER_WIDTH / width;
            }
        }
        return {
            width: Math.floor(width * scale),
            height: Math.floor(height * scale),
            scale: scale
        }
    }


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
        /** @type {XML3D.webgl.RenderObject} */
        this.currentPickObj = null;

        this.mainPass = new webgl.ForwardRenderPass(context);
        this.pickingPass = this.createPickingPass();new webgl.PickingRenderPass(context, this.width, this.height);

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
            var stats = this.mainPass.renderScene(this.scene);
            this.needDraw = false;
            return stats;
        },
        getRenderObjectFromPickingBuffer : function(x,y) {
            if(this.needsDraw) {
                this.prepareRendering();
                this.pickingPass.renderScene(this.scene);
                this.currentPickObj = this.pickingPass.getRenderObjectFromPickingBuffer(x,y,this.scene);
            }
            return this.currentPickObj;
        },
        prepareRendering : function() {
            this.scene.update();
        },
        createPickingPass : function() {
            var gl = this.context.gl;
            var dim = calcPickingBufferDimension(this.width, this.height);

            var target = new webgl.GLRenderTarget(this.context, {
                width: dim.width,
                height: dim.height,
                colorFormat: gl.RGBA,
                depthFormat: gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer : true,
                scale: dim.scale
            });
            return new webgl.PickingRenderPass(this.context, { target: target });
        },
        dispose: function() {
            this.scene.clear();
        }
    })

    webgl.GLRenderer = GLRenderer;

}(XML3D.webgl));