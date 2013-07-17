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
     * @returns {IShaderComposer.UpdateState}
     */
    IShaderComposer.prototype.update = function (scene, opt) {
        return IShaderComposer.UpdateState.SHADER_UNCHANGED;
    };

    //TODO Do we still need this?
    /**
     * @returns {boolean}
     */
    IShaderComposer.prototype.isValid = function () {
        return false;
    };

    /**
     *
     * @returns XML3D.webgl.ShaderClosure|null
     */
    IShaderComposer.prototype.getShaderClosure = function (lights) {
        return null;
    };

    /**
     *
     * @returns Object.<string, *>
     */
    IShaderComposer.prototype.getObjectRequests = function () {
        return {};
    };

    /**
     * @param {XML3D.webgl.GLContext} context
     * @constructor
     */
    var ShaderComposerFactory = function (context) {
        this.context = context;
        /** @type {Object.<number, IShaderComposer>} */
        this.composers = {};
        this.needsCompileCheck = true;
        this.defaultComposer = new DefaultComposer(context);
    };

    ShaderComposerFactory.EVENT_TYPE = {
        MATERIAL_STRUCTURE_CHANGED: "material_structure_changed"
    };

    XML3D.extend(ShaderComposerFactory.prototype, {
        /**
         *
         * @param {XML3D.webgl.ShaderInfo} shaderInfo
         * @returns {IShaderComposer}
         */
        createComposerForShaderInfo: function (shaderInfo) {
            if (!shaderInfo) {
                return this.defaultComposer;
            }
            var result = this.composers[shaderInfo.id];
            if (!result) {
                result = new MaterialShaderComposer(this.context, shaderInfo);
                this.composers[shaderInfo.id] = result;
            }
            return result;
        },
        getDefaultComposer: function () {
            return this.defaultComposer;
        },
        getTemplateById: function (id) {
            return this.composers[id];
        },
        update: function (scene) {
            for (var i in this.composers) {
                this.composers[i].update(scene, { evaluateShader: this.needsCompileCheck, updateLightValues: this.lightValuesDirty });
            }
            this.needsCompileCheck = this.lightValuesDirty = false;
        },
        setLightStructureDirty: function() {
            XML3D.debug.logWarning("Light structure changes not yet supported.");
            this.needsCompileCheck = true;
        },
        setLightValueChanged: function() {
            this.lightValuesDirty = true;
        }

    });

    webgl.ShaderComposerFactory = ShaderComposerFactory;

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
        isValid: function () {
            return true;
        },
        getShaderClosure: function () {
            return this.context.programFactory.getFallbackProgram();
        },
        getObjectRequests: function () {
            return {
                index: null,
                position: {
                    required: true
                },
                normal: null
            }
        }
    });

    /**
     * @param {string} path
     * @returns {*}
     */
    var getShaderDescriptor = function (path) {
        var shaderName = path.substring(path.lastIndexOf(':') + 1);
        return XML3D.shaders.getScript(shaderName);
    };


    var ShaderDescriptor = function() {
        this.uniforms = {};
        this.samplers = {};
        this.name = "";
        this.fragment = "";
        this.vertex =  "";
    };
    ShaderDescriptor.prototype.addDirectives = function() {};
    ShaderDescriptor.prototype.parametersChanged = function() {};

    webgl.ShaderDescriptor = ShaderDescriptor;


    /**
     * @implements {IShaderComposer}
     * @constructor
     */
    var MaterialShaderComposer = function (context, shaderInfo) {
        this.context = context;
        this.shaderClosures = [];
        this.descriptor = new ShaderDescriptor();
        this.dataChanged = false;
        this.structureChanged = false;
        this.setShaderInfo(shaderInfo);
    };

    XML3D.createClass(MaterialShaderComposer, XML3D.util.EventDispatcher, {
        /**
         *
         * @param {XML3D.webgl.ShaderInfo} shaderInfo
         */
        setShaderInfo: function (shaderInfo) {
            var shaderScriptURI = shaderInfo.getScript();
            this.setShaderScript(shaderScriptURI);

            var that = this;
            if (this.descriptor) {
                this.request = new Xflow.ComputeRequest(shaderInfo.getData(), this.getRequestFields(), function (request, changeType) {
                    that.dataChanged = true;
                    that.context.requestRedraw("Shader data changed");
                });
                this.structureChanged = true;
            }
        },

        setShaderScript: function (uri) {
            // Pesimistic approach
            this.state = IShaderComposer.State.NO_SCRIPT;

            if (!uri) {
                XML3D.debug.logError("Shader has no script attached: ", this.adapter.node);
                return;
            }
            if (uri.scheme != "urn") {
                XML3D.debug.logError("Shader script reference should start with an URN: ", this.adapter.node);
                return;
            }
            var descriptor = getShaderDescriptor(uri.path);
            if (!descriptor) {
                XML3D.debug.logError("No Shader registerd for urn:", uri);
                return;
            }

            XML3D.extend(this.descriptor, descriptor);
            this.state = IShaderComposer.State.OK;
        },

        getRequestFields: function () {
            return Object.keys(this.descriptor.uniforms).concat(Object.keys(this.descriptor.samplers));
        },

        update: function (scene, opt) {
            opt = opt || {};

            if(!this.shaderClosures.length)
                return;

            if(opt.evaluateShader || this.structureChanged) {
                this.dispatchEvent({type: webgl.ShaderComposerFactory.EVENT_TYPE.MATERIAL_STRUCTURE_CHANGED});
                return;
            }

            if (opt.updateShaderData || this.dataChanged) {
                this.shaderClosures.forEach(function(shader) {
                    this.updateClosureFromComputeResult(shader, opt);
                });
            }

            if (opt.updateLightValues) {
                var lightParameters = this.createLightParameters(scene.lights);
                this.shaderClosures.forEach(function(shader) {
                    this.updateClosureFromLightParameters(shader, lightParameters);
                });
            }
        },

        /**
         * @param {XML3D.webgl.ShaderClosure!} shaderClosure
         * @param {Xflow.ComputeResult!} result
         * @param {Object?} opt
         */
        updateClosureFromComputeResult: function (shaderClosure, result, opt) {
            shaderClosure.bind();
            shaderClosure.updateUniformsFromComputeResult(result, opt);
            shaderClosure.updateSamplersFromComputeResult(result, opt);
            shaderClosure.descriptor.parametersChanged(result.getOutputMap());
        },

        updateClosureFromLightParameters: function (shaderClosure, lightParameters) {
            shaderClosure.bind();
            shaderClosure.setUniformVariables(lightParameters);
        },

        createLightParameters: function(lights) {
            var parameters = {};
            var pointLightData = { position: [], attenuation: [], intensity: [], on: [] };
            lights.point.forEach(function(light, index) {
                light.getLightData(pointLightData, index);
            });
            parameters["pointLightPosition"] = pointLightData.position;
            parameters["pointLightAttenuation"] = pointLightData.attenuation;
            parameters["pointLightIntensity"] = pointLightData.intensity;
            parameters["pointLightOn"] = pointLightData.on;

            var directionalLightData = { direction: [], intensity: [], on: [] };
            lights.directional.forEach(function(light, index) {
                light.getLightData(directionalLightData, index);
            });
            parameters["directionalLightDirection"] = directionalLightData.direction;
            parameters["directionalLightIntensity"] = directionalLightData.intensity;
            parameters["directionalLightOn"] = directionalLightData.on;

            var spotLightData = { position: [], attenuation: [], direction: [], intensity: [], on: [], softness: [], falloffAngle: [] };
            lights.spot.forEach(function(light, index) {
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

        getShaderClosure: function (scene, objectData) {
            var shaderData = this.request.getResult();
            var shader = new webgl.ShaderClosure(this.context, this.descriptor);
            shader.createSources(scene, shaderData, objectData);
            for (var i=0; i < this.shaderClosures.length; i++) {
                if (this.shaderClosures[i].equals(shader))
                    return this.shaderClosures[i];
            }
            this.initializeShaderClosure(shader, scene, objectData);
            return shader;
        },

        initializeShaderClosure: function(shaderClosure, scene, objectData) {
            shaderClosure.compile();
            var result = this.request.getResult();
            //TODO Merge compute results
            this.updateClosureFromComputeResult(shaderClosure, result, {force : true});
            //this.updateClosureFromComputeResult(shaderClosure, objectData, {force : true});
            this.updateClosureFromLightParameters(shaderClosure, this.createLightParameters(scene.lights));
            this.shaderClosures.push(shaderClosure);
        },

        getObjectRequests: function() {
            return  {
                    index: null,
                    position: { required: true },
                    normal: null,
                    color: null,
                    texcoord: null
                    };
        },

        isValid: function () {
            return true;
        }

    });


}(XML3D.webgl));
