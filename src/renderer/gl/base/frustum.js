(function (ns) {

    /**
     *
     * @param {number} nearPlane
     * @param {number} farPlane
     * @param {number} fovx
     * @param {number} fovy
     * @param {number} aspect
     * @constructor
     */
    var Frustum = function (nearPlane, farPlane, fovx, fovy, aspect) {
        /**
         *
         * @type {boolean}
         */
        this.orthographic = false;
        this.set(nearPlane, farPlane, fovx, fovy, aspect);
    };

    XML3D.extend(Frustum.prototype, {
        set: function (nearPlane, farPlane, fovx, fovy, aspect) {
            if (fovx && fovy)
                throw new Error("fovx and fovy cannot both be non-zero.");

            var two = 2;

            if (fovx) {
                this.right = nearPlane * Math.tan(fovx / two);
                this.left = -this.right;
                this.top = ((this.right - this.left) / aspect) / two;
                this.bottom = -this.top;
            }
            else {
                this.top = nearPlane * Math.tan(fovy / two);
                this.bottom = -this.top;
                this.right = (this.top - this.bottom) * aspect / two;
                this.left = -this.right;
            }
            this.nearPlane = nearPlane;
            this.farPlane = farPlane;
            this.orthographic = false;
        },
        getProjectionMatrix: function (matrix) {
            var limitMax = Number.MAX_VALUE;
            var rightPlusLeft = this.right + this.left;
            var rightMinusLeft = this.right - this.left;

            var topPlusBottom = this.top + this.bottom;
            var topMinusBottom = this.top - this.bottom;

            var farPlusNear = this.farPlane + this.nearPlane;
            var farMinusNear = this.farPlane - this.nearPlane;

            if ((Math.abs(rightMinusLeft) < 1 &&
                Math.abs(rightPlusLeft) > limitMax * Math.abs(rightMinusLeft)) ||
                (Math.abs(topMinusBottom) < 1 &&
                    Math.abs(topPlusBottom) > limitMax * Math.abs(topMinusBottom)) ||
                (Math.abs(farMinusNear) < 1 &&
                    Math.abs(farPlusNear) > limitMax * Math.abs(farMinusNear))) {
                throw new Error("Bad viewing frustum: projection matrix cannot be computed.");
            }

            var A, B, C, D, E, F;

            if (this.orthographic) {
                var tx = -rightPlusLeft / rightMinusLeft;
                var ty = -topPlusBottom / topMinusBottom;
                var tz = -farPlusNear / farMinusNear;

                if ((Math.abs(rightMinusLeft) < 1 &&
                    2 > limitMax * Math.abs(rightMinusLeft)) ||
                    (Math.abs(topMinusBottom) < 1 &&
                        2 > limitMax * Math.abs(topMinusBottom)) ||
                    (Math.abs(farMinusNear) < 1 &&
                        2 > limitMax * Math.abs(farMinusNear))) {
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
            }
            else {
                A = rightPlusLeft / rightMinusLeft;
                B = topPlusBottom / topMinusBottom;
                C = -farPlusNear / farMinusNear;

                var farTimesNear = -2 * this.farPlane * this.nearPlane;
                if (Math.abs(farMinusNear) < 1 &&
                    Math.abs(farTimesNear) > limitMax * Math.abs(farMinusNear)) {
                    throw new Error("Bad viewing frustum: projection matrix cannot be computed.");
                }

                D = farTimesNear / farMinusNear;

                var twoTimesNear = 2 * this.nearPlane;

                if ((Math.abs(rightMinusLeft) < 1 &&
                    Math.abs(twoTimesNear) > limitMax * Math.abs(rightMinusLeft)) ||
                    (Math.abs(topMinusBottom) < 1 &&
                        Math.abs(twoTimesNear) > limitMax * Math.abs(topMinusBottom))) {
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
        }


    });

    ns.Frustum = Frustum;

}(XML3D.webgl));
