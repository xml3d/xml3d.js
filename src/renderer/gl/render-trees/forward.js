(function (webgl) {

    /**
     *
     * @param {GLContext} context
     * @param {GLScene} scene
     * @constructor
     */
    var ForwardRenderTree = function (renderInterface, enableSSAO) {
        webgl.BaseRenderTree.call(this, renderInterface);
        var scene = renderInterface.scene;
        scene.addEventListener(webgl.Scene.EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, this.onLightStructureChange.bind(this));
        scene.addEventListener(webgl.Scene.EVENT_TYPE.LIGHT_VALUE_CHANGED, this.onLightValueChange.bind(this));
        scene.addEventListener(webgl.Scene.EVENT_TYPE.SCENE_SHAPE_CHANGED, this.onSceneShapeChange.bind(this));
        scene.addEventListener(webgl.ShaderComposerFactory.EVENT_TYPE.MATERIAL_INITIALIZED, this.onShaderChange.bind(this));
		this._enableSSAO = enableSSAO;
        this.mainPass = null;
		this.createMainPass();
    };

    XML3D.createClass(ForwardRenderTree, webgl.BaseRenderTree);

    XML3D.extend(ForwardRenderTree.prototype, {
        onLightStructureChange: function(evt){
            var light = evt.light;
            if(evt.removed){
                // TODO: Proper clean up ShadowPass
                light.userData = null;
            }
            else{
                if(light.light.type == "spot")
                    light.userData = this.createLightPass(light)
                if(light.light.type == "directional")
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
            for (var i = 0; i < scene.lights.directional.length; i++) {
                var directionalLight = scene.lights.directional[i];
                if(directionalLight.castShadow)
                    directionalLight.userData && directionalLight.userData.setProcessed(false);
            }
        },
        onShaderChange: function(evt) {
            this.reassignLightPasses(evt.target);
        },

        createLightPass: function(light){
            var context = this.renderInterface.context
			var dimension = Math.max(context.canvasTarget.width, context.canvasTarget.height) * 2;
			var lightFramebuffer  = new webgl.GLRenderTarget(context, {
				width: dimension,
				height: dimension,
				colorFormat: context.gl.RGBA,
				depthFormat: context.gl.DEPTH_COMPONENT16,
				stencilFormat: null,
				depthAsRenderbuffer: true
			});
            var lightPass = new webgl.LightPass(this.renderInterface, lightFramebuffer, light);
            lightPass.init(context);
            return lightPass;
        },

        reassignLightPasses: function(scene){
            var context = this.renderInterface.context;

            this.mainPass.clearLightPasses();
            for (var i = 0; i < scene.lights.spot.length; i++) {
                var spotLight = scene.lights.spot[i];
                this.mainPass.addLightPass("spotLightShadowMap", spotLight.userData);
            }
            for (var i = 0; i < scene.lights.directional.length; i++) {
                var directionalLight = scene.lights.directional[i];
                this.mainPass.addLightPass("directionalLightShadowMap", directionalLight.userData);
            }
        },

        createMainPass: function() {
            var outputTarget = this.renderInterface.context.canvasTarget;
			if (this._enableSSAO) {
				var positionPass = this.createVertexAttributePass("render-position");
				var normalPass = this.createVertexAttributePass("render-normal");
				var ssaoPass = this.createSSAOPass(positionPass.output, normalPass.output);
				ssaoPass.addPrePass(positionPass);
				ssaoPass.addPrePass(normalPass);
				var blurPass = this.createBlurPass(ssaoPass.output);
				blurPass.addPrePass(ssaoPass);
				this._blurPass = blurPass;
				this._ssaoPass = ssaoPass;
				this._positionPass = positionPass;
				this._normalPass = normalPass;
				this.mainPass = new webgl.ForwardRenderPass(this.renderInterface, outputTarget, {
					inputs: {
						ssaoMap: blurPass.output
					}
				});
				this.mainPass.addPrePass(blurPass);
			} else {
				this.mainPass = new webgl.ForwardRenderPass(this.renderInterface, outputTarget);
			}
            this.mainRenderPass = this.mainPass;
        },

		createVertexAttributePass: function (programName) {
			var context = this.renderInterface.context;
			var buffer= new webgl.GLRenderTarget(context, {
				width: context.canvasTarget.width,
				height: context.canvasTarget.height,
				colorFormat: context.gl.RGBA,
				colorType: context.gl.FLOAT,
				depthFormat: context.gl.DEPTH_COMPONENT16,
				stencilFormat: null,
				depthAsRenderbuffer: true
			});
			return new webgl.VertexAttributePass(this.renderInterface, buffer, {
				programName: programName
			});
		},

		createSSAOPass: function (positionBuffer, normalBuffer) {
			var context = this.renderInterface.context;
			var ssaoBuffer = new webgl.GLRenderTarget(context, {
				width: context.canvasTarget.width,
				height: context.canvasTarget.height,
				colorFormat: context.gl.RGBA,
				depthFormat: context.gl.DEPTH_COMPONENT16,
				stencilFormat: null,
				depthAsRenderbuffer: true
			});

			return new webgl.SSAOPass(this.renderInterface, ssaoBuffer, {
				inputs: {
					positionBuffer: positionBuffer,
					normalBuffer: normalBuffer
				}
			});
		},

		createBlurPass: function (inputBuffer) {
			var context = this.renderInterface.context;
			var blurBuffer = new webgl.GLRenderTarget(context, {
				width: inputBuffer.width,
				height: inputBuffer.height,
				colorFormat: context.gl.RGBA,
				depthFormat: context.gl.DEPTH_COMPONENT16,
				stencilFormat: null,
				depthAsRenderbuffer: true
			});

			return new webgl.BoxBlurPass(this.renderInterface, blurBuffer, {
				inputs: {
					buffer: inputBuffer
				}
			});
		},

        render: function(scene){
			if (this._enableSSAO) {
				this._positionPass.setProcessed(false);
				this._normalPass.setProcessed(false);
				this._ssaoPass.setProcessed(false);
				this._blurPass.setProcessed(false);
			}
			this.mainRenderPass.setProcessed(false);
			webgl.BaseRenderTree.prototype.render.call(this, scene);
        },

        getRenderStats: function(){
            return this.mainPass.getRenderStats();
        }
    });

    webgl.ForwardRenderTree = ForwardRenderTree;

})(XML3D.webgl);
