var mat2 = require("gl-matrix").mat2;

var Mat2 = function(mat) {
    if (mat) {
        this.data = mat.data ? mat.data : mat;
    } else {
        this.data = mat2.create();
    }
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
    mat2.adjoint(this.data, this.data);
    return this;
};

Mat2.prototype.clone = function() {
   return new Mat2().copy(this);
};

Mat2.prototype.copy = function(b) {
    mat2.copy(this.data, b.data ? b.data : b);
    return this;
};

Mat2.prototype.determinant = function() {
    return mat2.determinant(this.data);
};

Mat2.prototype.identity = function() {
    mat2.identity(this.data);
    return this;
};

Mat2.prototype.invert = function() {
    mat2.invert(this.data, this.data);
    return this;
};

Mat2.prototype.mul = Mat2.prototype.multiply = function(b) {
    mat2.multiply(this.data, this.data, b.data ? b.data : b);
    return this;
};

Mat2.prototype.rotate = function(rad) {
    mat2.rotate(this.data, this.data, rad);
    return this;
};

Mat2.prototype.scale = function(vec) {
    mat2.scale(this.data, this.data, vec.data ? vec.data : vec);
    return this;
};

Mat2.prototype.transpose = function() {
    mat2.transpose(this.data, this.data);
    return this;
};

Mat2.prototype.toDOMString = function() {
    return mat2.toDOMString(this.data);
};

Mat2.prototype.setFromDOMString = function(str) {
    this.data = mat2.fromDOMString(str);
    return this;
};

module.exports = Mat2;
