var fs = require('fs');

XML3D.materials.register("phong", {

    vertex : fs.readFileSync(__dirname + '/glsl/phong.vert.glsl', 'utf-8'),

    fragment : fs.readFileSync(__dirname + '/glsl/phong.frag.glsl', 'utf-8'),

    addDirectives: function (directives, lights, params) {
        ["point", "directional", "spot"].forEach(function (type) {
            var numLights = lights.getModelCount(type);
            var castShadows = false;
            if(numLights) {
                castShadows = Array.prototype.some.call(lights.getModelEntry(type).parameters["castShadow"], function (value) {
                    return value;
                });
            }
            directives.push("MAX_" + type.toUpperCase() + "LIGHTS " + numLights);
            directives.push("HAS_" + type.toUpperCase() + "LIGHT_SHADOWMAPS " + (castShadows ? 1 : 0));
        });

        directives.push("HAS_DIFFUSETEXTURE " + ('diffuseTexture' in params ? "1" : "0"));
        directives.push("HAS_SPECULARTEXTURE " + ('specularTexture' in params ? "1" : "0"));
        directives.push("HAS_EMISSIVETEXTURE " + ('emissiveTexture' in params ? "1" : "0"));
        directives.push("HAS_SSAOMAP " + (XML3D.options.getValue("renderer-ssao") ? "1" : "0"));
    },
    hasTransparency: function(params) {
        return params.opacity && params.opacity.getValue()[0] < 1;
    },
    uniforms: {
        diffuseColor    : [1.0, 1.0, 1.0],
        emissiveColor   : [0.0, 0.0, 0.0],
        specularColor   : [0.0, 0.0, 0.0],
        opacity         : 1.0,
        shininess       : 0.2,
        ambientIntensity: 0.0,
        useVertexColor : false
    },

    samplers: {
        diffuseTexture : null,
        emissiveTexture : null,
        specularTexture : null,
        directionalLightShadowMap : null,
        spotLightShadowMap : null,
        pointLightShadowMap : null,
		ssaoMap: null
    },

    attributes: {
        normal : {
            required: true
        },
        texcoord: null,
        color: null
    }
});
