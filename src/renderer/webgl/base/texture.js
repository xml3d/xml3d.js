var utils = require("./utils.js");
var StateMachine = require("../../../contrib/state-machine.js");
var SamplerConfig = require("../../../xflow/interface/data.js").SamplerConfig;
var XC = require("../../../xflow/interface/constants.js");
var uniqueObjectId = utils.getUniqueCounter();

var textures = 0;
var c_calls = 0;
//noinspection JSValidateJSDoc
/**
 * @param {GLContext} context
 * @constructor
 */
var GLTexture = function (context) {
    SamplerConfig.call(this);
    this.setDefaults();
    this.id = uniqueObjectId();

    this.width = 0;
    this.height = 0;
    this.context = context;
    this.handle = null;

    this.textureType = context.gl.TEXTURE_2D;

    textures++;
};

XML3D.createClass(GLTexture, SamplerConfig);

GLTexture.State = {
    NONE: "none", LOADING: "loading", READY: "ready", ERROR: "error"
};


var getOrCreateFallbackTexture = (function () {

    var c_fallbackTexture = null;

    return function (context) {
        if (!c_fallbackTexture) {
            c_fallbackTexture = new GLTexture(context);
            var size = 16;
            var texels = new Uint8Array(size * size * 3);
            for (var i = 0; i < texels.length; i++) {
                texels[i] = 128;
            }
            c_fallbackTexture.createTex2DFromData(WebGLRenderingContext.RGB, size, size, WebGLRenderingContext.RGB, WebGLRenderingContext.UNSIGNED_BYTE, {
                texels: texels, wrapS: WebGLRenderingContext.REPEAT, wrapT: WebGLRenderingContext.REPEAT, minFilter: WebGLRenderingContext.LINEAR, magFilter: WebGLRenderingContext.LINEAR
            });
        }
        return c_fallbackTexture;
    }
}());

var isPowerOfTwo = function (dimension) {
    return (dimension & (dimension - 1)) == 0;
};
var nextHighestPowerOfTwo = function (x) {
    --x;
    for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
    }
    return x + 1;
};

/**
 * Scale up the texture to the next highest power of two dimensions.
 * @returns {HTMLCanvasElement}
 */
var scaleImage = function (image, width, height) {
    /**
     * @type {HTMLCanvasElement}
     */
    var canvas = document.createElement("canvas");
    canvas.width = nextHighestPowerOfTwo(width);
    canvas.height = nextHighestPowerOfTwo(height);

    var context = canvas.getContext("2d");
    if (image instanceof HTMLElement) {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
        var tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = width;
        tmpCanvas.height = height;
        var tmpContext = tmpCanvas.getContext("2d");
        var imageData = tmpContext.createImageData(width, height);
        imageData.data.set(image.data);
        tmpContext.putImageData(imageData, 0, 0);

        context.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);
    }

    return canvas;
};

var glTextureFormatFromXflow = function (format, gl) {
    switch (format) {
        case XC.TEXTURE_FORMAT.ALPHA:
            return gl.ALPHA;
        case XC.TEXTURE_FORMAT.RGB:
            return gl.RGB;
        case XC.TEXTURE_FORMAT.RGBA:
            return gl.RGBA;
        case XC.TEXTURE_FORMAT.LUMINANCE:
            return gl.LUMINANCE;
        case XC.TEXTURE_FORMAT.LUMINANCE_ALPHA:
            return gl.LUMINANCE_ALPHA;
        default:
            throw new Error("Unsupported Texture Format!");
    }
};

var glTextureTypeFromXflow = function (type, gl) {
    switch (type) {
        case XC.TEXTURE_TYPE.FLOAT:
            return gl.FLOAT;
        case XC.TEXTURE_TYPE.UBYTE:
            return gl.UNSIGNED_BYTE;
        case XC.TEXTURE_TYPE.USHORT_4_4_4_4:
            return gl.UNSIGNED_SHORT_4_4_4_4;
        case XC.TEXTURE_TYPE.USHORT_5_5_5_1:
            return gl.UNSIGNED_SHORT_5_5_5_1;
        case XC.TEXTURE_TYPE.USHORT_5_6_5:
            return gl.GL_UNSIGNED_SHORT_5_6_5;
        default:
            throw new Error("Unsupported Texture Type!");
    }
};

XML3D.extend(GLTexture.prototype, {
    /**
     * @param {Xflow.TextureEntry} textureEntry
     */
    updateFromTextureEntry: function (textureEntry) {
        if (!textureEntry.isLoading()) {
            this.set(textureEntry.getSamplerConfig());
            var img = textureEntry.asGLTextureValue();
            if (!img)
                return this.failed();
            this.createOrUpdateTexture(img);
        } else {
            this.loads();
        }
    }, /**
     * We need to scale texture when one of the wrap modes is not CLAMP_TO_EDGE and
     * one of the texture dimensions is not power of two.
     * Otherwise rendered texture will be just black.
     * @param {number} width
     * @param {number} height
     * @returns {boolean}
     */
    needsScale: function (width, height) {
        return (this.generateMipMap || this.wrapS != WebGLRenderingContext.CLAMP_TO_EDGE || this.wrapT != WebGLRenderingContext.CLAMP_TO_EDGE) && (!isPowerOfTwo(width) || !isPowerOfTwo(height))
    },

    /**
     * Binds this texture to an unit if not already bound and returns the
     * texture unit it was bound to. If this texture is not ready yet
     * it returns the texture unit of a fallback texture.
     * @returns {Number}
     */
    getTextureUnit: function () {
        if (this.canBind()) {
            var textureManager = this.context.textureManager;
            var unit = textureManager.get(this.id);
            if (unit == -1) {
                // Bind this texture to a texture unit
                unit =  this._bind();
            }
            return unit;
        } else {
            return getOrCreateFallbackTexture(this.context).getTextureUnit();
        }
    },

    _bind: function () {
        var gl = this.context.gl;
        var textureManager = this.context.textureManager;
        var unit = textureManager.bind(this.id, {});
        if (unit == -2) {
            XML3D.debug.logError("All available texture units are full.");
        } else {
            gl.activeTexture(WebGLRenderingContext.TEXTURE0 + unit);
            gl.bindTexture(this.textureType, this.handle);
        }
        return unit;
    },

    unbind: function (unit) {
        // Do nothing, texture manager will handle this
    },

    destroy: function () {
        var gl = this.context.gl;
        var textureManager = this.context.textureManager;
        textureManager.dispose(this.id);
        gl.deleteTexture(this.handle);
    },

    canBind: function () {
        return this.current == GLTexture.State.READY;
    },

    createOrUpdateTexture: function (texelSource) {

        if (!this.handle) {
            this.handle = this.context.gl.createTexture();
        }

        this.updateTextureFromData(texelSource);
    },

    updateTextureFromData: function (texelSource) {
        var gl = this.context.gl;
        this._bind();

        gl.texParameteri(this.textureType, gl.TEXTURE_WRAP_S, this.wrapS);
        gl.texParameteri(this.textureType, gl.TEXTURE_WRAP_T, this.wrapT);
        gl.texParameteri(this.textureType, gl.TEXTURE_MIN_FILTER, this.minFilter);
        gl.texParameteri(this.textureType, gl.TEXTURE_MAG_FILTER, this.magFilter);

        var type = glTextureTypeFromXflow(texelSource.texelType, gl);
        var format = glTextureFormatFromXflow(texelSource.texelFormat, gl);

        var width = texelSource.width;
        this.width = width;
        var height = texelSource.height;
        this.height = height;

        if (this.generateMipMap && this.needsScale(width, height)) {
            if (type === gl.FLOAT)
                throw new Error("Should generate MipMaps but texture data is float and not power of two in size!");
            else
                texelSource = scaleImage(texelSource, width, height);
        }

        if (texelSource instanceof HTMLElement) {
            gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, texelSource);
        } else {
            if (texelSource.data instanceof Uint8ClampedArray) {
                // WebGL does not support Uint8ClampedArray, which is (correctly) used by async. Xflow. We just build a new view
                // on top of the underlying array buffer which should be relatively fast
                gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, new Uint8Array(texelSource.data.buffer));
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, texelSource.data);
            }
        }

        if (this.generateMipMap)
            gl.generateMipmap(this.textureType);

        this.created();
    },

    createTex2DFromData: function (internalFormat, width, height, sourceFormat, sourceType, opt) {
        var gl = this.context.gl;

        var opt = opt || {};
        var texels = opt.texels;

        if (!texels) {
            if (sourceType == gl.FLOAT) {
                texels = new Float32Array(width * height * 4);
            } else {
                texels = new Uint8Array(width * height * 4);
            }
        }
        this.width = width;
        this.height = height;
        this.handle = gl.createTexture();
        this._bind();

        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(this.textureType, gl.TEXTURE_WRAP_S, opt.wrapS);
        gl.texParameteri(this.textureType, gl.TEXTURE_WRAP_T, opt.wrapT);
        gl.texParameteri(this.textureType, gl.TEXTURE_MIN_FILTER, opt.minFilter);
        gl.texParameteri(this.textureType, gl.TEXTURE_MAG_FILTER, opt.magFilter);

        if (!opt.isDepth) {
            if (texels instanceof Uint8ClampedArray) {
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, sourceFormat, sourceType, new Uint8Array(texels.buffer));
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, sourceFormat, sourceType, texels);
            }
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, sourceFormat, sourceType, null);
        }

        if (opt.generateMipmap) {
            gl.generateMipmap(this.textureType);
        }
        this.created();
    }

});

StateMachine.create({
    target: GLTexture.prototype,
    initial: GLTexture.State.NONE,
    events: [{name: 'created', from: '*', to: GLTexture.State.READY}, {
        name: 'failed', from: '*', to: GLTexture.State.ERROR
    }, {name: 'loads', from: '*', to: GLTexture.State.LOADING}]
});

//noinspection JSValidateJSDoc
/**
 * @param {GLContext} context
 * @constructor
 */
var GLCubeMap = function (context) {
    GLTexture.call(this, context, context.gl.TEXTURE_CUBE_MAP);
    var gl = context.gl;
    this.textureType = context.gl.TEXTURE_CUBE_MAP;
    this.glSides = [gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];

};
XML3D.createClass(GLCubeMap, GLTexture, {
    updateTextureFromData: function (texelSource) {
        debug.log("updateTextureFromData not implemented for CubeMapping!");
    },

    createTex2DFromData: function (internalFormat, width, height, sourceFormat, sourceType, opt) {
        var gl = this.context.gl;

        var opt = opt || {};
        var texels = opt.texels;

        if (!texels) {
            if (sourceType == gl.FLOAT) {
                texels = new Float32Array(width * height * 4);
            } else {
                texels = new Uint8Array(width * height * 4);
            }
        }
        this.width = width;
        this.height = height;
        this.handle = gl.createTexture();
        this._bind();

        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(this.textureType, gl.TEXTURE_WRAP_S, opt.wrapS);
        gl.texParameteri(this.textureType, gl.TEXTURE_WRAP_T, opt.wrapT);
        gl.texParameteri(this.textureType, gl.TEXTURE_MIN_FILTER, opt.minFilter);
        gl.texParameteri(this.textureType, gl.TEXTURE_MAG_FILTER, opt.magFilter);

        for(var i = 0; i < this.glSides.length; ++i) {
            if (!opt.isDepth) {
                if (texels instanceof Uint8ClampedArray) {
                    gl.texImage2D(this.glSides[i], 0, internalFormat, width, height, 0, sourceFormat, sourceType, new Uint8Array(texels.buffer));
                } else {
                    gl.texImage2D(this.glSides[i], 0, internalFormat, width, height, 0, sourceFormat, sourceType, texels);
                }
            } else {
                gl.texImage2D(this.glSides[i], 0, internalFormat, width, height, 0, sourceFormat, sourceType, null);
            }
        }

        if (opt.generateMipmap) {
            gl.generateMipmap(this.textureType);
        }
        this.created();
    }
});

GLCubeMap.State = {
    NONE: "none", LOADING: "loading", READY: "ready", ERROR: "error"
};

StateMachine.create({
    target: GLCubeMap.prototype,
    initial: GLCubeMap.State.NONE,
    events: [{name: 'created', from: '*', to: GLCubeMap.State.READY}, {
        name: 'failed', from: '*', to: GLCubeMap.State.ERROR
    }, {name: 'loads', from: '*', to: GLCubeMap.State.LOADING}]
});


module.exports = {
    GLTexture: GLTexture,
    GLCubeMap: GLCubeMap
};


