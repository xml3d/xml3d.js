var SceneRenderPass = require("./scene-pass.js");
var ObjectSorter = require("../../renderer/tools/objectsorter.js");
var mat4 = require("gl-matrix").mat4;

/**
 * @param {GLRenderInterface} renderInterface
 * @param {string} output
 * @param {RenderLight} light
 * @param {*} opt
 * @extends {SceneRenderPass}
 * @constructor
 */
var PointLightPass = function (renderInterface, output, light, opt) {
    SceneRenderPass.call(this, renderInterface, output, opt);
    this.light = light;
    this.program = null;
};

XML3D.createClass(PointLightPass, SceneRenderPass, {

    init: function (context) {
        this.sorter = new ObjectSorter();
        this.program = context.programFactory.getProgramByName("light-depth");
    },

    renderScene: function() {
        this.render(this.light.scene);
    },

    render: (function () {
        var c_viewMat_tmp = mat4.create();
        var c_projMat_tmp = mat4.create();
        var c_programSystemUniforms = ["viewMatrix", "projectionMatrix"];

        return function (scene) {

            var gl = this.renderInterface.context.gl, target = this.output, width = target.getWidth(), height = target.getHeight(), aspect = width / height, frustum = this.light.getFrustum(aspect), program = this.program;
            for (var side = 0; side < target.glSides.length; side++) {
                //calculate rotationmatrix for that face
                var mat_rot = new XML3D.Mat4();

                if (side == 0) { //look into +x o
                    mat_rot.m11 = 0;
                    mat_rot.m12 = 0;
                    mat_rot.m13 = -1;
                    mat_rot.m21 = 0;
                    mat_rot.m22 = -1;
                    mat_rot.m23 = 0;
                    mat_rot.m31 = -1;
                    mat_rot.m32 = 0;
                    mat_rot.m33 = 0;

                } else if (side == 1) { //look into -x
                    mat_rot.m11 = 0;
                    mat_rot.m12 = 0;
                    mat_rot.m13 = 1;
                    mat_rot.m21 = 0;
                    mat_rot.m22 = -1;
                    mat_rot.m23 = 0;
                    mat_rot.m31 = 1;
                    mat_rot.m32 = 0;
                    mat_rot.m33 = 0;

                } else if (side == 2) { //look into +y
                    mat_rot.m11 = 1;
                    mat_rot.m12 = 0;
                    mat_rot.m13 = 0;
                    mat_rot.m21 = 0;
                    mat_rot.m22 = 0;
                    mat_rot.m23 = -1;
                    mat_rot.m31 = 0;
                    mat_rot.m32 = 1;
                    mat_rot.m33 = 0;

                } else if (side == 3) { //look into -y
                    mat_rot.m11 = 1;
                    mat_rot.m12 = 0;
                    mat_rot.m13 = 0;
                    mat_rot.m21 = 0;
                    mat_rot.m22 = 0;
                    mat_rot.m23 = 1;
                    mat_rot.m31 = 0;
                    mat_rot.m32 = -1;
                    mat_rot.m33 = 0;

                } else if (side == 4) { //look into +z
                    mat_rot.m11 = 1;
                    mat_rot.m12 = 0;
                    mat_rot.m13 = 0;
                    mat_rot.m21 = 0;
                    mat_rot.m22 = -1;
                    mat_rot.m23 = 0;
                    mat_rot.m31 = 0;
                    mat_rot.m32 = 0;
                    mat_rot.m33 = -1;

                } else if (side == 5) { //look into -z
                    mat_rot.m11 = -1;
                    mat_rot.m12 = 0;
                    mat_rot.m13 = 0;
                    mat_rot.m21 = 0;
                    mat_rot.m22 = -1;
                    mat_rot.m23 = 0;
                    mat_rot.m31 = 0;
                    mat_rot.m32 = 0;
                    mat_rot.m32 = 1;
                }

                target.bind(side);

                gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
                gl.enable(gl.DEPTH_TEST);

                var count = {objects: 0, primitives: 0};

                this.light.model.getLightViewMatrix(c_viewMat_tmp);
                //rotate for the apropriate side of the cubemap
                XML3D.math.mat4.mul(c_viewMat_tmp, mat_rot.data, c_viewMat_tmp);

                frustum.getProjectionMatrix(c_projMat_tmp, aspect);

                scene.updateReadyObjectsFromMatrices(c_viewMat_tmp, c_projMat_tmp);
                var objects = this.sorter.sortObjects(scene.ready);

                var parameters = {};
                parameters["viewMatrix"] = c_viewMat_tmp;
                parameters["projectionMatrix"] = c_projMat_tmp;

                //Render opaque objects
                for (var i in objects.zLayers) {
                    var zLayer = objects.zLayers[i];
                    gl.clear(gl.DEPTH_BUFFER_BIT);
                    for (var prg in objects.opaque[zLayer]) {
                        this.renderObjectsToActiveBuffer(objects.opaque[zLayer][prg], scene, target, parameters, c_programSystemUniforms, {
                            transparent: false,
                            stats: count,
                            program: program
                        });
                    }
                }

                // Do not render transparent objects (considered to not throw shadows
                target.unbind();
            }
            return {count: count};
        }
    }())
});


module.exports = PointLightPass;

