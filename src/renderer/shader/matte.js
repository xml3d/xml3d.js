XML3D.shader.register("matte", {

    vertex: [
        "attribute vec3 position;",

        "uniform mat4 modelViewProjectionMatrix;",

        "void main(void) {",
        "   vec3 pos = position;",
        "   gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "uniform vec3 diffuseColor;",
        "void main(void) {",
        "    gl_FragColor = vec4(diffuseColor, 1.0);",
        "}"
    ].join("\n"),
});

XML3D.shader.register("mattevcolor", {

    vertex: [
        "attribute vec3 position;",
        "attribute vec3 color;",
        "varying vec3 fragVertexColor;",
        "uniform mat4 modelViewProjectionMatrix;",
        "void main(void) {",
        "    vec3 pos = position;",
        "    fragVertexColor = color;",
        "    gl_Position = modelViewProjectionMatrix * vec4(pos, 1.0);",
        "}",
    ].join("\n"),

    fragment: [
        "uniform vec3 diffuseColor;",
        "varying vec3 fragVertexColor;",
        "void main(void) {",
        "    gl_FragColor = vec4(fragVertexColor, 1.0);",
        "}"
    ].join("\n"),
});