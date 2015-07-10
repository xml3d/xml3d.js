var BaseRenderPass = require("./base.js");

var PickPositionRenderPass = function (renderInterface, output, opt) {
    BaseRenderPass.call(this, renderInterface, output, opt);
    this.objectBoundingBox = new XML3D.Box();
};
XML3D.createClass(PickPositionRenderPass, BaseRenderPass, {
    render: (function () {

        var c_modelMatrix = new XML3D.Mat4();
        var c_modelViewProjectionMatrix = new XML3D.Mat4(), c_uniformCollection = {
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
            c_uniformCollection.sysBase["modelMatrix"] = c_modelMatrix.data;
            c_uniformCollection.sysBase["modelViewProjectionMatrix"] = c_modelViewProjectionMatrix.data;

            program.setUniformVariables(null, c_systemUniformNames, c_uniformCollection);
            obj.mesh.draw(program);

            program.unbind();
            target.unbind();
        };
    }()),

    readPositionFromPickingBuffer: (function () {

        var c_vec3 = new XML3D.Vec3();

        return function (x, y) {
            var data = this.readPixelDataFromBuffer(x, y, this.output);
            if (data) {

                c_vec3.x = data[0] / 255;
                c_vec3.y = data[1] / 255;
                c_vec3.z = data[2] / 255;

                var size = this.objectBoundingBox.size();
                return size.mul(c_vec3).add(this.objectBoundingBox.min);
            } else {
                return null;
            }
        }
    }())
});

module.exports = PickPositionRenderPass;

