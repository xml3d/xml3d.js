var BaseRenderPass = require("./base.js");
var Options = require("../../../utils/options.js");
var mat4 = require("gl-matrix").mat4;
var mat3 = require("gl-matrix").mat3;

var OPTION_FACECULLING = "renderer-faceculling";
var OPTION_FRONTFACE = "renderer-frontface";

Options.register(OPTION_FACECULLING, "none");
Options.register(OPTION_FRONTFACE, "ccw");

/**
 * @constructor
 */
var SceneRenderPass = function (renderInterface, output, opt) {
    BaseRenderPass.call(this, renderInterface, output, opt);
    /**
     * @type {function}
     */
    this.setFaceCulling = getGlobalFaceCullingSetter(Options.getValue(OPTION_FACECULLING));
    /**
     * @type {function}
     */
    this.setFrontFace = getGlobalFrontFaceSetter(Options.getValue(OPTION_FRONTFACE));

    var that = this;
    Options.addObserver(OPTION_FACECULLING, function (key, value) {
        that.setFaceCulling = getGlobalFaceCullingSetter(value);
    });
    Options.addObserver(OPTION_FRONTFACE, function (key, value) {
        that.setFrontFace = getGlobalFrontFaceSetter(value);
    });
};

XML3D.createClass(SceneRenderPass, BaseRenderPass, {
    setGLStates: function () {
        var gl = this.renderInterface.context.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        this.setFaceCulling(gl);
        this.setFrontFace(gl);
        gl.enable(gl.DEPTH_TEST);
    }, /**
     * @param Array
     */
    renderObjectsToActiveBuffer: (function () {
        var tmpModelMatrix = mat4.create();
        var tmpModelMatrixN = mat3.create();
        var tmpModelView = mat4.create();
        var tmpModelViewProjection = mat4.create();
        var tmpModelViewN = mat3.create();
        var c_objectSystemUniforms = ["modelMatrix", "modelMatrixN", "modelViewMatrix", "modelViewProjectionMatrix", "modelViewMatrixN"];

        return function (objectArray, scene, target, systemUniforms, opt) {
            var objCount = 0;
            var primitiveCount = 0;
            var stats = opt.stats || {};
            var transparent = opt.transparent === true || false;
            var gl = this.renderInterface.context.gl;
            var overrideShader = opt.program;

            if (objectArray.length == 0) {
                return stats;
            }

            if (transparent) {
                gl.enable(gl.BLEND);
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            }

            var shader = overrideShader || objectArray[0].getShaderClosure();
            // At this point, we guarantee that the RenderObject has a valid shader
            shader.bind();

            //Set global data that is shared between all objects using this shader
            shader.setPerFrameUniforms(systemUniforms);

            var prevOverride = null;


            for (var i = 0, n = objectArray.length; i < n; i++) {
                var obj = objectArray[i];
                if (!obj.visible)
                    continue;
                var perObjectUniforms = {};
                //obj closure contains uniforms specific to this object/material, the underlying GL program is the same
                //as the one we bound before the loop
                var objShaderClosure = overrideShader || obj.getShaderClosure();
                this.renderInterface.setGLState(obj._actualMaterial.states);

                var mesh = obj.mesh;
                XML3D.debug.assert(mesh, "We need a mesh at this point.");

                obj.getWorldMatrix(tmpModelMatrix);
                perObjectUniforms["modelMatrix"] = tmpModelMatrix;

                obj.getModelMatrixN(tmpModelMatrixN);
                perObjectUniforms["modelMatrixN"] = tmpModelMatrixN;

                obj.getModelViewMatrix(tmpModelView);
                perObjectUniforms["modelViewMatrix"] = tmpModelView;

                obj.getModelViewProjectionMatrix(tmpModelViewProjection);
                perObjectUniforms["modelViewProjectionMatrix"] = tmpModelViewProjection;

                obj.getModelViewMatrixN(tmpModelViewN);
                perObjectUniforms["modelViewMatrixN"] = tmpModelViewN;

                XML3D.extend(perObjectUniforms, mesh.uniformOverride);

                objShaderClosure.setPerObjectUniforms(perObjectUniforms);

                primitiveCount += mesh.draw(objShaderClosure);
                objCount++;

                this.renderInterface.resetGLState(obj._actualMaterial.states);
            }

            if (transparent) {
                gl.disable(gl.BLEND);
            }

            shader.unbind();
            stats.objects += objCount;
            stats.primitives += primitiveCount;
            return stats;
        }
    }())


});

function getGlobalFrontFaceSetter(mode) {
    if (mode.toLowerCase() == "cw") {
        return function (gl) {
            gl.frontFace(gl.CW);
        };
    }
    return function (gl) {
        gl.frontFace(gl.CCW);
    };
}

function getGlobalFaceCullingSetter(mode) {
    //noinspection FallthroughInSwitchStatementJS
    switch (mode.toLowerCase()) {
        case "back":
            return function (gl) {
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.BACK);
            };
            break;
        case "front":
            return function (gl) {
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.FRONT);
            };
            break;
        case "both":
            return function (gl) {
                gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.FRONT_AND_BACK);
            };
            break;
        case "none":
        default:
            return function (gl) {
                gl.disable(gl.CULL_FACE);
            };
    }
}

module.exports = SceneRenderPass;
