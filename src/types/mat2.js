var mat2 = require("gl-matrix").mat2;

var Mat2 = function(mat) {
    if (this instanceof Mat2) {
        this.data = mat2.create();
        if (mat) {
            this.data.set(mat.data ? mat.data : mat);
        }
    } else return new Mat2(mat);
};

Object.defineProperty(Mat2.prototype, "m11", {
    set: function(x){ this.data[0] = x; },
    get: function(){ return this.data[0]; }
});
Object.defineProperty(Mat2.prototype, "m12", {
    set: function(x){ this.data[1] = x; },
    get: function(){ return this.data[1]; }
});
Object.defineProperty(Mat2.prototype, "m21", {
    set: function(x){ this.data[2] = x; },
    get: function(){ return this.data[2]; }
});
Object.defineProperty(Mat2.prototype, "m22", {
    set: function(x){ this.data[3] = x; },
    get: function(){ return this.data[3]; }
});

Mat2.prototype.adjoint = function() {
    var out = new Mat2();
    mat2.adjoint(out.data, this.data);
    return out;
};

Mat2.prototype.clone = function() {
   return new Mat2(this);
};

Mat2.prototype.determinant = function() {
    return mat2.determinant(this.data);
};

Mat2.prototype.invert = function() {
    var out = new Mat2();
    mat2.invert(out.data, this.data);
    return out;
};

Mat2.prototype.mul = Mat2.prototype.multiply = function(b) {
    var out = new Mat2();
    mat2.multiply(out.data, this.data, b.data ? b.data : b);
    return out;
};

Mat2.prototype.rotate = function(rad) {
    var out = new Mat2();
    mat2.rotate(out.data, this.data, rad);
    return out;
};

Mat2.prototype.scale = function(vec) {
    var out = new Mat2();
    mat2.scale(out.data, this.data, vec.data ? vec.data : vec);
    return out;
};

Mat2.prototype.transpose = function() {
    var out = new Mat2();
    mat2.transpose(out.data, this.data);
    return out;
};

Mat2.wrap = function(mat) {
    var m = Mat2();
    m.data = mat.data ? mat.data : mat;
    return m;
};

module.exports = Mat2;
