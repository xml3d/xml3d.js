var SceneRenderPass = require("./scene-pass.js");
var ObjectSorter = require("../../renderer/tools/objectsorter.js");

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

    render: (function () {
        var c_viewMat_tmp = XML3D.math.mat4.create();
        var c_projMat_tmp = XML3D.math.mat4.create();
        var c_programSystemUniforms = ["viewMatrix", "projectionMatrix"];

        return function (scene) {

            var gl = this.renderInterface.context.gl, target = this.output, width = target.getWidth(), height = target.getHeight(), aspect = width / height, frustum = this.light.getFrustum(aspect), program = this.program;
            for (var side = 0; side < target.glSides.length; side++) {
                //calculate rotationmatrix for that face
                var mat_rot = XML3D.math.mat4.create();
                XML3D.math.mat4.identity(mat_rot);

                if (side == 0) { //look into +x o
                    mat_rot[0] = 0;
                    mat_rot[1] = 0;
                    mat_rot[2] = -1;
                    mat_rot[4] = 0;
                    mat_rot[5] = -1;
                    mat_rot[6] = 0;
                    mat_rot[8] = -1;
                    mat_rot[9] = 0;
                    mat_rot[10] = 0;

                } else if (side == 1) { //look into -x
                    mat_rot[0] = 0;
                    mat_rot[1] = 0;
                    mat_rot[2] = 1;
                    mat_rot[4] = 0;
                    mat_rot[5] = -1;
                    mat_rot[6] = 0;
                    mat_rot[8] = 1;
                    mat_rot[9] = 0;
                    mat_rot[10] = 0;

                } else if (side == 2) { //look into +y
                    mat_rot[0] = 1;
                    mat_rot[1] = 0;
                    mat_rot[2] = 0;
                    mat_rot[4] = 0;
                    mat_rot[5] = 0;
                    mat_rot[6] = -1;
                    mat_rot[8] = 0;
                    mat_rot[9] = 1;
                    mat_rot[10] = 0;

                } else if (side == 3) { //look into -y
                    mat_rot[0] = 1;
                    mat_rot[1] = 0;
                    mat_rot[2] = 0;
                    mat_rot[4] = 0;
                    mat_rot[5] = 0;
                    mat_rot[6] = 1;
                    mat_rot[8] = 0;
                    mat_rot[9] = -1;
                    mat_rot[10] = 0;

                } else if (side == 4) { //look into +z
                    mat_rot[0] = 1;
                    mat_rot[1] = 0;
                    mat_rot[2] = 0;
                    mat_rot[4] = 0;
                    mat_rot[5] = -1;
                    mat_rot[6] = 0;
                    mat_rot[8] = 0;
                    mat_rot[9] = 0;
                    mat_rot[10] = -1;

                } else if (side == 5) { //look into -z
                    mat_rot[0] = -1;
                    mat_rot[1] = 0;
                    mat_rot[2] = 0;
                    mat_rot[4] = 0;
                    mat_rot[5] = -1;
                    mat_rot[6] = 0;
                    mat_rot[8] = 0;
                    mat_rot[9] = 0;
                    mat_rot[10] = 1;
                }

                target.bind(side);

                gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
                gl.viewport(0, 0, width, height);
                gl.enable(gl.DEPTH_TEST);

                var count = {objects: 0, primitives: 0};

                this.light.model.getWorldToLightMatrix(c_viewMat_tmp);
                //rotate for the apropriate side of the cubemap
                XML3D.math.mat4.mul(c_viewMat_tmp, mat_rot, c_viewMat_tmp);

                frustum.getProjectionMatrix(c_projMat_tmp, aspect);

                scene.updateReadyObjectsFromMatrices(c_viewMat_tmp, c_projMat_tmp);
                var objects = this.sorter.sortScene(scene);

                var parameters = {};
                parameters["viewMatrix"] = c_viewMat_tmp;
                parameters["projectionMatrix"] = c_projMat_tmp;

                //Render opaque objects
                for (var shader in objects.opaque) {
                    this.renderObjectsToActiveBuffer(objects.opaque[shader], scene, target, parameters, c_programSystemUniforms, {
                        transparent: false,
                        stats: count,
                        program: program
                    });
                }

                // Do not render transparent objects (considered to not throw shadows
                target.unbind();
            }
            return {count: count};
        }
    }())
});


module.exports = PointLightPass;

