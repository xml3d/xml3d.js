QUnit.extend( QUnit, {

    /** Small helper function for not having to manually compare vectors
     *  all the time.
     */
    __passesVector : function(actual, expected, maxDifference) {
        if (actual.data) actual = actual.data;
        if (expected.data) expected = expected.data;
        return (Math.abs(actual[0] - expected[0]) <= maxDifference &&
                Math.abs(actual[1] - expected[1]) <= maxDifference &&
                Math.abs(actual[2] - expected[2]) <= maxDifference);
    },

    closeVector : function(actual, expected, maxDifference, message) {
        if (actual.data) actual = actual.data;
        if (expected.data) expected = expected.data;
        var passes = (actual === expected) ||
            QUnit.__passesVector(actual, expected, maxDifference);
        QUnit.push(passes, actual, expected, message);
    },

    closeRotation : function(actual, expected, maxDifference, message) {
        if (actual.data) actual = actual.data;
        if (expected.data) expected = expected.data;
        var passes = (actual === expected) ||
            QUnit.__passesVector(actual, expected, maxDifference) &&
            (Math.abs((actual[3] % Math.PI) - (expected[3] % Math.PI)) <= maxDifference);
        QUnit.push(passes, actual, expected, message);
    },

    closeMatrix  : function(actual, expected, maxDifference, message) {
        if(!actual || !expected) {
            QUnit.push(actual === expected, actual, expected, message);
            return;
        }

        if (actual.data) {
            actual = actual.data;
        }

        if (expected.data) {
            expected = expected.data;
        }

        var passes =
            Math.abs(actual[0] - expected[0]) <= maxDifference &&
            Math.abs(actual[1] - expected[1]) <= maxDifference &&
            Math.abs(actual[2] - expected[2]) <= maxDifference &&
            Math.abs(actual[3] - expected[3]) <= maxDifference &&
            Math.abs(actual[4] - expected[4]) <= maxDifference &&
            Math.abs(actual[5] - expected[5]) <= maxDifference &&
            Math.abs(actual[6] - expected[6]) <= maxDifference &&
            Math.abs(actual[7] - expected[7]) <= maxDifference &&
            Math.abs(actual[8] - expected[8]) <= maxDifference &&
            Math.abs(actual[9] - expected[9]) <= maxDifference &&
            Math.abs(actual[10] - expected[10]) <= maxDifference &&
            Math.abs(actual[11] - expected[11]) <= maxDifference &&
            Math.abs(actual[12] - expected[12]) <= maxDifference &&
            Math.abs(actual[13] - expected[13]) <= maxDifference &&
            Math.abs(actual[14] - expected[14]) <= maxDifference &&
            Math.abs(actual[15] - expected[15]) <= maxDifference ;
        QUnit.push(passes, actual, expected, message);
    },

    closeRay : function(actual, expected, maxDifference, message) {
        var ray = XML3D.math.ray;
        var passes =
            QUnit.__passesVector(ray.origin(actual), ray.origin(expected), maxDifference) &&
            QUnit.__passesVector(ray.direction(actual), ray.direction(expected), maxDifference);
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

    closeArray : function(actual, expected, maxDifference, message, isImage) {

        isImage = isImage == undefined ? false : true;

        if(!actual || actual.length !== expected.length || isNaN(actual.length)){
            QUnit.push(false, actual, expected, message);
            return;
        }

        for (var i=0; i<actual.length; i++) {
            var diff = Math.abs(actual[i] - expected[i]);
            if (isNaN(diff)  || diff > maxDifference) {
                if(isImage) {
                    QUnit.push(false, actual.length, expected.length, message);
                } else {
                    QUnit.push(false, actual, expected, message);
                }
                return;
            }
        }
        QUnit.push(true, actual, expected, message);
    }
});
new (function() {

    function isVec3(arg) { return arg.length === 3;}
    function isRotation(arg) { return arg.length === 4}
    function isBox(arg) { return arg.length === 6 }
    function isMatrix(arg) {
        if (arg.length === 16)
            return true;
        if (window.WebKitCSSMatrix)
            return arg instanceof window.WebKitCSSMatrix;
        return false;
    }
    function isFloatArray(arg) {
        return arg.toString() == '[object Float32Array]';
    }
    function isIntArray(arg) {
        return arg.toString() == '[object Int32Array]';
    }

    var original = QUnit.jsDump.parsers.object;
    QUnit.jsDump.setParser("object", function(a,b) {
        if(!a) return original(a,b);
        if (a.data) {
            a = a.data;
        }
        if(isVec3(a))
            return "vec3("+a[0]+", "+a[1]+", "+a[2]+")";
        if(isRotation(a))
            return "vec4("+a[0]+", "+a[1]+", "+a[2]+", "+ a[3]+")";
        if(isMatrix(a))
            return 'mat(\n' +
            a[0] + ", " +  a[1] + ", " +  a[2] + ", " +  a[3] + "\n" +
            a[4] + ", " +  a[5] + ", " +  a[6] + ", " +  a[7] + "\n" +
            a[8] + ", " +  a[9] + ", " +  a[10] + ", " +  a[11] + "\n" +
            a[12] + ", " +  a[13] + ", " +  a[14] + ", " +  a[15] + ")";
        if(isBox(a))
            return "bbox(("+ a[0]+", "+ a[1]+", "+ a[2]+"),("+ a[3]+", "+ a[4]+", "+ a[5]+"))";
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
var PIXEL_EPSILON = 1;

QUnit.config.testTimeout = 5000;
QUnit.config.hidepassed = true;

XML3DUnit = {};

XML3DUnit.getRendererString = function() {
    var canvas = document.createElement("canvas");
    var context = null, result = "";

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
        if (ext) {
            result += "WebGL Vendor: " + context.getParameter(ext.UNMASKED_VENDOR_WEBGL);
            result += "<br>WebGL Renderer: " + context.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        }
    }
    return result;
};

XML3DUnit.readScenePixels = function(xml3dElement) {
    var context = getContextForXml3DElement(xml3dElement);
    var canvas = context.canvas;

    var scenePixels = new Uint8Array(canvas.width*canvas.height*4);
    context.readPixels(0, 0, canvas.width, canvas.height, WebGLRenderingContext.RGBA, WebGLRenderingContext.UNSIGNED_BYTE, scenePixels);
    return scenePixels;
}

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

function promiseIFrameLoaded(url) {
    var v = document.getElementById("xml3dframe");

    ok(v, "Found iframe.");
    var deferred = Q.defer();

    var f = function(e) {
        deferred.resolve(v.contentDocument);
        v.removeEventListener("load", f, true);
    };
    // TODO: Loading failed
    v.addEventListener("load", f, true);
    v.src = url;
    return deferred.promise;
};

function promiseOneSceneCompleteAndRendered(xml3dElement) {
    if(xml3dElement.complete) {
        return Q(xml3dElement);
    }
    var deferred = Q.defer();
    var f = function(e) {
        // Child elements dispact load events as well
        if(e.target != xml3dElement) {
            return;
        }
        xml3dElement.removeEventListener("load", f, true);
        deferred.resolve(xml3dElement);
    };
    xml3dElement.addEventListener("load", f, true);
    return deferred.promise;
}

function promiseSceneRendered(xml3dElement, returnEvent) {
    var renderer = getRenderer(xml3dElement);
    var glContext = getContextForXml3DElement(xml3dElement);
    var deferred = Q.defer();

    var first = true;
    var f = function(e) {
        if(first) {
            first = false;
            renderer.requestRedraw("test-triggered");
            return;
        }
        xml3dElement.removeEventListener("framedrawn", f, true);
        XML3DUnit.getPixelValue(glContext, 1, 1);
        window.setTimeout(function() {
            deferred.resolve(returnEvent ? e : xml3dElement);
        }, 100);
    };

    xml3dElement.addEventListener("framedrawn",f,false);
    renderer.requestRedraw("test-triggered");
    return deferred.promise;
}

function promiseSceneRenderedEvent(xml3dElement) {
    return promiseSceneRendered(xml3dElement, true);
}

function getWebGLAdapter(x) {
    var window = x.ownerDocument.defaultView ?x.ownerDocument.defaultView : x.ownerDocument.parentWindow;
    window.XML3D.flushDOMChanges();
    if(x._configured){
        for(var i in x._configured.adapters){
            if(i.indexOf("webgl") == 0){
                return x._configured.adapters[i];
            }
        }
    }
    return null;
}

function getWebGLFactory(x) {
    var adapter = getWebGLAdapter(x);
    return adapter ? adapter.factory : null;
}
