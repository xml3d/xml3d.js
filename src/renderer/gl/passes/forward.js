(function (webgl) {

    /**
     *
     * @constructor
     */
    var ForwardRenderPass = function (pipeline, output, opt) {
        webgl.SceneRenderPass.call(this, pipeline, output, opt);
        this.sorter = new webgl.ObjectSorter();
        this.reassignShadowMaps = {};
        this.lightPasses = {};
    };
    XML3D.createClass(ForwardRenderPass, webgl.SceneRenderPass);

    XML3D.extend(ForwardRenderPass.prototype, {

        clearLightPasses: function(){
            this.lightPasses = {};
            this.clearPrePasses();
            for(var name in this.reassignShadowMaps)
                this.reassignShadowMaps[name] = true;
        },

        addLightPass: function(uniformName, pass){
            if(!this.lightPasses[uniformName])
                this.lightPasses[uniformName] = [];
            this.lightPasses[uniformName].push(pass);
            if(pass)
                this.addPrePass(pass);
            this.reassignShadowMaps[uniformName] = true;
        },

        setShadowMapReassign: function(uniformName){
            this.reassignShadowMaps[uniformName] = true;
        },

        updateShadowMapUniforms: function(scene){
            var reassignShadowNames = [];
            for(var name in this.reassignShadowMaps){
                if(this.reassignShadowMaps[name]){
                    this.reassignShadowMaps[name] = false;
                    reassignShadowNames.push(name);
                    var lightPasses = this.lightPasses[name];
                    scene.systemUniforms[name] = [];
                    for(var i = 0; i < lightPasses.length; ++i){
                        var output = lightPasses[i].output;
                        var handle = output && output.colorTarget && output.colorTarget.handle;
                        scene.systemUniforms[name].push(handle);
                    }
                }
            }
            if(reassignShadowNames.length > 0){
                scene.updateSystemUniforms(reassignShadowNames);
            }
        },

        render: (function () {
            /**
             * @type Float32Array
             */
            var c_worldToViewMatrix = XML3D.math.mat4.create();
            var c_projectionMatrix = XML3D.math.mat4.create();
            var c_programSystemUniforms = ["viewMatrix", "projectionMatrix", "screenWidth", "cameraPosition"];

            return function (scene) {
                var gl = this.pipeline.context.gl,
                    count = { objects: 0, primitives: 0 },
                    target = this.output,
                    systemUniforms = scene.systemUniforms,
                    width = target.getWidth(),
                    height = target.getHeight(),
                    aspect = width / height;

                this.updateShadowMapUniforms(scene);


                target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
                gl.viewport(0, 0, width, height);
                gl.enable(gl.DEPTH_TEST);

                scene.updateReadyObjectsFromActiveView(aspect);
                scene.getActiveView().getWorldToViewMatrix(c_worldToViewMatrix);
                scene.getActiveView().getProjectionMatrix(c_projectionMatrix, aspect);

                var sorted = this.sorter.sortScene(scene, c_worldToViewMatrix);

                systemUniforms["viewMatrix"] = c_worldToViewMatrix;
                systemUniforms["projectionMatrix"] = c_projectionMatrix;
                systemUniforms["cameraPosition"] = scene.getActiveView().getWorldSpacePosition();
                systemUniforms["screenWidth"] = width;

                //Render opaque objects
                for (var program in sorted.opaque) {
                    this.renderObjectsToActiveBuffer(sorted.opaque[program], scene, target, systemUniforms, c_programSystemUniforms, { transparent: false, stats: count });
                }

                //Render transparent objects
                for (var k = 0; k < sorted.transparent.length; k++) {
                    var objectArray = [sorted.transparent[k]];
                    this.renderObjectsToActiveBuffer(objectArray, scene, target, systemUniforms, c_programSystemUniforms, { transparent: true, stats: count });
                }
                scene.lights.changed = false;
                target.unbind();
                return { count: count };
            }
        }())

    });


    webgl.ForwardRenderPass = ForwardRenderPass;

}(XML3D.webgl));
