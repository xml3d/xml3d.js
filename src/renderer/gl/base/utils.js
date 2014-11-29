// Utility functions
(function(webgl) {

    webgl.checkError = function(gl, text)
    {
        var error = gl.getError();
        if (error !== gl.NO_ERROR) {
            var textErr = ""+error;
            switch (error) {
            case 1280: textErr = "1280 ( GL_INVALID_ENUM )"; break;
            case 1281: textErr = "1281 ( GL_INVALID_VALUE )"; break;
            case 1282: textErr = "1282 ( GL_INVALID_OPERATION )"; break;
            case 1283: textErr = "1283 ( GL_STACK_OVERFLOW )"; break;
            case 1284: textErr = "1284 ( GL_STACK_UNDERFLOW )"; break;
            case 1285: textErr = "1285 ( GL_OUT_OF_MEMORY )"; break;
            }
            var msg = "GL error " + textErr + " occured.";
            if (text !== undefined)
                msg += " " + text;
            XML3D.debug.trace(msg);
        }
    };









    webgl.FRAGMENT_HEADER = [
        "#ifdef GL_FRAGMENT_PRECISION_HIGH",
        "precision highp float;",
        "#else",
        "precision mediump float;",
        "#endif // GL_FRAGMENT_PRECISION_HIGH",
        "\n"
    ].join("\n");

    webgl.addFragmentShaderHeader = function(fragmentShaderSource) {
        return webgl.FRAGMENT_HEADER + fragmentShaderSource;
    };


})(XML3D.webgl);
