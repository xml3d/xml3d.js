g_shaders["urn:xml3d:shader:phong"] = {
        vertex :

        "attribute vec3 position;\n"
        +"attribute vec3 normal;\n"

        +"varying vec3 fragNormal;\n"
        +"varying vec3 fragVertexPosition;\n"
        +"varying vec3 fragEyeVector;\n"

        +"uniform mat4 modelViewProjectionMatrix;\n"
        +"uniform mat4 modelViewMatrix;\n"
        +"uniform mat3 normalMatrix;\n"

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
    // ------------------------------------------------------------------------------------
            +"uniform float ambientIntensity;\n"
            +"uniform vec3 diffuseColor;\n"
            +"uniform vec3 emissiveColor;\n"
            +"uniform float shininess;\n"
            +"uniform vec3 specularColor;\n"
            +"uniform float transparency;\n"
            +"uniform mat4 viewMatrix;\n"

            +"varying vec3 fragNormal;\n"
            +"varying vec3 fragVertexPosition;\n"
            +"varying vec3 fragEyeVector;\n"

            +"#if MAX_POINTLIGHTS > 0\n"
            +"uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS+1];\n"
            +"uniform vec3 pointLightPosition[MAX_POINTLIGHTS+1];\n"
            +"uniform vec3 pointLightIntensity[MAX_POINTLIGHTS+1];\n"
            +"uniform vec3 pointLightVisibility[MAX_POINTLIGHTS+1];\n"
            +"#endif\n"

            +"#if MAX_DIRECTIONALLIGHTS > 0\n"
            +"uniform vec3 directionalLightDirection[MAX_DIRECTIONALLIGHTS+1];\n"
            +"uniform vec3 directionalLightIntensity[MAX_DIRECTIONALLIGHTS+1];\n"
            +"uniform vec3 directionalLightVisibility[MAX_DIRECTIONALLIGHTS+1];\n"
            +"#endif\n"

            +"void main(void) {\n"
            +"  if (transparency > 0.95) discard;\n"
            +"  vec3 color = diffuseColor * ambientIntensity + emissiveColor;\n"

            +"#if MAX_POINTLIGHTS > 0\n"
            +"  for (int i=0; i<MAX_POINTLIGHTS; i++) {\n"
            +"    vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );"
            +"    vec3 L = lPosition.xyz - fragVertexPosition;\n"
            +"    float dist = length(L);\n"
            +"    L = normalize(L);\n"
            +"    vec3 R = normalize(reflect(L,fragNormal));\n"
            +"    float atten = 1.0 / (pointLightAttenuation[i].x + pointLightAttenuation[i].y * dist + pointLightAttenuation[i].z * dist * dist);\n"
            +"    vec3 Idiff = pointLightIntensity[i] * max(dot(fragNormal,L),0.0) * diffuseColor ;\n"
            +"    vec3 Ispec = specularColor * pow(max(dot(R,fragEyeVector),0.0), shininess*128.0) * pointLightIntensity[i];\n"
            +"    color = color + (atten*(Idiff + Ispec)) * pointLightVisibility[i];\n"
            +"  }\n"
            +"#endif\n"

            +"#if MAX_DIRECTIONALLIGHTS > 0\n"
            +"  for (int i=0; i<MAX_DIRECTIONALLIGHTS; i++) {\n"
            +"    vec4 lDirection = viewMatrix * vec4(directionalLightDirection[i], 0.0);"
            +"    vec3 L =  normalize(lDirection.xyz);\n"
            +"    vec3 R = normalize(reflect(L,fragNormal));\n"
            +"    vec3 Idiff = directionalLightIntensity[i] * diffuseColor  * max(dot(fragNormal,L),0.0);\n"
            +"    vec3 Ispec = directionalLightIntensity[i] * specularColor * pow(max(dot(R,fragEyeVector),0.0), shininess*128.0);\n"
            +"    color = color + ((Idiff + Ispec));// * directionalLightVisibility[i];\n"
            +"  }\n"
            +"#endif\n"

            +"  gl_FragColor = vec4(color, max(0.0, 1.0 - transparency));\n"
            +"}"
};

g_shaders["urn:xml3d:shader:texturedphong"] = {
        vertex :

        "attribute vec3 position;\n"
        +"attribute vec3 normal;\n"
        +"attribute vec2 texcoord;\n"

        +"varying vec3 fragNormal;\n"
        +"varying vec3 fragVertexPosition;\n"
        +"varying vec3 fragEyeVector;\n"
        +"varying vec2 fragTexCoord;\n"

        +"uniform mat4 modelViewProjectionMatrix;\n"
        +"uniform mat4 modelViewMatrix;\n"
        +"uniform mat3 normalMatrix;\n"

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
            +"// const int MAX_POINTLIGHTS = 0; \n"
        // ------------------------------------------------------------------------------------
            +"uniform float ambientIntensity;\n"
            +"uniform vec3 diffuseColor;\n"
            +"uniform vec3 emissiveColor;\n"
            +"uniform float shininess;\n"
            +"uniform vec3 specularColor;\n"
            +"uniform float transparency;\n"
            +"uniform float lightOn;\n"
            +"uniform sampler2D diffuseTexture;\n"
            +"uniform mat4 viewMatrix;\n"

            +"uniform sampler2D specularTexture;\n"
            +"uniform bool useSpecularTexture;\n"

            +"varying vec3 fragNormal;\n"
            +"varying vec3 fragVertexPosition;\n"
            +"varying vec3 fragEyeVector;\n"
            +"varying vec2 fragTexCoord;\n"

            +"#if MAX_POINTLIGHTS > 0\n"
            +"uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS+1];\n"
            +"uniform vec3 pointLightPosition[MAX_POINTLIGHTS+1];\n"
            +"uniform vec3 pointLightIntensity[MAX_POINTLIGHTS+1];\n"
            +"uniform vec3 pointLightVisibility[MAX_POINTLIGHTS+1];\n"
            +"#endif\n"

            +"#if MAX_DIRECTIONALLIGHTS > 0\n"
            +"uniform vec3 directionalLightDirection[MAX_DIRECTIONALLIGHTS+1];\n"
            +"uniform vec3 directionalLightIntensity[MAX_DIRECTIONALLIGHTS+1];\n"
            +"uniform vec3 directionalLightVisibility[MAX_DIRECTIONALLIGHTS+1];\n"
            +"#endif\n"

            +"void main(void) {\n"
            +"  vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);\n"
            +"  vec3 objDiffuse = diffuseColor * texDiffuse.xyz;\n"
            +"  vec3 objSpecular = specularColor;\n"
            +"  if(useSpecularTexture)\n"
            +"    objSpecular = objSpecular * texture2D(specularTexture, fragTexCoord).xyz;\n"
            +"  vec3 color = objDiffuse * ambientIntensity + emissiveColor;\n"

            +"#if MAX_POINTLIGHTS > 0\n"
            +"  for (int i=0; i<MAX_POINTLIGHTS; i++) {\n"
            +"    vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );\n"
            +"    vec3 L = lPosition.xyz - fragVertexPosition;\n"
            +"    float dist = length(L);\n"
            +"    L = normalize(L);\n"
            +"    vec3 R = normalize(reflect(L,fragNormal));\n"
            +"    float atten = 1.0 / (pointLightAttenuation[i].x + pointLightAttenuation[i].y * dist + pointLightAttenuation[i].z * dist * dist);\n"
            +"    vec3 Idiff = pointLightIntensity[i] * objDiffuse * max(dot(fragNormal,L),0.0);\n"
            +"    vec3 Ispec = pointLightIntensity[i] * objSpecular * pow(max(dot(R,fragEyeVector),0.0), shininess*128.0);\n"
            +"    color = color + (atten*(Idiff + Ispec));// * pointLightVisibility[i];\n"
            +"  }\n"
            +"#endif\n"

            +"#if MAX_DIRECTIONALLIGHTS > 0\n"
            +"  for (int i=0; i<MAX_DIRECTIONALLIGHTS; i++) {\n"
            +"    vec4 lDirection = viewMatrix * vec4(directionalLightDirection[i], 0.0);\n"
            +"    vec3 L =  normalize(lDirection.xyz);\n"
            +"    vec3 R = normalize(reflect(L,fragNormal));\n"
            +"    vec3 Idiff = directionalLightIntensity[i] * objDiffuse  * max(dot(fragNormal,L),0.0);\n"
            +"    vec3 Ispec = directionalLightIntensity[i] * objSpecular * pow(max(dot(R,fragEyeVector),0.0), shininess*128.0);\n"
            +"    color = color + ((Idiff + Ispec));// * directionalLightVisibility[i];\n"
            +"  }\n"
            +"#endif\n"

            +"  float alpha = texDiffuse.w * max(0.0, 1.0 - transparency);\n"
            +"  if (alpha < 0.05) discard;\n"
            +"  gl_FragColor = vec4(color, alpha);\n"
            +"}"
};


g_shaders["urn:xml3d:shader:normal"] = {

vertex: [
         "attribute vec3 position;",
         "attribute vec3 normal;",
         "attribute vec3 tangent;",
         "attribute vec2 texcoord;",

         "varying vec3 normalVS;",
         "varying vec3 positionVS;",
         "varying vec2 texcoordMS;",
         "varying vec3 viewVecTS;",

         "#if MAX_DIRECTIONALLIGHTS > 0",
         "uniform vec3 directionalLightDirection[MAX_DIRECTIONALLIGHTS+1];",
         "varying vec3 directionalLightDirectionTS[MAX_DIRECTIONALLIGHTS+1];",
         "#endif",

         "uniform mat4 modelViewProjectionMatrix;", // model -> world -> view -> screen
         "uniform mat4 modelViewMatrix;",           // model -> world -> view
         "uniform mat3 normalMatrix;",              // model -> world -> view (normals)
         "uniform mat4 viewMatrix;",                // world -> view

         "void main(void) {",
         "    normalVS = normalMatrix * normal;", // normal in view space
         "    positionVS = (modelViewMatrix * vec4(position, 1.0)).xyz;", // position in view space

         "    texcoordMS = texcoord;", // texture coordinates in model space

         "    vec3 tangentVS = normalize(normalMatrix * tangent);", // tangent in view space
         "    vec3 bitangentVS = cross(tangentVS, normalVS);", // bi-tangent in view space

         "    vec3 viewVec = normalize(-positionVS);",
         "    viewVecTS = vec3(dot(viewVec, tangentVS), dot(viewVec, bitangentVS), dot(viewVec, normalVS));",

         // Tangent to matrix
         "#if MAX_DIRECTIONALLIGHTS > 0",
         "    vec3 v;",
         "    for (int i=0; i<MAX_DIRECTIONALLIGHTS; i++) {",
         "      vec3 lVec = (viewMatrix * vec4(directionalLightDirection[i],0.0)).xyz;",
         "      v.x = dot(lVec, tangentVS);",
         "      v.y = dot(lVec, bitangentVS);",
         "      v.z = dot(lVec, normalVS);",
         "      directionalLightDirectionTS[i] = v;",
         "    }",
         "#endif",

         "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",

         "}",,
     ].join("\n"),

fragment: [
           "#ifdef GL_ES",
           "precision highp float;",
           "#endif\n",
           "uniform float ambientIntensity;",
           "uniform vec3 diffuseColor;",
           "uniform vec3 emissiveColor;",
           "uniform float shininess;",
           "uniform vec3 specularColor;",
           "uniform float transparency;",
           "uniform float lightOn;",
           "uniform sampler2D diffuseTexture;",

           "uniform sampler2D specularTexture;",
           "uniform bool useSpecularTexture;",

           "uniform sampler2D normalTexture;",

           "varying vec3 normalVS;",
           "varying vec3 positionVS;",
           "varying vec2 texcoordMS;",
           "varying vec3 viewVecTS;",

           "#if MAX_POINTLIGHTS > 0",
           "uniform vec3 pointLightAttenuation[MAX_POINTLIGHTS+1];",
           "uniform vec3 pointLightPosition[MAX_POINTLIGHTS+1];",
           "uniform vec3 pointLightIntensity[MAX_POINTLIGHTS+1];",
           "uniform vec3 pointLightVisibility[MAX_POINTLIGHTS+1];",
           "#endif",

           "#if MAX_DIRECTIONALLIGHTS > 0",
           "uniform vec3 directionalLightIntensity[MAX_DIRECTIONALLIGHTS+1];",
           "uniform vec3 directionalLightVisibility[MAX_DIRECTIONALLIGHTS+1];",
           "uniform vec3 directionalLightDirection[MAX_DIRECTIONALLIGHTS+1];",
           "varying vec3 directionalLightDirectionTS[MAX_DIRECTIONALLIGHTS+1];",
           "#endif",

           "void main(void) {",
           "  vec4 texDiffuse = texture2D(diffuseTexture, texcoordMS);",
           "  vec3 normalTS = normalize(texture2D(normalTexture, texcoordMS).xyz * 2.0 - 1.0);",
           "  vec3 objDiffuse = diffuseColor * texDiffuse.xyz;",
           "  vec3 objSpecular = specularColor;",
           "  if(useSpecularTexture)",
           "    objSpecular = objSpecular * texture2D(specularTexture, texcoordMS).xyz;",
           "  vec3 color = objDiffuse * ambientIntensity + emissiveColor;",
           "  vec3 viewVec = normalize(viewVecTS);",
           "  vec3 R = reflect(-viewVec, normalTS);",

           "#if MAX_DIRECTIONALLIGHTS > 0",
           "  for (int i=0; i<MAX_DIRECTIONALLIGHTS; i++) {",
           "    vec3 L =  normalize(directionalLightDirectionTS[i]);",
           "    vec3 Idiff = directionalLightIntensity[i] * objDiffuse  * max(dot(L,normalTS),0.0);",
           "    float specular = pow(clamp(dot(R, L), 0.0, 1.0), shininess*128.0); ",
           "    vec3 Ispec = directionalLightIntensity[i] * objSpecular * specular;",
           //"    color = vec3(max(dot(L,normalTS),0.0));",
           "    color = color + Ispec + Idiff;// * directionalLightVisibility[i];",
           "  }",
           "#endif",

           "  float alpha = texDiffuse.w * max(0.0, 1.0 - transparency);",
           "  if (alpha < 0.05) discard;",
           "  gl_FragColor = vec4(color, alpha);",
           "}"
           ].join("\n")
};