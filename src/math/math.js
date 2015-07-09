module.exports = function (math) {

// Additional methods in glMatrix style
    math.vec3.reciprocal = function (dest, vec) {
        if (!dest) {
            dest = vec;
        }

        dest[0] = 1 / vec[0];
        dest[1] = 1 / vec[1];
        dest[2] = 1 / vec[2];
        return dest;
    };

    var toDOMString = function(data) {
        return Array.prototype.join.call(data, ' ');
    };

    math.vec2.toDOMString = toDOMString;

    math.vec2.fromDOMString = function(str) {
        var s = str.split(' ');
        if (s.length !== 2 || isNaN(+s[0]) || isNaN(+s[1])) {
            throw "Could not parse '"+str+"' into a valid vec2 object";
        }
        return math.vec2.fromValues(+s[0], +s[1]);
    };

    math.vec3.toDOMString = toDOMString;

    math.vec3.fromDOMString = function(str) {
        var s = str.split(' ');
        if (s.length !== 3 || isNaN(+s[0]) || isNaN(+s[1]) || isNaN(+s[2])) {
            throw "Could not parse '"+str+"' into a valid vec3 object";
        }
        return math.vec3.fromValues(+s[0], +s[1], +s[2]);
    };


    math.vec4.toDOMString = toDOMString;

    math.vec4.fromDOMString = function(str) {
        var s = str.split(' ');
        if (s.length !== 4 || isNaN(+s[0]) || isNaN(+s[1]) || isNaN(+s[2]) || isNaN(+s[3])) {
            throw "Could not parse '"+str+"' into a valid vec4 or quat object";
        }
        return math.vec4.fromValues(+s[0], +s[1], +s[2], +s[3]);
    };

    math.quat.toDOMString = toDOMString;

    math.quat.fromDOMString = math.vec4.fromDOMString;

    math.mat3.toDOMString = toDOMString;

    math.mat3.fromDOMString = function(str) {
        var s = str.split(' ');
        if (s.length !== 9) {
            throw "Could not parse '"+str+"' into a valid mat3 object";
        }
        var mat = math.mat3.create();
        for (var i=0; i<9; i++) {
            mat[i] = +s[i];
            if (isNaN(mat[i])) {
                throw "Could not parse '"+str+"' into a valid mat3 object";
            }
        }
        return mat;
    };

    math.mat4.toDOMString = toDOMString;

    math.mat4.fromDOMString = function(str) {
        var s = str.split(' ');
        if (s.length !== 16) {
            throw "Could not parse '"+str+"' into a valid mat4 object";
        }
        var mat = math.mat4.create();
        for (var i=0; i<16; i++) {
            mat[i] = +s[i];
            if (isNaN(mat[i])) {
                throw "Could not parse '"+str+"' into a valid mat4 object";
            }
        }
        return mat;
    };


    math.mat4.multiplyOffsetVec3 = function (mat, matOffset, vec, vecOffset, dest) {
        if (!dest) {
            dest = vec;
        }
        if (!vecOffset) {
            vecOffset = 0;
        }

        var x = vec[vecOffset + 0], y = vec[vecOffset + 1], z = vec[vecOffset + 2];

        dest[0] = mat[matOffset + 0] * x + mat[matOffset + 4] * y + mat[matOffset + 8] * z + mat[matOffset + 12];
        dest[1] = mat[matOffset + 1] * x + mat[matOffset + 5] * y + mat[matOffset + 9] * z + mat[matOffset + 13];
        dest[2] = mat[matOffset + 2] * x + mat[matOffset + 6] * y + mat[matOffset + 10] * z + mat[matOffset + 14];

        return dest;
    };


    math.mat4.multiplyOffsetDirection = function (mat, matOffset, vec, vecOffset, dest) {
        if (!dest) {
            dest = vec;
        }
        if (!vecOffset) {
            vecOffset = 0;
        }

        var x = vec[vecOffset + 0], y = vec[vecOffset + 1], z = vec[vecOffset + 2], w;

        dest[0] = mat[matOffset + 0] * x + mat[matOffset + 4] * y + mat[matOffset + 8] * z;
        dest[1] = mat[matOffset + 1] * x + mat[matOffset + 5] * y + mat[matOffset + 9] * z;
        dest[2] = mat[matOffset + 2] * x + mat[matOffset + 6] * y + mat[matOffset + 10] * z;

        return dest;
    };

    math.mat4.multiplyOffset = function (dest, destOffset, mat, offset1, mat2, offset2) {
        var a00 = mat2[offset2 + 0], a01 = mat2[offset2 + 1], a02 = mat2[offset2 + 2], a03 = mat2[offset2 + 3];
        var a10 = mat2[offset2 + 4], a11 = mat2[offset2 + 5], a12 = mat2[offset2 + 6], a13 = mat2[offset2 + 7];
        var a20 = mat2[offset2 + 8], a21 = mat2[offset2 + 9], a22 = mat2[offset2 + 10], a23 = mat2[offset2 + 11];
        var a30 = mat2[offset2 + 12], a31 = mat2[offset2 + 13], a32 = mat2[offset2 + 14], a33 = mat2[offset2 + 15];

        var b00 = mat[offset1 + 0], b01 = mat[offset1 + 1], b02 = mat[offset1 + 2], b03 = mat[offset1 + 3];
        var b10 = mat[offset1 + 4], b11 = mat[offset1 + 5], b12 = mat[offset1 + 6], b13 = mat[offset1 + 7];
        var b20 = mat[offset1 + 8], b21 = mat[offset1 + 9], b22 = mat[offset1 + 10], b23 = mat[offset1 + 11];
        var b30 = mat[offset1 + 12], b31 = mat[offset1 + 13], b32 = mat[offset1 + 14], b33 = mat[offset1 + 15];

        dest[destOffset + 0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
        dest[destOffset + 1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
        dest[destOffset + 2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
        dest[destOffset + 3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
        dest[destOffset + 4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
        dest[destOffset + 5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
        dest[destOffset + 6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
        dest[destOffset + 7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
        dest[destOffset + 8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
        dest[destOffset + 9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
        dest[destOffset + 10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
        dest[destOffset + 11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
        dest[destOffset + 12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
        dest[destOffset + 13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
        dest[destOffset + 14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
        dest[destOffset + 15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
    };

    math.quat.slerpOffset = function (quat, offset1, quat2, offset2, t, dest, destOffset, shortest) {
        if (!dest) {
            dest = quat;
        }

        var ix1 = offset1, iy1 = offset1 + 1, iz1 = offset1 + 2, iw1 = offset1 + 3;
        var ix2 = offset2, iy2 = offset2 + 1, iz2 = offset2 + 2, iw2 = offset2 + 3;
        var ixd = destOffset, iyd = destOffset + 1, izd = destOffset + 2, iwd = destOffset + 3;

        var cosAngle = quat[ix1] * quat2[ix2] + quat[iy1] * quat2[iy2] + quat[iz1] * quat2[iz2] + quat[iw1] * quat2[iw2];

        var c1, c2;

        // Linear interpolation for close orientations
        if ((1.0 - Math.abs(cosAngle)) < 0.01) {
            c1 = 1.0 - t;
            c2 = t;
        } else {
            // Spherical interpolation
            var angle = Math.acos(Math.abs(cosAngle));
            var sinAngle = Math.sin(angle);
            c1 = Math.sin(angle * (1.0 - t)) / sinAngle;
            c2 = Math.sin(angle * t) / sinAngle;
        }

        // Use the shortest path
        if (shortest && (cosAngle < 0.0))
            c1 = -c1;

        dest[ixd] = c1 * quat[ix1] + c2 * quat2[ix2];
        dest[iyd] = c1 * quat[iy1] + c2 * quat2[iy2];
        dest[izd] = c1 * quat[iz1] + c2 * quat2[iz2];
        dest[iwd] = c1 * quat[iw1] + c2 * quat2[iw2];
    };

    math.quat.fromAxisAngle = function(axis, angle) {
        var q = math.quat.create();
        if (axis.length === 4 && angle === undefined) {
            math.quat.setAxisAngle(q, axis, axis[3]);
        } else {
            math.quat.setAxisAngle(q, axis, angle);
        }
        return math.quat.normalize(q,q);
    };

    /**
     * Transforms the vec3 with a mat4.
     * 4th vector component is implicitly '0'
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the vector to transform
     * @param {mat4} m matrix to transform with
     * @returns {vec3} out
     */
    math.vec3.transformDirection = function(out, a, m) {
        var x = a[0], y = a[1], z = a[2];
        out[0] = (m[0] * x + m[4] * y + m[8] * z);
        out[1] = (m[1] * x + m[5] * y + m[9] * z);
        out[2] = (m[2] * x + m[6] * y + m[10] * z);
        return out;
    };

    math.quat.setFromMat3 = function(dest, m) {
        var tr = m[0] + m[4] + m[8];

        if (tr > 0) {
            var s = Math.sqrt(tr + 1.0) * 2; // s=4*dest[3]
            dest[0] = (m[7] - m[5]) / s;
            dest[1] = (m[2] - m[6]) / s;
            dest[2] = (m[3] - m[1]) / s;
            dest[3] = 0.25 * s;
        } else if ((m[0] > m[4]) && (m[0] > m[8])) {
            var s = Math.sqrt(1.0 + m[0] - m[4] - m[8]) * 2; // s=4*qx
            dest[3] = (m[7] - m[5]) / s;
            dest[0] = 0.25 * s;
            dest[1] = (m[1] + m[3]) / s;
            dest[2] = (m[2] + m[6]) / s;
        } else if (m[4] > m[8]) {
            var s = Math.sqrt(1.0 + m[4] - m[0] - m[8]) * 2; // s=4*qy
            dest[3] = (m[2] - m[6]) / s;
            dest[0] = (m[1] + m[3]) / s;
            dest[1] = 0.25 * s;
            dest[2] = (m[5] + m[7]) / s;
        } else {
            var s = Math.sqrt(1.0 + m[8] - m[0] - m[4]) * 2; // s=4*qz
            dest[3] = (m[3] - m[1]) / s;
            dest[0] = (m[2] + m[6]) / s;
            dest[1] = (m[5] + m[7]) / s;
            dest[2] = 0.25 * s;
        }
        return dest;
    };

    math.quat.setFromBasis = function(dest, X,Y,Z) {
        var lx = 1.0 / XML3D.math.vec3.length(X);
        var ly = 1.0 / XML3D.math.vec3.length(Y);
        var lz = 1.0 / XML3D.math.vec3.length(Z);
        var m = XML3D.math.mat3.create();
        m[0] = X[0] * lx;
        m[1] = Y[0] * ly;
        m[2] = Z[0] * lz;
        m[3] = X[1] * lx;
        m[4] = Y[1] * ly;
        m[5] = Z[1] * lz;
        m[6] = X[2] * lx;
        m[7] = Y[2] * ly;
        m[8] = Z[2] * lz;
        return XML3D.math.quat.setFromMat3(dest, m);
    };

    math.vec4.fromQuat = function(q) {
        var dest = XML3D.math.vec4.create();
        if (q[3] > 1) {
            XML3D.math.quat.normalize(q,q);
        }
        var s = Math.sqrt(1-q[3]*q[3]);
        var angle = 2*Math.acos(q[3]);
        if (s < 0.0001) {
            // Axis is practically 0 so we return the identity quaternion
            dest[0] = 0;
            dest[1] = 0;
            dest[2] = 0;
            dest[3] = 1;
        } else {
            dest[0] = q[0] / s;
            dest[1] = q[1] / s;
            dest[2] = q[2] / s;
            dest[3] = angle;
        }
        return dest;
    };


};
