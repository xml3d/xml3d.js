var SceneRenderPass = require("./scene-pass.js");
var ObjectSorter = require("../../renderer/tools/objectsorter.js");
var mat4 = require("gl-matrix").mat4;

var ForwardRenderPass = function (renderInterface, output, opt) {
    SceneRenderPass.call(this, renderInterface, output, opt);
    this.sorter = new ObjectSorter();
    this.lastRenderStats = {};
};

XML3D.createClass(ForwardRenderPass, SceneRenderPass);

XML3D.extend(ForwardRenderPass.prototype, {


    render: (function () {
        /**
         * @type mat4
         */
        var c_worldToViewMatrix = mat4.create();
        var c_viewToWorldMatrix = mat4.create();
        var c_projectionMatrix = mat4.create();

        return function (scene) {
            var gl = this.renderInterface.context.gl, count = {
                    objects: 0,
                    primitives: 0
                }, target = this.output, systemUniforms = scene.systemUniforms, width = target.getWidth(), height = target.getHeight(), aspect = width / height;

            target.bind();
            this.setGLStates();

            scene.updateReadyObjectsFromActiveView(aspect);
            scene.getActiveView().getWorldToViewMatrix(c_worldToViewMatrix);
            scene.getActiveView().getViewToWorldMatrix(c_viewToWorldMatrix);
            scene.getActiveView().getProjectionMatrix(c_projectionMatrix, aspect);

            var sorted = this.sorter.sortObjects(scene.ready, c_worldToViewMatrix);

            systemUniforms["viewMatrix"] = c_worldToViewMatrix;
            systemUniforms["viewInverseMatrix"] = c_viewToWorldMatrix;
            systemUniforms["projectionMatrix"] = c_projectionMatrix;
            systemUniforms["cameraPosition"] = scene.getActiveView().getWorldSpacePosition();
            systemUniforms["coords"] = [target.width, target.height, 1];

            if (this.inputs.ssaoMap)
                systemUniforms["ssaoMap"] = [this.inputs.ssaoMap.colorTarget.handle];

            //Render opaque objects
            for (var i in sorted.zLayers) {
                var zLayer = sorted.zLayers[i];
                gl.clear(gl.DEPTH_BUFFER_BIT);
                for (var program in sorted.opaque[zLayer]) {
                    this.renderObjectsToActiveBuffer(sorted.opaque[zLayer][program], scene, target, systemUniforms, {
                        transparent: false,
                        stats: count
                    });
                }
                if (sorted.transparent[zLayer].length) {
                    for (var k = 0; k < sorted.transparent[zLayer].length; k++) {
                        var objectArray = [sorted.transparent[zLayer][k]];
                        this.renderObjectsToActiveBuffer(objectArray, scene, target, systemUniforms, {
                            transparent: true,
                            stats: count
                        });
                    }
                }
            }

            scene.lights.changed = false;
            target.unbind();
            this.lastRenderStats.count = count;
        }
    }()),

    getRenderStats: function () {
        return this.lastRenderStats;
    }

});


module.exports = ForwardRenderPass;

