(function (math) {

    /**
     * @class An axis aligned bounding box in the style of glMatrix
     * @name bbox
     */
    var bbox = {};

    /**
     * Creates a new, empty bounding box
     *
     * @returns {bbox} a new empty bounding box
     */
    bbox.create = function () {
        var out = new Float32Array(6);
        out[0] = Number.MAX_VALUE;
        out[1] = Number.MAX_VALUE;
        out[2] = Number.MAX_VALUE;
        out[3] = -Number.MAX_VALUE;
        out[4] = -Number.MAX_VALUE;
        out[5] = -Number.MAX_VALUE;
        return out;
    };

    bbox.clone = function (a) {
        var out = new Float32Array(6);
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        return out;
    };

    bbox.copy = function (out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        return out;
    };

    bbox.copyMin = function (target, source) {
        target[0] = source[0];
        target[1] = source[1];
        target[2] = source[2];
        return target;
    };

    bbox.copyMax = function (target, source) {
        target[0] = source[3];
        target[1] = source[4];
        target[2] = source[5];
        return target;
    };

    bbox.extendWithBox = function (target, other) {
        for (var i = 0; i < 3; i++) {
            target[i] = Math.min(other[i], target[i]);
            target[i + 3] = Math.max(other[i + 3], target[i + 3]);
        }
        return target;
    };

    bbox.empty = function (b) {
        b[0] = Number.MAX_VALUE;
        b[1] = Number.MAX_VALUE;
        b[2] = Number.MAX_VALUE;
        b[3] = -Number.MAX_VALUE;
        b[4] = -Number.MAX_VALUE;
        b[5] = -Number.MAX_VALUE;
        return b;
    };

    bbox.isEmpty = function (b) {
        return (b[0] > b[3] || b[1] > b[4] || b[2] > b[5]);
    };

    bbox.center = function (target, b) {
        target[0] = (b[0] + b[3]) * 0.5;
        target[1] = (b[1] + b[4]) * 0.5;
        target[2] = (b[2] + b[5]) * 0.5;
        return target;
    }

    bbox.size = function (target, b) {
        target[0] = b[3] - b[0];
        target[1] = b[4] - b[1];
        target[2] = b[5] - b[2];
        return target;
    };

    bbox.halfSize = function (target, b) {
        target[0] = (b[3] - b[0]) * 0.5;
        target[1] = (b[4] - b[1]) * 0.5;
        target[2] = (b[5] - b[2]) * 0.5;
        return target;
    };

    bbox.transform = (function () {
        var absMat = XML3D.math.mat4.create();
        var center = XML3D.math.vec3.create();
        var extend = XML3D.math.vec3.create();

        return function (out, mat, b) {
            if (b[0] > b[3] || b[1] > b[4] || b[2] > b[5])
                return;

            bbox.center(center, b);
            bbox.halfSize(extend, b);

            XML3D.math.mat4.copy(absMat, mat);
            absMat.set([0, 0, 0, 1], 12);
            for (var i = 0; i < 16; i++) {
                absMat[i] = Math.abs(absMat[i]);
            }

            XML3D.math.vec3.transformMat4(extend, extend, absMat);
            XML3D.math.vec3.transformMat4(center, center, mat);

            out[0] = center[0] - extend[0];
            out[1] = center[1] - extend[1];
            out[2] = center[2] - extend[2];
            out[3] = center[0] + extend[0];
            out[4] = center[1] + extend[1];
            out[5] = center[2] + extend[2];

            return out;
        }
    }());

    bbox.longestSide = function (b) {
        var x = Math.abs(b[3] - b[0]);
        var y = Math.abs(b[4] - b[1]);
        var z = Math.abs(b[5] - b[2]);
        return Math.max(x, Math.max(y, z));
    };

    bbox.asXML3DBox = function(bb) {
        var result = new XML3DBox();
        result.min._data[0] = bb[0];
        result.min._data[1] = bb[1];
        result.min._data[2] = bb[2];
        result.max._data[0] = bb[3];
        result.max._data[1] = bb[4];
        result.max._data[2] = bb[5];
        return result;
    };

    math.bbox = bbox;


}(XML3D.math)
    )
;