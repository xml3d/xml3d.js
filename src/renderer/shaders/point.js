XML3D.shaders.register("point", {

    vertex : [
        "attribute vec3 position;",
        "attribute vec3 color;",
        "attribute vec2 texcoord;",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",
        "varying vec2 fragTexCoord;",
        "varying vec3 fragVertexColor;",

        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat4 modelViewMatrix;",
        "uniform mat4 projectionMatrix;",
        "uniform mat3 normalMatrix;",
        "uniform vec3 eyePosition;",
        "uniform float screenWidth;",
        "uniform float pointSize;",

        "void main(void) {",
        "    vec3 pos = position;",

        "    gl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);",
        "    fragVertexPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;",
        "    fragEyeVector = normalize(fragVertexPosition);",
        "    fragTexCoord = texcoord;",
        "    fragVertexColor = color;",
        "    vec4 pos2 = vec4(fragVertexPosition, 1.0); pos2.x += pointSize;",
        "    gl_PointSize = distance( gl_Position.xy, (projectionMatrix * pos2).xy ) * screenWidth / gl_Position.w;",
        "}"
    ].join("\n"),

    fragment : [
        "uniform vec3 diffuseColor;",
        "uniform float transparency;",
        "uniform mat4 viewMatrix;",
        "uniform bool useVertexColor;",
        "uniform vec2 texCoordOffset;",
        "uniform vec2 texCoordSize;",

        "#if HAS_DIFFUSETEXTURE",
        "uniform sampler2D diffuseTexture;",
        "#endif",

        "varying vec3 fragNormal;",
        "varying vec3 fragVertexPosition;",
        "varying vec3 fragEyeVector;",
        "varying vec2 fragTexCoord;",
        "varying vec3 fragVertexColor;",

        "void main(void) {",
        "  float alpha =  max(0.0, 1.0 - transparency);",
        "  vec3 objDiffuse = diffuseColor;",
        "  if(useVertexColor)",
        "    objDiffuse *= fragVertexColor;",
        "  #if HAS_DIFFUSETEXTURE",
        "    vec2 texCoord = fragTexCoord + texCoordOffset + gl_PointCoord*texCoordSize;",
        "    texCoord.y = 1.0 - texCoord.y;",
        "    vec4 texDiffuse = texture2D(diffuseTexture, texCoord);",
        "    alpha *= texDiffuse.a;",
        "    objDiffuse *= texDiffuse.rgb;",
        "  #endif",
        "  if (alpha < 0.05) discard;",
        "  gl_FragColor = vec4(objDiffuse, alpha);",
        "}"
    ].join("\n"),
    addDirectives: function(directives, lights, params) {
        directives.push("HAS_DIFFUSETEXTURE " + ('diffuseTexture' in params ? "1" : "0"));
    },
    hasTransparency: function(params) {
        return params.transparency && params.transparency.getValue()[0] > 0.001;
    },
    uniforms: {
        diffuseColor: [1.0, 1.0, 1.0],
        texCoordOffset: [0, 0],
        texCoordSize: [1, 1],
        transparency: 0.0,
        useVertexColor: false,
        pointSize: 1.0
    },
    samplers: {
        diffuseTexture: null
    },
    attributes: {
        texcoord: null,
        color: null
    }
});
