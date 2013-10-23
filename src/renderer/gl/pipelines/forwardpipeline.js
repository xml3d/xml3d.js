(function (webgl) {

    /**
     *
     * @param {GLContext} context
     * @param {GLScene} scene
     * @constructor
     */
    var ForwardRenderPipeline = function (context, scene) {
        webgl.RenderPipeline.call(this, context);

        scene.addEventListener(webgl.Scene.EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, this.onLightStructureChange.bind(this));
        scene.addEventListener(webgl.Scene.EVENT_TYPE.LIGHT_VALUE_CHANGED, this.onLightValueChange.bind(this));
        scene.addEventListener(webgl.Scene.EVENT_TYPE.SCENE_SHAPE_CHANGED, this.onSceneShapeChange.bind(this));
        this.mainPass = null;

        this.createMainPass();
    };

    XML3D.createClass(ForwardRenderPipeline, webgl.RenderPipeline);

    XML3D.extend(ForwardRenderPipeline.prototype, {
        init: function() {
            var context = this.context;
            this.renderPasses.forEach(function(pass) {
                if (pass.init) {
                    pass.init(context);
                }
            });
        },

        onLightStructureChange: function(evt){
            var light = evt.light;
            if(evt.removed){
                // TODO: Proper clean up ShadowPass
                light.userData = null;
            }
            else{
                if(light.light.type == "spot")
                    light.userData = this.createLightPass(light)
            }
            this.reassignLightPasses(evt.target);
        },
        onLightValueChange: function(evt){
            // TODO: Would be great to check of the light position or orientation specifically changed
            // We don't need to invalidate the lightPass otherwise
            if(evt.light.castShadow){
                evt.light.userData && evt.light.userData.setProcessed(false);
            }
        },
        onSceneShapeChange: function(evt){
            var scene = evt.target;
            for (var i = 0; i < scene.lights.spot.length; i++) {
                var spotLight = scene.lights.spot[i];
                if(spotLight.castShadow)
                    spotLight.userData && spotLight.userData.setProcessed(false);
            }
        },

        createLightPass: function(light){
            var context = this.context
            var lightFramebuffer  = new webgl.GLRenderTarget(context, {
                width: 1024,
                height: 1024,
                colorFormat: context.gl.RGBA,
                depthFormat: context.gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });
            var lightPass = new webgl.LightPass(this, lightFramebuffer, light);
            lightPass.init(context);
            return lightPass;
        },

        reassignLightPasses: function(scene){
            var context = this.context;

            this.mainPass.clearLightPasses();
            for (var i = 0; i < scene.lights.spot.length; i++) {
                var spotLight = scene.lights.spot[i];
                this.mainPass.addLightPass("spotLightShadowMap", spotLight.userData);
            }
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
            this.mainPass = new webgl.ForwardRenderPass(this, this.context.canvasTarget);
            this.addRenderPass(this.mainPass);
        },

        render: function(scene){
            this.mainPass.setProcessed(false);
            webgl.RenderPipeline.prototype.render.call(this, scene);
        }
    });

    webgl.ForwardRenderPipeline = ForwardRenderPipeline;

})(XML3D.webgl);
