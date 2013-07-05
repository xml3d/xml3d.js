(function(webgl) {

    //noinspection JSValidateJSDoc
    /**
     * @param {WebGLRenderingContext} gl
     * @constructor
     */
    var GLTexture = function(gl) {
        Xflow.SamplerConfig.call(this);
        this.gl = gl;
        this.handle = null;
    };
    XML3D.createClass(GLTexture, Xflow.SamplerConfig);

    GLTexture.State = {
        NONE :    1,
        LOADING : 2,
        READY :   3,
        ERROR :   4
    };

    var isPowerOfTwo = function(dimension) {
        return (dimension & (dimension - 1)) == 0;
    };
    var nextHighestPowerOfTwo = function(x) {
        --x;
        for ( var i = 1; i < 32; i <<= 1) {
            x = x | x >> i;
        }
        return x + 1;
    };

    /**
     * Scale up the texture to the next highest power of two dimensions.
     * @returns {HTMLCanvasElement}
     */
    var scaleImage = function (image, width, height) {
        var canvas = document.createElement("canvas");
        canvas.width = nextHighestPowerOfTwo(width);
        canvas.height = nextHighestPowerOfTwo(height);

        var context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas;
    };

    /**
     * @param {Image|Video} img
     * @returns {boolean}
     */
    var isLoaded = function(img) {
        return img.complete || img.readyState;
    }

    XML3D.extend(GLTexture.prototype, {
        /**
         * @param {Xflow.TextureEntry} textureEntry
         */
        updateFromTextureEntry : function(textureEntry) {
            var img = textureEntry.getImage();
            if(img) {
                if(!this.handle) {
                    this.handle = this.gl.createTexture();
                }
                this.set(textureEntry.getSamplerConfig());
                if(isLoaded(img)) {
                    this.updateTex2DFromImage(img);
                } else {
                    this.loads();
                }
            } else {
                this.failed();
            }
        },
        /**
         * We need to scale texture when one of the wrap modes is not CLAMP_TO_EDGE and
         * one of the texture dimensions is not power of two.
         * Otherwise rendered texture will be just black.
         * @param {number} width
         * @param {number} height
         * @returns {boolean}
         */
        needsScale: function(width, height) {
            return (this.wrapS != this.gl.CLAMP_TO_EDGE || this.wrapT != this.gl.CLAMP_TO_EDGE) &&
            (!isPowerOfTwo(width) || !isPowerOfTwo(height))
        },

        /**
         * @param {Image|Video} image
         */
        updateTex2DFromImage : function(image) {
            var gl = this.gl;
            gl.bindTexture(gl.TEXTURE_2D, this.handle);

            var width = image.videoWidth || image.width;
            var height = image.videoHeight || image.height;

            if(this.needsScale(width, height)) {
                image = scaleImage(image, width, height);
            }
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);

            if (this.generateMipMap) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
            gl.bindTexture(gl.TEXTURE_2D, null);

            this.created();
        },
        bind : function(unit) {
            this.gl.activeTexture(this.gl.TEXTURE0 + unit);
            this.gl.bindTexture(this.textureType, this.handle);
        },
        unbind : function(unit) {
            this.gl.activeTexture(this.gl.TEXTURE0 + unit);
            this.gl.bindTexture(this.textureType, null);
        },
        destroy : function() {
            this.gl.deleteTexture(this.handle);
        },
        canBind : function() {
            return this.current == GLTexture.State.READY;
        }
    });

    window.StateMachine.create({
        target: GLTexture.prototype,
        initial: GLTexture.State.NONE,
        events: [
            { name:'created', from: '*',    to: GLTexture.State.READY   },
            { name:'failed',  from: '*',    to: GLTexture.State.ERROR   },
            { name:'loads',   from: '*',    to: GLTexture.State.LOADING }
        ]
    });

    webgl.GLTexture = GLTexture;

}(XML3D.webgl));