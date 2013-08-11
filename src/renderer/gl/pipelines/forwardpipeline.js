(function (webgl) {

    var ForwardRenderPipeline = function (context) {
        webgl.RenderPipeline.call(this, context);
        this.createPasses();
    };

    XML3D.createClass(ForwardRenderPipeline, webgl.RenderPipeline);

    XML3D.extend(ForwardRenderPipeline.prototype, {
        init: function() {
            var context = this.context;
            this.addRenderTarget("screen", context.canvasTarget);
            this.renderPasses.forEach(function(pass) {
                if (pass.init) {
                    pass.init(context);
                }
            });
        },

        createPasses: function() {
            this.addRenderPass(new webgl.ForwardRenderPass(this, "screen"));
        }
    });

    webgl.ForwardRenderPipeline = ForwardRenderPipeline;

})(XML3D.webgl);
