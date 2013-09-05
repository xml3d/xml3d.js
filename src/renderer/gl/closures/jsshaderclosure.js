(function (webgl) {

    /**
     * @param {Xflow.DATA_TYPE} xflowType
     */
    var convertXflow2ShadeType = function(xflowType, source) {
        var result = {}
        switch (xflowType) {
            case Xflow.DATA_TYPE.BOOL:
                result.type = Shade.TYPES.BOOLEAN;
                break;
            case Xflow.DATA_TYPE.INT:
                result.type = Shade.TYPES.INT;
                break;
            case Xflow.DATA_TYPE.FLOAT:
                result.type = Shade.TYPES.NUMBER;
                break;
            case Xflow.DATA_TYPE.FLOAT2:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.FLOAT2;
                break;
            case Xflow.DATA_TYPE.FLOAT3:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.FLOAT3;
                break;
            case Xflow.DATA_TYPE.FLOAT4:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.FLOAT4;
                break;
            case Xflow.DATA_TYPE.TEXTURE:
                result.type = Shade.TYPES.OBJECT;
                result.kind = Shade.OBJECT_KINDS.TEXTURE;
                break;
            case Xflow.DATA_TYPE.UNKNOWN:
            default:
                throw new Error("Unknown Xflow DataType: " + xflowType);
        }
        result.source = source;
        return result;
    }

    /**
     * @param context
     * @param sourceTemplate
     * @param dataCallback
     * @constructor
     */
    var JSShaderClosure = function(context, sourceTemplate, extractedParams) {
        webgl.AbstractShaderClosure.call(this, context);
        this.sourceTemplate = sourceTemplate;
        this.extractedParams = extractedParams;
    };

    XML3D.createClass(JSShaderClosure, webgl.AbstractShaderClosure, {
        /**
         *
         * @param {Scene} scene
         * @param {Xflow.ComputeResult} shaderResult
         * @param objectData
         */
        createSources: function(scene, shaderResult, objectData) {

            var contextData = {"global.shade" :[{"extra": {"type": "object","kind": "any","global" : true,"info" : {}}}]};
            var contextInfo = contextData["global.shade"][0].extra.info;

            var shaderEntries = shaderResult && shaderResult.getOutputMap(),
                vsShaderOutput = objectData && objectData.shaderOutputNames;

            for(var i = 0; i < this.extractedParams.length; ++i){
                var paramName = this.extractedParams[i];
                var envName = webgl.JSShaderComposer.convertEnvName(paramName);
                if(vsShaderOutput && vsShaderOutput.indexOf(envName) != -1){
                    contextInfo[paramName] = convertXflow2ShadeType(objectData.getShaderOutputType(envName),
                        objectData.isShaderOutputUniform(envName) ? Shade.SOURCES.UNIFORM : Shade.SOURCES.VERTEX);
                }
                else if(shaderEntries && shaderEntries[paramName]){
                    contextInfo[paramName] = convertXflow2ShadeType(shaderEntries[paramName].type, Shade.SOURCES.UNIFORM);
                }
            }

            try{
                var aast = Shade.parseAndInferenceExpression(this.sourceTemplate, { inject: contextData, loc: true });
                this.source = {
                    fragment: Shade.compileFragmentShader(aast),
                    vertex:  objectData.getGLSLCode()
                }
            }
            catch(e){
                var errorMessage = "Shade.js Compile Error:\n" + e.message + "\n------------\n"
                + "Shader Source:" + "\n------------\n" + XML3D.debug.formatSourceCode(this.sourceTemplate);
                throw new Error(errorMessage);
            }

            // TODO: Handle errors.
            XML3D.debug.logDebug(this.source.vertex);
            XML3D.debug.logDebug(this.source.fragment);
            return true;

        },

        getTransparencyFromInputData: function(dataMap){
            // TODO: Compute Transparency
            return false;
        },

        getUniformDefault: function(name){
            return null;
        },

        /* Default values are compiled into shade.js */
        setDefaultUniforms: function() {}

    });
    webgl.JSShaderClosure = JSShaderClosure;

}(XML3D.webgl));
