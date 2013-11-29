XML3D.shaders.register("eyelight", {

    vertex : [
        "attribute vec3 position;",
        "attribute vec3 normal;",
        "attribute vec3 color;",
        "attribute vec2 texcoord;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec2 fragTexCoord;",

        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat4 modelViewMatrix;",
        "uniform mat3 modelViewMatrixN;",

        "void main(void) {",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "    fragNormal = normalize(modelViewMatrixN * normal);",
        "    fragVertexPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;",
        "    fragTexCoord = texcoord;",
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
        "uniform mat4 viewMatrix;",
        
        "#if HAS_DIFFUSETEXTURE",
        "  uniform sampler2D diffuseTexture;",
        "#endif",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec2 fragTexCoord;",

        "void main(void) {",
        "  vec3 objDiffuse = diffuseColor;",
        "  float alpha = max(0.0, 1.0 - transparency);",
        "  #if HAS_DIFFUSETEXTURE",
        "    vec4 texDiffuse = texture2D(diffuseTexture, fragTexCoord);",
        "    objDiffuse *= texDiffuse.rgb;",
        "    alpha *= texDiffuse.a;",
        "  #endif",
        
        "  if (alpha < 0.005) discard;",

        "  vec3 color = emissiveColor + (ambientIntensity * objDiffuse);\n",
        
        "  vec3 eyeVec = normalize(-fragVertexPosition);",     
        "  vec3 lightVec = eyeVec;",
        "  float diffuse = max(0.0, dot(fragNormal, lightVec)) ;",
        "  float specular = pow(max(0.0, dot(fragNormal, eyeVec)), shininess*128.0);",

        "  color = color + diffuse*objDiffuse + specular*specularColor;",
        "  gl_FragColor = vec4(color, alpha);",
        "}"
    ].join("\n"),

    addDirectives: function(directives, lights, params) { 
        directives.push("HAS_DIFFUSETEXTURE " + ('diffuseTexture' in params ? "1" : "0"));
    },

    uniforms: {
        diffuseColor    : [1.0, 1.0, 1.0],
        emissiveColor   : [0.0, 0.0, 0.0],
        specularColor   : [1.0, 1.0, 1.0],
        transparency    : 0.0,
        shininess       : 0.5,
        ambientIntensity: 0.0,
        useVertexColor : false
    },

    samplers: { 
        diffuseTexture : null
    },
	    attributes: {
        normal : {
            required: true
        },
        texcoord: null,
    }
});