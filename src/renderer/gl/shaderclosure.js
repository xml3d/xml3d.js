(function (webgl) {

    var ShaderClosure = function(context, descriptor, dataCallback) {
        this.descriptor = descriptor;
        this.getShaderParameters = dataCallback || function(){ {} };
        this.source = {};
        this.program = null;
        this.context = context;
        this.id = "";
        this.isTransparent = false;
    };

    Object.defineProperties(ShaderClosure.prototype, {
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
    XML3D.extend(ShaderClosure.prototype, {

        equals: function(that) {
            return this.source.vertex === that.source.vertex && this.source.fragment === that.source.fragment;
        },

        hasTransparency: function() {
            return this.isTransparent;
        },

        compile: function () {
            if (!this.source.fragment)
                return;
            if (!this.source.vertex)
                return;

            var programObject = new XML3D.webgl.GLProgramObject(this.context.gl, this.source);
            if (programObject.isValid()) {
                programObject.setUniformVariables(this.descriptor.uniforms);
            }
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

        createSources: function(scene, shaderData, objectData) {
            var directives = [];
            //TODO add object data to directives
            this.descriptor.addDirectives(directives, scene.lights || {}, shaderData ? shaderData.getOutputMap() : {});
            this.source = {
                fragment: this.addDirectivesToSource(directives, this.descriptor.fragment),
                vertex: this.addDirectivesToSource(directives, this.descriptor.vertex)
            };
        },

        convertToJSArray: function(value) {
            var jsArray = [value.length];
            for (var i=0; i<value.length; i++) {
                jsArray[i] = value[i];
            }
            return jsArray;
        },

        /**
         * @param {Xflow.data.ComputeResult} result
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
            this.isTransparent = this.descriptor.hasTransparency(dataMap);
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

        addDirectivesToSource: function (directives, source) {
            var header = "";
            directives.forEach(function (v) {
                header += "#define " + v + "\n";
            });
            return header + "\n" + source;
        },

        setUniformVariableOverride: function(override) {
            this.program.setUniformVariables(override);
        },

        undoUniformVariableOverride: function(override) {
            var previousValues = {};
            var shaderData = this.getShaderParameters();
            for (var name in override) {
                var value = shaderData[name] ? shaderData[name] : this.descriptor.uniforms[name];
                previousValues[name] = value.getValue ? value.getValue() : value;
            }
            this.program.setUniformVariables(previousValues);
        }
});

    webgl.ShaderClosure = ShaderClosure;

}(XML3D.webgl));
