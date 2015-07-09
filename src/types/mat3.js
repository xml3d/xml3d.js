var mat3 = require("gl-matrix").mat3;

var Mat3 = function(mat) {
    if (mat) {
        this.data = mat.data ? mat.data : mat;
    } else {
        this.data = mat3.create();
    }
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
    mat3.adjoint(this.data, this.data);
    return this;
};

Mat3.prototype.clone = function() {
   return new Mat3().copy(this);
};

Mat3.prototype.copy = function(b) {
    mat3.copy(this.data, b.data ? b.data : b);
    return this;
};

Mat3.prototype.determinant = function() {
    return mat3.determinant(this.data);
};

Mat3.prototype.fromMat4 = function(m) {
    mat3.fromMat4(this.data, m.data ? m.data : m);
    return this;
};

Mat3.prototype.fromQuat = function(q) {
    mat3.fromQuat(this.data, q.data ? q.data : q);
    return this;
};

Mat3.prototype.identity = function() {
    mat3.identity(this.data);
    return this;
};

Mat3.prototype.invert = function() {
    mat3.invert(this.data, this.data);
    return this;
};

Mat3.prototype.mul = Mat3.prototype.multiply = function(b) {
    mat3.multiply(this.data, this.data, b.data ? b.data : b);
    return this;
};

Mat3.prototype.normalFromMat4 = function(m) {
    mat3.normalFromMat4(this.data, m.data ? m.data : m);
    return this;
};

Mat3.prototype.rotate = function(rad) {
    mat3.rotate(this.data, this.data, rad);
    return this;
};

Mat3.prototype.scale = function(vec) {
    mat3.scale(this.data, this.data, vec.data ? vec.data : vec);
    return this;
};

Mat3.prototype.transpose = function() {
    mat3.transpose(this.data, this.data);
    return this;
};

Mat3.prototype.translate = function(vec) {
    mat3.translate(this.data, this.data, vec.data ? vec.data : vec);
    return this;
};

Mat3.prototype.toDOMString = function() {
    return mat3.toDOMString(this.data);
};

Mat3.prototype.fromDOMString = function(str) {
    return new Mat3(mat3.fromDOMString(str));
};

module.exports = Mat3;