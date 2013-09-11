(function (webgl) {

    var SYSTEM_CONTEXT = {
        "type": "object",
        "kind": "any",
        "info": {
            "coords": { "type": "object", "kind": "float3", "source": "uniform" },
            "viewMatrix": { "type": "object", "kind": "matrix4", "source": "uniform" },

            "MAX_POINTLIGHTS": { "type": "int", "source": "constant", "staticValue": 5 },
            "pointLightOn": { "type": "array", "elements": { "type": "boolean" }, "staticSize": 5, "source": "uniform"},
            "pointLightAttenuation": {
                "type": "array", "elements": { "type": "object", "kind": "float3" }, "staticSize": 5,
                "source": "uniform"
            },
            "pointLightIntensity": {
                "type": "array", "elements": { "type": "object", "kind": "float3" }, "staticSize": 5,
                "source": "uniform"
            },
            "pointLightPosition": {
                "type": "array", "elements": { "type": "object", "kind": "float3" }, "staticSize": 5,
                "source": "uniform"
            },

            "MAX_DIRECTIONALLIGHTS": { "type": "int", "source": "constant", "staticValue": 5 },
            "directionalLightOn": { "type": "array", "elements": { "type": "boolean" }, "staticSize": 5, "source": "uniform"},
            "directionalLightIntensity": {
                "type": "array", "elements": { "type": "object", "kind": "float3" }, "staticSize": 5,
                "source": "uniform"
            },
            "directionalLightDirection": {
                "type": "array", "elements": { "type": "object", "kind": "float3" }, "staticSize": 5,
                "source": "uniform"
            },

            "MAX_SPOTLIGHTS": { "type": "int", "source": "constant", "staticValue": 5 },
            "spotLightOn": { "type": "array", "elements": { "type": "boolean" }, "staticSize": 5, "source": "uniform"},
            "spotLightAttenuation": {
                "type": "array", "elements": { "type": "object", "kind": "float3" }, "staticSize": 5,
                "source": "uniform"
            },
            "spotLightIntensity": {
                "type": "array", "elements": { "type": "object", "kind": "float3" }, "staticSize": 5,
                "source": "uniform"
            },
            "spotLightPosition": {
                "type": "array", "elements": { "type": "object", "kind": "float3" }, "staticSize": 5,
                "source": "uniform"
            },
            "spotLightDirection": {
                "type": "array", "elements": { "type": "object", "kind": "float3" }, "staticSize": 5,
                "source": "uniform"
            },
            "spotLightCosFalloffAngle": {
                "type": "array", "elements": { "type": "number" }, "staticSize": 5,
                "source": "uniform"
            },
            "spotLightCosSoftFalloffAngle": {
                "type": "array", "elements": { "type": "number" }, "staticSize": 5,
                "source": "uniform"
            }
        }
    };

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
                "this" : SYSTEM_CONTEXT,
                "global.shade" :[{"extra": {"type": "object","kind": "any","global" : true,"info" : {}}}]
            };

            var systemUniforms = scene.systemUniforms, systemInfo = SYSTEM_CONTEXT.info;
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
                this.source = {
                    fragment: Shade.compileFragmentShader(aast, {useStatic: true}),
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

        setUniformVariables: function(envNames, sysNames, inputCollection){
            var i, base, override;
            if(envNames && inputCollection.envBase){
                i = envNames.length; base = inputCollection.envBase; override = inputCollection.envOverride;
                while(i--){
                    var srcName = envNames[i], destName = webgl.JSShaderComposer.convertEnvName(envNames[i]);
                    this.program.setUniformVariable(destName,
                        override && override[srcName] !== undefined ? override[srcName] : base[srcName]);
                }
            }
            if(sysNames && inputCollection.sysBase){
                i = sysNames.length; base = inputCollection.sysBase;
                while(i--){
                    var srcName = sysNames[i], destName = webgl.JSShaderComposer.convertSysName(sysNames[i]);
                    this.program.setUniformVariable(destName, base[srcName]);
                }
            }
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
