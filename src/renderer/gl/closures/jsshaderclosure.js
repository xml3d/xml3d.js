(function (webgl) {



    var c_SystemUpdate = {
        "pointLightOn": {
            staticValue : "MAX_POINTLIGHTS",
            staticSize: ["pointLightOn", "pointLightAttenuation", "pointLightIntensity", "pointLightPosition"]
        },
        "directionalLightOn" : {
            staticValue: "MAX_DIRECTIONALLIGHTS",
            staticSize: ["directionalLightOn", "directionalLightIntensity", "directionalLightDirection" ]
        },
        "spotLightOn" : {
            staticValue: "MAX_SPOTLIGHTS",
            staticSize: ["spotLightOn", "spotLightAttenuation", "spotLightIntensity",
                "spotLightPosition", "spotLightDirection", "spotLightCosFalloffAngle", "spotLightCosSoftFalloffAngle"]
        }
    };


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
        this.uniformSetter = function() {};
        this.uniformConverter = [];
    };

    XML3D.createClass(JSShaderClosure, webgl.AbstractShaderClosure, {
        /**
         *
         * @param {GLScene} scene
         * @param {Xflow.ComputeResult} shaderResult
         * @param objectData
         */
        createSources: function(scene, shaderResult, objectData) {

            var contextData = {
                "this" : webgl.getJSSystemConfiguration(this.context),
                "global.shade" :[{"extra": {"type": "object","kind": "any","global" : true,"info" : {}}}]
            };

            var systemUniforms = scene.systemUniforms, systemInfo = contextData["this"].info;
            for(var systemSource in c_SystemUpdate){
                var entry = c_SystemUpdate[systemSource];
                var length = systemUniforms[systemSource] && systemUniforms[systemSource].length;
                systemInfo[entry.staticValue].staticValue = length;
                for(var i = 0; i < entry.staticSize.length; ++i)
                    systemInfo[entry.staticSize[i]].staticSize = length;
            }

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

            XML3D.debug.logDebug("CONTEXT:", contextData);
            try{
                var aast = Shade.parseAndInferenceExpression(this.sourceTemplate, {
                    inject: contextData, loc: true, implementation: "xml3d-glsl-forward" });
                var glslShader = Shade.compileFragmentShader(aast, {useStatic: true});
                this.uniformSetter = glslShader.uniformSetter;
                this.source = {
                    fragment: glslShader.source,
                    vertex:  objectData.getGLSLCode()
                }
            }
            catch(e){
                webgl.SystemNotifier.sendEvent('shadejs', {
                    shadejsType : "error",
                    event: e,
                    code: this.sourceTemplate
                });

                var errorMessage = "Shade.js Compile Error:\n" + e.message + "\n------------\n"
                + "Shader Source:" + "\n------------\n" + XML3D.debug.formatSourceCode(this.sourceTemplate);
                throw new Error(errorMessage);
            }

            // TODO: Handle errors.
            XML3D.debug.logDebug(this.source.vertex);
            XML3D.debug.logDebug(this.source.fragment);

            webgl.SystemNotifier.sendEvent('shadejs', {
                shadejsType : "success",
                vertexShader: this.source.vertex,
                fragmentShader: this.source.fragment
            });

            return true;

        },

        setUniformVariables: function(envNames, sysNames, inputCollection){
            this.uniformSetter(envNames, sysNames, inputCollection, this.program.setUniformVariable.bind(this.program));
        },

        getTransparencyFromInputData: function(dataMap){
            // TODO: Compute Transparency
            return false;
        },

        /* Default values are compiled into shade.js */
        setDefaultUniforms: function() {}

    });
    webgl.JSShaderClosure = JSShaderClosure;

}(XML3D.webgl));
