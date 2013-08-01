(function (webgl) {

    var gl = window.WebGLRenderingContext;

    var RenderInterface = function (context) {
        this.context = context;
        this.options = {
            pickingEnabled          : true,
            mousemovePickingEnabled : true,
            glBlendFuncSeparate     : [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA]
        };
        this.renderPipeline = null;
    };

    XML3D.extend(RenderInterface.prototype, {
        getRenderPipeline: function() {
            return (this.renderPipeline = this.renderPipeline || new XML3D.webgl.RenderPipeline(this.context));
        },

        setRenderPipeline: function(pipeline) {
            //TODO cleanup old pipeline
            this.renderPipeline = pipeline;
            this.context.requestRedraw("Pipeline changed");
        },

        getRenderOptions: function() {
            return this.options;
        }

    });

    webgl.RenderInterface = RenderInterface;

})(XML3D.webgl);
