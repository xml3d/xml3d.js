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

    bbox.transform = function (out, mat, box) {
        if (box[0] > box[3] || box[1] > box[4] || box[2] > box[5]) {
            bbox.copy(out, box); // an empty box remains empty
            return;
        }
        box = bbox.clone(box);

        if (mat[3] == 0 && mat[7] == 0 && mat[11] == 0 && mat[15] == 1) {

            for (var i = 0; i < 3; i++) {
                out[i] = out[i + 3] = mat[12 + i];

                for (var j = 0; j < 3; j++) {
                    var a, b;

                    a = mat[j * 4 + i] * box[j];
                    b = mat[j * 4 + i] * box[j + 3];

                    if (a < b) {
                        out[i] += a;
                        out[i + 3] += b;
                    }
                    else {
                        out[i] += b;
                        out[i + 3] += a;
                    }
                }
            }
            return out;
        }
        throw new Error("Matrix is not affine");
    };

    bbox.transform2 = (function () {
        var absMat = XML3D.math.mat4.create();
        var center = XML3D.math.vec3.create();
        var extend = XML3D.math.vec3.create();

        return function (out, mat, box) {

            bbox.center(center, box);
            bbox.halfSize(extend, box);

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

    /**
     * Tests a given ray against a given bounding box and returns true if the ray intersects it, false otherwise.
     * @param bb The axis aligned bounding box to test against
     * @param xml3dRay The ray to test for intersection with
     * @param opt {object} If opt.dist is provided the function will fill it with the distance from the ray origin to
     *                     the hit point on the bounding box, or MAX_VALUE if the ray does not intersect.
     * @returns {boolean}
     */
    bbox.intersects = function(bb, xml3dRay, opt) {
        var inverseDirX = 1 / xml3dRay._direction.x;
        var inverseDirY = 1 / xml3dRay._direction.y;
        var inverseDirZ = 1 / xml3dRay._direction.z;

        var t1 = (bb[0] - xml3dRay._origin.x) * inverseDirX;
        var t2 = (bb[3] - xml3dRay._origin.x) * inverseDirX;
        var t3 = (bb[1] - xml3dRay._origin.y) * inverseDirY;
        var t4 = (bb[4] - xml3dRay._origin.y) * inverseDirY;
        var t5 = (bb[2] - xml3dRay._origin.z) * inverseDirZ;
        var t6 = (bb[5] - xml3dRay._origin.z) * inverseDirZ;

        var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
        var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

        if (opt === undefined || opt.dist === undefined) {
            return tmax > 0 && tmin <= tmax;
        }

        if (tmax < 0) {
            opt.dist = Number.MAX_VALUE;
            return false;
        }

        if (tmin > tmax) {
            opt.dist = Number.MAX_VALUE;
            return false;
        }

        opt.dist = tmin;
        return true;
    };

    bbox.asXML3DBox = function (bb) {
        var result = new window.XML3DBox();
        result.min._data[0] = bb[0];
        result.min._data[1] = bb[1];
        result.min._data[2] = bb[2];
        result.max._data[0] = bb[3];
        result.max._data[1] = bb[4];
        result.max._data[2] = bb[5];
        return result;
    };

    bbox.fromXML3DBox = function(bb) {
        var out = new Float32Array(6);
        out[0] = bb.min._data[0];
        out[1] = bb.min._data[1];
        out[2] = bb.min._data[2];
        out[3] = bb.max._data[0];
        out[4] = bb.max._data[1];
        out[5] = bb.max._data[2];
        return out;
    }

    bbox.str = function (a) {
        return 'bbox(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
            a[4] + ', ' + a[5] + ')';
    };


    math.bbox = bbox;
    math.EMPTY_BOX = bbox.create();


}(XML3D.math)
    )
;
