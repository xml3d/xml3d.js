
XML3D.shaders.register("diffuse", {
    vertex : [
        "attribute vec3 position;",
        "attribute vec3 normal;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",

        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat4 modelViewMatrix;",
        "uniform mat3 normalMatrix;",
        "uniform vec3 eyePosition;",

        "void main(void) {",
        "    vec3 pos = position;",
        "    vec3 norm = normal; //~",

        "    gl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);",
        "    fragNormal = normalize(normalMatrix * norm);",
        "    fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;",
        "    fragEyeVector = normalize(fragVertexPosition);",
        "}"
    ].join("\n"),

    fragment : [
        "#ifdef GL_ES",
          "precision highp float;",
        "#endif",

        "uniform vec3 diffuseColor;",
        "uniform vec3 emissiveColor;",
        "uniform float ambientIntensity;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",

        "#if MAX_POINTLIGHTS > 0",
        "uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS];",
        "uniform vec3 pointLightPosition[MAX_POINTLIGHTS];",
        "uniform vec3 pointLightIntensity[MAX_POINTLIGHTS];",
        "uniform vec3 pointLightVisibility[MAX_POINTLIGHTS];",
        "#endif",

        "void main(void) {",
        "  vec3 color = emissiveColor + ambientIntensity * diffuseColor;",
        "  #if MAX_POINTLIGHTS > 0",
        "      for (int i=0; i<MAX_POINTLIGHTS; i++) {",
        "          vec3 L = pointLightPosition[i] - fragVertexPosition;",
        "          vec3 N = fragNormal;",
        "          float dist = length(L);",
        "          L = normalize(L);",
        "          float atten = 1.0 / (pointLightAttenuation[i].x + pointLightAttenuation[i].y * dist + pointLightAttenuation[i].z * dist * dist);",
        "          vec3 Idiff = pointLightIntensity[i] * max(dot(N,L),0.0) * diffuseColor ;",
        "          color = color + (atten*Idiff) * pointLightVisibility[i];",
        "      }",
        "  #endif",
        "  gl_FragColor = vec4(color, 1.0);",
        "}"
    ].join("\n")
});


XML3D.shaders.register("textureddiffuse", {
        vertex : [

        "attribute vec2 texcoord;",
        "attribute vec3 position;",
        "attribute vec3 normal;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",
        "varying vec2 fragTexCoord;",

        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat4 modelViewMatrix;",
        "uniform mat3 normalMatrix;",
        "uniform vec3 eyePosition;",

        "void main(void) {",
        "    vec2 tex = texcoord;",
        "    vec3 pos = position;",
        "    vec3 norm = normal; //~",

        "    gl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);",
        "    fragNormal = normalize(normalMatrix * norm);",
        "    fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;",
        "    fragEyeVector = normalize(fragVertexPosition);",
        "    fragTexCoord = tex;",
        "}"
    ].join("\n"),

    fragment : [
        "#ifdef GL_ES",
          "precision highp float;",
        "#endif",

        "uniform vec3 diffuseColor;",
        "uniform sampler2D diffuseTexture;",
        "uniform vec3 emissiveColor;",
        "uniform float ambientIntensity;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",
        "varying vec2 fragTexCoord;",

        "#if MAX_POINTLIGHTS > 0",
        "uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS];",
        "uniform vec3 pointLightPosition[MAX_POINTLIGHTS];",
        "uniform vec3 pointLightIntensity[MAX_POINTLIGHTS];",
        "uniform vec3 pointLightVisibility[MAX_POINTLIGHTS];",
        "#endif",

        "void main(void) {",
        "  #if MAX_POINTLIGHTS > 0",
        "  vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);",
        "      for (int i=0; i<MAX_POINTLIGHTS; i++) {",
        "          vec3 L = pointLightPosition[i] - fragVertexPosition;",
        "  #if MAXLIGHTS > 0",
        "          vec3 N = fragNormal;",
        "          float dist = length(L);",
        "          L = normalize(L);",
        "          float atten = 1.0 / (pointLightAttenuation[i].x + pointLightAttenuation[i].y * dist + pointLightAttenuation[i].z * dist * dist);",
        "          vec3 Idiff = pointLightIntensity[i] * max(dot(N,L),0.0) * texDiffuse.xyz;",
        "          color = color + (atten*Idiff) * pointLightVisibility[i];",
        "      }",
        "  #endif",
        "  gl_FragColor = vec4(color, 1.0);",
        "}"
    ].join("\n")
});


XML3D.shaders.register("diffusevcolor", {
        vertex : [

        "attribute vec3 position;",
        "attribute vec3 normal;",
        "attribute vec3 color;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",
        "varying vec3 fragVertexColor;",

        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat4 modelViewMatrix;",
        "uniform mat3 normalMatrix;",
        "uniform vec3 eyePosition;",

        "void main(void) {",
        "    vec3 pos = position;",
        "    vec3 norm = normal; //~",

        "    gl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);",
        "    fragNormal = normalize(normalMatrix * norm);",
        "    fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;",
        "    fragEyeVector = normalize(fragVertexPosition);",
        "    fragVertexColor = color;",
        "}"
    ].join("\n"),

    fragment : [
        "#ifdef GL_ES",
          "precision highp float;",
        "#endif",

        "uniform vec3 diffuseColor;",
        "uniform vec3 emissiveColor;",
        "uniform float ambientIntensity;",
        "uniform float transparency;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",
        "varying vec3 fragVertexColor;",

        "#if MAX_POINTLIGHTS > 0",
        "uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS];",
        "uniform vec3 pointLightPosition[MAX_POINTLIGHTS];",
        "uniform vec3 pointLightIntensity[MAX_POINTLIGHTS];",
        "uniform vec3 pointLightVisibility[MAX_POINTLIGHTS];",
        "#endif",

        "void main(void) {",
        "  if (transparency > 0.95) discard;",
        "  #if MAX_POINTLIGHTS > 0",
        "      for (int i=0; i<MAX_POINTLIGHTS; i++) {",
        "          vec3 L = pointLightPosition[i] - fragVertexPosition;",
        "          vec3 N = fragNormal;",
        "          float dist = length(L);",
        "          L = normalize(L);",
        "          float atten = 1.0 / (pointLightAttenuation[i].x + pointLightAttenuation[i].y * dist + pointLightAttenuation[i].z * dist * dist);",
        "          vec3 Idiff = pointLightIntensity[i] * max(dot(N,L),0.0) * fragVertexColor ;",
        "          color = color + (atten*Idiff) * pointLightVisibility[i];",
        "      }",
        "  #endif",
        "  gl_FragColor = vec4(color, 1.0);",
        "}"
     ].join("\n")
});
