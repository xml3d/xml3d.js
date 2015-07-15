var mat3 = require("gl-matrix").mat3;

var Mat3 = function(mat) {
    if (this instanceof Mat3) {
        this.data = mat3.create();
        if (mat) {
            this.data.set(mat.data ? mat.data : mat);
        }
    } else return new Mat3(mat);
};

Object.defineProperty(Mat3.prototype, "m11", {
    set: function(x){ this.data[0] = x; },
    get: function(){ return this.data[0]; }
});
Object.defineProperty(Mat3.prototype, "m12", {
    set: function(x){ this.data[1] = x; },
    get: function(){ return this.data[1]; }
});
Object.defineProperty(Mat3.prototype, "m13", {
    set: function(x){ this.data[2] = x; },
    get: function(){ return this.data[2]; }
});
Object.defineProperty(Mat3.prototype, "m21", {
    set: function(x){ this.data[3] = x; },
    get: function(){ return this.data[3]; }
});
Object.defineProperty(Mat3.prototype, "m22", {
    set: function(x){ this.data[4] = x; },
    get: function(){ return this.data[4]; }
});
Object.defineProperty(Mat3.prototype, "m23", {
    set: function(x){ this.data[5] = x; },
    get: function(){ return this.data[5]; }
});
Object.defineProperty(Mat3.prototype, "m31", {
    set: function(x){ this.data[6] = x; },
    get: function(){ return this.data[6]; }
});
Object.defineProperty(Mat3.prototype, "m32", {
    set: function(x){ this.data[7] = x; },
    get: function(){ return this.data[7]; }
});
Object.defineProperty(Mat3.prototype, "m33", {
    set: function(x){ this.data[8] = x; },
    get: function(){ return this.data[8]; }
});


Mat3.prototype.adjoint = function() {
    var out = new Mat3();
    mat3.adjoint(out.data, this.data);
    return out;
};

Mat3.prototype.clone = function() {
   return new Mat3(this);
};

Mat3.prototype.determinant = function() {
    return mat3.determinant(this.data);
};

Mat3.fromMat4 = function(m) {
    var out = new Mat3();
    mat3.fromMat4(out.data, m.data ? m.data : m);
    return out;
};

Mat3.fromQuat = function(q) {
    var out = new Mat3();
    mat3.fromQuat(out.data, q.data ? q.data : q);
    return out;
};

Mat3.prototype.invert = function() {
    var out = new Mat3();
    mat3.invert(out.data, this.data);
    return out;
};

Mat3.prototype.mul = Mat3.prototype.multiply = function(b) {
    var out = new Mat3();
    mat3.multiply(out.data, this.data, b.data ? b.data : b);
    return out;
};

Mat3.normalFromMat4 = function(m) {
    var out = new Mat3();
    mat3.normalFromMat4(out.data, m.data ? m.data : m);
    return out;
};

Mat3.prototype.rotate = function(rad) {
    var out = new Mat3();
    mat3.rotate(out.data, this.data, rad);
    return out;
};

Mat3.prototype.scale = function(vec) {
    var out = new Mat3();
    mat3.scale(out.data, this.data, vec.data ? vec.data : vec);
    return out;
};

Mat3.prototype.transpose = function() {
    var out = new Mat3();
    mat3.transpose(out.data, this.data);
    return out;
};

Mat3.prototype.translate = function(vec) {
    var out = new Mat3();
    mat3.translate(out.data, this.data, vec.data ? vec.data : vec);
    return out;
};

Mat3.wrap = function(mat) {
    var m = Mat3();
    m.data = mat.data ? mat.data : mat;
    return m;
};

module.exports = Mat3;
