

XML3D.shaders.register("phong", {
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
        "}",
    ].join("\n"),
        
    fragment: [
        "#ifdef GL_ES",
          "precision highp float;",
        "#endif",
        
        "uniform float ambientIntensity;",
        "uniform vec3 diffuseColor;",
        "uniform vec3 emissiveColor;",
        "uniform float shininess;",
        "uniform vec3 specularColor;",
        "uniform float transparency;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",

        "#if MAXLIGHTS > 0",
        "uniform vec3 lightAttenuations[MAXLIGHTS];",
        "uniform vec3 lightPositions[MAXLIGHTS];",
        "uniform vec3 lightDiffuseColors[MAXLIGHTS];",
        "uniform vec3 lightVisibility[MAXLIGHTS];",
        "#endif",

        "void main(void) {",
        "  if (transparency > 0.95) discard;",
        "  vec3 color = emissiveColor;",
        "#if MAXLIGHTS > 0",
        "  for (int i=0; i<MAXLIGHTS; i++) {",
        "    vec3 L = lightPositions[i] - fragVertexPosition;",
        "    vec3 N = fragNormal;",
        "    vec3 E = fragEyeVector;",
        "    float dist = length(L);",
        "    L = normalize(L);",
        "    vec3 R = normalize(reflect(L,N));",
        "    float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);",
        "    vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * diffuseColor ;",
        "    vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess*128.0) * lightDiffuseColors[i];",
        "    color = color + (atten*(Idiff + Ispec)) * lightVisibility[i];",
        "  }",
        "#endif",
        "  gl_FragColor = vec4(color, max(0.0, 1.0 - transparency));",
        "}"
    ].join("\n")
});

XML3D.shaders.register("texturedphong", {

    vertex : [
        "attribute vec3 position;",
        "attribute vec3 normal;",
        "attribute vec2 texcoord;",
        
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
        "    vec3 norm = normal;",
        
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

        "uniform float ambientIntensity;",
        "uniform vec3 diffuseColor;",
        "uniform vec3 emissiveColor;",
        "uniform float shininess;",
        "uniform vec3 specularColor;",
        "uniform float transparency;",
        "uniform float lightOn;",
        "uniform sampler2D diffuseTexture;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",
        "varying vec2 fragTexCoord;",

        "#if MAXLIGHTS > 0",
        "uniform vec3 lightAttenuations[MAXLIGHTS];",
        "uniform vec3 lightPositions[MAXLIGHTS];",
        "uniform vec3 lightDiffuseColors[MAXLIGHTS];",
        "uniform vec3 lightVisibility[MAXLIGHTS];",
        "#endif",
        
        "void main(void) {",
        "  vec4 color = vec4(emissiveColor, 0.0);",
        "#if MAXLIGHTS > 0",
        "      vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);",
        "      for (int i=0; i<MAXLIGHTS; i++) {",
        "          vec3 L = lightPositions[i] - fragVertexPosition;",
        "          vec3 N = fragNormal;",
        "          vec3 E = fragEyeVector;",
        "          float dist = length(L);",
        "          L = normalize(L);",
        "          vec3 R = normalize(reflect(L,N));",
        "          float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);",
        "          vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * texDiffuse.xyz * diffuseColor;",
        "          vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess*128.0) * lightDiffuseColors[i];",
        "          color += vec4((atten*(Idiff + Ispec))*lightVisibility[i], texDiffuse.w);",
        "      }",
        "#endif",
        "  float alpha = color.w * max(0.0, 1.0 - transparency);",
        "  if (alpha < 0.1) discard;",
        "  gl_FragColor = vec4(color.xyz, alpha);",
        "}"
    ].join("\n")
});

XML3D.shaders.register("phongvcolor", {
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

        "uniform float ambientIntensity;",
        "uniform vec3 diffuseColor;",
        "uniform vec3 emissiveColor;",
        "uniform float shininess;",
        "uniform vec3 specularColor;",
        "uniform float transparency;",
        "uniform float lightOn;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",
        "varying vec3 fragVertexColor;",
        "#if MAXLIGHTS > 0",
        "uniform vec3 lightAttenuations[MAXLIGHTS];",
        "uniform vec3 lightPositions[MAXLIGHTS];",
        "uniform vec3 lightDiffuseColors[MAXLIGHTS];",
        "uniform vec3 lightVisibility[MAXLIGHTS];",
        "#endif",
        
        "void main(void) {",
        "  if (transparency > 0.95) discard;",
        "  vec3 color = emissiveColor;",
        "#if MAXLIGHTS > 0",
        "      for (int i=0; i<MAXLIGHTS; i++) {",
        "          vec3 L = lightPositions[i] - fragVertexPosition;",
        "          vec3 N = fragNormal;",
        "          vec3 E = fragEyeVector;",
        "          float dist = length(L);",
        "          L = normalize(L);",
        "          vec3 R = normalize(reflect(L,N));",

        "          float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);",
        "          vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * fragVertexColor ;",
        "          vec3 Ispec = specularColor * pow(max(dot(R,E),0.0), shininess*128.0) * lightDiffuseColors[i];",
        "          color += (atten*(Idiff + Ispec))*lightVisibility[i];",
        "      }",
        "#endif",
        "  gl_FragColor = vec4(color, max(0.0, 1.0 - transparency));",
        "}"
    ].join("\n")
});