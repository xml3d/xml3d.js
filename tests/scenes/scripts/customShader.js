XML3D.shaders.register("customtest", {

    vertex : [
        "attribute vec3 position;",

        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat4 modelViewMatrix;",

        "void main(void) {",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "#ifdef GL_ES",
          "precision highp float;",
        "#endif",

        "uniform vec3 someColor;",

        "void main(void) {",
        "  gl_FragColor = vec4(someColor, 1.0);",
        "}"
    ].join("\n"),

    addDirectives: function(directives, lights, params) {
    },

    uniforms: {
        someColor    : [0.0, 1.0, 0.0]
    },

    samplers: {
    }
});