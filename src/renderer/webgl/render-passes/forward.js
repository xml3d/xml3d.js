var SceneRenderPass = require("./scene-pass.js");
var ObjectSorter = require("../../renderer/tools/objectsorter.js");

var ForwardRenderPass = function (renderInterface, output, opt) {
    SceneRenderPass.call(this, renderInterface, output, opt);
    this.sorter = new ObjectSorter();
    this.reassignShadowMaps = {};
    this.lightPasses = {};
    this.lastRenderStats = {};
};

XML3D.createClass(ForwardRenderPass, SceneRenderPass);

XML3D.extend(ForwardRenderPass.prototype, {
    clearLightPasses: function () {
        var self = this;
        Object.keys(this.lightPasses).forEach(function (uniformName) {
            self.removePrePass(self.lightPasses[uniformName]);
        });
        this.lightPasses = {};
        for (var name in this.reassignShadowMaps)
            this.reassignShadowMaps[name] = true;
    },

    addLightPass: function (uniformName, pass) {
        if (!this.lightPasses[uniformName])
            this.lightPasses[uniformName] = [];
        this.lightPasses[uniformName].push(pass);
        if (pass)
            this.addPrePass(pass);
        this.reassignShadowMaps[uniformName] = true;
    },

    setShadowMapReassign: function (uniformName) {
        this.reassignShadowMaps[uniformName] = true;
    },

    updateShadowMapUniforms: function (scene) {
        var reassignShadowNames = [];
        for (var name in this.reassignShadowMaps) {
            if (this.reassignShadowMaps[name]) {
                this.reassignShadowMaps[name] = false;
                reassignShadowNames.push(name);
                var lightPasses = this.lightPasses[name];
                scene.systemUniforms[name] = [];
                if (typeof lightPasses == 'undefined' || !lightPasses) //TODO
                    continue;
                for (var i = 0; i < lightPasses.length; ++i) {
                    var output = lightPasses[i].output;
                    var handle = output && output.colorTarget && output.colorTarget.handle;
                    scene.systemUniforms[name].push(handle);
                }
            }
        }
        if (reassignShadowNames.length > 0) {
            scene.updateSystemUniforms(reassignShadowNames);
        }
    },

    render: (function () {
        /**
         * @type Float32Array
         */
        var c_worldToViewMatrix = XML3D.math.mat4.create();
        var c_viewToWorldMatrix = XML3D.math.mat4.create();
        var c_projectionMatrix = XML3D.math.mat4.create();
        var c_programSystemUniforms = ["viewMatrix", "viewInverseMatrix", "projectionMatrix", "cameraPosition", "coords", "ssaoMap", "width"];

        return function (scene) {
            var gl = this.renderInterface.context.gl, count = {
                    objects: 0,
                    primitives: 0
                }, target = this.output, systemUniforms = scene.systemUniforms, width = target.getWidth(), height = target.getHeight(), aspect = width / height;

            this.updateShadowMapUniforms(scene);


            target.bind();
            this.setGLStates();
            gl.viewport(0, 0, width, height);

            scene.updateReadyObjectsFromActiveView(aspect);
            scene.getActiveView().getWorldToViewMatrix(c_worldToViewMatrix);
            scene.getActiveView().getViewToWorldMatrix(c_viewToWorldMatrix);
            scene.getActiveView().getProjectionMatrix(c_projectionMatrix, aspect);

            var sorted = this.sorter.sortScene(scene, c_worldToViewMatrix);

            systemUniforms["viewMatrix"] = c_worldToViewMatrix;
            systemUniforms["viewInverseMatrix"] = c_viewToWorldMatrix;
            systemUniforms["projectionMatrix"] = c_projectionMatrix;
            systemUniforms["cameraPosition"] = scene.getActiveView().getWorldSpacePosition();
            systemUniforms["coords"] = [target.width, target.height, 1];

            if (this.inputs.ssaoMap)
                systemUniforms["ssaoMap"] = [this.inputs.ssaoMap.colorTarget.handle];

            //Render opaque objects
            for (var program in sorted.opaque) {
                this.renderObjectsToActiveBuffer(sorted.opaque[program], scene, target, systemUniforms, c_programSystemUniforms, {
                    transparent: false,
                    stats: count
                });
            }

            //Render transparent objects
            for (var k = 0; k < sorted.transparent.length; k++) {
                var objectArray = [sorted.transparent[k]];
                this.renderObjectsToActiveBuffer(objectArray, scene, target, systemUniforms, c_programSystemUniforms, {
                    transparent: true,
                    stats: count
                });
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

