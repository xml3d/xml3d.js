var BaseRenderTree = require("./base.js");
var GLRenderTarget = require("../base/rendertarget.js").GLRenderTarget;
var GLCubeMapRenderTarget = require("../base/rendertarget.js").GLCubeMapRenderTarget;
var ForwardRenderPass = require("../render-passes/forward.js");
var BoxBlurPass= require("../render-passes/boxblur.js");
var LightPass= require("../render-passes/light-pass.js");
var PointLightPass= require("../render-passes/pointlight-pass.js");
var VertexAttributePass = require("../render-passes/vertexattribute-pass.js");
var SSAOPass = require("../render-passes/ssao-pass.js");
var EVENT_TYPE = require("../../renderer/scene/constants.js").EVENT_TYPE;
var MaterialEvents = require("../materials/events.js");
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
    scene.addEventListener(MaterialEvents.MATERIAL_INITIALIZED, this.onShaderChange.bind(this));
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
            if (light.light.type == "spot" && light.castShadow && light.visible) { //TODO update parameters
                light.userData = this.createLightPass(light);
            }else if (light.light.type == "directional" && light.castShadow && light.visible) {
                light.userData = this.createLightPass(light);
            }else if (light.light.type == "point" && light.castShadow && light.visible) {
                light.userData = this.createPointLightPass(light);
            }
        }
        this.reassignLightPasses(evt.target);
    },

    onLightValueChange: function (evt) {
        var renderLight = evt.light;
        // TODO: Would be great to check of the light position or orientation specifically changed
        // We don't need to invalidate the lightPass otherwise
        //if (renderLight.castShadow && renderLight.visible) {
        if (/*renderLight.castShadow &&*/ renderLight.visible) { //TODO update parameters
            if (renderLight.userData) {
                renderLight.userData.setProcessed(false);
            } else {
                if (renderLight.model.id === "spot") {
                    renderLight.userData = this.createLightPass(renderLight);
                    this.mainPass.addLightPass("spotLightShadowMap", renderLight.userData);
                } else if (renderLight.model.id === "directional") {
                    renderLight.userData = this.createLightPass(renderLight);
                    this.mainPass.addLightPass("directionalLightShadowMap", renderLight.userData);
                } else if (renderLight.model.id === "point") {
                    renderLight.userData = this.createPointLightPass(renderLight);
                    this.mainPass.addLightPass("pointLightShadowMap", renderLight.userData);
                }
            }
        }
    }, onSceneShapeChange: function (evt) {
        var scene = evt.target;
        var modelIds = scene.lights.getModels()
        for (var id in modelIds) {
            var modelEntry = scene.lights.getModelEntry(modelIds[id]);
            for (var model in modelEntry.lightModels) {
                var light = modelEntry.lightModels[model].light;
                light.userData && light.userData.setProcessed(false);
            }
        }
        this.reassignLightPasses(evt.target);

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
        var lightFramebuffer = new GLCubeMapRenderTarget(context, {
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
        this.mainPass.clearLightPasses();
        var modelIds = scene.lights.getModels();
        for (var id in modelIds) {
           var modelEntry = scene.lights.getModelEntry(modelIds[id]);
            for(var model in modelEntry.lightModels) {
                var light = modelEntry.lightModels[model].light;
                    if(light.userData == null)
                        continue;
                    if (light.model.id == "spot")
                        this.mainPass.addLightPass("spotLightShadowMap", light.userData);
                   else if (light.model.id == "point")
                        this.mainPass.addLightPass("pointLightShadowMap", light.userData);
                   else
                        this.mainPass.addLightPass("directionalLightShadowMap", light.userData);
            }
        }

       /*  //TODO update parameters
                if (!pointLight.castShadow || !pointLight.visible)
                    pointLight.userData.setProcessed(true);
        }*/

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

