(function (webgl) {


    /**
     *
     * @param {XML3D.webgl.GLContext} context
     * @param {number} width
     * @param {number} height
     * @constructor
     */
    var PickingRenderPass = function (context, opt) {
        webgl.BaseRenderPass.call(this, context, opt);
        this.program = context.programFactory.getPickingObjectIdProgram();
        var gl = this.context.gl;
        this.clearBits = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;
    };
    XML3D.createClass(PickingRenderPass, webgl.BaseRenderPass);

    XML3D.extend(PickingRenderPass.prototype, {
        renderScene: (function () {

            var c_mvp = XML3D.math.mat4.create();

            return function (scene) {
                var gl = this.context.gl;
                this.target.bind();

                gl.enable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
                gl.disable(gl.BLEND);

                gl.viewport(0, 0, this.target.getWidth(), this.target.getHeight());
                gl.clear(this.clearBits);

                scene.updateReadyObjectsFromActiveView(this.target.getWidth() / this.target.getHeight());


                this.program.bind();
                var objects = scene.ready;

                for (var j = 0, n = objects.length; j < n; j++) {
                    var obj = objects[j];
                    var mesh = obj.mesh;

                    if (!obj.isVisible())
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
         * @param {XML3D.webgl.GLScene} scene Scene
         * @param {Object} buffer Buffer
         * @returns {XML3D.webgl.RenderObject|null} Picked Object
         *
         */
        getRenderObjectFromPickingBuffer: function (x, y, scene) {
            var data = this.readPixelDataFromBuffer(x, y);

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