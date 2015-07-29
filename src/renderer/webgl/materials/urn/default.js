var fs = require('fs');

XML3D.materials.register("default", {

	vertex: fs.readFileSync(__dirname + "/default-vertex-shader.glsl", "utf8"),
	fragment: fs.readFileSync(__dirname + "/default-fragment-shader.glsl", "utf8"),

	addDirectives: function(directives, lights, params) {
		directives.push("#extension GL_OES_standard_derivatives : enable");
		directives.push("PI " + Math.PI);

		directives.push("HAS_NORMAL " + ("normal" in params ? "1" : "0"));
		directives.push("HAS_TANGENT " + ("tangent" in params ? "1" : "0"));
		directives.push("HAS_TEXCOORD " + ("texcoord" in params ? "1" : "0"));
		directives.push("HAS_COLOR " + ("color" in params ? "1" : "0"));

		["point", "directional", "spot"].forEach(function (type) {
			var numLights = lights.getModelCount(type);
			var castShadows = false;
			if(numLights) {
				castShadows = Array.prototype.some.call(lights.getModelEntry(type).parameters["castShadow"], function (value) {
					return value;
				});
			}
			directives.push("MAX_" + type.toUpperCase() + "_LIGHTS " + numLights);
			directives.push("HAS_" + type.toUpperCase() + "_LIGHT_SHADOWMAPS " + (castShadows ? 1 : 0));
		});

		directives.push("HAS_SSAO_MAP " + (XML3D.options.getValue("renderer-ssao") ? "1" : "0"));

		directives.push("HAS_BASE_COLOR_TEXTURE " + ("baseColorTexture" in params ? "1" : "0"));
		directives.push("HAS_SUBSURFACE_TEXTURE " + ("subsurfaceTexture" in params ? "1" : "0"));
		directives.push("HAS_METALLIC_TEXTURE " + ("metallicTexture" in params ? "1" : "0"));
		directives.push("HAS_SPECULAR_TEXTURE " + ("specularTexture" in params ? "1" : "0"));
		directives.push("HAS_SPECULARTINT_TEXTURE " + ("specularTintTexture" in params ? "1" : "0"));
		directives.push("HAS_ROUGHNESS_TEXTURE " + ("roughnessTexture" in params ? "1" : "0"));
		directives.push("HAS_ANISOTROPIC_TEXTURE " + ("anisotropicTexture" in params ? "1" : "0"));
		directives.push("HAS_SHEEN_TEXTURE " + ("sheenTexture" in params ? "1" : "0"));
		directives.push("HAS_SHEENTINT_TEXTURE " + ("sheenTintTexture" in params ? "1" : "0"));
		directives.push("HAS_CLEARCOAT_TEXTURE " + ("clearCoatTexture" in params ? "1" : "0"));
		directives.push("HAS_CLEARCOATGLOSS_TEXTURE " + ("clearCoatGlossTexture" in params ? "1" : "0"));
		directives.push("HAS_CLEARCOATTHICKNESS_TEXTURE " + ("clearCoatThicknessTexture" in params ? "1" : "0"));
		directives.push("HAS_OPACITY_TEXTURE " + ("opacityTexture" in params ? "1" : "0"));

		directives.push("HAS_NORMAL_MAP " + ("normalMap" in params ? "1" : "0"));
	},

	hasTransparency: function(params) {
		return (params.opacity && params.opacity.getValue()[0] < 1) || ("opacityTexture" in params);
	},

	uniforms: {
		baseColor: [1.0, 1.0, 1.0],
		subsurface: 0,
		metallic: 0,
		specular: 0.5,
		specularTint: 0,
		roughness: 0.5,
		anisotropic: 0.0,
		sheen: 0,
		sheenTint: 0.5,
		clearCoat: 0,
		clearCoatGloss: 1,
		clearCoatThickness: 1,
		opacity: 1.0,
		ambientIntensity: 0.0
	},
	samplers: {
		baseColorTexture: null,
		subsurfaceTexture: null,
		metallicTexture: null,
		specularTexture: null,
		specularTintTexture: null,
		roughnessTexture: null,
		anisotropicTexture: null,
		sheenTexture: null,
		sheenTintTexture: null,
		clearCoatTexture: null,
		clearCoatGlossTexture: null,
		clearCoatThicknessTexture: null,
		opacityTexture: null,
		normalMap: null
	},
	attributes: {
		normal: null,
		tangent: null,
		texcoord: null,
		color: null
	}
});
