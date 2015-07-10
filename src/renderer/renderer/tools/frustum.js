var vec3 = require("gl-matrix").vec3;
var tmp1 = new XML3D.Vec3();
var tmp2 = new XML3D.Vec3();


/**
 *
 * @param {number} nearPlane
 * @param {number} farPlane
 * @param {number} fovx
 * @param {number} fovy
 * @param {number} aspect
 * @param {boolean} orthographic
 * @constructor
 */
var Frustum = function (nearPlane, farPlane, fovx, fovy, aspect, orthographic) {
    /**
     *
     * @type {boolean}
     */
    if (typeof(orthographic) === "undefined")
        this.orthographic = false; else
        this.orthographic = orthographic;
    this.setFrustum(nearPlane, farPlane, fovx, fovy, aspect, this.orthographic);
};

XML3D.extend(Frustum.prototype, {
    setFrustum: function (nearPlane, farPlane, fovx, fovy, aspect, orthographic) {
        if (fovx && fovy)
            throw new Error("fovx and fovy cannot both be non-zero.");

        if (fovx) {
            this.right = nearPlane * Math.tan(fovx / 2);
            this.left = -this.right;
            this.top = ((this.right - this.left) / aspect) / 2;
            this.bottom = -this.top;
        } else {
            this.top = nearPlane * Math.tan(0.5 * fovy);
            this.bottom = -this.top;
            this.right = (this.top - this.bottom) * aspect / 2;
            this.left = -this.right;
        }
        this.nearPlane = nearPlane;
        this.farPlane = farPlane;

        if (typeof(orthographic) === "undefined")
            this.orthographic = false; else
            this.orthographic = orthographic;

    },

    getProjectionMatrix: function (matrix) {
        var limitMax = Number.MAX_VALUE;
        var rightPlusLeft = this.right + this.left;
        var rightMinusLeft = this.right - this.left;

        var topPlusBottom = this.top + this.bottom;
        var topMinusBottom = this.top - this.bottom;

        var farPlusNear = this.farPlane + this.nearPlane;
        var farMinusNear = this.farPlane - this.nearPlane;

        if ((Math.abs(rightMinusLeft) < 1 && Math.abs(rightPlusLeft) > limitMax * Math.abs(rightMinusLeft)) || (Math.abs(topMinusBottom) < 1 && Math.abs(topPlusBottom) > limitMax * Math.abs(topMinusBottom)) || (Math.abs(farMinusNear) < 1 && Math.abs(farPlusNear) > limitMax * Math.abs(farMinusNear))) {
            throw new Error("Bad viewing frustum: projection matrix cannot be computed.");
        }

        var A, B, C, D, E, F;
        var m = matrix.data ? matrix.data : matrix;

        if (this.orthographic) {
            var tx = -rightPlusLeft / rightMinusLeft;
            var ty = -topPlusBottom / topMinusBottom;
            var tz = -farPlusNear / farMinusNear;

            if ((Math.abs(rightMinusLeft) < 1 && 2 > limitMax * Math.abs(rightMinusLeft)) || (Math.abs(topMinusBottom) < 1 && 2 > limitMax * Math.abs(topMinusBottom)) || (Math.abs(farMinusNear) < 1 && 2 > limitMax * Math.abs(farMinusNear))) {
                throw new Error("Bad viewing frustum:  projection matrix cannot be computed.");
            }

            A = 2 / rightMinusLeft;
            B = 2 / topMinusBottom;
            C = -2 / farMinusNear;

            XML3D.math.mat4.identity(m);
            m[0] = A;
            m[5] = B;
            m[10] = C;
            m[12] = tx;
            m[13] = ty;
            m[14] = tz;
            m[15] = 1.0;
        } else {
            A = rightPlusLeft / rightMinusLeft;
            B = topPlusBottom / topMinusBottom;
            C = -farPlusNear / farMinusNear;

            var farTimesNear = -2 * this.farPlane * this.nearPlane;
            if (Math.abs(farMinusNear) < 1 && Math.abs(farTimesNear) > limitMax * Math.abs(farMinusNear)) {
                throw new Error("Bad viewing frustum: projection matrix cannot be computed.");
            }

            D = farTimesNear / farMinusNear;

            var twoTimesNear = 2 * this.nearPlane;

            if ((Math.abs(rightMinusLeft) < 1 && Math.abs(twoTimesNear) > limitMax * Math.abs(rightMinusLeft)) || (Math.abs(topMinusBottom) < 1 && Math.abs(twoTimesNear) > limitMax * Math.abs(topMinusBottom))) {
                throw new Error("Bad viewing frustum: projection matrix cannot be computed.");
            }

            E = twoTimesNear / rightMinusLeft;
            F = twoTimesNear / topMinusBottom;

            XML3D.math.mat4.identity(m);
            m[0] = E;
            m[5] = F;
            m[8] = A;
            m[9] = B;
            m[10] = C;
            m[11] = -1;
            m[14] = D;
            m[15] = 0;
        }
    },

    getPlanes: (function () {

        var c_a = new XML3D.Vec3();
        var c_b = new XML3D.Vec3();
        var c_c = new XML3D.Vec3();
        var c_d = new XML3D.Vec3();

        var c_e = new XML3D.Vec3();
        var c_f = new XML3D.Vec3();
        var c_g = new XML3D.Vec3();
        var c_o = new XML3D.Vec3();


        return function (planes, M) {
            var a = vec3.transformMat4(c_a.data, [this.left, this.bottom, -this.nearPlane], M.data);
            var b = vec3.transformMat4(c_b.data, [this.left, this.top, -this.nearPlane], M.data);
            var c = vec3.transformMat4(c_c.data, [this.right, this.top, -this.nearPlane], M.data);
            var d = vec3.transformMat4(c_d.data, [this.right, this.bottom, -this.nearPlane], M.data);
            var e, f, g, h, o;
            if (!this.orthographic) {
                var s = this.farPlane / this.nearPlane;
                var farLeft = s * this.left;
                var farRight = s * this.right;
                var farTop = s * this.top;
                var farBottom = s * this.bottom;
                e = vec3.transformMat4(c_e.data, [farLeft, farBottom, -this.farPlane], M.data);
                f = vec3.transformMat4(c_f.data, [farLeft, farTop, -this.farPlane], M.data);
                g = vec3.transformMat4(c_g.data, [farRight, farTop, -this.farPlane], M.data);
                o = vec3.transformMat4(c_o.data, [0, 0, 0], M.data);
                planes[0].setFromPoints(o, c, b);
                planes[1].setFromPoints(o, d, c);
                planes[2].setFromPoints(o, a, d);
                planes[3].setFromPoints(o, b, a);
                planes[4].setFromPoints(a, d, c);
                planes[5].setFromPoints(e, f, g);
            } else {
                e = vec3.transformMat4(c_e.data, [this.left, this.bottom, -this.farPlane], M.data);
                f = vec3.transformMat4(c_f.data, [this.left, this.top, -this.farPlane], M.data);
                g = vec3.transformMat4(c_g.data, [this.right, this.top, -this.farPlane], M.data);
                h = vec3.transformMat4(c_o.data, [this.right, this.bottom, -this.farPlane], M.data);
                planes[0].setFromPoints(c, g, f);
                planes[1].setFromPoints(d, h, g);
                planes[2].setFromPoints(a, e, h);
                planes[3].setFromPoints(b, f, e);
                planes[4].setFromPoints(a, d, c);
                planes[5].setFromPoints(e, f, g);
            }
        };
    }())


});


var Plane = function () {
    this.distance = 0;
    this.normal = new XML3D.Vec3();
};

XML3D.extend(Plane.prototype, {
    setFromPoints: function (point1, point2, point3) {
        vec3.cross(this.normal.data, vec3.sub(tmp2, point3, point1), vec3.sub(tmp1, point2, point1));
        this.normal.normalize();
        this.distance = -this.normal.dot(point1);
    },

    set: function (x, y, z, distance) {
        this.normal.set(x, y, z).normalize();
        this.distance = distance;
    }
});

var FrustumTest = function (frustum, cameraMatrix) {
    this.frustumPlanes = [new Plane(), new Plane(), new Plane(), new Plane(), new Plane(), new Plane()];
    if (frustum && cameraMatrix) {
        this.set(frustum, cameraMatrix);
    }
};


XML3D.extend(FrustumTest.prototype, {
    /**
     *
     * @param {Frustum} frustum
     * @param {mat4} matrix
     */
    set: function (frustum, matrix) {
        frustum.getPlanes(this.frustumPlanes, matrix);

    }, /**
     * @param bbox
     * @returns {boolean}
     */
    isBoxVisible: (function () {

        return function (bbox) {
            if (bbox.isEmpty())
                return false;


            for (var i = 0; i < this.frustumPlanes.length; i++) {
                var plane = this.frustumPlanes[i];
                var normal = plane.normal;
                var bbx = normal.x >= 0.0 ? bbox.max.x : bbox.min.x;
                var bby = normal.y >= 0.0 ? bbox.max.y : bbox.min.y;
                var bbz = normal.z >= 0.0 ? bbox.max.z : bbox.min.z;

                // Compute the distance
                var distance = bbx * normal.x + bby * normal.y + bbz * normal.z + plane.distance;

                // if highest point is below plane then all below.
                if (distance < 0.0) {
                    return false;
                }
            }
            return true;
        }
    }())

});

module.exports = {
    Plane: Plane,
    Frustum: Frustum,
    FrustumTest: FrustumTest
};
