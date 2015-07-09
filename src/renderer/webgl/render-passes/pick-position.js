var BaseRenderPass = require("./base.js");

var PickPositionRenderPass = function (renderInterface, output, opt) {
    BaseRenderPass.call(this, renderInterface, output, opt);
    this.objectBoundingBox = new XML3D.Box();
};
XML3D.createClass(PickPositionRenderPass, BaseRenderPass, {
    render: (function () {

        var c_modelMatrix = XML3D.math.mat4.create();
        var c_modelViewProjectionMatrix = XML3D.math.mat4.create(), c_uniformCollection = {
                envBase: {},
                envOverride: null,
                sysBase: {}
            }, c_systemUniformNames = ["bbox", "modelMatrix", "modelViewProjectionMatrix"];

        return function (obj, viewMatrix, projMatrix) {
            var gl = this.renderInterface.context.gl, target = this.output;

            target.bind();
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.BLEND);

            if (viewMatrix && projMatrix) {
                obj.updateModelViewMatrix(viewMatrix);
                obj.updateModelViewProjectionMatrix(projMatrix);
            }
            obj.getWorldMatrix(c_modelMatrix);

            obj.getObjectSpaceBoundingBox(this.objectBoundingBox);
            this.objectBoundingBox.transformAxisAligned(c_modelMatrix);

            var program = this.renderInterface.context.programFactory.getPickingPositionProgram();
            program.bind();
            obj.getModelViewProjectionMatrix(c_modelViewProjectionMatrix);

            c_uniformCollection.sysBase["bbox"] = this.objectBoundingBox.data;
            c_uniformCollection.sysBase["modelMatrix"] = c_modelMatrix;
            c_uniformCollection.sysBase["modelViewProjectionMatrix"] = c_modelViewProjectionMatrix;

            program.setUniformVariables(null, c_systemUniformNames, c_uniformCollection);
            obj.mesh.draw(program);

            program.unbind();
            target.unbind();
        };
    }()),

    readPositionFromPickingBuffer: (function () {

        var c_vec3 = XML3D.math.vec3.create();

        return function (x, y) {
            var data = this.readPixelDataFromBuffer(x, y, this.output);
            if (data) {

                c_vec3[0] = data[0] / 255;
                c_vec3[1] = data[1] / 255;
                c_vec3[2] = data[2] / 255;

                var size = this.objectBoundingBox.size().data;
                size = XML3D.math.vec3.mul(size, c_vec3, size);
                XML3D.math.vec3.add(size, this.objectBoundingBox.data, size);
                return size;
            } else {
                return null;
            }
        }
    }())
});

module.exports = PickPositionRenderPass;

