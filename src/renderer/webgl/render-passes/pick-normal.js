var BaseRenderPass = require("./base.js");

var PickNormalRenderPass = function (renderInterface, output, opt) {
    BaseRenderPass.call(this, renderInterface, output, opt);
};

XML3D.createClass(PickNormalRenderPass, BaseRenderPass, {
    render: (function () {
        var c_modelViewProjectionMatrix = new XML3D.Mat4();
        var c_worldMatrix = new XML3D.Mat4();
        var c_normalMatrix3 = new XML3D.Mat3();
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
            if (!XML3D.math.mat3.normalFromMat4(c_normalMatrix3.data, c_worldMatrix.data)) {
                c_normalMatrix3.identity();
            }

            var program = this.renderInterface.context.programFactory.getPickingNormalProgram();
            program.bind();

            c_uniformCollection.sysBase["modelViewProjectionMatrix"] = c_modelViewProjectionMatrix.data;
            c_uniformCollection.sysBase["modelViewMatrixN"] = c_normalMatrix3.data;

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
        var c_pickVector = new XML3D.Vec3();
        var c_one = new XML3D.Vec3().set(1, 1, 1);

        return function (glX, glY) {
            var data = this.readPixelDataFromBuffer(glX, glY, this.output);
            if (!data) {
                return null;
            }
            c_pickVector.x = data[0] / 254;
            c_pickVector.y = data[1] / 254;
            c_pickVector.z = data[2] / 254;

            // TODO: Optimize (2 Float arrays created)
            return c_pickVector.scale(2).subtract(c_one);
        }
    }())
});


module.exports = PickNormalRenderPass;

