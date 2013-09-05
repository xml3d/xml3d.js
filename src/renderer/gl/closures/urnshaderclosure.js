(function (webgl) {

    /**
     * A ShaderClosure connects a mesh-specific GLProgram with it's Xflow data
     * @param {GLContext} context
     * @param descriptor
     * @param dataCallback
     * @constructor
     */
    var ShaderClosure = function(context, descriptor) {
        webgl.AbstractShaderClosure.call(this, context);
        this.descriptor = descriptor;
    };

    XML3D.createClass(ShaderClosure, webgl.AbstractShaderClosure);


    XML3D.extend(ShaderClosure.prototype, {


        setDefaultUniforms: function() {
            if (this.program.isValid()) {
                this.program.setUniformVariables(this.descriptor.uniforms);
            }
        },

        createSources: function(scene, shaderData, objectData) {
            var directives = [];

            var inputData = {};
            shaderData && XML3D.extend(inputData, shaderData.getOutputMap());
            objectData && XML3D.extend(inputData, objectData.getOutputMap());


            for(var attrName in this.descriptor.attributes){
                var entry = this.descriptor.attributes[attrName];
                if(entry && entry.required && !inputData[attrName]){
                    throw new Error("Mesh is missing '" + attrName + "' attribute.");
                    return false;
                }
            }

            this.descriptor.addDirectives(directives, scene.lights || {}, inputData);
            this.source = {
                fragment: this.addDirectivesToSource(directives, this.descriptor.fragment),
                vertex: this.addDirectivesToSource(directives, this.descriptor.vertex)
            };
            return true;
        },

        addDirectivesToSource: function (directives, source) {
            var header = "";
            directives.forEach(function (v) {
                header += "#define " + v + "\n";
            });
            return header + "\n" + source;
        },

        getTransparencyFromInputData: function(dataMap){
            return this.descriptor.hasTransparency(dataMap);
        },

        getUniformDefault: function(name){
            return this.descriptor.uniforms[name];
        }
});

    webgl.ShaderClosure = ShaderClosure;

}(XML3D.webgl));
