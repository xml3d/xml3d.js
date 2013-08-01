(function (webgl) {

    var PickObjectRenderPass = function (opt) {
        webgl.BaseRenderPass.call(this, opt);
    };
    XML3D.createClass(PickObjectRenderPass, webgl.BaseRenderPass);

    XML3D.extend(PickObjectRenderPass.prototype, {
        init: function(context) {
            var target = this.pipeline.getRenderTarget("pickBuffer");
            if (!target) {
                target = new webgl.GLScaledRenderTarget(context, webgl.MAX_PICK_BUFFER_DIMENSION, {
                    width: context.canvasTarget.width,
                    height: context.canvasTarget.height,
                    colorFormat: context.gl.RGBA,
                    depthFormat: context.gl.DEPTH_COMPONENT16,
                    stencilFormat: null,
                    depthAsRenderbuffer: true
                });
                this.pipeline.addRenderTarget("pickBuffer", target);
            }
        },

        render: (function () {
            var c_mvp = XML3D.math.mat4.create(),
                c_uniformCollection = {envBase: {}, envOverride: null, sysBase: {}},
                c_systemUniformNames = ["id", "modelViewProjectionMatrix"];

            return function (objects, viewMatrix, projMatrix) {
                var gl = this.pipeline.context.gl,
                    target = this.pipeline.getRenderTarget("pickBuffer");
                target.bind();

                gl.enable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
                gl.disable(gl.BLEND);
                gl.viewport(0, 0, target.getWidth(), target.getHeight());
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                var program = this.pipeline.context.programFactory.getPickingObjectIdProgram();
                program.bind();
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

                    program.setUniformVariables(null, c_systemUniformNames, c_uniformCollection);
                    mesh.draw(program);
                }
                program.unbind();
                target.unbind();
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
            var data = this.readPixelDataFromBuffer(x, y, this.pipeline.getRenderTarget("pickBuffer"));

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
