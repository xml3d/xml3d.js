(function (webgl) {

    /**
     *
     * @param {GLContext} context
     * @param {GLScene} scene
     * @constructor
     */
    var ForwardRenderPipeline = function (context, scene) {
        webgl.RenderPipeline.call(this, context);

        scene.addEventListener(webgl.Scene.EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, this.initLightMaps.bind(this));

        this.lightPass = null;

        this.createMainPass();
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

        /**
         * @param {GLScene} scene
         */
        initLightMaps: function(evt) {
            var scene = evt.target,
                context = this.context

            if(this.lightPass)
                return;

            for (var i = 0; i < scene.lights.spot.length; i++) {
                var spotLight = scene.lights.spot[i];
                if (spotLight.castShadow) {
                    var lightFramebuffer  = new webgl.GLRenderTarget(context, {
                        width: 1024,
                        height: 1024,
                        colorFormat: context.gl.RGBA,
                        depthFormat: context.gl.DEPTH_COMPONENT16,
                        stencilFormat: null,
                        depthAsRenderbuffer: true
                    });
                    this.addRenderTarget("spotLight" + i, lightFramebuffer);
                    this.lightPass = new webgl.LightPass(this, "spotLight" + i, spotLight);
                    this.addRenderPass(this.lightPass);
                    this.lightPass.init(context);
                }
            }
        },

        createMainPass: function() {
            this.addRenderPass(new webgl.ForwardRenderPass(this, "screen"));
        },

        render: function(scene) {
            if(this.renderPasses[1]) {
                console.log("Light render pass", this.renderPasses[1])
                this.renderPasses[1].render(scene);
            }
            return this.renderPasses[0].render(scene);
        }
    });

    webgl.ForwardRenderPipeline = ForwardRenderPipeline;

})(XML3D.webgl);
