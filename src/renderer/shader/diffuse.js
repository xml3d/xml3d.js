
g_shaders["urn:xml3d:shader:diffuse"] = {
        vertex :

        "attribute vec3 position;\n"
        +"attribute vec3 normal;\n"

        +"varying vec3 fragNormal;\n"
        +"varying vec3 fragVertexPosition;\n"
        +"varying vec3 fragEyeVector;\n"

        +"uniform mat4 modelViewProjectionMatrix;\n"
        +"uniform mat4 modelViewMatrix;\n"
        +"uniform mat3 normalMatrix;\n"
        +"uniform vec3 eyePosition;\n"

        +"void main(void) {\n"
        +"    vec3 pos = position;\n"
        +"    vec3 norm = normal;\n\n //~"
        
        +"    \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);\n"
        +"    fragNormal = normalize(normalMatrix * norm);\n"
        +"    fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;\n"
        +"    fragEyeVector = normalize(fragVertexPosition);\n"
        +"}\n",

    fragment:
    // NOTE: Any changes to this area must be carried over to the substring calculations in
    // XML3D.webgl.Renderer.prototype.getStandardShaderProgram
            "#ifdef GL_ES\n"
            +"precision highp float;\n"
            +"#endif\n\n"
            +"// const int MAXLIGHTS = 0; \n"
    // ------------------------------------------------------------------------------------
            +"uniform vec3 diffuseColor;\n"
            +"uniform vec3 emissiveColor;\n"

            +"varying vec3 fragNormal;\n"
            +"varying vec3 fragVertexPosition;\n"
            +"varying vec3 fragEyeVector;\n"

            +"uniform vec3 lightAttenuations[MAXLIGHTS+1];\n"
            +"uniform vec3 lightPositions[MAXLIGHTS+1];\n"
            +"uniform vec3 lightDiffuseColors[MAXLIGHTS+1];\n"
            +"uniform vec3 lightVisibility[MAXLIGHTS+1];\n"

            +"void main(void) {\n"
            +"  vec3 color = emissiveColor;\n"
            +"  if (MAXLIGHTS < 1) {\n"
            +"      vec3 normal = fragNormal;\n"
            +"      vec3 eye = fragEyeVector;\n"
            +"      float diffuse = max(0.0, dot(normal, -eye)) ;\n"
            +"      diffuse += max(0.0, dot(normal, eye));\n"
            +"      color = color + diffuse*diffuseColor;\n"
            +"  } else {\n"
            +"      for (int i=0; i<MAXLIGHTS; i++) {\n"
            +"          vec3 L = lightPositions[i] - fragVertexPosition;\n"
            +"          vec3 N = fragNormal;\n"
            +"          float dist = length(L);\n"
            +"          L = normalize(L);\n"
            +"          float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);\n"
            +"          vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * diffuseColor ;\n"
            +"          color = color + (atten*Idiff) * lightVisibility[i];\n"
            +"      }\n"
            +"  }\n"
            +"  gl_FragColor = vec4(color, 1.0);\n"
            +"}"
};


g_shaders["urn:xml3d:shader:textureddiffuse"] = {
        vertex :

        "attribute vec2 texcoord;\n"
        +"attribute vec3 position;\n"
        +"attribute vec3 normal;\n"

        +"varying vec3 fragNormal;\n"
        +"varying vec3 fragVertexPosition;\n"
        +"varying vec3 fragEyeVector;\n"
        +"varying vec2 fragTexCoord;\n"

        +"uniform mat4 modelViewProjectionMatrix;\n"
        +"uniform mat4 modelViewMatrix;\n"
        +"uniform mat3 normalMatrix;\n"
        +"uniform vec3 eyePosition;\n"

        +"void main(void) {\n"
        +"    vec2 tex = texcoord;\n"
        +"    vec3 pos = position;\n"
        +"    vec3 norm = normal;\n\n //~"
        
        +"    \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);\n"
        +"    fragNormal = normalize(normalMatrix * norm);\n"
        +"    fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;\n"
        +"    fragEyeVector = normalize(fragVertexPosition);\n"
        +"    fragTexCoord = tex;\n"
        +"}\n",

    fragment:
    // NOTE: Any changes to this area must be carried over to the substring calculations in
    // XML3D.webgl.Renderer.prototype.getStandardShaderProgram
            "#ifdef GL_ES\n"
            +"precision highp float;\n"
            +"#endif\n\n"
            +"// const int MAXLIGHTS = 0; \n"
    // ------------------------------------------------------------------------------------
            +"uniform vec3 diffuseColor;\n"
            +"uniform sampler2D diffuseTexture;"
            +"uniform vec3 emissiveColor;\n"

            +"varying vec3 fragNormal;\n"
            +"varying vec3 fragVertexPosition;\n"
            +"varying vec3 fragEyeVector;\n"
            +"varying vec2 fragTexCoord;\n"

            +"uniform vec3 lightAttenuations[MAXLIGHTS+1];\n"
            +"uniform vec3 lightPositions[MAXLIGHTS+1];\n"
            +"uniform vec3 lightDiffuseColors[MAXLIGHTS+1];\n"
            +"uniform vec3 lightVisibility[MAXLIGHTS+1];\n"

            +"void main(void) {\n"
            +"  vec3 color = emissiveColor;\n"
            +"  if (MAXLIGHTS < 1) {\n"
            +"      vec3 normal = fragNormal;\n"
            +"      vec3 eye = fragEyeVector;\n"
            +"      float diffuse = max(0.0, dot(normal, -eye)) ;\n"
            +"      diffuse += max(0.0, dot(normal, eye));\n"
            +"      color = color + diffuse*texture2D(diffuseTexture, fragTexCoord).xyz;\n"
            +"  } else {\n"
            +"      vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);\n"
            +"      for (int i=0; i<MAXLIGHTS; i++) {\n"
            +"          vec3 L = lightPositions[i] - fragVertexPosition;\n"
            +"          vec3 N = fragNormal;\n"
            +"          float dist = length(L);\n"
            +"          L = normalize(L);\n"
            +"          float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);\n"
            +"          vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * texDiffuse.xyz;\n"
            +"          color = color + (atten*Idiff) * lightVisibility[i];\n"
            +"      }\n"
            +"  }\n"
            +"  gl_FragColor = vec4(color, 1.0);\n"
            +"}"
};


g_shaders["urn:xml3d:shader:diffusevcolor"] = {
        vertex :

        "attribute vec3 position;\n"
        +"attribute vec3 normal;\n"
        +"attribute vec3 color;\n"

        +"varying vec3 fragNormal;\n"
        +"varying vec3 fragVertexPosition;\n"
        +"varying vec3 fragEyeVector;\n"
        +"varying vec3 fragVertexColor;\n"

        +"uniform mat4 modelViewProjectionMatrix;\n"
        +"uniform mat4 modelViewMatrix;\n"
        +"uniform mat3 normalMatrix;\n"
        +"uniform vec3 eyePosition;\n"

        +"void main(void) {\n"
        +"    vec3 pos = position;\n"
        +"    vec3 norm = normal;\n\n //~"
        
        +"    \ngl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);\n"
        +"    fragNormal = normalize(normalMatrix * norm);\n"
        +"    fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;\n"
        +"    fragEyeVector = normalize(fragVertexPosition);\n"
        +"    fragVertexColor = color;\n"
        +"}\n",

    fragment:
    // NOTE: Any changes to this area must be carried over to the substring calculations in
    // XML3D.webgl.Renderer.prototype.getStandardShaderProgram
            "#ifdef GL_ES\n"
            +"precision highp float;\n"
            +"#endif\n\n"
            +"// const int MAXLIGHTS = 0; \n"
    // ------------------------------------------------------------------------------------
            +"uniform vec3 diffuseColor;\n"
            +"uniform vec3 emissiveColor;\n"

            +"varying vec3 fragNormal;\n"
            +"varying vec3 fragVertexPosition;\n"
            +"varying vec3 fragEyeVector;\n"
            +"varying vec3 fragVertexColor;\n"

            +"uniform vec3 lightAttenuations[MAXLIGHTS+1];\n"
            +"uniform vec3 lightPositions[MAXLIGHTS+1];\n"
            +"uniform vec3 lightDiffuseColors[MAXLIGHTS+1];\n"
            +"uniform vec3 lightVisibility[MAXLIGHTS+1];\n"

            +"void main(void) {\n"
            +"  vec3 color = emissiveColor;\n"
            +"  if (MAXLIGHTS < 1) {\n"
            +"      vec3 normal = fragNormal;\n"
            +"      vec3 eye = fragEyeVector;\n"
            +"      float diffuse = max(0.0, dot(normal, -eye)) ;\n"
            +"      diffuse += max(0.0, dot(normal, eye));\n"
            +"      color = color + diffuse*fragVertexColor;\n"
            +"  } else {\n"
            +"      for (int i=0; i<MAXLIGHTS; i++) {\n"
            +"          vec3 L = lightPositions[i] - fragVertexPosition;\n"
            +"          vec3 N = fragNormal;\n"
            +"          float dist = length(L);\n"
            +"          L = normalize(L);\n"
            +"          float atten = 1.0 / (lightAttenuations[i].x + lightAttenuations[i].y * dist + lightAttenuations[i].z * dist * dist);\n"
            +"          vec3 Idiff = lightDiffuseColors[i] * max(dot(N,L),0.0) * fragVertexColor ;\n"
            +"          color = color + (atten*Idiff) * lightVisibility[i];\n"
            +"      }\n"
            +"  }\n"
            +"  gl_FragColor = vec4(color, 1.0);\n"
            +"}"
};
