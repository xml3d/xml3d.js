(function (ns) {

    XML3D.math = require("gl-matrix");
    XML3D.math.bbox = require("./bbox.js");


    /**
     * Transforms the vec3 with a mat4.
     * 4th vector component is implicitly '0'
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the vector to transform
     * @param {mat4} m matrix to transform with
     * @returns {vec3} out
     */
    XML3D.math.vec3.transformDirection = function(out, a, m) {
        var x = a[0], y = a[1], z = a[2];
        out[0] = (m[0] * x + m[4] * y + m[8] * z);
        out[1] = (m[1] * x + m[5] * y + m[9] * z);
        out[2] = (m[2] * x + m[6] * y + m[10] * z);
        return out;
    };
}(module));
