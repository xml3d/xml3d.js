(function (webgl) {

    /**
     * @interface
     */
    var IRenderTarget = function() {
    };
    IRenderTarget.prototype.bind = function(){};
    IRenderTarget.prototype.unbind = function(){};
    IRenderTarget.prototype.getWidth = function(){};
    IRenderTarget.prototype.getHeight = function(){};
    IRenderTarget.prototype.getScale = function(){};
    IRenderTarget.prototype.resize = function(width, height){};

    /**
     * Wrapper to handle screen context as render target
     * @param {XML3D.webgl.context} context
     * @constructor
     * @implements IRenderTarget
     */
    var GLCanvasTarget = function(context, width, height) {
        this.context = context;
        this.width = width;
        this.height = height;
    };

    var empty = function(){};

    XML3D.extend(GLCanvasTarget.prototype, {
        getWidth: function() { return this.width; },
        getHeight: function() { return this.height; },
        getScale: function() { return 1; },
        bind: empty,
        unbind: empty,
        resize: empty
    });

    /**
     * @param context
     * @param opt
     * @constructor
     * @implements IRenderTarget
     */
    var GLRenderTarget = function (context, opt) {
        this.context = context;
        this.width = opt.width || 800;
        this.height = opt.height || 600;
        this.scale = opt.scale || 1;
        this.opt = this.fillOptions(opt);
        this.handle = null;
        this.colorTarget = { handle: null, isTexture: false };
        this.depthTarget = { handle: null, isTexture: false };
        this.stencilTarget = { handle: null, isTexture: false };
        this.valid = false;
    };

    XML3D.extend(GLRenderTarget.prototype, {
        getWidth: function() {
            return this.width;
        },
        getHeight: function() {
            return this.height;
        },
        getScale: function() {
            return this.scale;
        },
        bind: function () {
            var created = false;
            if (!this.handle) {
                this.createFrameBuffer(this.opt.colorFormat, this.opt.depthFormat, this.opt.stencilFormat);
                created = true;
            }
            if (this.valid) {
                var gl = this.context.gl;
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);
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
        createFrameBuffer: function (colorFormat, depthFormat, stencilFormat) {
            var gl = this.context.gl;

            this.handle = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);
            colorFormat && this.createColorTarget(colorFormat);
            depthFormat && this.createDepthTarget(depthFormat);
            stencilFormat && this.createStencilTarget(stencilFormat);
            this.checkStatus();
        },
        createColorTarget: function (colorFormat) {
            var gl = this.context.gl;
            if (this.opt.colorAsRenderbuffer) {
                var ct = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, ct);
                gl.renderbufferStorage(gl.RENDERBUFFER, colorFormat, this.width, this.height);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);

                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, ct);

                this.colorTarget = {
                    handle: ct,
                    isTexture: false
                };
            } else {
                //opt.generateMipmap = opt.generateColorsMipmap;
                var ctex = new XML3D.webgl.GLTexture(gl);
                ctex.createTex2DFromData(colorFormat, this.width, this.height, gl.RGBA, this.opt.colorType || gl.UNSIGNED_BYTE, this.opt);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ctex.handle, 0);
                this.colorTarget = {
                    handle: ctex,
                    isTexture: true
                };
            }
        },
        createDepthTarget: function (depthFormat) {
            var gl = this.context.gl;
            this.opt.isDepth = true;
            if (this.opt.depthAsRenderbuffer) {
                var dt = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, dt);
                gl.renderbufferStorage(gl.RENDERBUFFER, depthFormat, this.width, this.height);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);

                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, dt);

                this.depthTarget = {
                    handle: dt,
                    isTexture: false
                }
            } else {
                //opt.generateMipmap = opt.generateDepthMipmap;
                var dtex = new XML3D.webgl.GLTexture(gl);
                dtex.createTex2DFromData(depthFormat, this.width, this.height, gl.DEPTH_COMPONENT, gl.FLOAT, this.opt);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, dtex.handle, 0);

                this.depthTarget = {
                    handle: dtex,
                    isTexture: true
                }
            }
        },
        createStencilTarget: function (stencilFormat) {
            var gl = this.context.gl;
            if (this.opt.stencilAsRenderbuffer) {
                var st = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, st);
                gl.renderbufferStorage(gl.RENDERBUFFER, stencilFormat, this.width, this.height);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);

                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, st);

                this.stencilTarget = {
                    handle: st,
                    isTexture: false
                }
            }
            else {
                //opt.generateMipmap = opt.generateStencilMipmap;
                var stex = new XML3D.webgl.GLTexture(gl);
                stex.createTex2DFromData(stencilFormat, this.width, this.height, gl.STENCIL_COMPONENT, this.opt.colorType || gl.UNSIGNED_BYTE, this.opt);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.TEXTURE_2D, stex.handle, 0);

                this.stencilTarget = {
                    handle: stex,
                    isTexture: true
                }
            }
        },
        checkStatus: function () {
            var gl = this.context.gl;

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);
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
            return opt;
        },
        dispose: function () {
            if (!this.handle)
                return;

            var gl = this.context.gl;
            gl.deleteFramebuffer(this.handle);

            if (this.colorTarget !== null) {
                if (this.colorTarget.isTexture)
                    this.colorTarget.handle.dispose();
                else
                    gl.deleteRenderBuffer(this.colorTarget.handle);
            }
            if (this.depthTarget !== null) {
                if (this.depthTarget.isTexture)
                    this.depthTarget.handle.dispose();
                else
                    gl.deleteRenderBuffer(this.depthTarget.handle);
            }
            if (this.stencilTarget !== null) {
                if (this.stencilTarget.isTexture)
                    this.stencilTarget.handle.dispose();
                else
                    gl.deleteRenderBuffer(this.stencilTarget.handle);
            }
        }
    });

    var GLScaledRenderTarget = function(context, maxDimension, opt) {
          GLRenderTarget.call(this, context, opt);
          this.scaleToMaxDimension(maxDimension);
    };

    XML3D.createClass(GLScaledRenderTarget, GLRenderTarget);
    XML3D.extend(GLScaledRenderTarget.prototype, {
        scaleToMaxDimension: function(maxDimension) {
            var hDiff = this.height - maxDimension;
            var wDiff = this.width - maxDimension;

            if (hDiff > 0 || wDiff > 0) {
                var scale;
                if (hDiff > wDiff) {
                    scale = maxDimension / this.height;
                } else {
                    scale = maxDimension / this.width;
                }
                this.width = Math.floor(this.width * scale);
                this.height = Math.floor(this.height * scale);
                this.scale = scale;
            }
        }
    });

    webgl.GLCanvasTarget = GLCanvasTarget;
    webgl.GLRenderTarget = GLRenderTarget;
    webgl.GLScaledRenderTarget = GLScaledRenderTarget;


}(XML3D.webgl));