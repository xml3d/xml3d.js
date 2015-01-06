var BaseRenderPass = require("./base.js");

var OPTION_FACECULLING = "renderer-faceculling";
var OPTION_FRONTFACE = "renderer-frontface";

XML3D.options.register(OPTION_FACECULLING, "none");
XML3D.options.register(OPTION_FRONTFACE, "ccw");

/**
 * @constructor
 */
var SceneRenderPass = function (renderInterface, output, opt) {
    BaseRenderPass.call(this, renderInterface, output, opt);
    /**
     * @type {function}
     */
    this.setFaceCulling = getGlobalFaceCullingSetter(XML3D.options.getValue(OPTION_FACECULLING));
    /**
     * @type {function}
     */
    this.setFrontFace = getGlobalFrontFaceSetter(XML3D.options.getValue(OPTION_FRONTFACE));

    var that = this;
    XML3D.options.addObserver(OPTION_FACECULLING, function (key, value) {
        that.setFaceCulling = getGlobalFaceCullingSetter(value);
    });
    XML3D.options.addObserver(OPTION_FRONTFACE, function (key, value) {
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
        var tmpModelMatrix = XML3D.math.mat4.create();
        var tmpModelMatrixN = XML3D.math.mat3.create();
        var tmpModelView = XML3D.math.mat4.create();
        var tmpModelViewProjection = XML3D.math.mat4.create();
        var tmpModelViewN = XML3D.math.mat3.create();
        var c_objectSystemUniforms = ["modelMatrix", "modelMatrixN", "modelViewMatrix", "modelViewProjectionMatrix", "modelViewMatrixN"];

        return function (objectArray, scene, target, systemUniforms, sceneParameterFilter, opt) {
            var objCount = 0;
            var primitiveCount = 0;
            var stats = opt.stats || {};
            var transparent = opt.transparent === true || false;
            var gl = this.renderInterface.context.gl;
            var program = opt.program || objectArray[0].getProgram();

            if (objectArray.length == 0) {
                return stats;
            }

            if (transparent) {
                gl.enable(gl.BLEND);
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            }

            // At this point, we guarantee that the RenderObject has a valid shader
            program.bind();

            //Set global data that is shared between all objects using this shader
            program.setSystemUniformVariables(sceneParameterFilter, systemUniforms);

            var prevOverride = null;

            for (var i = 0, n = objectArray.length; i < n; i++) {
                var obj = objectArray[i];
                if (!obj.isVisible())
                    continue;

                var mesh = obj.mesh;
                XML3D.debug.assert(mesh, "We need a mesh at this point.");

                obj.getWorldMatrix(tmpModelMatrix);
                systemUniforms["modelMatrix"] = tmpModelMatrix;

                obj.getModelMatrixN(tmpModelMatrixN);
                systemUniforms["modelMatrixN"] = tmpModelMatrixN;

                obj.getModelViewMatrix(tmpModelView);
                systemUniforms["modelViewMatrix"] = tmpModelView;

                obj.getModelViewProjectionMatrix(tmpModelViewProjection);
                systemUniforms["modelViewProjectionMatrix"] = tmpModelViewProjection;

                obj.getModelViewMatrixN(tmpModelViewN);
                systemUniforms["modelViewMatrixN"] = tmpModelViewN;

                program.setSystemUniformVariables(c_objectSystemUniforms, systemUniforms);

                program.changeUniformVariableOverride(prevOverride, mesh.uniformOverride);
                prevOverride = mesh.uniformOverride;

                primitiveCount += mesh.draw(program);
                objCount++;

                if (transparent) {
                    gl.disable(gl.BLEND);
                }

            }
            program.changeUniformVariableOverride(prevOverride, null);

            program.unbind();
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
