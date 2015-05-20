var AbstractShaderClosure = require("./../abstractshaderclosure.js");
var JSShaderComposer = require("./jsshadercomposer.js");
var SystemNotifier = require("../../system/system-notifier.js");
var getJSSystemConfiguration = require("./jssystemconfiguration.js");
var XC = require("../../../../xflow/interface/constants.js");
var Options = require("../../../../utils/options.js");


var c_jsShaderCache = {};


function convertEnvName(name) {
    return ("_env_" + name).replace(/_+/g, "_");
}

function addDefaultChanneling(vsConfig, inputName) {
    var outputName = convertEnvName(inputName);
    vsConfig.channelAttribute(inputName, outputName, null);
}


function channelVsAttribute(vsConfig, inputName, spaceInfo) {
    if (!spaceInfo || !spaceInfo[inputName]) {
        addDefaultChanneling(vsConfig, inputName);
        return;
    }

    var i = spaceInfo[inputName].length;
    while (i--) {
        var entry = spaceInfo[inputName][i];
        var outputName = convertEnvName(entry.name), code = null;
        switch (entry.space) {
            case Shade.SPACE_VECTOR_TYPES.OBJECT:
                break;
            case Shade.SPACE_VECTOR_TYPES.VIEW_POINT:
                vsConfig.addInputParameter(XC.DATA_TYPE.FLOAT4X4, "modelViewMatrix", true);
                code = outputName + " = ( modelViewMatrix * vec4(#I{" + inputName + "}, 1.0) ).xyz;";
                break;
            case Shade.SPACE_VECTOR_TYPES.VIEW_NORMAL:
                vsConfig.addInputParameter(XC.DATA_TYPE.FLOAT3X3, "modelViewMatrixN", true);
                code = outputName + " = normalize( modelViewMatrixN * #I{" + inputName + "} );";
                break;
            case Shade.SPACE_VECTOR_TYPES.WORLD_POINT:
                vsConfig.addInputParameter(XC.DATA_TYPE.FLOAT4X4, "modelMatrix", true);
                code = outputName + " = ( modelMatrix * vec4(#I{" + inputName + "}, 1.0) ).xyz;";
                break;
            case Shade.SPACE_VECTOR_TYPES.WORLD_NORMAL:
                vsConfig.addInputParameter(XC.DATA_TYPE.FLOAT3X3, "modelMatrixN", true);
                code = outputName + " = normalize( modelMatrixN * #I{" + inputName + "} );";
                break;
            default:
                throw new Error("Can't handle Space Type: " + entry.space);
        }
        vsConfig.channelAttribute(inputName, outputName, code);
    }
}


/**
 * @param {XC.DATA_TYPE} xflowType
 */
var convertXflow2ShadeType = function (xflowType, source) {
    var result = {}
    switch (xflowType) {
        case XC.DATA_TYPE.BOOL:
            result.type = Shade.TYPES.BOOLEAN;
            break;
        case XC.DATA_TYPE.INT:
            result.type = Shade.TYPES.INT;
            break;
        case XC.DATA_TYPE.FLOAT:
            result.type = Shade.TYPES.NUMBER;
            break;
        case XC.DATA_TYPE.FLOAT2:
            result.type = Shade.TYPES.OBJECT;
            result.kind = Shade.OBJECT_KINDS.FLOAT2;
            break;
        case XC.DATA_TYPE.FLOAT3:
            result.type = Shade.TYPES.OBJECT;
            result.kind = Shade.OBJECT_KINDS.FLOAT3;
            break;
        case XC.DATA_TYPE.FLOAT4:
            result.type = Shade.TYPES.OBJECT;
            result.kind = Shade.OBJECT_KINDS.FLOAT4;
            break;
        case XC.DATA_TYPE.FLOAT3X3:
            result.type = Shade.TYPES.OBJECT;
            result.kind = Shade.OBJECT_KINDS.MATRIX3;
            break;
        case XC.DATA_TYPE.FLOAT4X4:
            result.type = Shade.TYPES.OBJECT;
            result.kind = Shade.OBJECT_KINDS.MATRIX4;
            break;
        case XC.DATA_TYPE.TEXTURE:
            result.type = Shade.TYPES.OBJECT;
            result.kind = Shade.OBJECT_KINDS.TEXTURE;
            break;
        case XC.DATA_TYPE.UNKNOWN:
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
var JSShaderClosure = function (context, sourceTemplate, extractedParams) {
    AbstractShaderClosure.call(this, context);
    this.sourceTemplate = sourceTemplate;
    this.extractedParams = extractedParams;
    this.uniformSetter = function () {
    };
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

        var systemParameters = getSystemParameters(this.context, scene.systemUniforms);
        var environmentParameters = {};



        var shaderEntries = shaderResult && shaderResult.getOutputMap(), vsShaderOutput = vsDataResult && vsDataResult.outputNames;

        for (var i = 0; i < this.extractedParams.length; ++i) {
            var paramName = this.extractedParams[i];
            if (vsShaderOutput && vsShaderOutput.indexOf(paramName) != -1) {
                environmentParameters[paramName] = convertXflow2ShadeType(vsDataResult.getOutputType(paramName), vsDataResult.isOutputUniform(paramName) ? Shade.SOURCES.UNIFORM : Shade.SOURCES.VERTEX);
            } else if (shaderEntries && shaderEntries[paramName]) {
                environmentParameters[paramName] = convertXflow2ShadeType(shaderEntries[paramName].type, Shade.SOURCES.UNIFORM);
            }
        }

        var contextData = {
            "this": { "type": "object", "kind": "any", "info": systemParameters },
            "global.shade": [{"extra": {"type": "object", "kind": "any", "global": true, "info": environmentParameters }}]
        };

        XML3D.debug.logDebug("CONTEXT:", contextData);

        var options = {
            propagateConstants: true,
            validate: true,
            sanitize: true,
            transformSpaces: Options.getValue("shadejs-transformSpaces"),
            extractUniformExpressions: Options.getValue("shadejs-extractUniformExpressions")
        };
        var compileOptions = {
            useStatic: true, uniformExpressions: options.uniformExpressions
        };
        var implementation = scene.deferred ? "xml3d-glsl-deferred" : "xml3d-glsl-forward";

        var jsShaderKey = implementation + ";" + JSON.stringify(options) + ";" + JSON.stringify(environmentParameters) + ";" + this.sourceTemplate;

        var cacheEntry;
        if (!(cacheEntry = c_jsShaderCache[jsShaderKey])) {
            try {
                var workSet = new Shade.WorkingSet();
                workSet.parse(this.sourceTemplate, {loc: true});
                workSet.analyze(contextData, implementation, options);
                var spaceInfo = workSet.getProcessingData('spaceInfo');
                var glslShader = workSet.compileFragmentShader(compileOptions);

                cacheEntry = {
                    source: glslShader.source, uniformSetter: glslShader.uniformSetter, spaceInfo: spaceInfo
                }

                this.uniformSetter = glslShader.uniformSetter;
                this.source = {
                    fragment: glslShader.source, vertex: this.createVertexShader(vsRequest, vsDataResult, spaceInfo)
                }
                if (scene.deferred) {
                    cacheEntry.signatures = workSet.getProcessingData("colorClosureSignatures");
                }
                if (Options.getValue("shadejs-cache"))
                    c_jsShaderCache[jsShaderKey] = cacheEntry;
            } catch (e) {
                SystemNotifier.sendEvent('shadejs', {
                    shadejsType: "error", event: e, code: this.sourceTemplate
                });

                var errorMessage = "Shade.js Compile Error:\n" + e.message + "\n------------\n" + "Shader Source:" + "\n------------\n" + XML3D.debug.formatSourceCode(this.sourceTemplate);
                throw new Error(errorMessage);
            }
        }
        this.source = {
            fragment: cacheEntry.source, vertex: this.createVertexShader(vsRequest, vsDataResult, cacheEntry.spaceInfo)
        }
        this.uniformSetter = cacheEntry.uniformSetter;
        if (scene.deferred) {
            scene.colorClosureSignatures.push.apply(scene.colorClosureSignatures, cacheEntry.signatures);
        }

        // TODO: Handle errors.
        XML3D.debug.logDebug(this.source.vertex);
        XML3D.debug.logDebug(this.source.fragment);

        SystemNotifier.sendEvent('shadejs', {
            shadejsType: "success", vertexShader: this.source.vertex, fragmentShader: this.source.fragment
        });

        return true;
    },

    createVertexShader: function (vsRequest, vsDataResult, spaceInfo) {
        var vsConfig = vsRequest.getConfig();
        var names = vsDataResult.outputNames;
        for (var i = 0; i < names.length; ++i) {
            channelVsAttribute(vsConfig, names[i], spaceInfo);
        }
        vsConfig.addInputParameter(XC.DATA_TYPE.FLOAT4X4, "modelViewProjectionMatrix", true);
        vsConfig.addCodeFragment("gl_Position = modelViewProjectionMatrix * vec4(#I{position}, 1.0);");
        return vsRequest.getVertexShader().getGLSLCode();
    },

    setUniformVariables: function (envNames, sysNames, inputCollection) {
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

/**
 * @param {GLContext} context
 * @param {{}} globals
 * @returns {{}}
 */
function getSystemParameters(context, globals) {
    var result = getJSSystemConfiguration(context);

    // Update light parameters which vary in their size depending on number of lights defined
    ["point", "directional", "spot"].forEach(function(model) {
        var on = model + "LightOn";
        result["MAX_" + model.toUpperCase() + "LIGHTS"].staticValue = globals[on] && globals[on].length;
    });

    for (var global in globals) {
        var entry = result[global];
        if(entry && entry.staticSize) {
            var aLength = globals[global].length;
            var tupleSize = getTupleSize(entry);
            entry.staticSize = aLength / tupleSize;
        }

    }
    return result;
}

/**
 * @param {{}} desc Object type descriptor
 * @returns {number}
 */
function getTupleSize(desc) {
    if(desc.type == "array") {
        var elements = desc.elements;
        if (elements.type == "object") {
            switch(elements.kind) {
                case "texture":
                case "float": return 1;
                case "float2": return 2;
                case "float3": return 3;
                case "float4": return 4;
                case "matrix4": return 16;
                default: throw ("Unknown array element kind:" + elements.kind);
            }
        }
    }
    return 1;
}

module.exports = JSShaderClosure;

