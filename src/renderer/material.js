
    /**
     * @constructor
     */
    var Material = function(shaderManager) {
        this.shaderManager = shaderManager;
        /** @type boolean */
        this.isTransparent = false;
    };
    Material.prototype.parametersChanged = function(shaderEntries) {
        if (this.hasTransparency)
            this.isTransparent = this.hasTransparency(shaderEntries);
    };

    Material.prototype.uniforms = {};
    Material.prototype.samplers = {};
    Material.prototype.fragment = null;
    Material.prototype.vertex = null;

    Material.prototype.getRequestFields = function() {
        return Object.keys(this.uniforms).concat(Object.keys(this.samplers));
    };

    Material.prototype.addDirectives = function(directives, lights, data) {};

    Material.prototype.createProgram = function(lights, data) {
        if(!this.fragment)
            return null;
        if(!this.vertex)
            return null;

        var directives = [];
        this.addDirectives(directives, lights || {}, data ? data.getOutputMap() : {});
        this.fragment = Material.addDirectivesToSource(directives, this.fragment);
        this.vertex = Material.addDirectivesToSource(directives, this.vertex);
        //console.log(sources.fragment);
        return this.shaderManager.createProgramFromMaterial(this);
    };


    /**
     * @param {Array!} directives
     * @param {string!} source
     * @returns {string}
     */
    Material.addDirectivesToSource = function(directives, source) {
        var header = "";
        Array.forEach(directives, function(v) {
            header += "#define " + v + "\n";
        });
        return header + "\n" + source;
    };


    /**
     * @param {Xflow.ComputeResult} dataTable
     * @returns
     */
    Material.prototype.getProgram = function(lights, dataTable) {
        if(!this.program) {
            this.program = this.createProgram(lights, dataTable);
        }
        return this.program;
    };