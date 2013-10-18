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
        "uniform mat3 normalMatrix;",

        "varying vec3 fragNormal;",

        "void main(void) {",
        "    fragNormal = normalize(normalMatrix * normal);",
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
