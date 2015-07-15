var BaseRenderPass = require("./base.js");
var vec3 = require("gl-matrix").vec3;
var mat4 = require("gl-matrix").mat4;
var mat3 = require("gl-matrix").mat3;

var PickNormalRenderPass = function (renderInterface, output, opt) {
    BaseRenderPass.call(this, renderInterface, output, opt);
};

XML3D.createClass(PickNormalRenderPass, BaseRenderPass, {
    render: (function () {
        var c_modelViewProjectionMatrix = mat4.create();
        var c_worldMatrix = mat4.create();
        var c_normalMatrix3 = mat3.create();
        var c_uniformCollection = {
                envBase: {},
                envOverride: null,
                sysBase: {}
            }, c_systemUniformNames = ["modelViewProjectionMatrix", "modelViewMatrixN"];

        return function (object, viewMatrix, projMatrix) {
            var gl = this.renderInterface.context.gl, target = this.output;

            target.bind();
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.BLEND);

            if (viewMatrix && projMatrix) {
                object.updateModelViewMatrix(viewMatrix);
                object.updateModelViewProjectionMatrix(projMatrix);
            }

            object.getModelViewProjectionMatrix(c_modelViewProjectionMatrix);

            object.getWorldMatrix(c_worldMatrix);
            if (!XML3D.math.mat3.normalFromMat4(c_normalMatrix3, c_worldMatrix)) {
                mat3.identity(c_normalMatrix3);
            }

            var program = this.renderInterface.context.programFactory.getPickingNormalProgram();
            program.bind();

            c_uniformCollection.sysBase["modelViewProjectionMatrix"] = c_modelViewProjectionMatrix;
            c_uniformCollection.sysBase["modelViewMatrixN"] = c_normalMatrix3;

            program.setUniformVariables(null, c_systemUniformNames, c_uniformCollection);
            object.mesh.draw(program);

            program.unbind();
            target.unbind();
        }
    }()), /**
     * Read normal from picking buffer
     * @param {number} glX OpenGL Coordinate of color buffer
     * @param {number} glY OpenGL Coordinate of color buffer
     * @returns {Object} Vector with normal data
     */
    readNormalFromPickingBuffer: (function () {
        var c_pickVector = vec3.create();
        var c_one = vec3.fromValues(1, 1, 1);

        return function (glX, glY) {
            var data = this.readPixelDataFromBuffer(glX, glY, this.output);
            if (!data) {
                return null;
            }
            c_pickVector[0] = data[0] / 254;
            c_pickVector[1] = data[1] / 254;
            c_pickVector[2] = data[2] / 254;

            vec3.scale(c_pickVector, c_pickVector, 2);
            return vec3.subtract(vec3.create(), c_pickVector, c_one);
        }
    }())
});


module.exports = PickNormalRenderPass;

