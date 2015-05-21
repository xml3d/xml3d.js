var GLContext = require("../../base/context.js");
var singleton = null;

var SYSTEM_CONTEXT_TEMPLATE =  {
        "coords": {"type": "object", "kind": "float3", "source": "uniform"},
        "cameraPosition": {"type": "object", "kind": "float3", "source": "uniform"},
        "viewMatrix": {"type": "object", "kind": "matrix4", "source": "uniform"},
        "viewInverseMatrix": {"type": "object", "kind": "matrix4", "source": "uniform"},
        "modelMatrix": {"type": "object", "kind": "matrix4", "source": "uniform"},
        "modelViewMatrix": {"type": "object", "kind": "matrix4", "source": "uniform"},
        "modelViewProjectionMatrix": {"type": "object", "kind": "matrix4", "source": "uniform"},
        "modelMatrixN": {"type": "object", "kind": "matrix3", "source": "uniform"},
        "modelViewMatrixN": {"type": "object", "kind": "matrix3", "source": "uniform"},

        "pointLightOn": {"type": "array", "elements": {"type": "boolean"}, "staticSize": 5, "source": "uniform"},
        "pointLightAttenuation": {
            "type": "array", "elements": {"type": "object", "kind": "float3"}, "staticSize": 5, "source": "uniform"
        },
        "pointLightIntensity": {
            "type": "array", "elements": {"type": "object", "kind": "float3"}, "staticSize": 5, "source": "uniform"
        },
        "pointLightPosition": {
            "type": "array", "elements": {"type": "object", "kind": "float3"}, "staticSize": 5, "source": "uniform"
        },
        "pointLightCastShadow": {
            "type": "array", "elements": {"type": "boolean"}, "staticSize": 5, "source": "uniform"
        },
        "pointLightShadowBias": {
            "type": "array", "elements": {"type": "number"}, "staticSize": 5, "source": "uniform"
        },
        "pointLightShadowMap": {
            "type": "array", "elements": {"type": "object", "kind": "texture"}, "staticSize": 5, "source": "uniform"
        },
        "pointLightMatrix": {
            "type": "array",
            "elements": {"type": "object", "kind": "matrix4"},
            "staticSize": 5,
            "source": "uniform"
        },
        "pointLightProjection": {
            "type": "array",
            "elements": {"type": "object", "kind": "matrix4"},
            "staticSize": 5,
            "source": "uniform"
        },
        "pointLightNearFar": {
            "type": "array",
            "elements": {"type": "object", "kind": "float2"},
            "staticSize": 5,
            "source": "uniform"
        },

        "directionalLightOn": {"type": "array", "elements": {"type": "boolean"}, "staticSize": 5, "source": "uniform"},
        "directionalLightIntensity": {
            "type": "array", "elements": {"type": "object", "kind": "float3"}, "staticSize": 5, "source": "uniform"
        },
        "directionalLightDirection": {
            "type": "array", "elements": {"type": "object", "kind": "float3"}, "staticSize": 5, "source": "uniform"
        },
        "directionalLightCastShadow": {
            "type": "array", "elements": {"type": "boolean"}, "staticSize": 5, "source": "uniform"
        },
        "directionalLightShadowBias": {
            "type": "array", "elements": {"type": "number"}, "staticSize": 5, "source": "uniform"
        },
        "directionalLightShadowMap": {
            "type": "array", "elements": {"type": "object", "kind": "texture"}, "staticSize": 5, "source": "uniform"
        },
        "directionalLightMatrix": {
            "type": "array",
            "elements": {"type": "object", "kind": "matrix4"},
            "staticSize": 5,
            "source": "uniform"
        },

        "spotLightOn": {"type": "array", "elements": {"type": "boolean"}, "staticSize": 5, "source": "uniform"},
        "spotLightAttenuation": {
            "type": "array", "elements": {"type": "object", "kind": "float3"}, "staticSize": 5, "source": "uniform"
        },
        "spotLightIntensity": {
            "type": "array", "elements": {"type": "object", "kind": "float3"}, "staticSize": 5, "source": "uniform"
        },
        "spotLightPosition": {
            "type": "array", "elements": {"type": "object", "kind": "float3"}, "staticSize": 5, "source": "uniform"
        },
        "spotLightDirection": {
            "type": "array", "elements": {"type": "object", "kind": "float3"}, "staticSize": 5, "source": "uniform"
        },
        "spotLightCosFalloffAngle": {
            "type": "array", "elements": {"type": "number"}, "staticSize": 5, "source": "uniform"
        },
        "spotLightCosSoftFalloffAngle": {
            "type": "array", "elements": {"type": "number"}, "staticSize": 5, "source": "uniform"
        },
        "spotLightCastShadow": {
            "type": "array", "elements": {"type": "boolean"}, "staticSize": 5, "source": "uniform"
        },
        "spotLightShadowBias": {
            "type": "array", "elements": {"type": "number"}, "staticSize": 5, "source": "uniform"
        },
        "spotLightShadowMap": {
            "type": "array", "elements": {"type": "object", "kind": "texture"}, "staticSize": 5, "source": "uniform"
        },
        "spotLightMatrix": {
            "type": "array",
            "elements": {"type": "object", "kind": "matrix4"},
            "staticSize": 5,
            "source": "uniform"
        },
        // "ssaoMap": {"type": "object", "kind": "texture", "source": "uniform"},
        "environment": {"type": "object", "kind": "texture", "source": "uniform"}
};

function createSystemConfiguration(context) {
    var result = SYSTEM_CONTEXT_TEMPLATE;
    var ext = context.getExtensionByName(GLContext.EXTENSIONS.STANDARD_DERIVATES);
    if (ext) {
        result.fwidth = {type: Shade.TYPES.FUNCTION};
        result.dx = {type: Shade.TYPES.FUNCTION};
        result.dy = {type: Shade.TYPES.FUNCTION};
    }
    return result;
}


module.exports = function (context) {
    if (!singleton) {
        singleton = createSystemConfiguration(context);
    }
    return singleton;
};



