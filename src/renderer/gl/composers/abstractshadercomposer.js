(function (webgl) {

    /**
     * @interface
     */
    var IShaderComposer = function () {
    };

    /**
     * @enum
     */
    IShaderComposer.UpdateState = {
        SHADER_UPDATED: 1,
        SHADER_COMPILED: 2,
        SHADER_UNCHANGED: 3
    };

    IShaderComposer.State = {
        OK: 1,
        NO_SCRIPT: 2,
        NO_PROGRAM: 3
    };

    /**
     * @param {XML3D.webgl.scene} scene
     * @param {{}=} opt
     */
    IShaderComposer.prototype.update = function (scene, opt) {
    };

    /**
     *
     * @returns XML3D.webgl.ShaderClosure|null
     */
    IShaderComposer.prototype.getShaderClosure = function (scene) {
        return null;
    };

    /**
     * @returns {Array.<string>}
     */
    IShaderComposer.prototype.getRequestFields = function () {
        return [];
    };

    /**
     * @returns {{}}
     */
    IShaderComposer.prototype.getShaderAttributes = function () {
        return {};
    };


    /**
     * @implements IShaderComposer
     * @constructor
     */
    var DefaultComposer = function (context) {
        this.context = context;
    };

    XML3D.createClass(DefaultComposer, XML3D.util.EventDispatcher, {
        update: function () {
        },
        getShaderClosure: function () {
            return this.context.programFactory.getFallbackProgram();
        },
        getShaderAttributes: function () {
            return {color: null, normal: null /* for picking */};
        },
        getRequestFields: function () {
            return ["diffuseColor", "useVertexColor"];
        }

    });

    /**
     * @constructor
     * @implements IShaderComposer
     */
    var AbstractShaderComposer = function (context) {
        this.context = context;
        this.shaderClosures = [];
        this.dataChanged = false;
        this.structureChanged = false;
        this.request = null;
    };

    XML3D.createClass(AbstractShaderComposer, XML3D.util.EventDispatcher, {
        /**
         * @param {Scene} scene
         * @param {{}=} opt
         */
        update: function (scene, opt) {
            opt = opt || {};
            var that = this;

            // Clean up shaderClosures that are not used!
            var i = this.shaderClosures.length;
            while(i--){
                if(this.shaderClosures[i].obsolete) this.shaderClosures.splice(i,1);
            }

            if (!this.shaderClosures.length)
                return;

            if (opt.evaluateShader || this.structureChanged) {
                this.handleShaderStructureChanged(scene);
                this.dataChanged = true;
                opt.updateLightValues = true;
            }

            if (opt.updateShaderData || this.dataChanged) {
                var result = this.getShaderDataResult();
                this.shaderClosures.forEach(function (shader) {
                    that.updateClosureFromComputeResult(shader, result, opt);
                });
                this.dataChanged = false;
            }

            if (opt.updateLightValues) {
                var lightParameters = this.createLightParameters(scene.lights);
                this.shaderClosures.forEach(function (shader) {
                    that.updateClosureFromLightParameters(shader, lightParameters);
                });
            }
        },

        /**
         * @param {webgl.ShaderClosure} shaderClosure
         * @param {Xflow.ComputeResult} result
         * @param {Object?} opt
         */
        updateClosureFromComputeResult: function (shaderClosure, result, opt) {
            if (!result || !result.getOutputMap) {
                return;
            }
            shaderClosure.bind();
            shaderClosure.updateUniformsFromComputeResult(result, opt);
            shaderClosure.updateSamplersFromComputeResult(result, opt);
        },

        updateClosureFromLightParameters: function (shaderClosure, lightParameters) {
            shaderClosure.bind();
            shaderClosure.setUniformVariables(lightParameters);
        },

        createLightParameters: function (lights) {
            var parameters = {};
            var pointLightData = { position: [], attenuation: [], intensity: [], on: [] };
            lights.point.forEach(function (light, index) {
                light.getLightData(pointLightData, index);
            });
            parameters["pointLightPosition"] = pointLightData.position;
            parameters["pointLightAttenuation"] = pointLightData.attenuation;
            parameters["pointLightIntensity"] = pointLightData.intensity;
            parameters["pointLightOn"] = pointLightData.on;

            var directionalLightData = { direction: [], intensity: [], on: [] };
            lights.directional.forEach(function (light, index) {
                light.getLightData(directionalLightData, index);
            });
            parameters["directionalLightDirection"] = directionalLightData.direction;
            parameters["directionalLightIntensity"] = directionalLightData.intensity;
            parameters["directionalLightOn"] = directionalLightData.on;

            var spotLightData = { position: [], attenuation: [], direction: [], intensity: [], on: [], softness: [], falloffAngle: [] };
            lights.spot.forEach(function (light, index) {
                light.getLightData(spotLightData, index);
            });
            parameters["spotLightAttenuation"] = spotLightData.attenuation;
            parameters["spotLightPosition"] = spotLightData.position;
            parameters["spotLightIntensity"] = spotLightData.intensity;
            parameters["spotLightDirection"] = spotLightData.direction;
            parameters["spotLightOn"] = spotLightData.on;
            parameters["spotLightSoftness"] = spotLightData.softness;
            parameters["spotLightCosFalloffAngle"] = spotLightData.falloffAngle.map(Math.cos);

            var softFalloffAngle = spotLightData.softness.slice();
            for (var i = 0; i < softFalloffAngle.length; i++)
                softFalloffAngle[i] = softFalloffAngle[i] * (1.0 - spotLightData.softness[i]);
            parameters["spotLightCosSoftFalloffAngle"] = softFalloffAngle.map(Math.cos);

            return parameters;
        },

        createShaderClosure: function () {
            throw new Error("AbstractComposer::createShaderClosure needs to be overridden");
        },

        createVsRequest: function(objectDataNode, callback){
            throw new Error("AbstractComposer::createVsRequest needs to be overridden");
        },

        getShaderClosure: function (scene, vsResult) {
            var shader = this.createShaderClosure();

            shader.createSources(scene, this.getShaderDataResult(), vsResult);
            for (var i = 0; i < this.shaderClosures.length; i++) {
                if (this.shaderClosures[i].equals(shader)){
                    this.shaderClosures[i].obsolete = false;
                    return this.shaderClosures[i];
                }

            }

            this.initializeShaderClosure(shader, scene, objectData);
            return shader;
        },

        initializeShaderClosure: function (shaderClosure, scene) {
            shaderClosure.compile();
            shaderClosure.setDefaultUniforms();
            //TODO Merge compute results
            this.updateClosureFromComputeResult(shaderClosure, this.getShaderDataResult(), {force: true});
            this.updateClosureFromLightParameters(shaderClosure, this.createLightParameters(scene.lights));
            this.shaderClosures.push(shaderClosure);
        },

        handleShaderStructureChanged: function () {

            for(var i = 0; i < this.shaderClosures.length; ++i){
                this.shaderClosures[i].obsolete = true;
            }
            this.dispatchEvent({type: webgl.ShaderComposerFactory.EVENT_TYPE.MATERIAL_STRUCTURE_CHANGED});
            this.structureChanged = false;
        },
        /**
         * @returns {Xflow.ComputeResult|null}
         */
        getShaderDataResult: function() {
            return this.request ? this.request.getResult() : null;
        }

    });

    webgl.DefaultComposer = DefaultComposer;
    webgl.AbstractShaderComposer = AbstractShaderComposer;

}(XML3D.webgl));
