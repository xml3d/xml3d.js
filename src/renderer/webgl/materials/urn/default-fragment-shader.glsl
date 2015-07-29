varying vec3 fragWorldPosition;
varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec3 fragTangent;
varying vec3 fragBitangent;
varying vec3 fragColor;
varying vec2 fragTexcoord;

uniform vec3 coords;
uniform mat4 viewMatrix;
uniform sampler2D ssaoMap;

#if MAX_POINT_LIGHTS
	uniform vec3 pointLightPosition[MAX_POINT_LIGHTS];
	uniform vec3 pointLightIntensity[MAX_POINT_LIGHTS];
	uniform vec3 pointLightAttenuation[MAX_POINT_LIGHTS];
	uniform bool pointLightOn[MAX_POINT_LIGHTS];
	uniform bool pointLightCastShadow[MAX_POINT_LIGHTS];
#endif

#if MAX_SPOT_LIGHTS
	uniform vec3 spotLightPosition[MAX_SPOT_LIGHTS];
	uniform vec3 spotLightDirection[MAX_SPOT_LIGHTS];
	uniform vec3 spotLightIntensity[MAX_SPOT_LIGHTS];
	uniform vec3 spotLightAttenuation[MAX_SPOT_LIGHTS];
	uniform float spotLightCosFalloffAngle[MAX_SPOT_LIGHTS];
	uniform float spotLightCosSoftFalloffAngle[MAX_SPOT_LIGHTS];
	uniform float spotLightSoftness[MAX_SPOT_LIGHTS];
	uniform bool spotLightOn[MAX_SPOT_LIGHTS];
	uniform bool spotLightCastShadow[MAX_SPOT_LIGHTS];
	#if HAS_SPOT_LIGHT_SHADOWMAPS
		uniform mat4 spotLightMatrix[MAX_SPOT_LIGHTS];
		uniform sampler2D spotLightShadowMap[MAX_SPOT_LIGHTS];
		uniform float spotLightShadowBias[MAX_SPOT_LIGHTS];
	#endif
#endif

#if MAX_DIRECTIONAL_LIGHTS
	uniform vec3 directionalLightDirection[MAX_DIRECTIONAL_LIGHTS];
	uniform vec3 directionalLightIntensity[MAX_DIRECTIONAL_LIGHTS];
	uniform bool directionalLightOn[MAX_DIRECTIONAL_LIGHTS];
	uniform bool directionalLightCastShadow[MAX_DIRECTIONAL_LIGHTS];
#endif

uniform vec3 baseColor;
uniform float subsurface;
uniform float metallic;
uniform float specular;
uniform float specularTint;
uniform float roughness;
uniform float anisotropic;
uniform float sheen;
uniform float sheenTint;
uniform float clearCoat;
uniform float clearCoatGloss;
uniform float clearCoatThickness;
uniform float ambientIntensity;
uniform float opacity;

uniform sampler2D baseColorTexture;
uniform sampler2D subsurfaceTexture;
uniform sampler2D metallicTexture;
uniform sampler2D specularTexture;
uniform sampler2D specularTintTexture;
uniform sampler2D roughnessTexture;
uniform sampler2D anisotropicTexture;
uniform sampler2D sheenTexture;
uniform sampler2D sheenTintTexture;
uniform sampler2D clearCoatTexture;
uniform sampler2D clearCoatGlossTexture;
uniform sampler2D clearCoatThicknessTexture;
uniform sampler2D opacityTexture;

uniform sampler2D normalMap;

struct TangentSpace {
	vec3 N;
	vec3 T;
	vec3 B;
};

TangentSpace getTangentSpace() {
	TangentSpace s;
	#if HAS_NORMAL
		s.N = normalize(fragNormal);
	#else
		#if GL_OES_standard_derivatives
			vec3 X = dFdx(fragPosition);
			vec3 Y = dFdy(fragPosition);
			s.N = normalize(cross(X, Y));
		#else
			#error Sorry, shader cannot be compiled because the 3D models does not have normals and GL_OES_standard_derivatives extension is not available on the device.
		#endif
	#endif

	#if HAS_TANGENT
		s.T = normalize(fragTangent);
		s.B = normalize(fragBitangent);
	#else
		s.T = normalize(cross(s.N, vec3(0.0, 0.999999, 0.000001)));
		s.B = normalize(cross(s.N, s.T));
	#endif

	return s;
}

TangentSpace normalMapping(TangentSpace original) {
	#if HAS_NORMAL_MAP && HAS_TEXCOORD
		TangentSpace perturbed;
		vec3 sample = texture2D(normalMap, fragTexcoord).rgb;
		vec3 nN = normalize((sample - 0.5) * 2.0);
		perturbed.N = normalize(original.N * nN.z + original.T * nN.y + original.B * nN.x);
		perturbed.T = normalize(original.T - perturbed.N * dot(perturbed.N, original.T));
		perturbed.B = normalize(cross(perturbed.N, perturbed.T));
		return perturbed;
	#else
		return original;
	#endif
}

vec3 linearize(const vec3 color) {
	return pow(color, vec3(2.2));
}

vec3 getBaseColor() {
	vec3 color;
	#if HAS_BASE_COLOR_TEXTURE && HAS_TEXCOORD
		color = linearize(texture2D(baseColorTexture, fragTexcoord).rgb);
	#else
		#if HAS_COLOR
			// We assume that vertex colors are already linearized
			color = fragColor;
		#else
			color = linearize(baseColor);
		#endif
	#endif

	return color;
}

float getSubsurface() {
	#if HAS_SUBSURFACE_TEXTURE && HAS_TEXCOORD
		return texture2D(subsurfaceTexture, fragTexcoord).r;
	#else
		return subsurface;
	#endif
}

float getMetallic() {
	#if HAS_METALLIC_TEXTURE && HAS_TEXCOORD
		return texture2D(metallicTexture, fragTexcoord).r;
	#else
		return metallic;
	#endif
}

float getSpecular() {
	#if HAS_SPECULAR_TEXTURE && HAS_TEXCOORD
		return texture2D(specularTexture, fragTexcoord).r;
	#else
		return specular;
	#endif
}

float getSpecularTint() {
	#if HAS_SPECULARTINT_TEXTURE && HAS_TEXCOORD
		return texture2D(specularTintTexture, fragTexcoord).r;
	#else
		return specularTint;
	#endif
}

float getRoughness() {
	#if HAS_ROUGHNESS_TEXTURE && HAS_TEXCOORD
		return texture2D(roughnessTexture, fragTexcoord).r;
	#else
		return roughness;
	#endif
}

float getAnisotropic() {
	#if HAS_ANISOTROPIC_TEXTURE && HAS_TEXCOORD
		return texture2D(anisotropicTexture, fragTexcoord).r;
	#else
		return anisotropic;
	#endif
}

float getSheen() {
	#if HAS_SHEEN_TEXTURE && HAS_TEXCOORD
		return texture2D(sheenTexture, fragTexcoord).r;
	#else
		return sheen;
	#endif
}

float getSheenTint() {
	#if HAS_SHEENTINT_TEXTURE && HAS_TEXCOORD
		return texture2D(sheenTintTexture, fragTexcoord).r;
	#else
		return sheenTint;
	#endif
}

float getClearCoat() {
	#if HAS_CLEARCOAT_TEXTURE && HAS_TEXCOORD
		return texture2D(clearCoatTexture, fragTexcoord).r;
	#else
		return clearCoat;
	#endif
}

float getClearCoatGloss() {
	#if HAS_CLEARCOATGLOSS_TEXTURE && HAS_TEXCOORD
		return texture2D(clearCoatGlossTexture, fragTexcoord).r;
	#else
		return clearCoatGloss;
	#endif
}

float getClearCoatThickness() {
	#if HAS_CLEARCOATTHICKNESS_TEXTURE && HAS_TEXCOORD
		return texture2D(clearCoatThicknessTexture, fragTexcoord).r;
	#else
		return clearCoatThickness;
	#endif
}

float getOpacity() {
	#if HAS_OPACITY_TEXTURE && HAS_TEXCOORD
		return texture2D(opacityTexture, fragTexcoord).r;
	#else
		return opacity;
	#endif
}

float getSSOA() {
	#if HAS_SSAO_MAP
		return 1.0 - texture2D(ssaoMap, gl_FragCoord.xy / coords.xy).r;
	#else
		return 1.0;
	#endif
}

struct SurfaceParameters {
	float subsurface;
	float metallic;
	float specular;
	float specularTint;
	float roughness;
	float anisotropic;
	float sheen;
	float sheenTint;
	float clearCoat;
	float clearCoatGloss;
	float clearCoatThickness;
	float opacity;
	float ssao;
};

SurfaceParameters getSurfaceParameters() {
	return SurfaceParameters(
		getSubsurface(),
		getMetallic(),
		getSpecular(),
		getSpecularTint(),
		getRoughness(),
		getAnisotropic(),
		getSheen(),
		getSheenTint(),
		getClearCoat(),
		getClearCoatGloss(),
		getClearCoatThickness(),
		getOpacity(),
		getSSOA()
	);
}

float luminance(const vec3 color) {
	return dot(vec3(0.3, 0.6, 0.1), color);
}

struct SurfaceColors {
	vec3 base;
	vec3 specular;
	vec3 sheen;
};

SurfaceColors getSurfaceColors(SurfaceParameters parameters) {
	vec3 linearBaseColor = getBaseColor();
	float luminance = luminance(linearBaseColor);
	vec3 tint = luminance > 0.0 ? linearBaseColor / luminance : vec3(1.0);
	vec3 specularColor = mix(parameters.specular * 0.8 * mix(vec3(1.0), tint, parameters.specularTint), linearBaseColor, parameters.metallic);
	vec3 sheenColor = mix(vec3(1.0), tint, parameters.sheenTint);
	return SurfaceColors(linearBaseColor, specularColor, sheenColor);
}

float square(const float x) {
	return x * x;
}

float smith(const float NdotV, const float sqrNdotV, const float sqrRoughness) {
	return 1.0 / (NdotV + sqrt(sqrNdotV + sqrRoughness - sqrNdotV * sqrRoughness));
}

vec3 lightContribution(TangentSpace original, TangentSpace perturbed, vec3 L, vec3 V, SurfaceColors colors, SurfaceParameters parameters) {
	float NdotL = dot(perturbed.N, L);
	float NdotV = dot(perturbed.N, V);

	if (NdotL < 0.0)
		return vec3(0.0);

	vec3 H = normalize(L + V);
	float HdotT = dot(H, perturbed.T);
	float HdotB = dot(H, perturbed.B);
	float NdotH = dot(perturbed.N, H);
	float LdotH = dot(L, H);

	float sqrNdotL = square(NdotL);
	float sqrNdotV = square(NdotV);
	float sqrRoughness = square(parameters.roughness);
	float sqrNdotH = square(NdotH);

	float NdotLschlick = pow(clamp(1.0 - NdotL, 0.0, 1.0), 5.0);
	float NdotVschlick = pow(clamp(1.0 - NdotV, 0.0, 1.0), 5.0);
	float LdotHschlick = pow(clamp(1.0 - LdotH, 0.0, 1.0), 5.0);

	// diffuse
	float fd90 = 0.5 + 2.0 * LdotH * LdotH * parameters.roughness;
	float diffuseContribution = mix(1.0, fd90, NdotLschlick) * mix(1.0, fd90, NdotVschlick) * parameters.ssao;
	// subsurface
	float fss90 = parameters.roughness * LdotH * LdotH;
	float fss = mix(1.0, fss90, NdotLschlick) * mix(1.0, fss90, NdotVschlick);
	float subsurfaceContribution = 1.25 * (fss * (1.0 / (NdotL + NdotV) - 0.5) + 0.5);
	vec3 diffuseColor = 1.0 / PI * mix(diffuseContribution, subsurfaceContribution, parameters.subsurface) * colors.base + LdotHschlick * parameters.sheen * colors.sheen;

	// specular
	float aspect = sqrt(1.0 - parameters.anisotropic * 0.9);
	float ax = max(0.001, sqrRoughness / aspect);
	float ay = max(0.001, sqrRoughness * aspect);
	float sqrRoughnessGeometric = square(parameters.roughness * 0.5 + 0.5);
	float Dspecular = 1.0 / (PI * ax * ay * square(square(HdotT / ax) + square(HdotB / ay) + sqrNdotH));
	float Gspecular = smith(NdotL, sqrNdotL, sqrRoughnessGeometric) * smith(NdotV, sqrNdotV, sqrRoughnessGeometric);
	vec3 specularColor = Dspecular * Gspecular * mix(colors.specular, vec3(1), LdotHschlick);

	vec3 surfaceReflectionColor = (diffuseColor * (1.0 - parameters.metallic) + specularColor) * NdotL;

	// clear coat
	vec3 clearCoatN = normalize(mix(perturbed.N, original.N, parameters.clearCoatThickness));
	float clearCoatNdotV = dot(clearCoatN, V);
	float clearCoatNdotL = dot(clearCoatN, L);
	float clearCoatNdotH = dot(clearCoatN, H);

	float clearCoatSqrNdotV = square(clearCoatNdotV);
	float clearCoatSqrNdotL = square(clearCoatNdotL);
	float clearCoatSqrNdotH = square(clearCoatNdotH);

	float clearCoatRoughness = mix(0.1, 0.001, parameters.clearCoatGloss);
	float clearCoatSqrRoughness = square(clearCoatRoughness);
	float DclearCoat = clearCoatRoughness >= 1.0 ? 1.0 / PI : (clearCoatSqrRoughness - 1.0) / (PI * log(clearCoatSqrRoughness) * (1.0 + (clearCoatSqrRoughness - 1.0) * clearCoatSqrNdotH));
	float FclearCoat = mix(0.04, 1.0, LdotHschlick);
	float GclearCoat = smith(clearCoatNdotL, clearCoatSqrNdotL, 0.25) * smith(clearCoatNdotV, clearCoatSqrNdotV, 0.25);
	float clearCoatReflection = 0.25 * parameters.clearCoat * GclearCoat * FclearCoat * DclearCoat * clearCoatNdotL;

	return max(vec3(0.0), (surfaceReflectionColor + clearCoatReflection));
}

float attenuation(const vec3 L, const vec3 attenuation) {
	float dist = length(L);
	return 1.0 / (attenuation.x + attenuation.y * dist + attenuation.z * dist * dist);
}

float unpackDepth(const vec4 rgbaDepth) {
	const vec4 bitShift = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
	float depth = dot(rgbaDepth, bitShift);
	return depth;
}

void main() {
	TangentSpace originalTangentSpace = getTangentSpace();
	TangentSpace perturbedTangentSpace = normalMapping(originalTangentSpace);
	SurfaceParameters parameters = getSurfaceParameters();
	SurfaceColors colors = getSurfaceColors(parameters);
	vec3 V = -normalize(fragPosition);

	vec3 finalColor;
	#if MAX_POINT_LIGHTS > 0
		for (int idx = 0; idx < MAX_POINT_LIGHTS; ++idx) {
			if (pointLightOn[idx]) {
				vec4 lightPosition = viewMatrix * vec4(pointLightPosition[idx], 1.0);
				vec3 L = lightPosition.xyz - fragPosition;
				float attenuation = attenuation(L, pointLightAttenuation[idx]);
				L = normalize(L);
				finalColor += lightContribution(originalTangentSpace, perturbedTangentSpace, L, V, colors, parameters) * pointLightIntensity[idx] * attenuation;
			}
		}
	#endif

	#if MAX_SPOT_LIGHTS > 0
		for (int idx = 0; idx < MAX_SPOT_LIGHTS; ++idx) {
			if (spotLightOn[idx]) {
				float shadowInfluence = 1.0;
				#if HAS_SPOT_LIGHT_SHADOWMAPS
					shadowInfluence = 0.0;
					vec4 lspos = spotLightMatrix[idx] * vec4(fragWorldPosition, 1.0);
					vec3 perspectiveDivPos = lspos.xyz / lspos.w * 0.5 + 0.5;
					float lsDepth = perspectiveDivPos.z;
					vec2 lightuv = perspectiveDivPos.xy;
					float depth = unpackDepth(texture2D(spotLightShadowMap[idx], lightuv)) + spotLightShadowBias[idx];
					if(lsDepth < depth)
						shadowInfluence = 1.0;
				#endif
				if (shadowInfluence > 0.0) {
					vec4 lightPosition = viewMatrix * vec4(spotLightPosition[idx], 1.0);
					vec3 L = lightPosition.xyz - fragPosition;
					float attenuation = attenuation(L, spotLightAttenuation[idx]);
					L = normalize(L);
					vec3 D = normalize((viewMatrix * vec4(-spotLightDirection[idx], 0.0)).xyz);
					float angle = dot(L, D);
					if (angle > spotLightCosFalloffAngle[idx]) {
						float softness = 1.0;
						if (angle < spotLightCosSoftFalloffAngle[idx])
							softness = (angle - spotLightCosFalloffAngle[idx]) / (spotLightCosSoftFalloffAngle[idx] - spotLightCosFalloffAngle[idx]);
						finalColor += lightContribution(originalTangentSpace, perturbedTangentSpace, L, V, colors, parameters) * spotLightIntensity[idx] * attenuation * softness * shadowInfluence;
					}
				}
			}
		}
	#endif

	#if MAX_DIRECTIONAL_LIGHTS > 0
		for (int idx = 0; idx < MAX_DIRECTIONAL_LIGHTS; ++idx) {
			if (directionalLightOn[idx]) {
				vec3 L = normalize((viewMatrix * vec4(-directionalLightDirection[idx], 0.0)).xyz);
				finalColor += lightContribution(originalTangentSpace, perturbedTangentSpace, L, V, colors, parameters) * directionalLightIntensity[idx];
			}
		}
	#endif

	finalColor += colors.base * ambientIntensity * parameters.ssao;

	gl_FragColor = vec4(pow(finalColor, vec3(1.0 / 2.2)), parameters.opacity);
}
