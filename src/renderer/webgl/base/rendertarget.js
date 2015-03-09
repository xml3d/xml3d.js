/**
 * @interface
 */
var IRenderTarget = function () {
};
IRenderTarget.prototype.bind = function () {
};
IRenderTarget.prototype.unbind = function () {
};
IRenderTarget.prototype.getWidth = function () {
};
IRenderTarget.prototype.getHeight = function () {
};
IRenderTarget.prototype.getScale = function () {
};
IRenderTarget.prototype.resize = function (width, height) {
};

/**
 * Wrapper to handle screen context as render target
 * @constructor
 * @param {GLContext} context
 * @param {Number} width
 * @param {Number} height
 * @implements IRenderTarget
 */
var GLCanvasTarget = function (context, width, height) {
    this.context = context;
    this.width = width;
    this.height = height;
};

var empty = function () {
};

XML3D.extend(GLCanvasTarget.prototype, {
    getWidth: function () {
        return this.width;
    }, getHeight: function () {
        return this.height;
    }, getScale: function () {
        return 1;
    }, bind: empty, unbind: empty, resize: empty
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
    this.colorTarget = {handle: null, isTexture: false};
    this.depthTarget = {handle: null, isTexture: false};
    this.stencilTarget = {handle: null, isTexture: false};
    this.valid = false;
};

XML3D.extend(GLRenderTarget.prototype, {
    getWidth: function () {
        return this.width;
    }, getHeight: function () {
        return this.height;
    }, getScale: function () {
        return this.scale;
    }, bind: function () {
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
    }, unbind: function () {
        var gl = this.context.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }, resize: function (width, height) {
        this.dispose();
        this.width = width;
        this.height = height;
        this.bind();
    }, createFrameBuffer: function (colorFormat, depthFormat, stencilFormat) {
        var gl = this.context.gl;

        this.handle = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);
        colorFormat && this.createColorTarget(colorFormat);
        depthFormat && this.createDepthTarget(depthFormat);
        stencilFormat && this.createStencilTarget(stencilFormat);
        this.checkStatus();
    }, createColorTarget: function (colorFormat) {
        var gl = this.context.gl;
        if (this.opt.colorAsRenderbuffer) {
            var ct = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, ct);
            gl.renderbufferStorage(gl.RENDERBUFFER, colorFormat, this.width, this.height);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);

            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, ct);

            this.colorTarget = {
                handle: ct, isTexture: false
            };
        } else {
            //opt.generateMipmap = opt.generateColorsMipmap;
            var ctex = this.context.createTexture();
            ctex.createTex2DFromData(colorFormat, this.width, this.height, gl.RGBA, this.opt.colorType || gl.UNSIGNED_BYTE, this.opt);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ctex.handle, 0);
            this.colorTarget = {
                handle: ctex, isTexture: true
            };
        }
    }, createDepthTarget: function (depthFormat) {
        var gl = this.context.gl;
        this.opt.isDepth = true;
        if (this.opt.depthAsRenderbuffer) {
            var dt = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, dt);
            gl.renderbufferStorage(gl.RENDERBUFFER, depthFormat, this.width, this.height);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);

            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, dt);

            this.depthTarget = {
                handle: dt, isTexture: false
            }
        } else {
            //opt.generateMipmap = opt.generateDepthMipmap;
            var dtex = this.context.createTexture();
            dtex.createTex2DFromData(depthFormat, this.width, this.height, gl.DEPTH_COMPONENT, gl.FLOAT, this.opt);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, dtex.handle, 0);

            this.depthTarget = {
                handle: dtex, isTexture: true
            }
        }
    }, createStencilTarget: function (stencilFormat) {
        var gl = this.context.gl;
        if (this.opt.stencilAsRenderbuffer) {
            var st = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, st);
            gl.renderbufferStorage(gl.RENDERBUFFER, stencilFormat, this.width, this.height);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);

            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, st);

            this.stencilTarget = {
                handle: st, isTexture: false
            }
        } else {
            //opt.generateMipmap = opt.generateStencilMipmap;
            var stex = this.context.createTexture();
            stex.createTex2DFromData(stencilFormat, this.width, this.height, gl.STENCIL_COMPONENT, gl.UNSIGNED_BYTE, this.opt);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.TEXTURE_2D, stex.handle, 0);

            this.stencilTarget = {
                handle: stex, isTexture: true
            }
        }
    }, checkStatus: function () {
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
    }, fillOptions: function (options) {
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
    }, dispose: function () {
        if (!this.handle)
            return;

        var gl = this.context.gl;
        gl.deleteFramebuffer(this.handle);

        if (this.colorTarget !== null) {
            if (this.colorTarget.isTexture)
                this.colorTarget.handle.dispose(); else
                gl.deleteRenderBuffer(this.colorTarget.handle);
        }
        if (this.depthTarget !== null) {
            if (this.depthTarget.isTexture)
                this.depthTarget.handle.dispose(); else
                gl.deleteRenderBuffer(this.depthTarget.handle);
        }
        if (this.stencilTarget !== null) {
            if (this.stencilTarget.isTexture)
                this.stencilTarget.handle.dispose(); else
                gl.deleteRenderBuffer(this.stencilTarget.handle);
        }
    }
});

var GLScaledRenderTarget = function (context, maxDimension, opt) {
    GLRenderTarget.call(this, context, opt);
    this.scaleToMaxDimension(maxDimension);
};

XML3D.createClass(GLScaledRenderTarget, GLRenderTarget);
XML3D.extend(GLScaledRenderTarget.prototype, {
    scaleToMaxDimension: function (maxDimension) {
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

            if(colorFormat) { //TODO check if renderbuffers instead of textures...
                this.ctex = this.context.createCubeMap();
                this.ctex.createTex2DFromData(colorFormat, this.width, this.height, gl.RGBA, this.opt.colorType || gl.UNSIGNED_BYTE, this.opt);
                this.colorTarget = { handle: this.ctex,  isTexture: true};
            }
            if(depthFormat) {
                this.opt.isDepth = true;

                if (this.opt.depthAsRenderbuffer) {
                } else {
                    this.dtex = this.context.createCubeMap();
                    this.dtex.createTex2DFromData(depthFormat, this.width, this.height, gl.DEPTH_COMPONENT, gl.FLOAT, this.opt);
                    this.depthTarget = { handle: this.dtex,  isTexture: true};
                }
            }
            if(stencilFormat) {
                this.stex = this.context.createCubeMap();
                this.stex.createTex2DFromData(stencilFormat, this.width, this.height, gl.STENCIL_COMPONENT, gl.UNSIGNED_BYTE, this.opt);
                this.stencilTarget = { handle: this.stex, isTexture: true};
            }

            for(var i = 0; i < this.glSides.length; ++i) {
                this.framebuffers[i] = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[i]);
                colorFormat && this.createColorTarget(colorFormat, i);
                depthFormat && this.createDepthTarget(depthFormat, i);
                stencilFormat && this.createStencilTarget(stencilFormat, i);
                this.checkStatus(i);
            }
        },
        createColorTarget: function (colorFormat, side) {
            var gl = this.context.gl;
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.glSides[side], this.ctex.handle, 0);
        },
        createDepthTarget: function (depthFormat, side) {
            var gl = this.context.gl;

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
            else
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT0, this.glSides[side], this.dtex.handle, 0);
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

module.exports = {
    GLCanvasTarget: GLCanvasTarget,
    GLRenderTarget: GLRenderTarget,
    GLScaledRenderTarget: GLScaledRenderTarget,
    GLCubeMapRenderTarget: GLCubeMapRenderTarget
};


