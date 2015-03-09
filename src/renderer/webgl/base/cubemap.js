//moved to texture.js
var SamplerConfig = require("../../../xflow/interface/data.js").SamplerConfig;

/**
 * @param {WebGLRenderingContext} gl
 * @constructor
 */
/*var GLCubeMap = function (gl) {
    SamplerConfig.call(this);
    this.setDefaults();
    this.width = 0;
    this.height = 0;
    this.gl = gl;
    this.handle = null;
    this.glSides = [gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
};
XML3D.createClass(GLCubeMap, SamplerConfig);

GLCubeMap.State = {
    NONE: "none", LOADING: "loading", READY: "ready", ERROR: "error"
};


var getOrCreateFallbackTexture = (function () {

    var c_fallbackTexture = null;

    return function (gl) {
        if (!c_fallbackTexture) {
            c_fallbackTexture = new GLCubeMap(gl);
            var size = 16;
            var texels = new Uint8Array(size * size * 3);
            for (var i = 0; i < texels.length; i++) {
                texels[i] = 128;
            }
            c_fallbackTexture.createTex2DFromData(gl.RGB, size, size, gl.RGB, gl.UNSIGNED_BYTE, {
                texels: texels,
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                minFilter: gl.LINEAR,
                magFilter: gl.LINEAR
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
 *//*
var scaleImage = function (image, width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = nextHighestPowerOfTwo(width);
    canvas.height = nextHighestPowerOfTwo(height);

    var context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
};


XML3D.extend(GLCubeMap.prototype, {
    /**
     * @param {Xflow.TextureEntry} textureEntry
     *//*
    updateFromTextureEntry: function (textureEntry) {
        var img = textureEntry.getImage();
        if (img) {
            if (!this.handle) {
                this.handle = this.gl.createTexture();
            }
            this.set(textureEntry.getSamplerConfig());
            if (!textureEntry.isLoading()) {
                this.updateTex2DFromImage(img);
            } else {
                this.loads();
            }
        } else {
            this.failed();
        }
    }, /**
     * We need to scale texture when one of the wrap modes is not CLAMP_TO_EDGE and
     * one of the texture dimensions is not power of two.
     * Otherwise rendered texture will be just black.
     * @param {number} width
     * @param {number} height
     * @returns {boolean}
     *//*
    needsScale: function (width, height) {
        return (this.generateMipMap || this.wrapS != this.gl.CLAMP_TO_EDGE || this.wrapT != this.gl.CLAMP_TO_EDGE) && (!isPowerOfTwo(width) || !isPowerOfTwo(height))
    },

    /**
     * @param {Image|HTMLVideoElement} image
     *//*
    updateTex2DFromImage: function (image, side) {
        var gl = this.gl, width = this.width = image.videoWidth || image.width, height = this.height = image.videoHeight || image.height;

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.handle);

        if (this.needsScale(width, height)) {
            image = scaleImage(image, width, height);
        }
        if (side === "undefined" || side == null)
            for (var sideIndex = 0; sideIndex < this.glSides.length; ++sideIndex)
                gl.texImage2D(this.glSides[sideIndex], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); else
            gl.texImage2D(this.glSides[side], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, this.wrapS);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, this.wrapT);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, this.minFilter);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, this.magFilter);

        if (this.generateMipMap) {
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        }
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

        this.created();
    }, bind: function (unit) {
        if (this.canBind()) {
            this.gl.activeTexture(this.gl.TEXTURE0 + unit);
            this.gl.bindTexture(this.textureType, this.handle);
        } else {
            getOrCreateFallbackTexture(this.gl).bind(unit);
        }
    }, unbind: function (unit) {
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.textureType, null);
    }, destroy: function () {
        this.gl.deleteTexture(this.handle);
    }, canBind: function () {
        return this.current == GLCubeMap.State.READY;
    }, createTex2DFromData: function (internalFormat, width, height, sourceFormat, sourceType, opt) {
        var gl = this.gl;

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
        this.textureType = gl.TEXTURE_CUBE_MAP;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.handle);

        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, opt.wrapS);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, opt.wrapT);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, opt.minFilter);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, opt.magFilter);

        if (opt.isDepth)
            texels = null;
        for (var i = 0; i < this.glSides.length; i++)
            gl.texImage2D(this.glSides[i], 0, internalFormat, width, height, 0, sourceFormat, sourceType, texels);

        if (opt.generateMipmap) {
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        }

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        this.created();
    }

});

StateMachine.create({
    target: GLCubeMap.prototype,
    initial: GLCubeMap.State.NONE,
    events: [{name: 'created', from: '*', to: GLCubeMap.State.READY}, {
        name: 'failed',
        from: '*',
        to: GLCubeMap.State.ERROR
    }, {name: 'loads', from: '*', to: GLCubeMap.State.LOADING}]
});

module.exports = GLCubeMap;
