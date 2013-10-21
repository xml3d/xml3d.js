(function (webgl) {

    /**
     * @param {RenderPipeline} pipeline
     * @param {string} output
     * @param {RenderLight} light
     * @param {*} opt
     * @extends {SceneRenderPass}
     * @constructor
     */
    var LightPass = function (pipeline, output, light, opt) {
        webgl.SceneRenderPass.call(this, pipeline, output, opt);
        this.light = light;
    };

    XML3D.createClass(LightPass, webgl.SceneRenderPass, {

        init: function (context) {
            this.sorter = new webgl.ObjectSorter();
            console.log("Init LightPass")
            var shader = context.programFactory.getProgramByName("light-depth");
            this.pipeline.addShader("light-depth", shader);

        },

        render:  (function () {
            var c_viewMat_tmp = XML3D.math.mat4.create();
            var c_projMat_tmp = XML3D.math.mat4.create();
            var c_programSystemUniforms = ["viewMatrix", "projectionMatrix", "screenWidth"];

            return function (scene) {
                var gl = this.pipeline.context.gl,
                    target = this.pipeline.getRenderTarget(this.output),
                    width = target.getWidth(),
                    height = target.getHeight(),
                    aspect = width / height,
                    frustum = this.light.getFrustum(aspect),
                    program = this.pipeline.getShader("light-depth");


                target.bind();
                gl.clear(this.clearBits);
                gl.viewport(0, 0, width, height);
                gl.enable(gl.DEPTH_TEST);

                var count = { objects: 0, primitives: 0 };

                this.light.getWorldToLightMatrix(c_viewMat_tmp);
                frustum.getProjectionMatrix(c_projMat_tmp, aspect);

                scene.updateReadyObjectsFromMatrices(c_viewMat_tmp, c_projMat_tmp);
                var objects = this.sorter.sortScene(scene);

                var parameters = {};
                parameters["viewMatrix"] = c_viewMat_tmp;
                parameters["projectionMatrix"] = c_projMat_tmp;
                parameters["screenWidth"] = width;

                //Render opaque objects
                for (var shader in objects.opaque) {
                    this.renderObjectsToActiveBuffer(objects.opaque[shader], scene, target, parameters, c_programSystemUniforms, { transparent: false, stats: count, program: program });
                }

                // Do not render transparent objects (considered to not throw shadows
                target.unbind();
                return { count: count };
            }
        }())
    });




    webgl.LightPass = LightPass;

}(XML3D.webgl));
