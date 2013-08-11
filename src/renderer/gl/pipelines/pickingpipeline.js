(function (webgl) {

    var PickingRenderPipeline = function (context) {
        webgl.RenderPipeline.call(this, context);
    };

    XML3D.createClass(PickingRenderPipeline, webgl.RenderPipeline);

    XML3D.extend(PickingRenderPipeline.prototype, {
        init: function() {
            var context = this.context;
            var pickTarget = new webgl.GLScaledRenderTarget(context, webgl.MAX_PICK_BUFFER_DIMENSION, {
                width: context.canvasTarget.width,
                height: context.canvasTarget.height,
                colorFormat: context.gl.RGBA,
                depthFormat: context.gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });
            this.addRenderTarget("pickBuffer", pickTarget);

            this.renderPasses.forEach(function(pass) {
                if (pass.init) {
                    pass.init(context);
                }
            });
        }
    });

    webgl.PickingRenderPipeline = PickingRenderPipeline;

})(XML3D.webgl);
