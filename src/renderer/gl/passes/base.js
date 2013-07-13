(function (webgl) {

    /**
     * @contructor
     */
    var BaseRenderPass = function(context, opt) {
        opt = opt || {};
        this.context = context;
        this.target = opt.target || context.canvasTarget;
    };
    webgl.BaseRenderPass = BaseRenderPass;

}(XML3D.webgl));