var BaseRenderTree = require("./base.js");
var GLRenderTarget = require("../base/rendertarget.js").GLRenderTarget;
var ForwardRenderPass = require("../render-passes/forward.js");
var BoxBlurPass= require("../render-passes/boxblur.js");
var LightPass= require("../render-passes/light-pass");
var PointLightPass= require("../render-passes/pointlight-pass");
var VertexAttributePass = require("../render-passes/vertexattribute-pass.js");
var SSAOPass = require("../render-passes/ssao-pass");
var EVENT_TYPE = require("../../renderer/scene/constants.js").EVENT_TYPE;

/**
 *
 * @param {GLRenderInterface} renderInterface
 * @param {boolean} enableSSAO
 * @constructor
 */
var ForwardRenderTree = function (renderInterface, enableSSAO) {
    BaseRenderTree.call(this, renderInterface);
    var scene = renderInterface.scene;
    scene.addEventListener(EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, this.onLightStructureChange.bind(this));
    scene.addEventListener(EVENT_TYPE.LIGHT_VALUE_CHANGED, this.onLightValueChange.bind(this));
    scene.addEventListener(EVENT_TYPE.SCENE_SHAPE_CHANGED, this.onSceneShapeChange.bind(this));
    scene.addEventListener(XML3D.webgl.ShaderComposerFactory.EVENT_TYPE.MATERIAL_INITIALIZED, this.onShaderChange.bind(this));
    this._enableSSAO = enableSSAO;
    this.mainPass = null;
    this.createMainPass();
};

XML3D.createClass(ForwardRenderTree, BaseRenderTree);

XML3D.extend(ForwardRenderTree.prototype, {
    onLightStructureChange: function (evt) {
        var light = evt.light;
        if (evt.removed) {
            // TODO: Proper clean up ShadowPass
            light.userData = null;
        } else {
            if (light.light.type == "spot" && light.castShadow && light.visible)
                light.userData = this.createLightPass(light); else if (light.light.type == "directional" && light.castShadow && light.visible)
                light.userData = this.createLightPass(light); else if (light.light.type == "point" && light.castShadow && light.visible) {
                light.userData = this.createPointLightPass(light);
            }
        }
        this.reassignLightPasses(evt.target);
    }, onLightValueChange: function (evt) {
        var renderLight = evt.light;
        // TODO: Would be great to check of the light position or orientation specifically changed
        // We don't need to invalidate the lightPass otherwise
        if (renderLight.castShadow && renderLight.visible) {
            if (renderLight.userData) {
                renderLight.userData.setProcessed(false);
            } else {
                if (renderLight.light.type === "spot") {
                    renderLight.userData = this.createLightPass(renderLight);
                    this.mainPass.addLightPass("spotLightShadowMap", renderLight.userData);
                } else if (renderLight.light.type === "directional") {
                    renderLight.userData = this.createLightPass(renderLight);
                    this.mainPass.addLightPass("directionalLightShadowMap", renderLight.userData);
                } else if (renderLight.light.type === "point") {
                    renderLight.userData = this.createPointLightPass(renderLight);
                    this.mainPass.addLightPass("pointLightShadowMap", renderLight.userData);
                }
            }
        }
    }, onSceneShapeChange: function (evt) {
        var scene = evt.target, i;
        for (i = 0; i < scene.lights.spot.length; i++) {
            var spotLight = scene.lights.spot[i];
            if (spotLight.castShadow && spotLight.visible)
                spotLight.userData && spotLight.userData.setProcessed(false);
        }
        for (i = 0; i < scene.lights.directional.length; i++) {
            var directionalLight = scene.lights.directional[i];
            if (directionalLight.castShadow && directionalLight.visible)
                directionalLight.userData && directionalLight.userData.setProcessed(false);
        }
        for (i = 0; i < scene.lights.point.length; i++) {
            var pointLight = scene.lights.point[i];
            if (pointLight.castShadow && pointLight.visible)
                pointLight.userData && pointLight.userData.setProcessed(false);
        }
    }, onShaderChange: function (evt) {
        this.reassignLightPasses(evt.target);
    },

    createLightPass: function (light) {
        var context = this.renderInterface.context;
        var dimension = Math.max(context.canvasTarget.width, context.canvasTarget.height) * 2;
        var lightFramebuffer = new GLRenderTarget(context, {
            width: dimension,
            height: dimension,
            colorFormat: context.gl.RGBA,
            depthFormat: context.gl.DEPTH_COMPONENT16,
            stencilFormat: null,
            depthAsRenderbuffer: true
        });
        var lightPass = new LightPass(this.renderInterface, lightFramebuffer, light);
        lightPass.init(context);
        return lightPass;
    },

    createPointLightPass: function (light) {
        var context = this.renderInterface.context;
        var dimension = Math.max(context.canvasTarget.width, context.canvasTarget.height) * 2;
        var lightFramebuffer = new XML3D.webgl.GLCubeMapRenderTarget(context, {
            width: dimension,
            height: dimension,
            colorFormat: context.gl.RGBA,
            depthFormat: context.gl.DEPTH_COMPONENT16,
            stencilFormat: null,
            depthAsRenderbuffer: true
        });
        var lightPass = new PointLightPass(this.renderInterface, lightFramebuffer, light);
        lightPass.init(context);
        return lightPass;
    },

    reassignLightPasses: function (scene) {
        var i;

        this.mainPass.clearLightPasses();
        for (i = 0; i < scene.lights.spot.length; i++) {
            var spotLight = scene.lights.spot[i];
            if (spotLight.userData) {
                this.mainPass.addLightPass("spotLightShadowMap", spotLight.userData);
                if (!spotLight.castShadow || !spotLight.visible)
                    spotLight.userData.setProcessed(true);
            }
        }
        for (i = 0; i < scene.lights.directional.length; i++) {
            var directionalLight = scene.lights.directional[i];
            if (directionalLight.userData) {
                this.mainPass.addLightPass("directionalLightShadowMap", directionalLight.userData);
                if (!directionalLight.castShadow || !directionalLight.visible)
                    directionalLight.userData.setProcessed(true);
            }
        }
        for (i = 0; i < scene.lights.point.length; i++) {
            var pointLight = scene.lights.point[i];
            if (pointLight.userData) {
                this.mainPass.addLightPass("pointLightShadowMap", pointLight.userData);
                if (!pointLight.castShadow || !pointLight.visible)
                    pointLight.userData.setProcessed(true);
            }
        }
    },

    createMainPass: function () {
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
            this.mainPass = new ForwardRenderPass(this.renderInterface, outputTarget, {
                inputs: {
                    ssaoMap: blurPass.output
                }
            });
            this.mainPass.addPrePass(blurPass);
        } else {
            this.mainPass = new ForwardRenderPass(this.renderInterface, outputTarget);
        }
        this.mainRenderPass = this.mainPass;
    },

    createVertexAttributePass: function (programName) {
        var context = this.renderInterface.context;
        var buffer = new GLRenderTarget(context, {
            width: context.canvasTarget.width,
            height: context.canvasTarget.height,
            colorFormat: context.gl.RGBA,
            colorType: context.gl.FLOAT,
            depthFormat: context.gl.DEPTH_COMPONENT16,
            stencilFormat: null,
            depthAsRenderbuffer: true
        });
        return new VertexAttributePass(this.renderInterface, buffer, {
            programName: programName
        });
    },

    createSSAOPass: function (positionBuffer, normalBuffer) {
        var context = this.renderInterface.context;
        var ssaoBuffer = new GLRenderTarget(context, {
            width: context.canvasTarget.width,
            height: context.canvasTarget.height,
            colorFormat: context.gl.RGBA,
            depthFormat: context.gl.DEPTH_COMPONENT16,
            stencilFormat: null,
            depthAsRenderbuffer: true
        });

        return new SSAOPass(this.renderInterface, ssaoBuffer, {
            inputs: {
                positionBuffer: positionBuffer, normalBuffer: normalBuffer
            }
        });
    },

    createBlurPass: function (inputBuffer) {
        var context = this.renderInterface.context;
        var blurBuffer = new GLRenderTarget(context, {
            width: inputBuffer.width,
            height: inputBuffer.height,
            colorFormat: context.gl.RGBA,
            depthFormat: context.gl.DEPTH_COMPONENT16,
            stencilFormat: null,
            depthAsRenderbuffer: true
        });

        return new BoxBlurPass(this.renderInterface, blurBuffer, {
            inputs: {
                buffer: inputBuffer
            }
        });
    },

    render: function (scene) {
        if (this._enableSSAO) {
            this._positionPass.setProcessed(false);
            this._normalPass.setProcessed(false);
            this._ssaoPass.setProcessed(false);
            this._blurPass.setProcessed(false);
        }
        this.mainRenderPass.setProcessed(false);
        BaseRenderTree.prototype.render.call(this, scene);
    },

    getRenderStats: function () {
        return this.mainPass.getRenderStats();
    }
});

module.exports = ForwardRenderTree;

