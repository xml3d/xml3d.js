(function (webgl) {

    var PickingRenderPipeline = function (context) {
        webgl.RenderPipeline.call(this, context);
        var context = this.context;
        this.pickTarget = new webgl.GLScaledRenderTarget(context, webgl.MAX_PICK_BUFFER_DIMENSION, {
            width: context.canvasTarget.width,
            height: context.canvasTarget.height,
            colorFormat: context.gl.RGBA,
            depthFormat: context.gl.DEPTH_COMPONENT16,
            stencilFormat: null,
            depthAsRenderbuffer: true
        });
    };

    XML3D.createClass(PickingRenderPipeline, webgl.RenderPipeline);

    XML3D.extend(PickingRenderPipeline.prototype, {
        init: function() {
        },

        getPickTarget: function(){
            return this.pickTarget;
        }

    });

    webgl.PickingRenderPipeline = PickingRenderPipeline;

})(XML3D.webgl);
