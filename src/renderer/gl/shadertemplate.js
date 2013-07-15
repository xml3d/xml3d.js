(function (webgl) {

    /**
     * @interface
     */
    var IShaderTemplate = function () {
    };

    /**
     * @enum
     */
    IShaderTemplate.UpdateState = {
        SHADER_UPDATED: 1,
        SHADER_COMPILED: 2,
        SHADER_UNCHANGED: 3
    };

    IShaderTemplate.State = {
        OK: 1,
        NO_SCRIPT: 2,
        NO_PROGRAM: 3
    };

    /**
     * @param {XML3D.webgl.scene} scene
     * @returns {IShaderTemplate.UpdateState}
     */
    IShaderTemplate.prototype.update = function (scene, lightStructureChanged) {
        return IShaderTemplate.UpdateState.SHADER_UNCHANGED;
    };

    /**
     * @returns {boolean}
     */
    IShaderTemplate.prototype.isValid = function () {
        return false;
    };

    /**
     *
     * @returns XML3D.webgl.GLProgramObject|null
     */
    IShaderTemplate.prototype.getProgram = function (lights) {
        return null;
    };

    /**
     *
     * @returns Object.<string, *>
     */
    IShaderTemplate.prototype.getObjectRequests = function () {
        return {};
    };

    /**
     * @param {XML3D.webgl.GLContext} context
     * @constructor
     */
    var ShaderTemplateFactory = function (context) {
        this.context = context;
        /** @type {Object.<number, IShaderTemplate>} */
        this.templates = {};
        this.lightStructureDirty = true;
        this.defaultTemplate = new DefaultTemplate(context);
    };

    XML3D.extend(ShaderTemplateFactory.prototype, {
        /**
         *
         * @param {XML3D.webgl.ShaderInfo} shaderInfo
         * @returns {IShaderTemplate}
         */
        createTemplateForShaderInfo: function (shaderInfo) {
            if (!shaderInfo) {
                return this.defaultTemplate;
            }
            var result = this.templates[shaderInfo.id];
            if (!result) {
                result = new MaterialShaderTemplate(this.context, shaderInfo);
                this.templates[shaderInfo.id] = result;
            }
            return result;
        },
        getDefaultTemplate: function () {
            return this.defaultTemplate;
        },
        getTemplateById: function (id) {
            return this.templates[id];
        },
        update: function (scene) {
            for (var i in this.templates) {
                this.templates[i].update(scene, this.lightStructureDirty);
            }
        },
        setLightStructureDirty: function() {
            console.log("Light structure changed");
            this.lightStructureDirty = true;
        }

    });

    /**
     * @implements IShaderTemplate
     * @constructor
     */
    var DefaultTemplate = function (context) {
        this.context = context;
    };

    XML3D.extend(DefaultTemplate.prototype, {
        update: function () {
        },
        isValid: function () {
            return true;
        },
        getProgram: function () {
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

    var getMaterial = function (env, urn) {
        var descriptor = getShaderDescriptor(urn.path);
        var result = null;
        if (descriptor) {
            result = new webgl.Material(env);
            XML3D.extend(result, descriptor);
        }
        return result;
    };

    /**
     * @implements {IShaderTemplate}
     * @constructor
     */
    var MaterialShaderTemplate = function (context, shaderInfo) {
        this.context = context;
        this.programs = [];
        this.setShaderInfo(shaderInfo);
        var id = shaderInfo.id;
    }

    XML3D.extend(MaterialShaderTemplate.prototype, {
        /**
         *
         * @param {XML3D.webgl.ShaderInfo} shaderInfo
         */
        setShaderInfo: function (shaderInfo) {
            var shaderScriptURI = shaderInfo.getScript();
            this.setShaderScript(shaderScriptURI);

            var that = this;
            if (this.material) {
                this.request = new Xflow.ComputeRequest(shaderInfo.getData(), this.material.getRequestFields(), function (request, changeType) {
                    that.dataChanged = true;
                    that.context.requestRedraw("Shader data changed");
                });
                this.structureChanged = true;
            }
        },

        setShaderScript: function (uri) {
            // Pesimistic approach
            this.state = IShaderTemplate.State.NO_SCRIPT;

            if (!uri) {
                XML3D.debug.logError("Shader has no script attached: ", this.adapter.node);
                return;
            }
            if (uri.scheme != "urn") {
                XML3D.debug.logError("Shader script reference should start with an URN: ", this.adapter.node);
                return;
            }
            var material = getMaterial(this.context, uri);
            if (!material) {
                XML3D.debug.logError("No Shader registerd for urn:", uri);
                return;
            }

            this.material = material;
            this.state = IShaderTemplate.State.OK;
        },

        /**
         *
         * @param {Object?} opt
         */
        updateProgramsFromComputeResult: function (opt) {
            this.programs.forEach(function (program) {
                program.bind();
                this.updateUniformsFromComputeResult(program, opt);
                this.updateSamplersFromComputeResult(program, opt);
                this.material.parametersChanged(this.request.getResult().getOutputMap());
                this.dataChanged = false;
            }, this);
        },

        updateProgramsLightParameters: function (lights) {
            var lightParameter = this.createLightParameters(lights);
            this.programs.forEach(function (program) {
                program.bind();
                program.setUniformVariables(lightParameter);
            }, this);
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
            //parameters["pointLightVisibility"] = lights.point.visibility;

            var directionalLightData = { direction: [], intensity: [], on: [] };
            lights.directional.forEach(function(light, index) {
                light.getLightData(directionalLightData, index);
            });

            parameters["directionalLightDirection"] = directionalLightData.direction;
            parameters["directionalLightIntensity"] = directionalLightData.intensity;
            parameters["directionalLightVisibility"] = directionalLightData.on;

            var spotLightData = { position: [], attenuation: [], direction: [], intensity: [], on: [] };
            lights.spot.forEach(function(light, index) {
                light.getLightData(spotLightData, index);
            });
            parameters["spotLightAttenuation"] = spotLightData.attenuation;
            parameters["spotLightPosition"] = spotLightData.position;
            parameters["spotLightIntensity"] = spotLightData.intensity;
            parameters["spotLightDirection"] = spotLightData.direction;

            //parameters["spotLightVisibility"] = lights.spot.visibility;
            //parameters["spotLightCosFalloffAngle"] = lights.spot.falloffAngle.map(Math.cos);

            /*var softFalloffAngle = lights.spot.falloffAngle.slice();
            for (var i = 0; i < softFalloffAngle.length; i++)
                softFalloffAngle[i] = softFalloffAngle[i] * (1.0 - lights.spot.softness[i]);
            parameters["spotLightCosSoftFalloffAngle"] = softFalloffAngle.map(Math.cos);
            parameters["spotLightSoftness"] = lights.spot.softness;*/
            console.log(parameters);
            return parameters;
    },

        /**
         *
         * @param {XML3D.webgl.GLProgram} program
         * @param {Object} opt
         */
    updateSamplersFromComputeResult: function (program, opt) {
            var samplers = program.samplers;
            var result = this.request.getResult();

            var opt = opt || {};
            var force = opt.force || false;

            for (var name in samplers) {
                var sampler = samplers[name];
                var entry = result.getOutputData(name);

                if (!entry) {
                    sampler.texture.failed();
                    continue;
                }

                var webglData = this.context.getXflowEntryWebGlData(entry);

                if (force || webglData.changed) {
                    sampler.texture.updateFromTextureEntry(entry);
                    webglData.changed = 0;
                }
            }
        },
        /**
         * @param {XML3D.webgl.GLProgramObject} program
         * @param {Object?} opt
         */
        updateUniformsFromComputeResult: function (program, opt) {
            var dataMap = this.request.getResult().getOutputMap();
            var uniforms = program.uniforms;

            var opt = opt || {};
            var force = opt.force || false;

            for (var name in uniforms) {
                var entry = dataMap[name];

                if (!entry)
                    continue;

                var webglData = this.context.getXflowEntryWebGlData(entry);

                if (force || webglData.changed) {
                    webgl.setUniform(this.context.gl, uniforms[name], entry.getValue());
                    webglData.changed = 0;
                }
            }
        },

        isValid: function () {
            return this.state == IShaderTemplate.State.OK;
        },

        getProgram: function (scene) {
            if (!this.programs[0]) {
                this.programs[0] = this.createProgram(scene);
                // Update everything after creation
                this.update(scene, {updateShaderData: true, updateLights: true});
            }
            return this.programs[0];
        },
        createProgram: function(scene) {
            var result = this.material.getProgram(scene.lights, this.request.getResult());
            if (!result.isValid()) {
                throw new Error("Failed to create shader program.");
            }
            return result;
        },

        update: function (scene, opt) {
            opt = opt || {}

            if (!this.isValid())
                return;
            if (opt.updateShaderData || this.dataChanged) {
                this.updateProgramsFromComputeResult();
            } else if (this.structureChanged) {

            }
            if (opt.updateLights) {
                var lights = scene.lights;
                this.updateProgramsLightParameters(lights);
            }

        },

        getObjectRequests: function() {
            return this.material ? this.material.meshRequest : [];
        }

    });

    webgl.ShaderTemplateFactory = ShaderTemplateFactory;

}(XML3D.webgl));