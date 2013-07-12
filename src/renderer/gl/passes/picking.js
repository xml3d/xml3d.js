(function (webgl) {

    var c_data = new Uint8Array(8);

    /**
     * Reads pixels from the provided buffer
     *
     * @param {number} glX OpenGL Coordinate of color buffer
     * @param {number} glY OpenGL Coordinate of color buffer
     * @param {Object} buffer Buffer to read pixels from
     * @returns {Uint8Array} pixel data
     */
    var readPixelDataFromBuffer = function (gl, glX, glY, buffer) {
        var scale = buffer.scale;
        var x = glX * scale;
        var y = glY * scale;

        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.handle);
        try {
            gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, c_data);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return c_data;
        } catch (e) {
            XML3D.debug.logException(e);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return null;
        }
    };

    var PickingRenderPass = function (context) {
        this.context = context;
        this.program = context.programFactory.getPickingObjectIdProgram();
    };

    XML3D.extend(PickingRenderPass.prototype, {
        renderSceneToPickingBuffer: (function () {

            var c_mvp = XML3D.math.mat4.create();

            return function (scene, buffer) {
                var gl = this.context.gl;

                gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.handle);

                gl.enable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
                gl.disable(gl.BLEND);

                gl.viewport(0, 0, buffer.width, buffer.height);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

                var shader = this.program;
                shader.bind();
                var objects = scene.ready;

                for (var j = 0, n = objects.length; j < n; j++) {
                    var obj = objects[j];
                    var mesh = obj.mesh;

                    if (!mesh.valid || !obj.visible)
                        continue;

                    var parameters = {};

                    obj.getModelViewProjectionMatrix(c_mvp);

                    var objId = j + 1;
                    var c1 = objId & 255;
                    objId = objId >> 8;
                    var c2 = objId & 255;
                    objId = objId >> 8;
                    var c3 = objId & 255;

                    parameters.id = [c3 / 255.0, c2 / 255.0, c1 / 255.0];
                    parameters.modelViewProjectionMatrix = c_mvp;

                    shader.setUniformVariables(parameters);
                    webgl.CoreRenderer.drawObject(gl, shader, mesh);
                }
                shader.unbind(shader);

                gl.disable(gl.DEPTH_TEST);

                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            };
        }()),

        /**
         * Reads pixels from the screenbuffer to determine picked object or normals.
         *
         * @param {number} x Screen Coordinate of color buffer
         * @param {number} y Screen Coordinate of color buffer
         * @param {XML3D.webgl.Scene} scene Scene
         * @param {Object} buffer Buffer
         * @returns {XML3D.webgl.RenderObject|null} Picked Object
         *
         */
        getRenderObjectFromPickingBuffer: function (x, y, scene, buffer) {
            var data = readPixelDataFromBuffer(this.context.gl, x, y, buffer);

            if (!data)
                return null;

            var result = null;
            var objId = data[0] * 65536 + data[1] * 256 + data[2];

            if (objId > 0) {
                var pickedObj = scene.ready[objId - 1];
                result = pickedObj;
            }
            return result;
        }
    });

    webgl.PickingRenderPass = PickingRenderPass;

}(XML3D.webgl));