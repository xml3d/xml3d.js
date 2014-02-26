XML3D.shaders.register("pickobjectid", {
    vertex : [
        "attribute vec3 position;",
        "uniform mat4 modelViewProjectionMatrix;",

        "void main(void) {",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "uniform vec3 id;",

        "void main(void) {",
        "    gl_FragColor = vec4(id, 0.0);",
        "}"
    ].join("\n"),

    uniforms : {}
});

XML3D.shaders.register("pickedposition", {
    vertex : [
        "attribute vec3 position;",
        "uniform mat4 modelMatrix;",
        "uniform mat4 modelViewProjectionMatrix;",
        "uniform vec3 bbox[2];",  // min = bbox[0], max = bbox[1]

        "varying vec3 worldCoord;",

        "void main(void) {",
        "    worldCoord = (modelMatrix * vec4(position, 1.0)).xyz;",
        "    vec3 diff = bbox[1] - bbox[0];",
        "    worldCoord = worldCoord - bbox[0];",
        "    worldCoord = worldCoord / diff;",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "varying vec3 worldCoord;",

        "void main(void) {",
        "    gl_FragColor = vec4(worldCoord, 1.0);",
        "}"
    ].join("\n"),

    uniforms : {}
});


XML3D.shaders.register("pickedNormals", {
    vertex : [
        "attribute vec3 position;",
        "attribute vec3 normal;",
        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat3 modelViewMatrixN;",

        "varying vec3 fragNormal;",

        "void main(void) {",
        "    fragNormal = normalize(modelViewMatrixN * normal);",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "varying vec3 fragNormal;",

        "void main(void) {",
        "    gl_FragColor = vec4((fragNormal+1.0)/2.0 * (254.0 / 255.0), 1.0);",
        "}"
    ].join("\n"),

    uniforms : {}
});

XML3D.shaders.register("light-depth", {

    vertex: [
        "attribute vec3 position;",
        "varying vec4 worldPosition;",
        "uniform mat4 modelMatrix;",
        "uniform mat4 modelViewProjectionMatrix;",

        "void main(void) {",
        "   worldPosition = modelMatrix * vec4(position, 1.0);",
        "   gl_Position   = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "varying vec4 worldPosition;",
        "uniform mat4 viewMatrix;",

        "vec4 pack_depth( const in float depth ) {",
        "const vec4 bit_shift = vec4( 256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0 );",
        "const vec4 bit_mask  = vec4( 0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0 );",
        "vec4 res = fract( depth * bit_shift );",
        "res -= res.xxyz * bit_mask;",
        "return res;",
        "}",


        "void main(void) {",
        "    gl_FragColor = pack_depth( gl_FragCoord.z );",
        "}"
    ].join("\n"),

    uniforms: {}
});

XML3D.shaders.register("render-normal", {
    vertex : [
        "attribute vec3 position;",
        "attribute vec3 normal;",
        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat3 modelMatrixN;",

        "varying vec3 fragNormal;",

        "void main(void) {",
        "    fragNormal = modelMatrixN * normal;",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "varying vec3 fragNormal;",

        "void main(void) {",
        "   gl_FragColor = vec4((normalize(fragNormal) + 1.0) / 2.0, 1.0);",
        "}"
    ].join("\n"),

    uniforms : {}
});

XML3D.shaders.register("render-position", {
    vertex : [
        "attribute vec3 position;",
        "uniform mat4 modelMatrix;",
        "uniform mat4 modelViewProjectionMatrix;",

        "varying vec3 worldCoord;",

        "void main(void) {",
        "    worldCoord = (modelMatrix * vec4(position, 1.0)).xyz;",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "varying vec3 worldCoord;",

        "void main(void) {",
        "    gl_FragColor = vec4(worldCoord, 1.0);",
        "}"
    ].join("\n"),

    uniforms : {}
});

XML3D.shaders.register("boxblur", {
    vertex: [
        "attribute vec3 position;",

        "void main(void) {",
        "   gl_Position = vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "uniform sampler2D sInTexture;",
        "uniform vec2 canvasSize;",
        "uniform vec2 blurOffset;",

        "const float blurSize = 1.0/512.0;",

        "void main(void) {",
        "   vec2 texcoord = (gl_FragCoord.xy / canvasSize.xy);",
        "   vec4 sum = vec4(0.0);",
        "   float blurSizeY = blurOffset.y / canvasSize.y;",
        "   float blurSizeX = blurOffset.x / canvasSize.x;",

        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y - 1.5*blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y - 2.0*blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y - blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y + blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y + 2.0*blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y + 1.5*blurSizeY));",

        "   sum += texture2D(sInTexture, vec2(texcoord.x - 1.5*blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x - 2.0*blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x - blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x + blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x + 2.0*blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x + 1.5*blurSizeX, texcoord.y));",

        "   gl_FragColor = sum / 12.0;",
        "}"
    ].join("\n"),

    uniforms: {
        canvasSize : [512, 512],
        blurOffset : [1.0, 1.0]
    },

    samplers: {
        sInTexture : null
    }
});

XML3D.shaders.register("ssao", {
    vertex : [
        "attribute vec2 position;",

        "void main(void) {",
        "    gl_Position = vec4(position, 0.0, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",

        "uniform vec2 canvasSize;",
        "uniform sampler2D sPositionTex;",
        "uniform sampler2D sNormalTex;",
        "uniform sampler2D sRandomNormals;",
        "uniform vec2 uRandomTexSize;",
        "uniform float uSampleRadius;",
        "uniform float uScale;",
        "uniform float uBias;",
        "uniform float uIntensity;",
        "uniform vec2 uConstVectors[4];",
        "uniform mat4 viewMatrix;",

        "vec3 getPosition(vec2 uv) {",
        "return texture2D(sPositionTex, uv).xyz;",
        "}",

        "float calcAmbientOcclusion(vec2 screenUV, vec2 uvOffset, vec3 origin, vec3 cnorm) {",
        "   vec3 diff = getPosition(screenUV + uvOffset) - origin;",
        "   vec3 v = normalize(diff);",
        "   float dist = length(diff) * uScale;",
        "   return max(0.0, dot(cnorm, v) - uBias) * (1.0/(1.0 + dist)) * uIntensity;",
        "}",

        "void main(void) {",
        "   vec2 screenUV = gl_FragCoord.xy / canvasSize.xy;",
        "   vec2 rand = normalize(texture2D(sRandomNormals, gl_FragCoord.xy / uRandomTexSize).xy * 2.0 - 1.0 );",
        "   vec3 norm = normalize(texture2D(sNormalTex, screenUV).xyz * 2.0 - 1.0 );",
        "   vec3 origin = getPosition(screenUV);",
        "   float radius = uSampleRadius / (viewMatrix * vec4(origin, 1.0)).z;",
        "   float ao = 0.0;",

        "   const int iterations = 4;",
        "   for (int i = 0; i < iterations; ++i) {",
        "       vec2 coord1 = reflect(uConstVectors[i], rand) * radius;",
        "       vec2 coord2 = vec2(coord1.x*0.707 - coord1.y*0.707, coord1.x*0.707 + coord1.y*0.707);",
        "       ao += calcAmbientOcclusion(screenUV, coord1*0.25, origin, norm);",
        "       ao += calcAmbientOcclusion(screenUV, coord2*0.5, origin, norm);",
        "       ao += calcAmbientOcclusion(screenUV, coord1*0.75, origin, norm);",
        "       ao += calcAmbientOcclusion(screenUV, coord2, origin, norm);",
        "   }",
        "   ao /= (float(iterations) * 4.0);",
        "   gl_FragColor = vec4(ao, ao, ao, 1.0);",
        "}"
    ].join("\n"),

    uniforms: {
        canvasSize      : [512, 512],
        uConstVectors   : [1,0, -1,0, 0,1, 0,-1],
        uRandomTexSize  : [64,64],
        uSampleRadius   : 0.9,
        uScale          : 0.9,
        uBias           : 0.2,
        uIntensity      : 1.0
    },

    samplers: {
        sPositionTex   : null,
        sNormalTex     : null,
        sRandomNormals : null
    },

    attributes: {
    }
});
