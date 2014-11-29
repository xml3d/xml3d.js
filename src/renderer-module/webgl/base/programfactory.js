var ShaderUtils = require("./shader-utils.js");

var ProgramFactory = function (context) {
    this.context = context;
    this.programs = {
        fallback: null, picking: {
            id: null, normal: null, position: null
        }
    }
};



XML3D.extend(ProgramFactory.prototype, {

    getProgramByName: function (name) {
        var scriptDescriptor = XML3D.shaders.getScript(name);
        if (!scriptDescriptor || !scriptDescriptor.vertex) {
            XML3D.debug.logError("Unknown shader: ", name);
            return null;
        }
        var descriptor = new XML3D.webgl.ShaderDescriptor();
        XML3D.extend(descriptor, scriptDescriptor);
        descriptor.fragment = ShaderUtils.addFragmentShaderHeader(descriptor.fragment);
        var shader = new XML3D.webgl.ShaderClosure(this.context, descriptor);
        shader.createSources({}, null, null);
        shader.compile();
        return shader;
    },

    getFallbackProgram: function () {
        if (!this.programs.fallback) {
            var descriptor = new XML3D.webgl.ShaderDescriptor();
            XML3D.extend(descriptor, XML3D.shaders.getScript("matte"));
            descriptor.fragment = ShaderUtils.addFragmentShaderHeader(descriptor.fragment);
            var shader = new XML3D.webgl.ShaderClosure(this.context, descriptor);
            shader.uniformCollection.envBase.diffuseColor = [1, 0, 0];
            shader.createSources({}, null, null);
            shader.compile();
            this.programs.fallback = shader;
            this.programs.fallback.bind();
            this.programs.fallback.setUniformVariables(["diffuseColor"], null, {envBase: {diffuseColor: [1, 0, 0]}});
            this.programs.fallback.unbind();
        }
        return this.programs.fallback;
    },

    getPickingObjectIdProgram: function () {
        var picking = this.programs.picking;
        if (!picking.id) {
            picking.id = this.getProgramByName("pickobjectid");
        }
        return picking.id;
    },

    getPickingPositionProgram: function () {
        var picking = this.programs.picking;
        if (!picking.position) {
            picking.position = this.getProgramByName("pickedposition");
        }
        return picking.position;
    },

    getPickingNormalProgram: function () {
        var picking = this.programs.picking;
        if (!picking.normal) {
            picking.normal = this.getProgramByName("pickedNormals");
        }
        return picking.normal;
    }

});

module.exports = ProgramFactory;

