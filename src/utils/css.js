var CSSMatrix = require("./cssMatrix.js");

var css = {};

css.TRANSFORM_PROPERTY = null;

css.init = function () {
    var styleElement = document.createElement("style");
    styleElement.textContent = "xml3d * { display: inherit; }";
    document.head.appendChild(styleElement);

    if ('transform' in document.body.style) {
        css.TRANSFORM_PROPERTY = 'transform'
    } else if ('WebkitTransform' in document.body.style) {
        css.TRANSFORM_PROPERTY = '-webkit-transform'
    } else if ('MozTransform' in document.body.style) {
        css.TRANSFORM_PROPERTY = '-moz-transform'
    } else {
        XML3D.debug.logWarning("No supported transform css property found");
    }

};

css.getInlinePropertyValue = function (node, property) {
    var styleValue = node.getAttribute('style');
    if (styleValue) {
        var pattern = new RegExp(property + "\s*:([^;]+)", "i");
        var result = pattern.exec(styleValue);
        if (result)
            return result[1].trim();
    }
    return null;
};

css.getPropertyValue = function (node, property) {
    var value = this.getInlinePropertyValue(node, property);
    if (value)
        return value;

    var style = window.getComputedStyle(node);
    return style.getPropertyValue(property);
};

css.getCSSMatrix = function (node) {
    if (!css.TRANSFORM_PROPERTY || !CSSMatrix)
        return null;

    var style = null;

    if (css.TRANSFORM_PROPERTY != "transform")
        style = css.getInlinePropertyValue(node, "transform");

    if (!style)
        style = css.getPropertyValue(node, css.TRANSFORM_PROPERTY);

    if (!style || style == "none")
        return null;

    var result = null;
    try {
        result = new CSSMatrix(style);
    } catch (e) {
        XML3D.debug.logError("Error parsing transform property: " + style);
    }
    return result;

};


css.convertCssToMat4 = function (cssMatrix, m) {
    var matrix = m || XML3D.math.mat4.create();
    matrix[0] = cssMatrix.m11;
    matrix[1] = cssMatrix.m12;
    matrix[2] = cssMatrix.m13;
    matrix[3] = cssMatrix.m14;
    matrix[4] = cssMatrix.m21;
    matrix[5] = cssMatrix.m22;
    matrix[6] = cssMatrix.m23;
    matrix[7] = cssMatrix.m24;
    matrix[8] = cssMatrix.m31;
    matrix[9] = cssMatrix.m32;
    matrix[10] = cssMatrix.m33;
    matrix[11] = cssMatrix.m34;
    matrix[12] = cssMatrix.m41;
    matrix[13] = cssMatrix.m42;
    matrix[14] = cssMatrix.m43;
    matrix[15] = cssMatrix.m44;
    return matrix;
};

module.exports = css;

