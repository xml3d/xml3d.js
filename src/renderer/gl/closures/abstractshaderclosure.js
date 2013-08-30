(function (webgl) {

    /**
     * A ShaderClosure connects a mesh-specific GLProgram with it's Xflow data
     * @param {GLContext} context
     * @constructor
     */
    var AbstractShaderClosure = function(context) {
        /**
         * @private
         * @type {GLProgramObject|null}
         */
        this.program = null;
        this.context = context;
        /**
         * A flag used by shadercomposer to sort out obsolete shaderclosures
         * @type {boolean}
         */
        this.obsolete = false;
        this.id = "";

        /**
         * Stores, if the underlying shader has semi-transparencies
         * and thus needs to considered for alpha-blending
         * @type {boolean}
         */
        this.isTransparent = false;

        /**
         * The source of a shader
         * @private
         * @type {{vertex: string, fragment: string}}
         */
        this.source = {
            vertex: "",
            fragment: ""
        }
    };

    Object.defineProperties(AbstractShaderClosure.prototype, {
            attributes: {
                writeable: false,
                get: function() {
                    return this.program ? this.program.attributes : {}
                }
            },
            uniforms: {
                writeable: false,
                get: function() {
                    return this.program ? this.program.uniforms : {}
                }
            },
            samplers: {
                writeable: false,
                get: function() {
                    return this.program ? this.program.samplers : {}
                }
            }
        }
    );
    XML3D.extend(AbstractShaderClosure.prototype, {

        equals: function(that) {
            return this.source.vertex === that.source.vertex && this.source.fragment === that.source.fragment;
        },

        hasTransparency: function() {
            return this.isTransparent;
        },

        compile: function () {
            if (!this.source.fragment || !this.source.vertex) {
                XML3D.debug.logError("No source found for shader", this);
                return;
            }

            var programObject = new XML3D.webgl.GLProgramObject(this.context.gl, this.source);
            this.program = programObject;
            this.id = programObject.id;
        },

        bind: function() {
            this.program.bind();
        },

        unbind: function() {
            this.program.unbind();
        },

        setUniformVariables: function(uniforms) {
            this.program.setUniformVariables(uniforms);
        },

        isValid: function() {
            return this.program.isValid();
        },

        convertToJSArray: function(value) {
            var jsArray = [value.length];
            for (var i=0; i<value.length; i++) {
                jsArray[i] = value[i];
            }
            return jsArray;
        },

        /**
         * @param {Xflow.ComputeResult} result
         * @param {Object?} options
         */
        updateUniformsFromComputeResult: function (result, options) {
            var dataMap = result.getOutputMap();
            var uniforms = this.program.uniforms;

            var opt = options || {};
            var force = opt.force || false;

            for (var name in uniforms) {
                var entry = dataMap[name];
                if (!entry)
                    continue;

                var webglData = this.context.getXflowEntryWebGlData(entry);
                if (force || webglData.changed) {
                    if (uniforms[name].glType === this.context.gl.BOOL) {
                        //TODO Can we get Xflow to return boolean arrays as normal JS arrays? WebGL doesn't accept Uint8Arrays here...
                        //TODO Alternatively we could set boolean uniforms using uniform1fv together with Float32Arrays, which apparently works too
                        webgl.setUniform(this.context.gl, uniforms[name], this.convertToJSArray(entry.getValue()));
                    } else {
                        webgl.setUniform(this.context.gl, uniforms[name], entry.getValue());
                    }
                    webglData.changed = 0;
                }
            }
            // TODO: this.isTransparent = this.descriptor.hasTransparency(dataMap);
        },

        /**
         *
         * @param {Xflow.data.ComputeResult} result
         * @param {Object} options
         */
        updateSamplersFromComputeResult: function (result, options) {
            var samplers = this.program.samplers;

            var opt = options || {};
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

        setUniformVariableOverride: function(override) {
            this.program.setUniformVariables(override);
        }

    });

    webgl.AbstractShaderClosure = AbstractShaderClosure;

}(XML3D.webgl));
