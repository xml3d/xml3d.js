var AbstractShaderComposer = require("../abstractshadercomposer.js").AbstractShaderComposer;
var URNShaderClosure= require("./urnshaderclosure.js");
var ShaderDescriptor = require("./shader-descriptor.js");
var ComputeRequest = require("../../../../xflow/interface/request.js").ComputeRequest;
var addFragmentShaderHeader = require("../../shader/shader-utils.js").addFragmentShaderHeader;
require("./diffuse.js");
require("./phong.js");
require("./matte.js");
require("./point.js");
require("./utility.js");

/**
 * @param {string} path
 * @returns {*}
 */
var getShaderDescriptor = function (path) {
    var shaderName = path.substring(path.lastIndexOf(':') + 1);
    return XML3D.materials.getScript(shaderName);
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
            this.descriptor.matName = materialConfiguration.name;

            this.descriptor.fragment = addFragmentShaderHeader(this.descriptor.fragment);
        }
    },

    setShaderScript: function (uri) {

        if (!uri) {
            XML3D.debug.logError("Material has no script attached: ", this.adapter.node);
            return;
        }
        if (uri.scheme != "urn") {
            XML3D.debug.logError("Material model reference should start with an URN: ", this.adapter.node);
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
        return new ComputeRequest(objectDataNode, requestNames, callback);
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


