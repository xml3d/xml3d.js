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

css.matrixStringToMat4 = function(matrix) {
    if (matrix.match("matrix3d")) {
        return css.matrix3dStringToMat4(matrix);
    }
    var chopped = matrix.replace("matrix(", "").replace(")","").split(", ");
    var mat3 = new XML3D.Mat3();
    var c = 0;
    for (var i = 0; i < 9; i++) {
        if ((i+1)%3 == 0) // matrix() is only 6 values with the lowest row implicitly 0 0 1
            continue;
        var cval = +chopped[c];
        if (isNaN(cval)) {
            return new XML3D.Mat4();
        }
        mat3.data[i] = cval;
        c++;
    }

    var mat4 = new XML3D.Mat4();
    mat4.m11 = mat3.m11;
    mat4.m12 = mat3.m12;
    mat4.m21 = mat3.m21;
    mat4.m22 = mat3.m22;
    mat4.m41 = mat3.m31;
    mat4.m42 = mat3.m32;

    return mat4;
};

css.getLargestTransitionDurationMS = function(tdString) {
    var durations = tdString.split(", ");
    var largestDuration = 0;
    for (var i = 0; i < durations.length; i++) {
        var duration = durations[i].substr(0, durations[i].length - 1); //remove the s on the end
        duration = +duration;

        if (isNaN(duration)) {
            XML3D.debug.logError("Encountered an invalid duration for a CSS transition: "+tdString);
            duration = 1000;
        }

        largestDuration = Math.max(duration, largestDuration);
    }
    return largestDuration * 1000;
};

var activeTransitions = [];
css.addTransitionCallback = function(func, durationMS) {
    activeTransitions.push({func: func, endTime: Date.now() + durationMS});
};

var updateTransitions = function() {
    var currTime = Date.now();
    for (var i=0; i < activeTransitions.length; i++) {
        var transition = activeTransitions[i];
        transition.func();
        if (transition.endTime < currTime) {
            activeTransitions.splice(transition, 1);
            i--;
        }
    }
    window.requestAnimationFrame(updateTransitions);
};

window.requestAnimationFrame(updateTransitions);

css.matrix3dStringToMat4 = function(matrix3d) {
    var mat4 = new XML3D.Mat4();
    var chopped = matrix3d.replace("matrix3d(", "").replace(")","").split(", ");
    for (var i = 0; i < 16; i++) {
        var cval = +chopped[i];
        if (isNaN(cval)) {
            return new XML3D.Mat4();
        }
        mat4.data[i] = cval;
    }
    return mat4;
};

css.XML3DStyleElement = function() {
    var styleElement = document.createElement("style");
    styleElement.textContent = "xml3d * { display: inherit; }" +
        "float,float2,float3,float4,float4x4,int,int4,bool,texture,string,compute { display: none; } " +
        "mesh,model,group { position: relative; }";
    return styleElement;
};

(function () {
    var styleElement = css.XML3DStyleElement();
    document.head.appendChild(styleElement);
}());


module.exports = css;

