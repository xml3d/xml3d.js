var BaseRenderPass = require("./base.js");
var mat4 = require("gl-matrix").mat4;
var ObjectSorter = require("../../renderer/tools/objectsorter.js");

var PickObjectRenderPass = function (renderInterface, output, opt) {
    BaseRenderPass.call(this, renderInterface, output, opt);
    this.sorter = new ObjectSorter();
};
XML3D.createClass(PickObjectRenderPass, BaseRenderPass);

XML3D.extend(PickObjectRenderPass.prototype, {
    render: (function () {
        var c_mvp = mat4.create(), c_uniformCollection = {
                envBase: {},
                envOverride: null,
                sysBase: {}
            }, c_systemUniformNames = ["id", "modelViewProjectionMatrix"];

        return function (objects, viewMatrix, projMatrix) {
            var gl = this.renderInterface.context.gl, target = this.output;
            target.bind();
            var sortedObjects = this.sorter.sortObjects(objects, viewMatrix);

            gl.enable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.BLEND);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var program = this.renderInterface.context.programFactory.getPickingObjectIdProgram();
            program.bind();
            var objCount = 0;
            for (var j = 0, n = sortedObjects.zLayers.length; j < n; j++) {
                var zLayer = sortedObjects.zLayers[j];
                gl.clear(gl.DEPTH_BUFFER_BIT);
                for (var ind in sortedObjects.opaque[zLayer]) {
                    var objs = sortedObjects.opaque[zLayer][ind];
                    for (var i=0; i < objs.length; i++) {
                        var obj = objs[i];
                        var mesh = obj.mesh;

                        if (!obj.visible)
                            continue;

                        if (viewMatrix && projMatrix) {
                            obj.updateModelViewMatrix(viewMatrix);
                            obj.updateModelViewProjectionMatrix(projMatrix);
                        }

                        obj.getModelViewProjectionMatrix(c_mvp);

                        var objId = ++objCount;
                        obj.pickId = objId;
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
                }

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
     * @returns {RenderObject|null} Picked Object
     */
    getRenderObjectFromPickingBuffer: function (x, y, objects) {
        var data = this.readPixelDataFromBuffer(x, y, this.output);

        if (!data)
            return null;

        var result = null;
        var objId = data[0] * 65536 + data[1] * 256 + data[2];

        if (objId > 0) {
            for (var i=0; i < objects.length; i++) {
                if (objects[i].inFrustum && objects[i].pickId === objId) {
                    result = objects[i];
                    break;
                }
            }
        }
        return result;
    }
});

module.exports = PickObjectRenderPass;

