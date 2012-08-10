


XML3D.shaders.register("picking", {
    vertex : [
        "attribute vec3 position;",
        "uniform mat4 modelMatrix;",
        "uniform mat4 modelViewProjectionMatrix;",
        "uniform vec3 min;",
        "uniform vec3 max;",

        "varying vec3 worldCoord;",
        "void main(void) {",
        "    worldCoord = (modelMatrix * vec4(position, 1.0)).xyz;",
        "    vec3 diff = max - min;",
        "    worldCoord = worldCoord - min;",
        "    worldCoord = worldCoord / diff;",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "#ifdef GL_ES",
          "precision highp float;",
        "#endif",
        "uniform float id;",
        "varying vec3 worldCoord;",

        "void main(void) {",
        "    gl_FragColor = vec4(worldCoord, id);",
        "}"
    ].join("\n"),
    
    uniforms : {}
});

XML3D.shaders.register("pickedNormals", {
    vertex : [
        "attribute vec3 position;",
        "attribute vec3 normal;",
        "uniform mat4 modelViewMatrix;",
        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat3 normalMatrix;",

        "varying vec3 fragNormal;",

        "void main(void) {",
        "    fragNormal = normalize(normalMatrix * normal);",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "#ifdef GL_ES",
          "precision highp float;",
        "#endif",

        "varying vec3 fragNormal;",

        "void main(void) {",
        "    gl_FragColor = vec4((fragNormal+1.0)/2.0, 1.0);",
        "}"
    ].join("\n"),
    
    uniforms : {}
});