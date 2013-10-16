(function (webgl) {

    /**
     * @constructor
     */
    var SceneRenderPass = function (pipeline, output, opt) {
        webgl.BaseRenderPass.call(this, pipeline, output, opt);
    };

    XML3D.createClass(SceneRenderPass, webgl.BaseRenderPass, {
        /**
         * @param Array
         */
        renderObjectsToActiveBuffer: (function () {

            var tmpModelMatrix = XML3D.math.mat4.create();
            var tmpModelView = XML3D.math.mat4.create();
            var tmpModelViewProjection = XML3D.math.mat4.create();
            var tmpNormalMatrix = XML3D.math.mat3.create();
            var c_objectSystemUniforms = ["modelMatrix", "modelViewMatrix", "modelViewProjectionMatrix", "normalMatrix"];

            return function (objectArray, scene, target, systemUniforms, sceneParameterFilter, opt) {
                var objCount = 0;
                var primitiveCount = 0;
                var stats = opt.stats || {};
                var transparent = opt.transparent === true || false;
                var gl = this.pipeline.context.gl;
                var program = opt.program || objectArray[0].getProgram();

                if (objectArray.length == 0) {
                    return;
                }

                if (transparent) {
                    gl.enable(gl.BLEND);
                    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                }

                // At this point, we guarantee that the RenderObject has a valid shader
                program.bind();

                //Set global data that is shared between all objects using this shader
                program.setSystemUniformVariables(sceneParameterFilter, systemUniforms);

                var prevOverride = null;

                for (var i = 0, n = objectArray.length; i < n; i++) {
                    var obj = objectArray[i];
                    if (!obj.isVisible())
                        continue;

                    var mesh = obj.mesh;
                    XML3D.debug.assert(mesh, "We need a mesh at this point.");

                    obj.getWorldMatrix(tmpModelMatrix);
                    systemUniforms["modelMatrix"] = tmpModelMatrix;

                    obj.getModelViewMatrix(tmpModelView);
                    systemUniforms["modelViewMatrix"] = tmpModelView;

                    obj.getModelViewProjectionMatrix(tmpModelViewProjection);
                    systemUniforms["modelViewProjectionMatrix"] = tmpModelViewProjection;

                    obj.getNormalMatrix(tmpNormalMatrix);
                    systemUniforms["normalMatrix"] = tmpNormalMatrix;

                    program.setSystemUniformVariables(c_objectSystemUniforms, systemUniforms);

                    program.changeUniformVariableOverride(prevOverride, mesh.uniformOverride);
                    prevOverride = mesh.uniformOverride;

                    primitiveCount += mesh.draw(program);
                    objCount++;

                    if (transparent) {
                        gl.disable(gl.BLEND);
                    }

                }
                program.changeUniformVariableOverride(prevOverride, null);

                program.unbind();
                stats.objects += objCount;
                stats.primitives += primitiveCount;
                return stats;
            }
        }())


    });
    webgl.SceneRenderPass = SceneRenderPass;

}(XML3D.webgl));
