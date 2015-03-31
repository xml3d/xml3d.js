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
    this._enableSSAO = enableSSAO;
    this.mainPass = null;
    this.createMainPass();
};

XML3D.createClass(ForwardRenderTree, BaseRenderTree);

XML3D.extend(ForwardRenderTree.prototype, {

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

