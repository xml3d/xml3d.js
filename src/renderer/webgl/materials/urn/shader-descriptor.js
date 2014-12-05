var ShaderDescriptor = function () {
    this.uniforms = {};
    this.samplers = {};
    this.attributes = {};
    this.name = "";
    this.fragment = "";
    this.vertex = "";
};
ShaderDescriptor.prototype.addDirectives = function () {
};
ShaderDescriptor.prototype.hasTransparency = function () {
    return false;
};

module.exports = ShaderDescriptor;
