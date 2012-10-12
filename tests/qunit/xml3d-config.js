QUnit.extend( QUnit, {

    /** Small helper function for not having to manually compare vectors
     *  all the time.
     */
    __passesVector : function(actual, expected, maxDifference) {

        return (Math.abs(actual.x - expected.x) <= maxDifference &&
                Math.abs(actual.y - expected.y) <= maxDifference &&
                Math.abs(actual.z - expected.z) <= maxDifference);
    },

    closeVector : function(actual, expected, maxDifference, message) {
        var passes = (actual === expected) ||
            QUnit.__passesVector(actual, expected, maxDifference);
        QUnit.push(passes, actual, expected, message);
    },

    closeRotation : function(actual, expected, maxDifference, message) {
        var passes = (actual === expected) ||
            QUnit.__passesVector(actual.axis, expected.axis, maxDifference) &&
            (Math.abs((actual.angle % Math.PI) - (expected.angle % Math.PI)) <= maxDifference);
        QUnit.push(passes, actual, expected, message);
    },

    closeMatrix  : function(actual, expected, maxDifference, message) {
        if(!actual || !expected) {
            QUnit.push(actual === expected, actual, expected, message);
            return;
        }

        var passes =
            Math.abs(actual.m11 - expected.m11) <= maxDifference &&
            Math.abs(actual.m12 - expected.m12) <= maxDifference &&
            Math.abs(actual.m13 - expected.m13) <= maxDifference &&
            Math.abs(actual.m14 - expected.m14) <= maxDifference &&
            Math.abs(actual.m21 - expected.m21) <= maxDifference &&
            Math.abs(actual.m22 - expected.m22) <= maxDifference &&
            Math.abs(actual.m23 - expected.m23) <= maxDifference &&
            Math.abs(actual.m24 - expected.m24) <= maxDifference &&
            Math.abs(actual.m31 - expected.m31) <= maxDifference &&
            Math.abs(actual.m32 - expected.m32) <= maxDifference &&
            Math.abs(actual.m33 - expected.m33) <= maxDifference &&
            Math.abs(actual.m34 - expected.m34) <= maxDifference &&
            Math.abs(actual.m41 - expected.m41) <= maxDifference &&
            Math.abs(actual.m42 - expected.m42) <= maxDifference &&
            Math.abs(actual.m43 - expected.m43) <= maxDifference &&
            Math.abs(actual.m44 - expected.m44) <= maxDifference ;
        QUnit.push(passes, actual, expected, message);
    },

    closeRay : function(actual, expected, maxDifference, message) {
        var passes =
            QUnit.__passesVector(actual.origin, expected.origin, maxDifference) &&
            QUnit.__passesVector(actual.direction, expected.direction, maxDifference);
        QUnit.push(passes, actual, expected, message);
    },

    closeBox : function(actual, expected, maxDifference, message) {
        var passes = actual.isEmpty() ? expected.isEmpty() :
            QUnit.__passesVector(actual.min, expected.min, maxDifference) &&
            QUnit.__passesVector(actual.max, expected.max, maxDifference);
        QUnit.push(passes, actual, expected, message);
    },

    closePixel : function(actual, expected, maxDifference, message) {
        var passes = (actual === expected) ||
        Math.abs(actual[0] - expected[0]) <= maxDifference &&
        Math.abs(actual[1] - expected[1]) <= maxDifference &&
        Math.abs(actual[2] - expected[2]) <= maxDifference &&
        Math.abs(actual[3] - expected[3]) <= maxDifference;
        QUnit.push(passes, actual, expected, message);
    },

    closeArray : function(actual, expected, maxDifference, message) {
        if (actual.toString() != expected.toString())
            QUnit.push(false, actual, expected, message);

        if (actual.length != expected.length)
            QUnit.push(false, actual, expected, message);

        for (var i=0; i<actual.length; i++) {
            if (Math.abs(actual[i] - expected[i]) > maxDifference) {
                QUnit.push(false, actual, expected, message);
                return;
            }
        }
        QUnit.push(true, actual, expected, message);
    }
});
new (function() {

    function isVec3(arg) { return arg.toString() == '[object XML3DVec3]';};
    function isRotation(arg) { return arg.toString() == '[object XML3DRotation]';};
    function isBox(arg) { return arg.toString() == '[object XML3DBox]';};
    function isMatrix(arg) {
        if (arg.toString() == '[object XML3DMatrix]')
            return true;
        if (window.WebKitCSSMatrix)
            return arg instanceof window.WebKitCSSMatrix;
        return false;
    };
    function isFloatArray(arg) {
        return arg.toString() == '[object Float32Array]';
    };
    function isIntArray(arg) {
        return arg.toString() == '[object Int32Array]';
    }

    var original = QUnit.jsDump.parsers.object;
    QUnit.jsDump.setParser("object", function(a,b) {
        if(!a) return original(a,b);
        if(isVec3(a))
            return "XML3DVec("+a.x+", "+a.y+", "+a.z+")";
        if(isRotation(a))
            return "XML3DRotation("+a.axis.x+", "+a.axis.y+", "+a.axis.z+", "+ a.angle+")";
        if(isMatrix(a))
            return 'XML3DMatrix(\n' +
            a.m11 + ", " +  a.m12 + ", " +  a.m13 + ", " +  a.m14 + "\n" +
            a.m21 + ", " +  a.m22 + ", " +  a.m23 + ", " +  a.m24 + "\n" +
            a.m31 + ", " +  a.m32 + ", " +  a.m33 + ", " +  a.m34 + "\n" +
            a.m41 + ", " +  a.m42 + ", " +  a.m43 + ", " +  a.m44 + ")";
        if(isBox(a))
            return a.isEmpty() ? "XML3DBox(empty)" : "XML3DBox(("+a.min.x+", "+a.min.y+", "+a.min.z+"),("+a.max.x+", "+a.max.y+", "+a.max.z+"))";
        if(isFloatArray(a)) {
            var str = "Float32Array[";
            for (var i=0; i < a.length; i++)
                str += " "+a[i];
            return str + " ]";
        }
        if(isIntArray(a)) {
            var str = "Int32Array[";
            for (var i=0; i < a.length; i++)
                str += " "+a[i];
            return str + " ]";
        }
        return original(a,b);
    });
})();

var loadDocument = function(url, f) {
    var v = document.getElementById("xml3dframe");
    ok(v, "Found frame.");
    v.addEventListener("load", f, true);
    v.src = url;
};

var EPSILON = 0.0001;
QUnit.config.testTimeout = 20000;
XML3DUnit = {};

XML3DUnit.getRendererString = function() {
    var canvas = document.createElement("canvas");
    var context = null;

    result = "Renderer: ";
    if(XML3D._native)
    {
        return result + "Native";
    }

    try {
      context = canvas.getContext("webgl");
    } catch(e) {
    }
    if (!context) {
      try {
        context = canvas.getContext("experimental-webgl");
      } catch(e) {
      }
    }
    if (!context) {
        result += "none found";
    } else {
        var ext = context.getExtension("WEBGL_debug_renderer_info");
        result += "WebGL";
        if (ext) {
            result += context.getParameter(ext.UNMASKED_VENDOR_WEBGL);
            result += context.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        }
    }
    return result;
};

XML3DUnit.loadSceneTestImages = function(doc, refSceneId, testSceneId, callback){
    var xRef = doc.getElementById(refSceneId),
        glRef = getContextForXml3DElement(xRef);
    var xTest = doc.getElementById(testSceneId),
        glTest = getContextForXml3DElement(xTest);

    var refImagesLoaded = 0;
    function onLoad(){
        refImagesLoaded++;
        if(refImagesLoaded == 2)
            callback(refImage, testImage);
    }

    var refImage = new Image();
    refImage.onload = onLoad;
    refImage.src = glRef.canvas.toDataURL();
    var testImage = new Image();
    testImage.onload = onLoad;
    testImage.src = glTest.canvas.toDataURL();
};

XML3DUnit.getPixelValue = function(canvas, x,y) {
    var pixels = new Uint8Array(4), a = new Array(4);
    canvas.readPixels(x, y, 1, 1, WebGLRenderingContext.RGBA, WebGLRenderingContext.UNSIGNED_BYTE, pixels);
    for(var i=0;i < 4;i++)
        a[i] = pixels[i];
    return a;
};

XML3DUnit.pixelsAreEqual = function(actual, shouldBe){
    return actual[0] == shouldBe[0] &&
            actual[1] == shouldBe[1] &&
            actual[2] == shouldBe[2] &&
            actual[3] == shouldBe[3];
}