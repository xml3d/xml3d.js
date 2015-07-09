var vec3 = XML3D.math.vec3;
var tmp1 = vec3.create();
var tmp2 = vec3.create();


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

    }, getProjectionMatrix: function (matrix) {
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

            XML3D.math.mat4.identity(matrix);
            matrix[0] = A;
            matrix[5] = B;
            matrix[10] = C;
            matrix[12] = tx;
            matrix[13] = ty;
            matrix[14] = tz;
            matrix[15] = 1.0;
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

            XML3D.math.mat4.identity(matrix);
            matrix[0] = E;
            matrix[5] = F;
            matrix[8] = A;
            matrix[9] = B;
            matrix[10] = C;
            matrix[11] = -1;
            matrix[14] = D;
            matrix[15] = 0;
        }
    },

    getPlanes: (function () {

        var c_a = vec3.create();
        var c_b = vec3.create();
        var c_c = vec3.create();
        var c_d = vec3.create();

        var c_e = vec3.create();
        var c_f = vec3.create();
        var c_g = vec3.create();
        var c_o = vec3.create();


        return function (p, M) {
            var a = vec3.transformMat4(c_a, [this.left, this.bottom, -this.nearPlane], M);
            var b = vec3.transformMat4(c_b, [this.left, this.top, -this.nearPlane], M);
            var c = vec3.transformMat4(c_c, [this.right, this.top, -this.nearPlane], M);
            var d = vec3.transformMat4(c_d, [this.right, this.bottom, -this.nearPlane], M);
            var e, f, g, h, o;
            if (!this.orthographic) {
                var s = this.farPlane / this.nearPlane;
                var farLeft = s * this.left;
                var farRight = s * this.right;
                var farTop = s * this.top;
                var farBottom = s * this.bottom;
                e = vec3.transformMat4(c_e, [farLeft, farBottom, -this.farPlane], M);
                f = vec3.transformMat4(c_f, [farLeft, farTop, -this.farPlane], M);
                g = vec3.transformMat4(c_g, [farRight, farTop, -this.farPlane], M);
                o = vec3.transformMat4(c_o, [0, 0, 0], M);
                p[0].setFromPoints(o, c, b);
                p[1].setFromPoints(o, d, c);
                p[2].setFromPoints(o, a, d);
                p[3].setFromPoints(o, b, a);
                p[4].setFromPoints(a, d, c);
                p[5].setFromPoints(e, f, g);
            } else {
                e = vec3.transformMat4(c_e, [this.left, this.bottom, -this.farPlane], M);
                f = vec3.transformMat4(c_f, [this.left, this.top, -this.farPlane], M);
                g = vec3.transformMat4(c_g, [this.right, this.top, -this.farPlane], M);
                h = vec3.transformMat4(c_o, [this.right, this.bottom, -this.farPlane], M);
                p[0].setFromPoints(c, g, f);
                p[1].setFromPoints(d, h, g);
                p[2].setFromPoints(a, e, h);
                p[3].setFromPoints(b, f, e);
                p[4].setFromPoints(a, d, c);
                p[5].setFromPoints(e, f, g);
            }
        };
    }())


});


var Plane = function () {
    this.distance = 0;
    this.normal = vec3.create();
};

XML3D.extend(Plane.prototype, {
    setFromPoints: function (point1, point2, point3) {
        vec3.cross(this.normal, vec3.sub(tmp2, point3, point1), vec3.sub(tmp1, point2, point1));
        vec3.normalize(this.normal, this.normal);
        this.distance = -vec3.dot(this.normal, point1);
    }, set: function (x, y, z, distance) {
        vec3.set(this.normal, x, y, z);
        vec3.normalize(this.normal, this.normal);
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
                var bbx = normal[0] >= 0.0 ? bbox.max.x : bbox.min.x;
                var bby = normal[1] >= 0.0 ? bbox.max.y : bbox.min.y;
                var bbz = normal[2] >= 0.0 ? bbox.max.z : bbox.min.z;

                // Compute the distance
                var distance = bbx * normal[0] + bby * normal[1] + bbz * normal[2] + plane.distance;

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
