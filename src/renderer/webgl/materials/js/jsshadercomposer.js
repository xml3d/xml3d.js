var AbstractShaderComposer = require("./../abstractshadercomposer").AbstractShaderComposer;
var JSShaderClosure = require("./jsshaderclosure");

/**
 *
 * @param {GLContext} context
 * @param shaderInfo
 * @extends AbstractShaderComposer
 * @constructor
 */
var JSShaderComposer = function (context, shaderInfo) {
    AbstractShaderComposer.call(this, context, shaderInfo);

    if (!window.Shade)
        throw new Error("shade.js library not found");

    this.context = context;

    /** @type string*/
    this.sourceTemplate = null;

    /**
     * @private
     * @type {Array.<string>}
     */
    this.extractedParams = [];

    /**
     * @private
     * @type {Xflow.ComputeRequest|null}
     */
    this.request = null;

    this.setShaderInfo(shaderInfo);
};

JSShaderComposer.convertSysName = function (name) {
    return name;
};

XML3D.createClass(JSShaderComposer, AbstractShaderComposer, {
    setShaderInfo: function (shaderInfo) {
        this.sourceTemplate = shaderInfo.getScriptCode();
        try {
            this.extractedParams = Shade.extractParameters(this.sourceTemplate, {implementation: "xml3d-glsl-forward"}).shaderParameters;
            // FIXME: Shader.js should always request position (in case
        } catch (e) {
            // We ignore errors here. They will reoccur when updating connected mesh closures
            this.extractedParams = [];
        }
        if (this.extractedParams.indexOf("position") == -1) this.extractedParams.push("position");

        // The composer is interested in changes of all possible shader parameters (extracted)
        // the instances (closures) will only set those, that occur in the instance
        if (this.extractedParams.length) {
            this.updateRequest(shaderInfo.getData());
        }
    },

    getRequestFields: function () {
        return this.extractedParams;
    },

    getShaderAttributes: function () {
        return {color: null, normal: null, texcoord: null};
    },

    createShaderClosure: function () {
        return new JSShaderClosure(this.context, this.sourceTemplate, this.extractedParams);
    },

    createObjectDataRequest: function (objectDataNode, callback) {

        var vsConfig = new Xflow.VSConfig();
        var names = this.extractedParams.slice();
        //if(names.indexOf("position") == -1) names.push("position");
        vsConfig.addAttribute(Xflow.DATA_TYPE.FLOAT3, "position", true);
        for (var i = 0; i < names.length; ++i) {
            var name = names[i];
            if (name == "position") continue;
            var xflowInfo = objectDataNode.getOutputChannelInfo(name);
            if (xflowInfo) {
                vsConfig.addAttribute(xflowInfo.type, name, true);
            }
        }
        return new Xflow.VertexShaderRequest(objectDataNode, vsConfig, callback);
    },

    distributeObjectShaderData: function (objectRequest, attributeCallback, uniformCallback) {
        var vertexShader = objectRequest.getVertexShader();
        var inputNames = vertexShader.inputNames;
        var i, name, entry;

        for (i = 0; i < inputNames.length; ++i) {
            name = inputNames[i];
            entry = vertexShader.getInputData(name);
            if (vertexShader.isInputUniform(name))
                uniformCallback(name, entry); else
                attributeCallback(name, entry);
        }
        var outputNames = vertexShader.outputNames;
        for (i = 0; i < outputNames.length; ++i) {
            name = outputNames[i];
            if (vertexShader.isOutputFragmentUniform(name)) {
                uniformCallback(vertexShader.getOutputSourceName(name), vertexShader.getUniformOutputData(name));
            }
        }
    }

});


module.exports = JSShaderComposer;


