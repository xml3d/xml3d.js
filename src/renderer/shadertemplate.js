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
     * @param {Object} lights
     * @returns {IShaderTemplate.UpdateState}
     */
    IShaderTemplate.prototype.update = function (lights) {
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
    IShaderTemplate.prototype.getProgram = function(lights) {
        return null;
    };

    /**
     * @param {Xflow.ComputeResult} result
     * @returns {IShaderTemplate.UpdateState}
     */
    /*IShaderClosure.prototype.updateObjectAttributes = function (result) {
        return IShaderClosure.UpdateState.SHADER_UNCHANGED;
    };*/

    /**
     *
     * @constructor
     */
    var ShaderTemplateFactory = function(context) {
        this.context = context;
        /** @type {Object<number, IShaderTemplate>} */
        this.templates = {};
        this.defaultTemplate = new DefaultTemplate(context);
    };

    XML3D.extend(ShaderTemplateFactory.prototype, {
        /**
         *
         * @param {XML3D.webgl.ShaderInfo} shaderInfo
         * @returns {IShaderTemplate}
         */
        createTemplateForShaderInfo : function (shaderInfo) {
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
        getDefaultTemplate : function() {
            return this.defaultTemplate;
        },
        getTemplateById : function(id) {
           return this.templates[id];
        },
        update : function (scene) {
            for(var i in this.templates) {
                this.templates[i].update();
            }
        }
    })

    /**
     * @implements IShaderTemplate
     * @constructor
     */
    var DefaultTemplate = function(context) {
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
        }
    });

    /**
     * @param {string} path
     * @returns {*}
     */
    var getShaderDescriptor = function(path) {
        var shaderName = path.substring(path.lastIndexOf(':') + 1);
        return XML3D.shaders.getScript(shaderName);
    };

    var getMaterial = function(env, urn) {
        var descriptor = getShaderDescriptor(urn.path);
        var result = null;
        if(descriptor) {
            result = new webgl.Material(env);
            XML3D.extend(result, descriptor);
        }
        return result;
    }

    /**
     * @implements {IShaderTemplate}
     * @constructor
     */
    var MaterialShaderTemplate = function(context, shaderInfo) {
        this.context = context;
        this.programs = [];
        this.setShaderInfo(shaderInfo);
        var id = shaderInfo.id;
        this.getId = function() {
            return id;
        }
    }

    /**
     *
     * @param {XML3D.webgl.ShaderInfo} shaderInfo
     */
    MaterialShaderTemplate.prototype.setShaderInfo = function(shaderInfo) {
        var shaderScriptURI = shaderInfo.getScript();
        this.setShaderScript(shaderScriptURI);

        var that = this;
        if(this.material) {
            this.request = new Xflow.ComputeRequest(shaderInfo.getData(), this.material.getRequestFields(), function(request, changeType) {
                that.dataChanged = true;
                that.context.requestRedraw("Shader data changed");
            });
            this.structureChanged = true;
        }
    }

    MaterialShaderTemplate.prototype.setShaderScript = function(uri) {
        // Pesimistic approach
        this.state = IShaderTemplate.State.NO_SCRIPT;

        if(!uri) {
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
    }

    /**
     *
     * @param {Object?} opt
     */
    MaterialShaderTemplate.prototype.updateProgramsFromComputeResult = function(opt) {
        this.programs.forEach(function(program) {
            this.updateUniformsFromComputeResult(program, opt);
            this.updateSamplersFromComputeResult(program, opt);
            this.material.parametersChanged(this.request.getResult().getOutputMap());
            this.dataChanged = false;
        }, this);
    };

    MaterialShaderTemplate.prototype.updateSamplersFromComputeResult = function(program, opt) {
        var samplers = program.samplers;
        var result = this.request.getResult();

        var opt = opt || {};
        var force = opt.force || false;

        for ( var name in samplers) {
            var sampler = samplers[name];
            var entry = result.getOutputData(name);

            if (!entry) {
                sampler.texture.failed();
                continue;
            }

            var webglData = this.context.getXflowEntryWebGlData(entry);

            if(force || webglData.changed) {
                sampler.texture.updateFromTextureEntry(entry);
                webglData.changed = 0;
            }
        }
    };

    /**
     *
     * @param {Object?} opt
     */
    MaterialShaderTemplate.prototype.updateUniformsFromComputeResult = function(program, opt) {
        var dataMap = this.request.getResult().getOutputMap();
        var uniforms = program.uniforms;

        var opt = opt || {};
        var force = opt.force || false;

        for ( var name in uniforms) {
            var entry = dataMap[name];

            if(!entry)
                continue;

            var webglData = this.context.getXflowEntryWebGlData(entry);

            if(force || webglData.changed) {
                webgl.setUniform(this.context.gl, uniforms[name], entry.getValue());
                webglData.changed = 0;
            }
        }
    }

    MaterialShaderTemplate.prototype.isValid = function() {
        return this.state == IShaderTemplate.State.OK;
    }

    MaterialShaderTemplate.prototype.getProgram = function(lights) {
        if(!this.programs[0]) {
            this.programs[0] = this.material.getProgram(lights, this.request.getResult());
            if(!this.programs[0].isValid()) {
                this.state = IShaderTemplate.State.NO_PROGRAM;
            }
            this.updateProgramsFromComputeResult();
        }
        return this.programs[0];
    }

    MaterialShaderTemplate.prototype.update = function(lights) {
        if(!this.isValid())
            return;
        if (this.dataChanged) {
            this.updateProgramsFromComputeResult();
            this.state = IShaderTemplate.State.OK;
        } else if (this.structureChanged) {
            // TODO
        }

    }

    webgl.ShaderTemplateFactory = ShaderTemplateFactory;

}(XML3D.webgl));