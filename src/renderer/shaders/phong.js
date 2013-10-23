XML3D.shaders.register("phong", {

    vertex : [
        "attribute vec3 position;",
        "attribute vec3 normal;",
        "attribute vec3 color;",
        "attribute vec2 texcoord;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",
        "varying vec2 fragTexCoord;",
        "varying vec3 fragVertexColor;",
        "#if MAX_SPOTLIGHTS > 0 && HAS_SPOTLIGHT_SHADOWMAPS",
        "varying vec4 spotLightShadowMapCoord[ MAX_SPOTLIGHTS ];",
        "uniform mat4 spotLightMatrix[ MAX_SPOTLIGHTS ];",
        "#endif",


        "uniform mat4 modelMatrix;",
        "uniform mat4 modelViewMatrix;",
        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat3 normalMatrix;",
        "uniform vec3 eyePosition;",

        "void main(void) {",
        "    vec3 pos = position;",
        "    vec3 norm = normal;",

        "    gl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);",
        "    fragNormal = normalize(normalMatrix * norm);",
        "    fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;",
        "    fragEyeVector = normalize(fragVertexPosition);",
        "    fragTexCoord = texcoord;",
        "    fragVertexColor = color;",
        "#if MAX_SPOTLIGHTS > 0 && HAS_SPOTLIGHT_SHADOWMAPS",
        "    vec4 worldPosition = modelMatrix * vec4(position, 1.0);",
        "    for(int i = 0; i < MAX_SPOTLIGHTS; i++) {",
        "      spotLightShadowMapCoord[i] = spotLightMatrix[i] * worldPosition;",
        "    }",
        "#endif",
        "}"
    ].join("\n"),

    fragment : [
        "uniform float ambientIntensity;",
        "uniform vec3 diffuseColor;",
        "uniform vec3 emissiveColor;",
        "uniform float shininess;",
        "uniform vec3 specularColor;",
        "uniform float transparency;",
        "uniform mat4 viewMatrix;",
        "uniform bool useVertexColor;",

        "#if HAS_EMISSIVETEXTURE",
        "uniform sampler2D emissiveTexture;",
        "#endif",
        "#if HAS_DIFFUSETEXTURE",
        "uniform sampler2D diffuseTexture;",
        "#endif",
        "#if HAS_SPECULARTEXTURE",
        "uniform sampler2D specularTexture;",
        "#endif",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",
        "varying vec2 fragTexCoord;",
        "varying vec3 fragVertexColor;",

        "#if MAX_POINTLIGHTS > 0",
        "uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS];",
        "uniform vec3 pointLightPosition[MAX_POINTLIGHTS];",
        "uniform vec3 pointLightIntensity[MAX_POINTLIGHTS];",
        "uniform bool pointLightOn[MAX_POINTLIGHTS];",
        "#endif",

        "#if MAX_DIRECTIONALLIGHTS > 0",
        "uniform vec3 directionalLightDirection[MAX_DIRECTIONALLIGHTS];",
        "uniform vec3 directionalLightIntensity[MAX_DIRECTIONALLIGHTS];",
        "uniform bool directionalLightOn[MAX_DIRECTIONALLIGHTS];",
        "#endif",

        "#if MAX_SPOTLIGHTS > 0",
        "uniform vec3 spotLightAttenuation[MAX_SPOTLIGHTS];",
        "uniform vec3 spotLightPosition[MAX_SPOTLIGHTS];",
        "uniform vec3 spotLightIntensity[MAX_SPOTLIGHTS];",
        "uniform bool spotLightOn[MAX_SPOTLIGHTS];",
        "uniform vec3 spotLightDirection[MAX_SPOTLIGHTS];",
        "uniform float spotLightCosFalloffAngle[MAX_SPOTLIGHTS];",
        "uniform float spotLightCosSoftFalloffAngle[MAX_SPOTLIGHTS];",
        "uniform float spotLightSoftness[MAX_SPOTLIGHTS];",
        "uniform bool spotLightCastShadow[MAX_SPOTLIGHTS];",
            "#if HAS_SPOTLIGHT_SHADOWMAPS",
            "uniform sampler2D spotLightShadowMap[MAX_SPOTLIGHTS];",
            "uniform float spotLightShadowBias[MAX_SPOTLIGHTS];",
            "varying vec4 spotLightShadowMapCoord[MAX_SPOTLIGHTS];",

            "float unpackDepth( const in vec4 rgba_depth ) {",
            "  const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );",
            "  float depth = dot( rgba_depth, bit_shift );",
            "  return depth;",
            "} ",
            "#endif",
        "#endif",

        "void main(void) {",
        "  float alpha =  max(0.0, 1.0 - transparency);",
        "  vec3 objDiffuse = diffuseColor;",
        "  if(useVertexColor)",
        "    objDiffuse *= fragVertexColor;",
        "  #if HAS_DIFFUSETEXTURE",
        "    vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);",
        "    alpha *= texDiffuse.a;",
        "    objDiffuse *= texDiffuse.rgb;",
        "  #endif",
        "  if (alpha < 0.05) discard;",
        "  #if HAS_EMISSIVETEXTURE",
        "    vec3 color = emissiveColor * texture2D(emissiveTexture, fragTexCoord).rgb + (ambientIntensity * objDiffuse);",
        "  #else",
        "    vec3 color = emissiveColor + (ambientIntensity * objDiffuse);",
        "  #endif",
        "  vec3 objSpecular = specularColor;",
        "  #if HAS_SPECULARTEXTURE",
        "    objSpecular = objSpecular * texture2D(specularTexture, fragTexCoord).rgb;",
        "  #endif",

        "#if MAX_POINTLIGHTS > 0",
        "  for (int i = 0; i < MAX_POINTLIGHTS; i++) {",
        "    if(!pointLightOn[i])",
        "      continue;",
        "    vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
        "    vec3 L = lPosition.xyz - fragVertexPosition;",
        "    float dist = length(L);",
        "    L = normalize(L);",
        "    vec3 R = normalize(reflect(L,fragNormal));",
        "    float atten = 1.0 / (pointLightAttenuation[i].x + pointLightAttenuation[i].y * dist + pointLightAttenuation[i].z * dist * dist);",
        "    vec3 Idiff = pointLightIntensity[i] * objDiffuse * max(dot(fragNormal,L),0.0);",
        "    vec3 Ispec = pointLightIntensity[i] * objSpecular * pow(max(dot(R,fragEyeVector),0.0), shininess*128.0);",
        "    color = color + (atten*(Idiff + Ispec));",
        "  }",
        "#endif",

        "#if MAX_DIRECTIONALLIGHTS > 0",
        "  for (int i=0; i<MAX_DIRECTIONALLIGHTS; i++) {",
        "    if(!directionalLightOn[i])",
        "      continue;",
        "    vec4 lDirection = viewMatrix * vec4(directionalLightDirection[i], 0.0);",
        "    vec3 L =  normalize(-lDirection.xyz);",
        "    vec3 R = normalize(reflect(L,fragNormal));",
        "    vec3 Idiff = directionalLightIntensity[i] * objDiffuse * max(dot(fragNormal,L),0.0);",
        "    vec3 Ispec = directionalLightIntensity[i] * objSpecular * pow(max(dot(R,fragEyeVector),0.0), shininess*128.0);",
        "    color = color + ((Idiff + Ispec));",
        "  }",
        "#endif",

        "#if MAX_SPOTLIGHTS > 0",
        "  for (int i=0; i<MAX_SPOTLIGHTS; i++) {",
        "    if(spotLightOn[i]) {",
        "  #if HAS_SPOTLIGHT_SHADOWMAPS",
        "         bool lightIsVisible = true;",
        "         if(spotLightCastShadow[i]){",
        "             lightIsVisible = false;",
        "             vec3 shadowCoord = spotLightShadowMapCoord[i].xyz / spotLightShadowMapCoord[i].w;",
        "             bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );",
        "             bool inFrustum = all( inFrustumVec );",
        "             if(inFrustum && (shadowCoord.z <= 1.0)) {",
        "               float depth = unpackDepth(texture2D(spotLightShadowMap[i], shadowCoord.xy));",
        "               lightIsVisible = shadowCoord.z-depth <= spotLightShadowBias[i];",
        "             }",
        "          }",
        "          if(lightIsVisible){",
        "  #endif",
        "    vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );",
        "    vec3 L = lPosition.xyz - fragVertexPosition;",
        "    float dist = length(L);",
        "    L = normalize(L);",
        "    vec3 R = normalize(reflect(L,fragNormal));",
        "    float atten = 1.0 / (spotLightAttenuation[i].x + spotLightAttenuation[i].y * dist + spotLightAttenuation[i].z * dist * dist);",
        "    vec3 Idiff = spotLightIntensity[i] * objDiffuse * max(dot(fragNormal,L),0.0);",
        "    vec3 Ispec = spotLightIntensity[i] * objSpecular * pow(max(dot(R,fragEyeVector),0.0), shininess*128.0);",
        "    vec4 lDirection = viewMatrix * vec4(-spotLightDirection[i], 0.0);",
        "    vec3 D = normalize(lDirection.xyz);",
        "    float angle = dot(L, D);",
        "    if(angle > spotLightCosFalloffAngle[i]) {",
        "       float softness = 1.0;",
        "       //if (angle < spotLightCosSoftFalloffAngle[i])",
        "       //    softness = (angle - spotLightCosFalloffAngle[i]) /  (spotLightCosSoftFalloffAngle[i] -  spotLightCosFalloffAngle[i]);",
        "       color += atten*softness*(Idiff + Ispec);",
        "    }",
        "  #if HAS_SPOTLIGHT_SHADOWMAPS",
        "   }",
        "  #endif",
        "    } ", // spotlight on
        "  }", // light loop
        "#endif",

        "  gl_FragColor = vec4(color, alpha);",
        "}"
    ].join("\n"),

    addDirectives: function(directives, lights, params) {
        var pointLights = lights.point ? lights.point.length : 0;
        var directionalLights = lights.directional ? lights.directional.length : 0;
        var spotLights = lights.spot ? lights.spot.length : 0;
        directives.push("MAX_POINTLIGHTS " + pointLights);
        directives.push("MAX_DIRECTIONALLIGHTS " + directionalLights);
        directives.push("MAX_SPOTLIGHTS " + spotLights);
        directives.push("HAS_SPOTLIGHT_SHADOWMAPS " + (!lights.spot.every(function(light) { return !light.castShadow; }) | 0));
        directives.push("HAS_DIFFUSETEXTURE " + ('diffuseTexture' in params ? "1" : "0"));
        directives.push("HAS_SPECULARTEXTURE " + ('specularTexture' in params ? "1" : "0"));
        directives.push("HAS_EMISSIVETEXTURE " + ('emissiveTexture' in params ? "1" : "0"));
    },
    hasTransparency: function(params) {
        return params.transparency && params.transparency.getValue()[0] > 0.001;
    },
    uniforms: {
        diffuseColor    : [1.0, 1.0, 1.0],
        emissiveColor   : [0.0, 0.0, 0.0],
        specularColor   : [0.0, 0.0, 0.0],
        transparency    : 0.0,
        shininess       : 0.2,
        ambientIntensity: 0.0,
        useVertexColor : false
    },

    samplers: {
        diffuseTexture : null,
        emissiveTexture : null,
        specularTexture : null,
        spotLightShadowMap : null
    },

    attributes: {
        normal : {
            required: true
        },
        texcoord: null,
        color: null
    }
});
