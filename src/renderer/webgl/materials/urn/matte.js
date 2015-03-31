XML3D.shaders.register("matte", {

    vertex: [
        "attribute vec3 position;",
        "attribute vec3 color;",

        "varying vec3 fragVertexColor;",

        "uniform mat4 modelViewProjectionMatrix;",

        "void main(void) {",
        "   fragVertexColor = color;",
        "   gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "uniform vec3 diffuseColor;",
        "uniform bool useVertexColor;",

        "varying vec3 fragVertexColor;",

        "void main(void) {",
        "    vec3 color = diffuseColor;",
        "    if (useVertexColor)",
        "       color *=  fragVertexColor;",
        "    gl_FragColor = vec4(color, 1.0);",
        "}"
    ].join("\n"),

    uniforms: {
        diffuseColor : [1.0, 1.0, 1.0],
        useVertexColor: false
    },
    attributes: {
        color: null,
        normal: null // For picking
    }
});

XML3D.shaders.register("flat", XML3D.shaders.getScript("matte"));
