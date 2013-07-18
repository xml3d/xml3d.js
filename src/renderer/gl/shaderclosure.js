(function (webgl) {

    var ShaderClosure = function(context, descriptor) {
        this.descriptor = descriptor;
        this.source = {};
        this.program = null;
        this.context = context;
        this.id = "";
        this.isTransparent = false;
    };
    XML3D.extend(ShaderClosure.prototype, {
        get attributes() {
            return this.program ? this.program.attributes : {};
        },
        set attributes(arg) {},

        get uniforms() {
            return this.program ? this.program.uniforms : {};
        },
        set uniforms(arg) {},

        get samplers() {
            return this.program ? this.program.samplers : {};
        },
        set samplers(arg) {},

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
                    webgl.setUniform(this.context.gl, uniforms[name], entry.getValue());
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
            var defaults = {};
            for (var name in override) {
                defaults[name] = this.descriptor.uniforms[name];
            }
            this.program.setUniformVariables(defaults);
        }
});

    webgl.ShaderClosure = ShaderClosure;

}(XML3D.webgl));
