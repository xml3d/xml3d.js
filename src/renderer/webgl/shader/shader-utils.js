var FRAGMENT_HEADER = ["#ifdef GL_FRAGMENT_PRECISION_HIGH", "precision highp float;", "#else", "precision mediump float;", "#endif // GL_FRAGMENT_PRECISION_HIGH", "\n"].join("\n");

module.exports = {
    addFragmentShaderHeader: function (fragmentShaderSource) {
        return FRAGMENT_HEADER + fragmentShaderSource;
    }
};
