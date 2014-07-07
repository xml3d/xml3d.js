(function (webgl) {

    /**
     * @param context
     * @param opt
     * @constructor
     * @implements IRenderTarget
     */
    var GLCubeMapRenderTarget = function (context, opt) {
        var gl = context.gl;
        this.context = context;
        this.width = opt.width || 800;
        this.height = this.width;
        this.scale = opt.scale || 1;
        this.opt = this.fillOptions(opt);
        this.handle = null;
        this.ctex = null;
        this.dtex = null;
        this.stex = null;
        this.colorTarget = null;
        this.depthTarget =  null;
        this.stencilTarget = null;
        this.valid = false;
        this.glSides = [gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
        this.framebuffers = [];
    };

    XML3D.extend(GLCubeMapRenderTarget.prototype, {
        getWidth: function() {
            return this.width;
        },
        getHeight: function() {
            return this.height;
        },
        getScale: function() {
            return this.scale;
        },
        bind: function (side) {
            var created = false;
            if (this.framebuffers.length <= 0) {
                this.createFrameBuffers(this.opt.colorFormat, this.opt.depthFormat, this.opt.stencilFormat);
                created = true;
            }
            if (this.valid) {
                var gl = this.context.gl;
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[side]);
                // Set default viewport
                created && gl.viewport(0, 0, this.width, this.height);
            }
        },
        unbind: function () {
            var gl = this.context.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },
        resize: function(width, height) {
            this.dispose();
            this.width = width;
            this.height = height;
            this.bind();
        },
        createFrameBuffers: function (colorFormat, depthFormat, stencilFormat) {
            var gl = this.context.gl;

            if(colorFormat) {
                this.ctex = new XML3D.webgl.GLCubeMap(gl);
                this.ctex.createTex2DFromData(colorFormat, this.width, this.height, gl.RGBA, this.opt.colorType || gl.UNSIGNED_BYTE, this.opt);
                this.colorTarget = {
                    handle: this.ctex,
                    isTexture: true
                };
            }
            if(depthFormat) {
                this.opt.isDepth = true;


                if (this.opt.depthAsRenderbuffer) {

                } else {

                    this.dtex = new XML3D.webgl.GLCubeMap(gl);
                    console.log("Depthformat: " + depthFormat + " <-> " + gl.DEPTH_COMPONENT);
                    this.dtex.createTex2DFromData(depthFormat, this.width, this.height, gl.DEPTH_COMPONENT, gl.FLOAT, this.opt);
                    this.depthTarget = {
                        handle: this.dtex,
                        isTexture: true
                    }
                }
            }
            if(stencilFormat) {
                this.stex = new XML3D.webgl.GLCubeMap(gl);
                this.stex.createTex2DFromData(stencilFormat, this.width, this.height, gl.STENCIL_COMPONENT, gl.UNSIGNED_BYTE, this.opt);
                this.stencilTarget = {
                    handle: this.stex,
                    isTexture: true
                }
            }


            for(var i = 0; i < this.glSides.length; ++i) {
                this.framebuffers[i] = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[i]);
                colorFormat && this.createColorTarget(colorFormat, i);
                depthFormat && this.createDepthTarget(depthFormat, i);
                stencilFormat && this.createStencilTarget(stencilFormat, i);
                this.checkStatus();
            }
        },
        createColorTarget: function (colorFormat, side) {
            var gl = this.context.gl;

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.glSides[side], this.ctex.handle, 0);
        },
        createDepthTarget: function (depthFormat, side) {
            var gl = this.context.gl;
            //TODO depthtexture doesnt work...
            if (this.opt.depthAsRenderbuffer) {
                if (!this.dtex) this.dtex = [];
                this.dtex[side] = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, this.dtex[side]);
                gl.renderbufferStorage(gl.RENDERBUFFER, depthFormat, this.width, this.height);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);

                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.dtex[side]);
                if (!this.depthTarget) this.depthTarget = [];
                this.depthTarget[side] = {
                    handle: this.dtex[side],
                    isTexture: false
                }
            }

        },
        createStencilTarget: function (stencilFormat, side) {
            var gl = this.context.gl;

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, this.glSides[side], this.stex.handle, 0);

        },
        checkStatus: function (side) {
            var gl = this.context.gl;

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[side]);
            //Finalize framebuffer creation
            var fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

            switch (fbStatus) {
                case gl.FRAMEBUFFER_COMPLETE:
                    break;
                case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                    XML3D.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
                    break;
                case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                    XML3D.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
                    break;
                case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                    XML3D.debug.logError("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
                    break;
                case gl.FRAMEBUFFER_UNSUPPORTED:
                    XML3D.debug.logError("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
                    break;
                default:
                    XML3D.debug.logError("Incomplete framebuffer: " + fbStatus);
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            this.valid = (fbStatus == gl.FRAMEBUFFER_COMPLETE);
            return this.valid;
        },
        fillOptions: function (options) {
            var gl = this.context.gl;
            var opt = {
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                minFilter: gl.NEAREST,
                magFilter: gl.NEAREST,
                depthMode: gl.LUMINANCE,
                depthCompareMode: gl.COMPARE_R_TO_TEXTURE,
                depthCompareFunc: gl.LEQUAL,
                colorsAsRenderbuffer: false,
                depthAsRenderbuffer: false,
                stencilAsRenderbuffer: false,
                isDepth: false
            };

            for (var item in options) {
                opt[item] = options[item];
            }
            //opt.colorsAsRenderbuffer = false;
            //opt.depthAsRenderbuffer  = false;
            //opt.stencilAsRenderbuffer = false;

            return opt;
        },
        dispose: function () {
            if (this.framebuffers.length <= 0)
                return;

            var gl = this.context.gl;
            for(var side in this.framebuffers)
                gl.deleteFramebuffer(this.framebuffers[side]);

            if (this.colorTarget.handle !== null) {
                    this.colorTarget.handle.dispose();
            }
            if (this.depthTarget !== null) {
                this.depthTarget.handle.dispose();
            }
            if (this.stencilTarget !== null) {
                    this.stencilTarget.handle.dispose();
            }

            this.framebuffers = [];
        }
    });

    webgl.GLCubeMapRenderTarget = GLCubeMapRenderTarget;


}(XML3D.webgl));
