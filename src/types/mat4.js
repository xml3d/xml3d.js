var mat4 = require("gl-matrix").mat4;

var Mat4 = function(mat) {
    if (mat) {
        this.data = mat.data ? mat.data : mat;
    } else {
        this.data = mat4.create();
    }
};

Object.defineProperty(Mat4.prototype, "m11", {
    set: function(x){ this.data[0] = x; },
    get: function(){ return this.data[0]; }
});
Object.defineProperty(Mat4.prototype, "m12", {
    set: function(x){ this.data[1] = x; },
    get: function(){ return this.data[1]; }
});
Object.defineProperty(Mat4.prototype, "m13", {
    set: function(x){ this.data[2] = x; },
    get: function(){ return this.data[2]; }
});
Object.defineProperty(Mat4.prototype, "m14", {
    set: function(x){ this.data[3] = x; },
    get: function(){ return this.data[3]; }
});
Object.defineProperty(Mat4.prototype, "m21", {
    set: function(x){ this.data[4] = x; },
    get: function(){ return this.data[4]; }
});
Object.defineProperty(Mat4.prototype, "m22", {
    set: function(x){ this.data[5] = x; },
    get: function(){ return this.data[5]; }
});
Object.defineProperty(Mat4.prototype, "m23", {
    set: function(x){ this.data[6] = x; },
    get: function(){ return this.data[6]; }
});
Object.defineProperty(Mat4.prototype, "m24", {
    set: function(x){ this.data[7] = x; },
    get: function(){ return this.data[7]; }
});
Object.defineProperty(Mat4.prototype, "m31", {
    set: function(x){ this.data[8] = x; },
    get: function(){ return this.data[8]; }
});
Object.defineProperty(Mat4.prototype, "m32", {
    set: function(x){ this.data[9] = x; },
    get: function(){ return this.data[9]; }
});
Object.defineProperty(Mat4.prototype, "m33", {
    set: function(x){ this.data[10] = x; },
    get: function(){ return this.data[10]; }
});
Object.defineProperty(Mat4.prototype, "m34", {
    set: function(x){ this.data[11] = x; },
    get: function(){ return this.data[11]; }
});
Object.defineProperty(Mat4.prototype, "m41", {
    set: function(x){ this.data[12] = x; },
    get: function(){ return this.data[12]; }
});
Object.defineProperty(Mat4.prototype, "m42", {
    set: function(x){ this.data[13] = x; },
    get: function(){ return this.data[13]; }
});
Object.defineProperty(Mat4.prototype, "m43", {
    set: function(x){ this.data[14] = x; },
    get: function(){ return this.data[14]; }
});
Object.defineProperty(Mat4.prototype, "m44", {
    set: function(x){ this.data[15] = x; },
    get: function(){ return this.data[15]; }
});

Mat4.prototype.adjoint = function() {
    mat4.adjoint(this.data, this.data);
    return this;
};

Mat4.prototype.clone = function() {
   return new Mat4().copy(this);
};

Mat4.prototype.copy = function(b) {
    mat4.copy(this.data, b.data ? b.data : b);
    return this;
};

Mat4.prototype.determinant = function() {
    return mat4.determinant(this.data);
};

Mat4.prototype.frustum = function(left, right, bottom, top, near, far) {
    mat4.frustum(this.data, left, right, bottom, top, near, far);
    return this;
};

Mat4.prototype.identity = function() {
    mat4.identity(this.data);
    return this;
};

Mat4.prototype.invert = function() {
    mat4.invert(this.data, this.data);
    return this;
};

Mat4.prototype.lookAt = function(eye, center, up) {
    mat4.lookAt(this.data, eye.data ? eye.data : eye, center.data ? center.data : center, up.data ? up.data : up);
    return this;
};

Mat4.prototype.mul = Mat4.prototype.multiply = function(b) {
    mat4.multiply(this.data, this.data, b.data ? b.data : b);
    return this;
};

Mat4.prototype.ortho = function(left, right, bottom, top, near, far) {
    mat4.ortho(this.data, left, right, bottom, top, near, far);
    return this;
};

Mat4.prototype.perspective = function(fov, aspect, near, far) {
    mat4.perspective(this.data, fov, aspect, near, far);
    return this;
};

Mat4.prototype.rotate = function(rad, axis) {
    mat4.rotate(this.data, this.data, rad, axis.data ? axis.data : axis);
    return this;
};

Mat4.prototype.rotateX = function(rad) {
    mat4.rotateX(this.data, this.data, rad);
    return this;
};

Mat4.prototype.rotateY = function(rad) {
    mat4.rotateY(this.data, this.data, rad);
    return this;
};

Mat4.prototype.rotateZ = function(rad) {
    mat4.rotateZ(this.data, this.data, rad);
    return this;
};

Mat4.prototype.scale = function(vec) {
    mat4.scale(this.data, this.data, vec.data ? vec.data : vec);
    return this;
};

Mat4.prototype.setFromQuat = function(q) {
    mat4.fromQuat(this.data, q.data ? q.data : q);
    return this;
};

Mat4.prototype.setFromRotationTranslation = function(q, v) {
    mat4.fromRotationTranslation(this.data, q.data ? q.data : q, v.data ? v.data : v);
    return this;
};

Mat4.prototype.transpose = function() {
    mat4.transpose(this.data, this.data);
    return this;
};

Mat4.prototype.translate = function(vec) {
    mat4.translate(this.data, this.data, vec.data ? vec.data : vec);
    return this;
};

Mat4.prototype.toDOMString = function() {
    return mat4.toDOMString(this.data);
};

Mat4.prototype.setFromDOMString = function(str) {
    this.data = mat4.fromDOMString(str);
    return this;
};

module.exports = Mat4;
