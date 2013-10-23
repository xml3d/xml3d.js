(function (webgl) {


    /**
     * @constructor
     */
    var BaseRenderPass = function(pipeline, output, opt) {
        opt = opt || {};
        this.inputs = opt.inputs || {};
        this.output = output;
        this.pipeline = pipeline;
        this.prePasses = [];
        this.postPasses = [];
        this.processed = false;


        var gl = pipeline.context.gl;
        this.clearBits = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT;
    };

    XML3D.extend(BaseRenderPass.prototype, {

        init: function(context) {
        },

        addPrePass: function(pass){
            if(this.prePasses.indexOf(pass) == -1){
                this.prePasses.push(pass);
                pass.postPasses.push(this);
            }
        },

        removePrePass: function(pass){
            var idx;
            if( ( idx = this.prePasses.indexOf(pass)) != -1){
                this.prePasses.splice(idx, 1);
                pass.postPasses.splice(pass.postPasses.indexOf(this), 1);
            }
        },

        clearPrePasses: function(){
            var i = this.prePasses.length;
            while(i--)
                this.removePrePass(this.prePasses[i]);
        },

        setProcessed: function(processed){
            if(this.processed && !processed){
                var i = this.postPasses.length;
                while(i--) this.postPasses[i].setProcessed(false);
            }
            this.processed = processed;
        },

        renderTree: function(scene){
            if(this.processed)
                return;
            this.processed = true;
            var i = this.prePasses.length;
            while(i--)
                this.prePasses[i].renderTree(scene);
            this.render(scene);
        },

        /**
         * Reads pixels from the pass's target
         *
         * @param {number} glX OpenGL Coordinate in the target
         * @param {number} glY OpenGL Coordinate in the target
         * @returns {Uint8Array} pixel data
         */
        readPixelDataFromBuffer : (function() {
            var c_data = new Uint8Array(8);

            return function (glX, glY, target) {
                var gl = this.pipeline.context.gl;
                var scale = target.getScale();
                var x = glX * scale;
                var y = glY * scale;

                target.bind();
                try {
                    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, c_data);
                    target.unbind();
                    return c_data;
                } catch (e) {
                    XML3D.debug.logException(e);
                    target.unbind();
                    return null;
                }
            }
        }()),

        setRenderPipeline: function(pipeline) {
            this.pipeline = pipeline;
        }

    });

    webgl.BaseRenderPass = BaseRenderPass;

}(XML3D.webgl));
