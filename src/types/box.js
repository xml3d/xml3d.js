var Vec3 = require("./vec3.js");
var vec3 = require("gl-matrix").vec3;

var Box = function(box) {
    this.data = new Float32Array(6);
    if (box) {
        this.copy(box);
    } else {
        this.setEmpty();
    }
};

Object.defineProperty(Box.prototype, "min", {
    set: function(v){
        var val = v.data ? v.data : v;
        this.data[0] = val[0];
        this.data[1] = val[1];
        this.data[2] = val[2];
    },
    get: function(){
        return new Vec3(this.data.subarray(0,3));
    }
});

Object.defineProperty(Box.prototype, "max", {
    set: function(v){
        var val = v.data ? v.data : v;
        this.data[3] = val[0];
        this.data[4] = val[1];
        this.data[5] = val[2];
    },
    get: function(){
        return new Vec3(this.data.subarray(3,6));
    }
});

Box.prototype.clone = function() {
    return new Box().copy(this);
};

Box.prototype.copy = function(other) {
    this.copyMin(other);
    this.copyMax(other);
    return this;
};

Box.prototype.copyMin = function(other) {
    vec3.copy(this.data, other.data ? other.data : other);
    return this;
};

Box.prototype.copyMax = function(other) {
    vec3.copy(this.data.subarray(3,6), other.data ? other.data.subarray(3,6) : other.subarray(3,6));
    return this;
};

Box.prototype.extend = function(other) {
    var box = other.data ? other.data : other;
    for (var i = 0; i < 3; i++) {
        this.data[i] = Math.min(box[i], this.data[i]);
        this.data[i + 3] = Math.max(box[i + 3], this.data[i + 3]);
    }
    return this;
};

Box.prototype.setEmpty = function() {
    this.data[0] = Number.MAX_VALUE;
    this.data[1] = Number.MAX_VALUE;
    this.data[2] = Number.MAX_VALUE;
    this.data[3] = -Number.MAX_VALUE;
    this.data[4] = -Number.MAX_VALUE;
    this.data[5] = -Number.MAX_VALUE;
    return this;
};

Box.prototype.isEmpty = function() {
    return (this.data[0] > this.data[3] || this.data[1] > this.data[4] || this.data[2] > this.data[5]);
};

Box.prototype.center = function(target) {
    var cen = target || new Vec3();
    cen.x = (this.data[0] + this.data[3]) * 0.5;
    cen.y = (this.data[1] + this.data[4]) * 0.5;
    cen.z = (this.data[2] + this.data[5]) * 0.5;
    return cen;
};

Box.prototype.size = function(target) {
    var size = target || new Vec3();
    size.x = Math.max(this.data[3] - this.data[0], 0);
    size.y = Math.max(this.data[4] - this.data[1], 0);
    size.z = Math.max(this.data[5] - this.data[2], 0);
    return size;
};

Box.prototype.extent = function() {
    return this.size().scale(0.5);
};

Box.prototype.transformAxisAligned = function(mat) {
    if (this.isEmpty()) {
        return this;
    }
    var out = new Float32Array(6);
    var m = mat.data ? mat.data : mat;
    if (m[3] == 0 && m[7] == 0 && m[11] == 0 && m[15] == 1) {

        for (var i = 0; i < 3; i++) {
            out[i] = out[i + 3] = m[12 + i];

            for (var j = 0; j < 3; j++) {
                var a, b;

                a = m[j * 4 + i] * this.data[j];
                b = m[j * 4 + i] * this.data[j + 3];

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
        this.data = out;
        return this;
    }
    throw new Error("Matrix is not affine");
};

Box.prototype.transform = function(mat) {
    if (this.isEmpty()) {
        return this;
    }

    this.min.transformMat4(mat);
    this.max.transformMat4(mat);
    return this;
};

Box.prototype.longestSide = function() {
    if (this.isEmpty()) {
        return 0;
    }
    var x = Math.abs(this.data[3] - this.data[0]);
    var y = Math.abs(this.data[4] - this.data[1]);
    var z = Math.abs(this.data[5] - this.data[2]);
    return Math.max(x, Math.max(y, z));
};

Box.prototype.intersects = function(ray, opt) {
    if (this.isEmpty()) {
        if (opt !== undefined && opt.dist !== undefined) {
            opt.dist = Infinity;
        }
        return false;
    }
    var origin = ray.origin;
    var direction = ray.direction;
    var inverseDirX = 1 / direction.x;
    var inverseDirY = 1 / direction.y;
    var inverseDirZ = 1 / direction.z;

    var t1 = (this.data[0] - origin.x) * inverseDirX;
    var t2 = (this.data[3] - origin.x) * inverseDirX;
    var t3 = (this.data[1] - origin.y) * inverseDirY;
    var t4 = (this.data[4] - origin.y) * inverseDirY;
    var t5 = (this.data[2] - origin.z) * inverseDirZ;
    var t6 = (this.data[5] - origin.z) * inverseDirZ;

    var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
    var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

    if (opt === undefined || opt.dist === undefined) {
        return tmax > 0 && tmin <= tmax;
    }

    if (tmax < 0 || tmin > tmax) {
        opt.dist = Infinity;
        return false;
    }

    opt.dist = tmin;
    return true;
};

Box.prototype.toString = function() {
    return 'XML3D.Box(' + this.data[0] + ', ' + this.data[1] + ', ' + this.data[2] + ', ' + this.data[3] + ', ' +
        this.data[4] + ', ' + this.data[5] + ')';
};

Box.EMPTY_BOX = new Box();

module.exports = Box;