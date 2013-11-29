(function (webgl) {

    var PickNormalRenderPass = function (pipeline, output, opt) {
        webgl.BaseRenderPass.call(this, pipeline, output, opt);
    };

    XML3D.createClass(PickNormalRenderPass, webgl.BaseRenderPass, {
        render: (function () {
            var c_modelViewProjectionMatrix = XML3D.math.mat4.create();
            var c_worldMatrix = XML3D.math.mat4.create();
            var c_normalMatrix3 = XML3D.math.mat3.create();
            var c_uniformCollection = {envBase: {}, envOverride: null, sysBase: {}},
                c_systemUniformNames = ["modelViewProjectionMatrix", "modelViewMatrixN"];

            return function (object, viewMatrix, projMatrix) {
                var gl = this.pipeline.context.gl,
                    target = this.output;

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
                if (XML3D.math.mat4.invert(c_worldMatrix, c_worldMatrix)) {
                    XML3D.math.mat3.fromMat4(c_normalMatrix3, c_worldMatrix);
                    XML3D.math.mat3.transpose(c_normalMatrix3, c_normalMatrix3);
                } else {
                    XML3D.math.mat3.identity(c_normalMatrix3);
                }

                var program = this.pipeline.context.programFactory.getPickingNormalProgram();
                program.bind();

                c_uniformCollection.sysBase["modelViewProjectionMatrix"] = c_modelViewProjectionMatrix;
                c_uniformCollection.sysBase["modelViewMatrixN"] = c_normalMatrix3;

                program.setUniformVariables(null, c_systemUniformNames, c_uniformCollection);
                object.mesh.draw(program);

                program.unbind();
                target.unbind();
            }
        }()),
        /**
         * Read normal from picking buffer
         * @param {number} glX OpenGL Coordinate of color buffer
         * @param {number} glY OpenGL Coordinate of color buffer
         * @returns {Object} Vector with normal data
         */
        readNormalFromPickingBuffer: (function () {
            var c_pickVector = XML3D.math.vec3.create();
            var c_one = XML3D.math.vec3.fromValues(1, 1, 1);

            return function (glX, glY) {
                var data = this.readPixelDataFromBuffer(glX, glY, this.output);
                if (!data) {
                    return null;
                }
                c_pickVector[0] = data[0] / 254;
                c_pickVector[1] = data[1] / 254;
                c_pickVector[2] = data[2] / 254;

                // TODO: Optimize (2 Float arrays created)
                return XML3D.math.vec3.subtract(XML3D.math.vec3.create(), XML3D.math.vec3.scale(XML3D.math.vec3.create(), c_pickVector, 2.0), c_one);
            }
        }())
    });


    webgl.PickNormalRenderPass = PickNormalRenderPass;

}(XML3D.webgl));