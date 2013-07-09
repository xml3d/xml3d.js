(function (webgl) {
    /**
     * @constructor
     */
    var Material = function (env) {
        this.context = env;
        /** @type boolean */
        this.isTransparent = false;
    };
    Material.prototype.parametersChanged = function (shaderEntries) {
        if (this.hasTransparency)
            this.isTransparent = this.hasTransparency(shaderEntries);
    };

    Material.prototype.uniforms = {};
    Material.prototype.samplers = {};
    Material.prototype.fragment = null;
    Material.prototype.vertex = null;
    Material.prototype.meshRequest = {
        index: null,
        position: { required: true },
        normal: null,
        color: null,
        texcoord: null
    };

    Material.prototype.getRequestFields = function () {
        return Object.keys(this.uniforms).concat(Object.keys(this.samplers));
    };

    Material.prototype.addDirectives = function (directives, lights, data) {
    };

    /**
     *
     * @param lights
     * @param {Xflow.ComputeResult} data
     * @returns {XML3D.webgl.GLProgramObject}
     */
    Material.prototype.createProgram = function (lights, data) {
        if (!this.fragment)
            return null;
        if (!this.vertex)
            return null;

        var directives = [];

        this.fragment = XML3D.webgl.addFragmentShaderHeader(this.fragment);
        this.addDirectives(directives, lights || {}, data ? data.getOutputMap() : {});
        var sources = {
            fragment: Material.addDirectivesToSource(directives, this.fragment),
            vertex: Material.addDirectivesToSource(directives, this.vertex)
        };
        var programObject = new XML3D.webgl.GLProgramObject(this.context.gl, sources);
        if (programObject.isValid()) {
            programObject.setUniformVariables(this.uniforms);
            if (data) {
                this.parametersChanged(data.getOutputMap());
            }
            var that = this;
            Object.defineProperty(programObject, "hasTransparency", {
                get: function() {
                    return  that.isTransparent;
                }
            });
            programObject.material = this;
        }
        return programObject;
    };


    /**
     * @param {Array} directives
     * @param {string!} source
     * @returns {string}
     */
    Material.addDirectivesToSource = function (directives, source) {
        var header = "";
        directives.forEach(function (v) {
            header += "#define " + v + "\n";
        });
        return header + "\n" + source;
    };


    /**
     * @param {Object} lights
     * @param {Xflow.ComputeResult} dataTable
     * @returns {XML3D.webgl.GLProgramObject}
     */
    Material.prototype.getProgram = function (lights, dataTable) {
        if (!this.program) {
            this.program = this.createProgram(lights, dataTable);
        }
        return this.program;
    };

    webgl.Material = Material;

}(XML3D.webgl));