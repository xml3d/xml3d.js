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
    var JSShaderClosure = function(context, sourceTemplate) {
        webgl.AbstractShaderClosure.call(this, context);
        this.sourceTemplate = sourceTemplate;
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
            if (shaderResult) {
                var entries = shaderResult.getOutputMap();

                for (var name in entries) {
                    var entry = entries[name];
                    if (entry) {
                        contextInfo[name] = convertXflow2ShadeType(entry.type, Shade.SOURCES.UNIFORM);
                    }
                }
            }
            if (objectData) {
                var outputNames = objectData.shaderOutputNames;

                for (var i = 0; i < outputNames.length; ++i) {
                    var name = outputNames[i];
                    if (entry) {
                        contextInfo[name] = convertXflow2ShadeType(objectData.getShaderOutputType(name)
                            , objectData.isShaderInputUniform(name) ? Shade.SOURCES.UNIFORM
                                : Shade.SOURCES.VERTEX);
                    }
                }
            }

            var aast = Shade.parseAndInferenceExpression(this.sourceTemplate, { inject: contextData, loc: true });
            this.source = {
                fragment: Shade.compileFragmentShader(aast),
                vertex:  [
                    "attribute vec3 position;",
                    "attribute vec3 color;",

                    "varying vec3 fragVertexColor;",

                    "uniform mat4 modelViewProjectionMatrix;",

                    "void main(void) {",
                    "   fragVertexColor = color;",
                    "   gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
                    "}"
                ].join("\n")
            }
            console.log(this.source.fragment);
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
