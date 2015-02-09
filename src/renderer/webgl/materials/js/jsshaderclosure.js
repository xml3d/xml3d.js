var AbstractShaderClosure = require("./../abstractshaderclosure.js");
var JSShaderComposer = require("./jsshadercomposer.js");
var SystemNotifier = require("../../system/system-notifier");
var getJSSystemConfiguration = require("./jssystemconfiguration");

var c_SystemUpdate = {
    "pointLightOn": {
        staticValue: "MAX_POINTLIGHTS",
        staticSize: ["pointLightOn", "pointLightAttenuation", "pointLightIntensity", "pointLightPosition", "pointLightCastShadow", "pointLightShadowBias", "pointLightShadowMap", "pointLightMatrix", "pointLightNearFar"]
    }, "directionalLightOn": {
        staticValue: "MAX_DIRECTIONALLIGHTS",
        staticSize: ["directionalLightOn", "directionalLightIntensity", "directionalLightDirection", "directionalLightCastShadow", "directionalLightShadowBias", "directionalLightShadowMap", "directionalLightMatrix"]
    }, "spotLightOn": {
        staticValue: "MAX_SPOTLIGHTS",
        staticSize: ["spotLightOn", "spotLightAttenuation", "spotLightIntensity", "spotLightPosition", "spotLightDirection", "spotLightCosFalloffAngle", "spotLightCosSoftFalloffAngle", "spotLightCastShadow", "spotLightShadowBias", "spotLightShadowMap", "spotLightMatrix"]
    }
};

var c_jsShaderCache = {};

function addDefaultChanneling(vsConfig, inputName){
    var outputName = inputName;
    vsConfig.channelAttribute(inputName, outputName, null);
}


function channelVsAttribute(vsConfig, inputName, spaceInfo){
    if(!spaceInfo || !spaceInfo[inputName]){
        addDefaultChanneling(vsConfig, inputName);
        return;
    }

    var i = spaceInfo[inputName].length;
    while(i--){
        var entry = spaceInfo[inputName][i];
        var outputName = entry.name, code = null;
        switch(entry.space){
            case Shade.SPACE_VECTOR_TYPES.OBJECT: break;
            case Shade.SPACE_VECTOR_TYPES.VIEW_POINT:
                vsConfig.addInputParameter(Xflow.DATA_TYPE.FLOAT4X4, "modelViewMatrix", true);
                code = "this.modelViewMatrix.mulVec(" + inputName + ", 1.0).xyz()";
                break;
            case Shade.SPACE_VECTOR_TYPES.VIEW_NORMAL:
                vsConfig.addInputParameter(Xflow.DATA_TYPE.FLOAT3X3, "modelViewMatrixN", true);
                code = "this.modelViewMatrixN.mulVec(" + inputName + ").normalize()";
                break;
            case Shade.SPACE_VECTOR_TYPES.WORLD_POINT:
                vsConfig.addInputParameter(Xflow.DATA_TYPE.FLOAT4X4, "modelMatrix", true);
                code = "this.modelMatrix.mulVec(" + inputName + ", 1.0).xyz()";
                break;
            case Shade.SPACE_VECTOR_TYPES.WORLD_NORMAL:
                vsConfig.addInputParameter(Xflow.DATA_TYPE.FLOAT3X3, "modelMatrixN", true);
                code = "this.modelMatrixN.mulVec(" + inputName + ").normalize()";
                break;
            default:
                throw new Error("Can't handle Space Type: " + entry.space);
        }
        vsConfig.channelAttribute(inputName, outputName, code);
    }
}

/**
 * @param context
 * @param sourceTemplate
 * @param dataCallback
 * @constructor
 */
var JSShaderClosure = function(context, sourceTemplate, extractedParams) {
    AbstractShaderClosure.call(this, context);
    this.sourceTemplate = sourceTemplate;
    this.extractedParams = extractedParams;
    this.vertexUniforms = [];
    this.uniformSetter = function() {};
    this.uniformConverter = [];
};

XML3D.createClass(JSShaderClosure, AbstractShaderClosure, {
    /**
     *
     * @param {GLScene} scene
     * @param {Xflow.ComputeResult} shaderResult
     * @param objectData
     */
    createSources: function (scene, shaderResult, vsRequest) {

        var vsDataResult = vsRequest.getResult();

        var contextData = {
            "this" : getJSSystemConfiguration(this.context),
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
                contextInfo[paramName] = Xflow.shadejs.convertFromXflow(vsDataResult.getOutputType(paramName),
                    vsDataResult.isOutputUniform(paramName) ? Shade.SOURCES.UNIFORM : Shade.SOURCES.VERTEX);
            }
            else if(shaderEntries && shaderEntries[paramName]){
                contextInfo[paramName] = Xflow.shadejs.convertFromXflow(
                    shaderEntries[paramName].type, Shade.SOURCES.UNIFORM);
            }
        }
        XML3D.debug.logDebug("CONTEXT:", contextData);

        var options = {
            propagateConstants: true,
            validate: true,
            sanitize: true,
            transformSpaces: XML3D.options.getValue("shadejs-transformSpaces"),
            extractUniformExpressions: XML3D.options.getValue("shadejs-extractUniformExpressions")
        };
        var compileOptions = {
            useStatic: true,
            uniformExpressions: options.uniformExpressions
        };
        var implementation = scene.deferred ? "xml3d-glsl-deferred" : "xml3d-glsl-forward";

        var jsShaderKey = implementation + ";" + JSON.stringify(options) + ";" + JSON.stringify(contextInfo) + ";"
               + this.sourceTemplate;

        var cacheEntry;
        if (!(cacheEntry = c_jsShaderCache[jsShaderKey])) {
            try {
                var workSet = new Shade.WorkingSet();
                workSet.parse(this.sourceTemplate, {loc: true});
                workSet.analyze(contextData, implementation, options);
                var spaceInfo = workSet.getProcessingData('spaceInfo');
                var glslShader = workSet.compileFragmentShader(compileOptions);

                cacheEntry = {
                    source: glslShader.source,
                    uniformSetter: glslShader.uniformSetter,
                    spaceInfo: spaceInfo
                }

                this.uniformSetter = glslShader.uniformSetter;
                this.source = {
                    fragment: glslShader.source,
                    vertex: this.createVertexShader(vsRequest, vsDataResult, spaceInfo)
                }
                if (scene.deferred) {
                    cacheEntry.signatures = workSet.getProcessingData("colorClosureSignatures");
                }
                if (XML3D.options.getValue("shadejs-cache"))
                    c_jsShaderCache[jsShaderKey] = cacheEntry;
            } catch (e) {
                SystemNotifier.sendEvent('shadejs', {
                    shadejsType: "error",
                    event: e,
                    code: this.sourceTemplate
                });

                var errorMessage = "Shade.js Compile Error:\n" + e.message + "\n------------\n"
                  + "Shader Source:" + "\n------------\n" + XML3D.debug.formatSourceCode(this.sourceTemplate);
                throw new Error(errorMessage);
            }
        }
        this.source = {
            fragment: cacheEntry.source,
            vertex: this.createVertexShader(vsRequest, vsDataResult, cacheEntry.spaceInfo)
        }
        this.uniformSetter = cacheEntry.uniformSetter;
        if (scene.deferred) {
            scene.colorClosureSignatures.push.apply(scene.colorClosureSignatures, cacheEntry.signatures);
        }

        // TODO: Handle errors.
        XML3D.debug.logDebug(this.source.vertex);
        XML3D.debug.logDebug(this.source.fragment);

        SystemNotifier.sendEvent('shadejs', {
            shadejsType: "success",
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
        vsConfig.channelAttribute("position", "_glPosition", "this.modelViewProjectionMatrix.mulVec(position, 1.0)");
        //vsConfig.addCodeFragment( "gl_Position = modelViewProjectionMatrix * vec4(#I{position}, 1.0);");
        var vertexShader =  vsRequest.getVertexShader();
        this.vertexUniforms.length = 0;
        var inputNames = vertexShader.inputNames;
        for(var i = 0; i < inputNames.length; ++i){
            var name = inputNames[i];
            if(vertexShader.isInputUniform(name))
                this.vertexUniforms.push(name);
        }
        return vertexShader.getGLSLCode();
    },

    setUniformVariables: function(envNames, sysNames, inputCollection){
        var i = envNames && envNames.length;
        var override = inputCollection.envOverride, base = inputCollection.envBase;
        while(i--){
            var name = envNames[i];
            if(this.vertexUniforms.indexOf(name) != -1){
                this.program.setUniformVariable(name, override && override[name] !== undefined ? override[name] : base[name]);
            }
        }

        this.uniformSetter(envNames, sysNames, inputCollection, this.program.setUniformVariable.bind(this.program));
    },

    getTransparencyFromInputData: function (dataMap) {
        // TODO: Compute Transparency
        return false;
    },

    /* Default values are compiled into shade.js */
    setDefaultUniforms: function () {
    }

});
module.exports = JSShaderClosure;

