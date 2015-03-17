var lightModels = {
    point: {
        parameters: [ "pointLightPosition", "pointLightAttenuation", "pointLightIntensity", "pointLightOn", "pointLightCastShadow", "pointLightMatrix", "pointLightShadowBias", "pointLightNearFar", "pointLightShadowMap"]
    },
    directional: {
        parameters: ["directionalLightDirection", "directionalLightIntensity", "directionalLightOn", "directionalLightCastShadow", "directionalLightMatrix", "directionalLightShadowBias", "directionalLightShadowMap"]
    },
    spot: {
        parameters: ["spotLightAttenuation", "spotLightPosition", "spotLightIntensity", "spotLightDirection", "spotLightOn", "spotLightSoftness", "spotLightCosFalloffAngle", "spotLightCosSoftFalloffAngle", "spotLightCastShadow", "spotLightMatrix", "spotLightShadowBias", "spotLightShadowMap"]
    }
};

var ALL_PARAMETERS = lightModels.point.parameters.concat(lightModels.directional.parameters).concat(lightModels.spot.parameters);

module.exports = {
    ALL_PARAMETERS: ALL_PARAMETERS
};
