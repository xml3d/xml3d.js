(function (webgl) {

    /**
     *
     * @constructor
     */
    var ForwardRenderPass = function (context) {
        this.context = context;
    };

    XML3D.extend(ForwardRenderPass.prototype, {
        renderToCanvas: (function () {

            var c_viewMat_tmp = XML3D.math.mat4.create();
            var c_projMat_tmp = XML3D.math.mat4.create();

            return function (scene, width, height) {
                var gl = this.context.gl;

                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
                gl.viewport(0, 0, width, height);
                gl.enable(gl.DEPTH_TEST);

                var camera = {};
                scene.getActiveView().getViewMatrix(c_viewMat_tmp);
                camera.view = c_viewMat_tmp;

                scene.ready.forEach(function (obj) {
                    obj.updateModelViewMatrix(camera.view);
                    obj.updateNormalMatrix();
                });

                scene.updateBoundingBox();
                scene.getActiveView().getProjectionMatrix(c_projMat_tmp, width / height);
                camera.proj = c_projMat_tmp;

                scene.ready.forEach(function (obj) {
                    obj.updateModelViewProjectionMatrix(camera.proj);
                });

                var stats = { objCount: 0, triCount: 0 };

                //Sort objects by shader/transparency
                var opaqueObjects = [];
                var transparentObjects = [];
                this.sortObjects(scene.ready, scene.firstOpaqueIndex, opaqueObjects, transparentObjects);

                //Render opaque objects
                for (var shaderName in opaqueObjects) {
                    this.renderObjectsToActiveBuffer(opaqueObjects[shaderName], shaderName, scene, { transparent: false, stats: stats });
                }

                //Render transparent objects
                for (var k = 0; k < transparentObjects.length; k++) {
                    var objectArray = [transparentObjects[k]];
                    this.renderObjectsToActiveBuffer(objectArray, objectArray[0].shader, scene, { transparent: true, stats: stats });
                }
                scene.lights.changed = false;
                return [stats.objCount, stats.triCount];
            }
        }()),
        sortObjects: (function () {
            var c_tmpVec4 = XML3D.math.vec4.create();
            var c_tmpModelMatrix = XML3D.math.mat4.create();

            return function (sourceObjectArray, firstOpaque, opaque, transparent) {
                var tempArray = [], obj;
                for (var i = 0, l = sourceObjectArray.length; i < l; i++) {
                    obj = sourceObjectArray[i];
                    if (i < firstOpaque) {
                        tempArray.push(obj);
                    } else {
                        opaque[obj.shader.id] = opaque[obj.shader.id] || [];
                        opaque[obj.shader.id].push(obj);
                    }
                }

                //Sort transparent objects from back to front
                var tlength = tempArray.length;
                if (tlength > 1) {
                    for (i = 0; i < tlength; i++) {
                        obj = tempArray[i];
                        obj.getWorldMatrix(c_tmpModelMatrix);
                        XML3D.math.vec3.set(obj.mesh.bbox.center()._data, c_tmpVec4);
                        c_tmpVec4[3] = 1.0;
                        XML3D.math.vec4.transformMat4(c_tmpVec4, c_tmpVec4, c_tmpModelMatrix);
                        c_tmpVec4[3] = 1.0;
                        var center = XML3D.math.vec4.transformMat4(c_tmpVec4, c_tmpVec4, c_tmpModelMatrix);
                        tempArray[i] = [ obj, center[2] ];
                    }

                    tempArray.sort(function (a, b) {
                        return a[1] - b[1];
                    });

                    for (i = 0; i < tlength; i++) {
                        transparent[i] = tempArray[i][0];
                    }
                } else if (tlength == 1) {
                    transparent[0] = tempArray[0];
                }
                //console.log("Sorted: " + transparent.length);
            }
        }()),
        renderObjectsToActiveBuffer: (function () {

            var c_viewMat_tmp = XML3D.math.mat4.create();
            var c_projMat_tmp = XML3D.math.mat4.create();
            var tmpModelMatrix = XML3D.math.mat4.create();
            var tmpModelView = XML3D.math.mat4.create();
            var tmpModelViewProjection = XML3D.math.mat4.create();
            var tmpNormalMatrix = XML3D.math.mat4.create();

            return function (objectArray, shaderId, scene, opts) {
                var objCount = 0;
                var triCount = 0;
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
                var shader = objectArray[0].shader;
                var lights = scene.lights;

                if (shader.needsLights || lights.changed) {
                    parameters["pointLightPosition"] = lights.point.position;
                    parameters["pointLightAttenuation"] = lights.point.attenuation;
                    parameters["pointLightVisibility"] = lights.point.visibility;
                    parameters["pointLightIntensity"] = lights.point.intensity;
                    parameters["directionalLightDirection"] = lights.directional.direction;
                    parameters["directionalLightVisibility"] = lights.directional.visibility;
                    parameters["directionalLightIntensity"] = lights.directional.intensity;
                    parameters["spotLightAttenuation"] = lights.spot.attenuation;
                    parameters["spotLightPosition"] = lights.spot.position;
                    parameters["spotLightIntensity"] = lights.spot.intensity;
                    parameters["spotLightVisibility"] = lights.spot.visibility;
                    parameters["spotLightDirection"] = lights.spot.direction;
                    parameters["spotLightCosFalloffAngle"] = lights.spot.falloffAngle.map(Math.cos);

                    var softFalloffAngle = lights.spot.falloffAngle.slice();
                    for (i = 0; i < softFalloffAngle.length; i++)
                        softFalloffAngle[i] = softFalloffAngle[i] * (1.0 - lights.spot.softness[i]);
                    parameters["spotLightCosSoftFalloffAngle"] = softFalloffAngle.map(Math.cos);

                    parameters["spotLightSoftness"] = lights.spot.softness;
                    shader.needsLights = false;
                }


                shader.bind();
                //this.shaderManager.updateActiveShader(shader);
                scene.getActiveView().getViewMatrix(c_viewMat_tmp);
                scene.getActiveView().getProjectionMatrix(c_projMat_tmp, this.width / this.height);

                parameters["viewMatrix"] = c_viewMat_tmp;
                parameters["projectionMatrix"] = c_projMat_tmp;
                //parameters["cameraPosition"] = this.camera.getWorldSpacePosition();
                parameters["screenWidth"] = this.width;

                //Set global data that is shared between all objects using this shader
                shader.setUniformVariables(parameters);
                parameters = {};

                for (var i = 0, n = objectArray.length; i < n; i++) {
                    var obj = objectArray[i];
                    if (!obj.isVisible())
                        continue;

                    var mesh = obj.mesh;
                    XML3D.debug.assert(mesh && mesh.valid, "Mesh has to be valid at his point.");

                    obj.getWorldMatrix(tmpModelMatrix);
                    parameters["modelMatrix"] = tmpModelMatrix;

                    obj.getModelViewMatrix(tmpModelView);
                    parameters["modelViewMatrix"] = tmpModelView;

                    obj.getModelViewProjectionMatrix(tmpModelViewProjection);
                    parameters["modelViewProjectionMatrix"] = tmpModelViewProjection;

                    obj.getNormalMatrix(tmpNormalMatrix);
                    parameters["normalMatrix"] = tmpNormalMatrix;

                    shader.setUniformVariables(parameters);
                    if (obj.override !== null) {
                        // TODO: Set back to default after rendering
                        // this.shaderManager.setUniformVariables(shader, obj.override);
                    }

                    triCount += webgl.CoreRenderer.drawObject(gl, shader, mesh);
                    objCount++;

                    if (obj.override !== null) {
                        // this.shaderManager.resetUniformVariables(obj.shaderAdapter, shader, Object.keys(obj.override));
                    }
                    if (transparent) {
                        gl.disable(gl.BLEND);
                    }

                }

                stats.objCount += objCount;
                stats.triCount += triCount;
                return stats;
            }
        }())

    });


    webgl.ForwardRenderPass = ForwardRenderPass;

}(XML3D.webgl));