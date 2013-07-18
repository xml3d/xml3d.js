(function (webgl) {

    var ShaderClosure = function(context, descriptor) {
        this.descriptor = descriptor;
        this.source = {};
        this.program = null;
        this.context = context;
        this.id = "";
        //TODO Better way to add getters?
        var that = this;
        Object.defineProperty(this, "attributes", {
            get: function() {
                return  that.program.attributes;
            }
        });
        Object.defineProperty(this, "uniforms", {
            get: function() {
                return  that.program.uniforms;
            }
        });
        Object.defineProperty(this, "samplers", {
            get: function() {
                return  that.program.samplers;
            }
        });
    };
    XML3D.extend(ShaderClosure.prototype, {
        equals: function(that) {
            //TODO Need to support multiple shaders of same type (eg. Phong) with different <shader> nodes
            //return this.source.vertex === that.source.vertex && this.source.fragment === that.source.fragment;
            return false;
        },

        compile: function () {
            if (!this.source.fragment)
                return;
            if (!this.source.vertex)
                return;

            var programObject = new XML3D.webgl.GLProgramObject(this.context.gl, this.source);
            if (programObject.isValid()) {
                programObject.setUniformVariables(this.descriptor.uniforms);
                //TODO Not sure how to add generic shader logic here
                this.addShaderLogic();
                //if (data) {
                //    this.parametersChanged(data.getOutputMap());
                //}
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
            this.descriptor.fragment = XML3D.webgl.addFragmentShaderHeader(this.descriptor.fragment);
            //TODO add object data to directives
            this.descriptor.addDirectives(directives, scene.lights || {}, shaderData ? shaderData.getOutputMap() : {});
            this.source = {
                fragment: this.addDirectivesToSource(directives, this.descriptor.fragment),
                vertex: this.addDirectivesToSource(directives, this.descriptor.vertex)
            };
        },

        addShaderLogic: function() {
            var that = this;
            Object.defineProperty(this, "hasTransparency", {
                get: function() {
                    return  that.isTransparent;
                }
            });
        },

        /**
         * @param {XML3D.webgl.GLProgramObject} program
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
        },

        /**
         *
         * @param {XML3D.webgl.GLProgram} program
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
        }
});

    webgl.ShaderClosure = ShaderClosure;

}(XML3D.webgl));
