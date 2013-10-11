(function (webgl) {

    /**
     *
     * @constructor
     */
    var ForwardRenderPass = function (context, opt) {
        webgl.BaseRenderPass.call(this, context, opt);
        this.sorter = new webgl.ObjectSorter();
    };
    XML3D.createClass(ForwardRenderPass, webgl.BaseRenderPass);

    XML3D.extend(ForwardRenderPass.prototype, {
        renderScene: (function () {
            /**
             * @type Float32Array
             */
            var c_worldToViewMatrix = XML3D.math.mat4.create();

            return function (scene) {
                var gl = this.context.gl,
                    target = this.target,
                    count = { objects: 0, primitives: 0 };

                target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
                gl.viewport(0, 0, target.getWidth(), target.getHeight());
                gl.enable(gl.DEPTH_TEST);

                scene.updateReadyObjectsFromActiveView(target.getWidth() / target.getHeight());
                scene.getActiveView().getWorldToViewMatrix(c_worldToViewMatrix);

                var sorted = this.sorter.sortScene(scene, c_worldToViewMatrix);

                //Render opaque objects
                for (var program in sorted.opaque) {
                    this.renderObjectsToActiveBuffer(sorted.opaque[program], scene, { transparent: false, stats: count });
                }

                //Render transparent objects
                for (var k = 0; k < sorted.transparent.length; k++) {
                    var objectArray = [sorted.transparent[k]];
                    this.renderObjectsToActiveBuffer(objectArray, scene, { transparent: true, stats: count });
                }
                scene.lights.changed = false;
                return { count: count };
            }
        }()),

        renderObjectsToActiveBuffer: (function () {

            var c_viewMat_tmp = XML3D.math.mat4.create();
            var c_projMat_tmp = XML3D.math.mat4.create();
            var tmpModelMatrix = XML3D.math.mat4.create();
            var tmpModelView = XML3D.math.mat4.create();
            var tmpModelViewProjection = XML3D.math.mat4.create();
            var tmpNormalMatrix = XML3D.math.mat3.create();

            return function (objectArray, scene, opts) {
                var objCount = 0;
                var primitiveCount = 0;
                var parameters = {};
                var stats = opts.stats || {};
                var transparent = opts.transparent === true || false;
                var gl = this.context.gl;

                if (objectArray.length == 0) {
                    return;
                }

                if (transparent) {
                    gl.enable(gl.BLEND);
                    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                }

                // At this point, we have to gurantee (via FSM), that the RenderObject has a valid shader
                var program = objectArray[0].program;

                program.bind();
                //this.shaderManager.updateActiveShader(shader);
                scene.getActiveView().getWorldToViewMatrix(c_viewMat_tmp);
                scene.getActiveView().getProjectionMatrix(c_projMat_tmp, this.width / this.height);

                parameters["viewMatrix"] = c_viewMat_tmp;
                parameters["projectionMatrix"] = c_projMat_tmp;
                //parameters["cameraPosition"] = this.camera.getWorldSpacePosition();
                parameters["screenWidth"] = this.target.width;

                //Set global data that is shared between all objects using this shader
                program.setUniformVariables(parameters);
                parameters = {};

                for (var i = 0, n = objectArray.length; i < n; i++) {
                    var obj = objectArray[i];
                    if (!obj.isVisible())
                        continue;

                    var mesh = obj.mesh;
                    XML3D.debug.assert(mesh, "We need a mesh at his point.");

                    obj.getWorldMatrix(tmpModelMatrix);
                    parameters["modelMatrix"] = tmpModelMatrix;

                    obj.getModelViewMatrix(tmpModelView);
                    parameters["modelViewMatrix"] = tmpModelView;

                    obj.getModelViewProjectionMatrix(tmpModelViewProjection);
                    parameters["modelViewProjectionMatrix"] = tmpModelViewProjection;

                    obj.getNormalMatrix(tmpNormalMatrix);
                    parameters["normalMatrix"] = tmpNormalMatrix;

                    program.setUniformVariables(parameters);
                    if (obj.override !== null) {
                        program.setUniformVariableOverride(obj.override);
                    }

                    primitiveCount += mesh.draw(program);
                    objCount++;

                    if (obj.override !== null) {
                        //TODO variable needs to be set back to the proper value instead of the default one
                        program.undoUniformVariableOverride(obj.override);
                    }
                    if (transparent) {
                        gl.disable(gl.BLEND);
                    }

                }

                stats.objects += objCount;
                stats.primitives += primitiveCount;
                return stats;
            }
        }())

    });


    webgl.ForwardRenderPass = ForwardRenderPass;

}(XML3D.webgl));
