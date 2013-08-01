(function (webgl) {

    /**
     *
     * @constructor
     */
    var ForwardRenderPass = function (opt) {
        webgl.BaseRenderPass.call(this, opt);
		this.sorter = new webgl.ObjectSorter();
    };
    XML3D.createClass(ForwardRenderPass, webgl.BaseRenderPass);

    XML3D.extend(ForwardRenderPass.prototype, {
 		init: function(context) {
            var target = this.pipeline.getRenderTarget("screen");
            if (!target) {
                this.pipeline.addRenderTarget("screen", context.canvasTarget);
            }
        },
        renderScene: (function () {
            /**
             * @type Float32Array
             */
            var c_worldToViewMatrix = XML3D.math.mat4.create();

            return function (scene) {
                var gl = this.pipeline.context.gl,
                    count = { objects: 0, primitives: 0 },
                    target = this.pipeline.getRenderTarget("screen"),
                    width = target.getWidth(),
                    height = target.getHeight(),
                    aspect = width / height;

                target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
                gl.viewport(0, 0, width, height);
                gl.enable(gl.DEPTH_TEST);

                scene.updateReadyObjectsFromActiveView(aspect);
                scene.getActiveView().getWorldToViewMatrix(c_worldToViewMatrix);

                var sorted = this.sorter.sortScene(scene, c_worldToViewMatrix);

                //Render opaque objects
                for (var program in sorted.opaque) {
                    this.renderObjectsToActiveBuffer(sorted.opaque[program], scene, target, { transparent: false, stats: count });
                }

                //Render transparent objects
                for (var k = 0; k < sorted.transparent.length; k++) {
                    var objectArray = [sorted.transparent[k]];
                    this.renderObjectsToActiveBuffer(objectArray, scene, target, { transparent: true, stats: count });
                }
                scene.lights.changed = false;
                target.unbind();
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
            var c_programSystemUniforms = ["viewMatrix", "projectionMatrix", "screenWidth", "cameraPosition"],
                c_objectSystemUniforms = ["modelMatrix", "modelViewMatrix", "modelViewProjectionMatrix", "normalMatrix"];

            return function (objectArray, scene, target, opts) {
                var objCount = 0;
                var primitiveCount = 0;
                var systemUniforms = scene.systemUniforms;
                var stats = opts.stats || {};
                var transparent = opts.transparent === true || false;
                var gl = this.pipeline.context.gl;

                if (objectArray.length == 0) {
                    return;
                }

                if (transparent) {
                    gl.enable(gl.BLEND);
                    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                }

                // At this point, we have to gurantee (via FSM), that the RenderObject has a valid shader
                var program = objectArray[0].getProgram();

                program.bind();
                //this.shaderManager.updateActiveShader(shader);
                scene.getActiveView().getWorldToViewMatrix(c_viewMat_tmp);
                scene.getActiveView().getProjectionMatrix(c_projMat_tmp, this.target.getWidth() / this.target.getHeight());

                systemUniforms["viewMatrix"] = c_viewMat_tmp;
                systemUniforms["projectionMatrix"] = c_projMat_tmp;
                systemUniforms["cameraPosition"] = scene.getActiveView().getWorldSpacePosition();
                systemUniforms["screenWidth"] = this.target.width;

                //Set global data that is shared between all objects using this shader
                program.setSystemUniformVariables(c_programSystemUniforms, systemUniforms);

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


    webgl.ForwardRenderPass = ForwardRenderPass;

}(XML3D.webgl));
