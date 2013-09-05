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
     * @constructor
     * @implements IShaderComposer
     */
    var AbstractShaderComposer = function (context, identifier) {
        this.identifier = identifier || "NO IDENTIFIER";
        this.context = context;
        this.shaderClosures = [];
        this.dataChanged = false;
        this.updateLightValues = false;
        this.request = null;
    };

    XML3D.createClass(AbstractShaderComposer, XML3D.util.EventDispatcher, {

        updateRequest: function(xflowDataNode){
            if(this.request) this.request.clear();

            this.request = new Xflow.ComputeRequest(xflowDataNode, this.getRequestFields(),
                this.onShaderRequestChange.bind(this));
            this.setShaderRecompile();
        },

        onShaderRequestChange: function(request, changeType){
            this.dataChanged = true;
            if(changeType == Xflow.RESULT_STATE.CHANGED_STRUCTURE)
                this.setShaderRecompile();
            this.context.requestRedraw("Shader data changed");
        },

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

            if (opt.updateShaderData || this.dataChanged) {
                var result = this.getShaderDataResult();
                this.updateUniformTexturesAndBuffers(result);
                this.shaderClosures.forEach(function (shader) {
                    that.updateClosureFromComputeResult(shader, result);
                });
                this.dataChanged = false;
            }

            if (opt.updateLightValues || this.updateLightValues) {
                var lightParameters = this.createLightParameters(scene.lights);
                this.shaderClosures.forEach(function (shader) {
                    that.updateClosureFromLightParameters(shader, lightParameters);
                });
            }
        },

        updateUniformTexturesAndBuffers: function(result){
            if(!result) return;
            var dataMap = result.getOutputMap();


            for(var name in dataMap){
                this.updateUniformEntryTextureOrBuffer(dataMap[name]);
            }
        },
        updateUniformEntryTextureOrBuffer: function(entry){
            if(entry.type == Xflow.DATA_TYPE.TEXTURE){
                var gl = this.context.gl;
                var webglData = this.context.getXflowEntryWebGlData(entry);
                var texture = webglData.texture || new XML3D.webgl.GLTexture(gl);
                texture.updateFromTextureEntry(entry);

                webglData.texture = texture;
                webglData.changed = 0;
            }
        },

        /**
         * @param {webgl.AbstractShaderClosure} shaderClosure
         * @param {Xflow.ComputeResult} result
         * @param {Object?} opt
         */
        updateClosureFromComputeResult: function (shaderClosure, result) {
            if (!result || !result.getOutputMap) {
                return;
            }
            var uniforms = {}, xflowMap = result.getOutputMap();
            for(var name in xflowMap){
                uniforms[this.getUniformName(name)] = xflowMap[name];
            }

            shaderClosure.bind();
            shaderClosure.updateUniformsFromComputeResult(uniforms);
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

        createObjectDataRequest: function(objectDataNode, callback){
            throw new Error("AbstractComposer::createObjectDataRequest needs to be overridden");
        },

        distributeObjectShaderData: function(objectRequest, attributeCallback, uniformCallback){
            throw new Error("AbstractComposer::distributeObjectShaderData needs to be overridden");
        },

        getUniformName: function(name){
            return name;
        },

        getShaderClosure: function (scene, vsResult) {
            var shader = this.createShaderClosure();

            try{
                shader.createSources(scene, this.getShaderDataResult(), vsResult)
            }
            catch(e){
                throw new Error("Shader '" + this.identifier + "': " + e.message)
            }

            for (var i = 0; i < this.shaderClosures.length; i++) {
                if (this.shaderClosures[i].equals(shader)){
                    this.shaderClosures[i].obsolete = false;
                    return this.shaderClosures[i];
                }
            }

            this.initializeShaderClosure(shader, scene, vsResult);
            return shader;
        },

        initializeShaderClosure: function (shaderClosure, scene, vsResult) {
            shaderClosure.compile();
            shaderClosure.setDefaultUniforms();

            this.updateClosureFromComputeResult(shaderClosure, this.getShaderDataResult());
            this.updateClosureFromLightParameters(shaderClosure, this.createLightParameters(scene.lights));
            this.shaderClosures.push(shaderClosure);
        },

        setShaderRecompile: function () {

            for(var i = 0; i < this.shaderClosures.length; ++i){
                this.shaderClosures[i].obsolete = true;
            }
            this.dispatchEvent({type: webgl.ShaderComposerFactory.EVENT_TYPE.MATERIAL_STRUCTURE_CHANGED});
            this.dataChanged = true;
            this.updateLightValues = true;
        },



        /**
         * @returns {Xflow.ComputeResult|null}
         */
        getShaderDataResult: function() {
            return this.request ? this.request.getResult() : null;
        }



    });


    /**
     * @implements IShaderComposer
     * @constructor
     */
    var DefaultComposer = function (context) {
        this.context = context;
    };
    XML3D.createClass(DefaultComposer, AbstractShaderComposer, {
        update: function () {
        },
        getShaderClosure: function (scene, vsResult) {
            return this.context.programFactory.getFallbackProgram();
        },
        getShaderAttributes: function () {
            return {color: null, normal: null /* for picking */};
        },
        getRequestFields: function () {
            return ["diffuseColor", "useVertexColor"];
        },
        createObjectDataRequest: function(objectDataNode, callback){
            return new Xflow.ComputeRequest(objectDataNode,
                ["position", "color", "normal", "diffuseColor", "useVertexColor"], callback);
        },
        distributeObjectShaderData: function(objectRequest, attributeCallback, uniformCallback){
            var result = objectRequest.getResult();

            var dataMap = result.getOutputMap(), requestFields = this.getRequestFields();
            for(var name in dataMap){
                if(requestFields.indexOf(name) != -1)
                    uniformCallback(name, dataMap[name]);
                else
                    attributeCallback(name, dataMap[name]);
                }
        }
    });


    webgl.AbstractShaderComposer = AbstractShaderComposer;
    webgl.DefaultComposer = DefaultComposer;

}(XML3D.webgl));
