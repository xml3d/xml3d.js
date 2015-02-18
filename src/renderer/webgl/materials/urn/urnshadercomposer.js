var AbstractShaderComposer = require("../abstractshadercomposer").AbstractShaderComposer;
var URNShaderClosure= require("./urnshaderclosure");
var ShaderDescriptor = require("./shader-descriptor");

/**
 * @param {string} path
 * @returns {*}
 */
var getShaderDescriptor = function (path) {
    var shaderName = path.substring(path.lastIndexOf(':') + 1);
    return XML3D.shaders.getScript(shaderName);
};


/**
 * @implements {IShaderComposer}
 * @extends AbstractShaderComposer
 * @constructor
 */
var URNShaderComposer = function (context, materialConfiguration) {
    AbstractShaderComposer.call(this, context, materialConfiguration);
    this.descriptor = null;
    this.setMaterialConfiguration(materialConfiguration);
};

XML3D.createClass(URNShaderComposer, AbstractShaderComposer, {
    /**
     *
     * @param {MaterialConfiguration} materialConfiguration
     */
    setMaterialConfiguration: function (materialConfiguration) {
        var shaderScriptURI = materialConfiguration.model.urn;
        this.setShaderScript(shaderScriptURI);

        if (this.descriptor) {
            materialConfiguration.dataNode && this.updateRequest(materialConfiguration.dataNode);

            this.descriptor.fragment = XML3D.webgl.addFragmentShaderHeader(this.descriptor.fragment);
        }
    },

    setShaderScript: function (uri) {

        if (!uri) {
            XML3D.debug.logError("Shader has no script attached: ", this.adapter.node);
            return;
        }
        if (uri.scheme != "urn") {
            XML3D.debug.logError("Shader script reference should start with an URN: ", this.adapter.node);
            return;
        }
        var descriptor = getShaderDescriptor(uri.path);
        if (!descriptor) {
            throw new Error("Unknown URN: " + uri);
        }

        this.descriptor = new ShaderDescriptor();
        XML3D.extend(this.descriptor, descriptor);
    },

    getRequestFields: function () {
        return Object.keys(this.descriptor.uniforms).concat(Object.keys(this.descriptor.samplers));
    },

    /**
     * Get the attributes required by the shader
     * @returns {Object<string, *>}
     */
    getShaderAttributes: function () {
        return this.descriptor.attributes;
    },

    createShaderClosure: function () {
        return new URNShaderClosure(this.context, this.descriptor);
    },

    createObjectDataRequest: function (objectDataNode, callback) {
        var requestNames = ["position"];
        requestNames.push.apply(requestNames, Object.keys(this.descriptor.attributes));
        requestNames.push.apply(requestNames, Object.keys(this.descriptor.uniforms));
        requestNames.push.apply(requestNames, Object.keys(this.descriptor.samplers));
        return new Xflow.ComputeRequest(objectDataNode, requestNames, callback);
    },

    distributeObjectShaderData: function (objectRequest, attributeCallback, uniformCallback) {
        var result = objectRequest.getResult();

        var dataMap = result.getOutputMap();
        for (var name in dataMap) {

            if (name == "position" || this.descriptor.attributes[name] !== undefined)
                attributeCallback(name, dataMap[name]); else if (this.descriptor.uniforms[name] !== undefined || this.descriptor.samplers[name] !== undefined) {
                uniformCallback(name, dataMap[name]);
            }
        }
    }

});

module.exports = URNShaderComposer;


