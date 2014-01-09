(function (webgl) {


    /**
     *
     * @param {XML3D.webgl.GLContext} context
     * @param {number} width
     * @param {number} height
     * @constructor
     */
    var PickObjectRenderPass = function (context, opt) {
        webgl.BaseRenderPass.call(this, context, opt);
        this.program = context.programFactory.getPickingObjectIdProgram();
        var gl = this.context.gl;
        this.clearBits = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;
    };
    XML3D.createClass(PickObjectRenderPass, webgl.BaseRenderPass);

    XML3D.extend(PickObjectRenderPass.prototype, {
        renderObjects: (function () {
            var c_mvp = XML3D.math.mat4.create(),
                c_uniformCollection = {envBase: {}, envOverride: null, sysBase: {}},
                c_systemUniformNames = ["id", "modelViewProjectionMatrix"];

            return function (objects, viewMatrix, projMatrix) {
                var gl = this.context.gl;
                this.target.bind();
                this.program.bind();

                gl.enable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
                gl.disable(gl.BLEND);
                gl.viewport(0, 0, this.target.getWidth(), this.target.getHeight());
                gl.clear(this.clearBits);

                for (var j = 0, n = objects.length; j < n; j++) {
                    var obj = objects[j];
                    var mesh = obj.mesh;

                    if (!obj.isVisible())
                        continue;

                    if (viewMatrix && projMatrix) {
                        obj.updateModelViewMatrix(viewMatrix);
                        obj.updateModelViewProjectionMatrix(projMatrix);
                    }

                    obj.getModelViewProjectionMatrix(c_mvp);

                    var objId = j + 1;
                    var c1 = objId & 255;
                    objId = objId >> 8;
                    var c2 = objId & 255;
                    objId = objId >> 8;
                    var c3 = objId & 255;

                    c_uniformCollection.sysBase["id"] = [c3 / 255.0, c2 / 255.0, c1 / 255.0];
                    c_uniformCollection.sysBase["modelViewProjectionMatrix"] = c_mvp;

                    this.program.setUniformVariables(null, c_systemUniformNames, c_uniformCollection);
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
         * @param {Array} objects List of objects that were rendered in the previous picking pass
         * @returns {XML3D.webgl.RenderObject|null} Picked Object
         */
        getRenderObjectFromPickingBuffer: function (x, y, objects) {
            var data = this.readPixelDataFromBuffer(x, y);

            if (!data)
                return null;

            var result = null;
            var objId = data[0] * 65536 + data[1] * 256 + data[2];

            if (objId > 0) {
                var pickedObj = objects[objId - 1];
                result = pickedObj;
            }
            return result;
        }
    });

    webgl.PickObjectRenderPass = PickObjectRenderPass;

}(XML3D.webgl));