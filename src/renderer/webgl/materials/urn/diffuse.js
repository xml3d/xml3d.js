var fs = require('fs');

XML3D.materials.register("diffuse", {

    vertex : fs.readFileSync(__dirname + '/glsl/diffuse.vert.glsl', 'utf-8'),

    fragment : fs.readFileSync(__dirname + '/glsl/diffuse.frag.glsl', 'utf-8'),

    addDirectives: function(directives, lights, params) {
        ["point", "directional", "spot"].forEach(function (type) {
            var numLights = lights.getModelCount(type);
            directives.push("MAX_" + type.toUpperCase() + "LIGHTS " + numLights);
        });
        directives.push("HAS_DIFFUSETEXTURE " + ('diffuseTexture' in params ? "1" : "0"));
        directives.push("HAS_EMISSIVETEXTURE " + ('emissiveTexture' in params ? "1" : "0"));
    },
    hasTransparency: function(params) {
        return params.opacity && params.opacity.getValue()[0] < 1;
    },
    uniforms: {
        diffuseColor    : [1.0, 1.0, 1.0],
        emissiveColor   : [0.0, 0.0, 0.0],
        opacity         : 1.0,
        ambientIntensity: 0.0,
        useVertexColor : false
    },
    samplers: {
        diffuseTexture : null,
        emissiveTexture : null
    },
    attributes: {
        normal : {
            required: true
        },
        texcoord: null,
        color: null
    }
});
