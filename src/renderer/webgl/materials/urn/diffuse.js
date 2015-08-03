XML3D.materials.register("diffuse", {

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

        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat4 modelViewMatrix;",
        "uniform mat3 modelViewMatrixN;",
        "uniform vec3 eyePosition;",

        "void main(void) {",
        "    vec3 pos = position;",
        "    vec3 norm = normal;",

        "    gl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);",
        "    fragNormal = normalize(modelViewMatrixN * norm);",
        "    fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;",
        "    fragEyeVector = normalize(fragVertexPosition);",
        "    fragTexCoord = texcoord;",
        "    fragVertexColor = color;",
        "}"
    ].join("\n"),

    fragment : [
        "uniform float ambientIntensity;",
        "uniform vec3 diffuseColor;",
        "uniform vec3 emissiveColor;",
        "uniform float transparency;",
        "uniform mat4 viewMatrix;",
        "uniform bool useVertexColor;",

        "#if HAS_EMISSIVETEXTURE",
        "uniform sampler2D emissiveTexture;",
        "#endif",
        "#if HAS_DIFFUSETEXTURE",
        "uniform sampler2D diffuseTexture;",
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
        "uniform float spotLightCosCutoffAngle[MAX_SPOTLIGHTS];",
        "uniform float spotLightCosSoftCutoffAngle[MAX_SPOTLIGHTS];",
        "uniform float spotLightSoftness[MAX_SPOTLIGHTS];",
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

        "  #if MAX_POINTLIGHTS > 0",
        "    for (int i=0; i<MAX_POINTLIGHTS; i++) {",
        "      if (!pointLightOn[i])",
        "         continue;",
        "      vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
        "      vec3 L = lPosition.xyz - fragVertexPosition;",
        "      float dist = length(L);",
        "      L = normalize(L);",
        "      float atten = 1.0 / (pointLightAttenuation[i].x + pointLightAttenuation[i].y * dist + pointLightAttenuation[i].z * dist * dist);",
        "      vec3 Idiff = pointLightIntensity[i] * objDiffuse * max(dot(fragNormal,L),0.0);",
        "      color = color + atten*Idiff;",
        "    }",
        "  #endif",

        "#if MAX_DIRECTIONALLIGHTS > 0",
        "  for (int i=0; i<MAX_DIRECTIONALLIGHTS; i++) {",
        "      if (!directionalLightOn[i])",
        "         continue;",
        "    vec4 lDirection = viewMatrix * vec4(directionalLightDirection[i], 0.0);",
        "    vec3 L =  normalize(-lDirection.xyz);",
        "    vec3 Idiff = directionalLightIntensity[i] * objDiffuse * max(dot(fragNormal,L),0.0);",
        "    color = color + Idiff;",
        "  }",
        "#endif",

        "#if MAX_SPOTLIGHTS > 0",
        "  for (int i=0; i<MAX_SPOTLIGHTS; i++) {",
        "      if (!spotLightOn[i])",
        "         continue;",
        "    vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );",
        "    vec3 L = lPosition.xyz - fragVertexPosition;",
        "    float dist = length(L);",
        "    L = normalize(L);",
        "    float atten = 1.0 / (spotLightAttenuation[i].x + spotLightAttenuation[i].y * dist + spotLightAttenuation[i].z * dist * dist);",
        "    vec3 Idiff = spotLightIntensity[i] * objDiffuse * max(dot(fragNormal,L),0.0);",
        "    vec4 lDirection = viewMatrix * vec4(-spotLightDirection[i], 0.0);",
        "    vec3 D = normalize(lDirection.xyz);",
        "    float angle = dot(L, D);",
        "    if(angle > spotLightCosCutoffAngle[i]) {",
        "       float softness = 1.0;",
        "       if (angle < spotLightCosSoftCutoffAngle[i])",
        "           softness = (angle - spotLightCosCutoffAngle[i]) /  (spotLightCosSoftCutoffAngle[i] -  spotLightCosCutoffAngle[i]);",
        "       color += atten * softness * Idiff;",
        "    }",
        "  }",
        "#endif",

        "  gl_FragColor = vec4(color, alpha);",
        "}"
    ].join("\n"),

    addDirectives: function(directives, lights, params) {
        ["point", "directional", "spot"].forEach(function (type) {
            var numLights = lights.getModelCount(type);
            directives.push("MAX_" + type.toUpperCase() + "LIGHTS " + numLights);
        });
        directives.push("HAS_DIFFUSETEXTURE " + ('diffuseTexture' in params ? "1" : "0"));
        directives.push("HAS_EMISSIVETEXTURE " + ('emissiveTexture' in params ? "1" : "0"));
    },
    hasTransparency: function(params) {
        return params.transparency && params.transparency.getValue()[0] > 0.001;
    },
    uniforms: {
        diffuseColor    : [1.0, 1.0, 1.0],
        emissiveColor   : [0.0, 0.0, 0.0],
        transparency    : 0.0,
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
