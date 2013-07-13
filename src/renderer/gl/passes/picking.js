(function (webgl) {

    var c_data = new Uint8Array(8);

    /**
     * Reads pixels from the provided buffer
     *
     * @param {number} glX OpenGL Coordinate of color buffer
     * @param {number} glY OpenGL Coordinate of color buffer
     * @param {XML3D.webgl.GLRenderTarget} buffer Buffer to read pixels from
     * @returns {Uint8Array} pixel data
     */
    var readPixelDataFromBuffer = function (gl, glX, glY, target) {
        var scale = target.scale;
        var x = glX * scale;
        var y = glY * scale;

        target.bind();
        try {
            gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, c_data);
            target.unbind();
            return c_data;
        } catch (e) {
            XML3D.debug.logException(e);
            target.unbind();
            return null;
        }
    };

    /**
     * @param {number} width
     * @param {number} height
     * @returns {{width: number, height: number, scale: number}}
     */
    var calcPickingBufferDimension = function (width, height) {
        var scale = 1.0;

        var hDiff = height - XML3D.webgl.MAX_PICK_BUFFER_HEIGHT;
        var wDiff = width - XML3D.webgl.MAX_PICK_BUFFER_WIDTH;

        if (hDiff > 0 || wDiff > 0) {
            if (hDiff > wDiff) {
                scale = XML3D.webgl.MAX_PICK_BUFFER_HEIGHT / height;
            } else {
                scale = XML3D.webgl.MAX_PICK_BUFFER_WIDTH / width;
            }
        }
        return {
            width: Math.floor(width * scale),
            height: Math.floor(height * scale),
            scale: scale
        }
    }

    /**
     *
     * @param {XML3D.webgl.GLContext} context
     * @param {number} width
     * @param {number} height
     * @constructor
     */
    var PickingRenderPass = function (context, width, height) {
        this.context = context;
        this.program = context.programFactory.getPickingObjectIdProgram();

        var dim = calcPickingBufferDimension(width, height);

        var gl = this.context.gl;
        this.target = new webgl.GLRenderTarget(context, {
            width: dim.width,
            height: dim.height,
            colorFormat: gl.RGBA,
            depthFormat: gl.DEPTH_COMPONENT16,
            stencilFormat: null,
            depthAsRenderbuffer : true,
            scale: dim.scale
        });
        this.clearBits = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;
    };

    XML3D.extend(PickingRenderPass.prototype, {
        renderScene: (function () {

            var c_mvp = XML3D.math.mat4.create();

            return function (scene) {
                var gl = this.context.gl;
                this.target.bind();

                gl.enable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
                gl.disable(gl.BLEND);

                gl.viewport(0, 0, this.target.width, this.target.height);
                gl.clear(this.clearBits);

                this.program.bind();
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

                    this.program.setUniformVariables(parameters);
                    mesh.draw(this.program);
                }
                this.program.unbind();
                this.target.unbind();
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
        getRenderObjectFromPickingBuffer: function (x, y, scene) {
            var data = readPixelDataFromBuffer(this.context.gl, x, y, this.target);

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