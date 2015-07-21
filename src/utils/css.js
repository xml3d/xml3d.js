var CSSMatrix = require("./cssMatrix.js");

var css = {};

css.TRANSFORM_PROPERTY = null;

css.init = function () {
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
    var matrix = m || new XML3D.Mat4();
    matrix.m11 = cssMatrix.m11;
    matrix.m12 = cssMatrix.m12;
    matrix.m13 = cssMatrix.m13;
    matrix.m14 = cssMatrix.m14;
    matrix.m21 = cssMatrix.m21;
    matrix.m22 = cssMatrix.m22;
    matrix.m23 = cssMatrix.m23;
    matrix.m24 = cssMatrix.m24;
    matrix.m31 = cssMatrix.m31;
    matrix.m32 = cssMatrix.m32;
    matrix.m33 = cssMatrix.m33;
    matrix.m34 = cssMatrix.m34;
    matrix.m41 = cssMatrix.m41;
    matrix.m42 = cssMatrix.m42;
    matrix.m43 = cssMatrix.m43;
    matrix.m44 = cssMatrix.m44;
    return matrix;
};

(function () {
    var styleElement = document.createElement("style");
    styleElement.textContent = "xml3d * { display: inherit; }" + "float,float2,float3,float4,float4x4,int,int4,bool,texture,compute { display: none; }";
    document.head.appendChild(styleElement);
}());


module.exports = css;

