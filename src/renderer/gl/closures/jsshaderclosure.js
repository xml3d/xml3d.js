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

    function addDefaultChanneling(vsConfig, inputName){
        var outputName = XML3D.webgl.JSShaderComposer.convertEnvName(inputName);
        vsConfig.channelAttribute(inputName, outputName, null);
    }


    function channelVsAttribute(vsConfig, inputName, spaceInfo){
        if(!spaceInfo[inputName]){
            addDefaultChanneling(vsConfig, inputName);
            return;
        }

        var i = spaceInfo[inputName].length;
        while(i--){
            var entry = spaceInfo[inputName][i];
            var outputName = XML3D.webgl.JSShaderComposer.convertEnvName(entry.name), code = null;
            switch(entry.space){
                case Shade.SPACE_VECTOR_TYPES.OBJECT: break;
                case Shade.SPACE_VECTOR_TYPES.VIEW_POINT:
                    vsConfig.addInputParameter(Xflow.DATA_TYPE.FLOAT4X4, "modelViewMatrix", true);
                    code = outputName + " = ( modelViewMatrix * vec4(#I{" + inputName + "}, 1.0) ).xyz;";
                    break;
                case Shade.SPACE_VECTOR_TYPES.VIEW_NORMAL:
                    vsConfig.addInputParameter(Xflow.DATA_TYPE.FLOAT3X3, "normalMatrix", true);
                    code =  outputName + " = normalize( normalMatrix * #I{" + inputName + "} );";
                    break;
                default:
                    XML3D.error("Can't handle Space Type: " + entry.space);
            }
            vsConfig.channelAttribute(inputName, outputName, code);
        }
    }


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
        createSources: function(scene, shaderResult, vsRequest) {

            var vsDataResult = vsRequest.getResult();

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
                vsShaderOutput = vsDataResult && vsDataResult.outputNames;

            for(var i = 0; i < this.extractedParams.length; ++i){
                var paramName = this.extractedParams[i];
                if(vsShaderOutput && vsShaderOutput.indexOf(paramName) != -1){
                    contextInfo[paramName] = convertXflow2ShadeType(vsDataResult.getOutputType(paramName),
                        vsDataResult.isOutputUniform(paramName) ? Shade.SOURCES.UNIFORM : Shade.SOURCES.VERTEX);
                }
                else if(shaderEntries && shaderEntries[paramName]){
                    contextInfo[paramName] = convertXflow2ShadeType(shaderEntries[paramName].type, Shade.SOURCES.UNIFORM);
                }
            }

            XML3D.debug.logDebug("CONTEXT:", contextData);
            try{
                var ast = Shade.getSanitizedAst(this.sourceTemplate, {loc: true});
                var aast = Shade.parseAndInferenceExpression(ast, {
                    inject: contextData, implementation: "xml3d-glsl-forward" });
                var spaceInfo = Shade.resolveSpaces(aast);
                var glslShader = Shade.compileFragmentShader(aast, {useStatic: true});
                this.uniformSetter = glslShader.uniformSetter;
                this.source = {
                    fragment: glslShader.source,
                    vertex:  this.createVertexShader(vsRequest, vsDataResult, spaceInfo)
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

        createVertexShader: function(vsRequest, vsDataResult, spaceInfo){
            var vsConfig = vsRequest.getConfig();
            var names = vsDataResult.outputNames;
            for(var i = 0; i < names.length; ++i){
                channelVsAttribute(vsConfig, names[i], spaceInfo);
            }
            vsConfig.addInputParameter(Xflow.DATA_TYPE.FLOAT4X4, "modelViewProjectionMatrix", true);
            vsConfig.addCodeFragment( "gl_Position = modelViewProjectionMatrix * vec4(#I{position}, 1.0);");
            return vsRequest.getVertexShader().getGLSLCode();
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
