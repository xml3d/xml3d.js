(function (module) {
    /**
     * @class A ray in the style of glMatrix
     * @name ray
     */
    var ray = {};

    /**
     * Creates a new, ray with origin (0,0,0) and direction (0,0,-1)
     *
     * @returns {ray} a new default ray
     */
    ray.create = function () {
        var out = new Float32Array(6);
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = -1;
        return out;
    };

    ray.fromOriginDirection = function(origin, direction) {
        var out = ray.create();
        ray.setOrigin(out, origin);
        ray.setDirection(out, direction);
        return out;
    };

    ray.clone = function (a) {
        var out = new Float32Array(6);
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        return out;
    };

    ray.copy = function (out, a) {
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        return out;
    };

    ray.copyOrigin = function (target, source) {
        target[0] = source[0];
        target[1] = source[1];
        target[2] = source[2];
        return target;
    };

    ray.copyDirection = function (target, source) {
        target[3] = source[3];
        target[4] = source[4];
        target[5] = source[5];
        return target;
    };

    ray.origin = function(a) {
        return a.subarray(0,3);
    };

    ray.direction = function(a) {
        return a.subarray(3,6);
    };

    ray.setOrigin = function(ray, origin) {
        ray[0] = origin[0];
        ray[1] = origin[1];
        ray[2] = origin[2];
        return ray;
    };

    ray.setDirection = function(ray, direction) {
        XML3D.math.vec3.normalize(ray.subarray(3,6), direction);
    };

    ray.str = function (a) {
        return 'ray(origin: ' + a[0] + ', ' + a[1] + ', ' + a[2] + ', direction: ' + a[3] + ', ' +
            a[4] + ', ' + a[5] + ')';
    };

    module.exports = ray;

})(module);