var mat4 = require("gl-matrix").mat4;

var Mat4 = function(mat) {
    if (this instanceof Mat4) {
        this.data = mat4.create();
        if (mat) {
            this.data.set(mat.data ? mat.data : mat);
        }
    } else return new Mat4(mat);
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
    var out = new Mat4();
    mat4.adjoint(out.data, this.data);
    return out;
};

Mat4.prototype.clone = function() {
   return new Mat4(this);
};

Mat4.prototype.determinant = function() {
    return mat4.determinant(this.data);
};

Mat4.frustum = function(left, right, bottom, top, near, far) {
    var out = new Mat4();
    mat4.frustum(out.data, left, right, bottom, top, near, far);
    return out;
};

Mat4.prototype.invert = function() {
    var out = new Mat4();
    mat4.invert(out.data, this.data);
    return out;
};

Mat4.lookAt = function(eye, center, up) {
    var out = new Mat4();
    mat4.lookAt(out.data, eye.data ? eye.data : eye, center.data ? center.data : center, up.data ? up.data : up);
    return out;
};

Mat4.prototype.mul = Mat4.prototype.multiply = function(b) {
    var out = new Mat4();
    mat4.multiply(out.data, this.data, b.data ? b.data : b);
    return out;
};

Mat4.ortho = function(left, right, bottom, top, near, far) {
    var out = new Mat4();
    mat4.ortho(out.data, left, right, bottom, top, near, far);
    return out;
};

Mat4.perspective = function(fov, aspect, near, far) {
    var out = new Mat4();
    mat4.perspective(out.data, fov, aspect, near, far);
    return out;
};

Mat4.prototype.rotate = function(rad, axis) {
    var out = new Mat4();
    mat4.rotate(out.data, this.data, rad, axis.data ? axis.data : axis);
    return out;
};

Mat4.prototype.rotateX = function(rad) {
    var out = new Mat4();
    mat4.rotateX(out.data, this.data, rad);
    return out;
};

Mat4.prototype.rotateY = function(rad) {
    var out = new Mat4();
    mat4.rotateY(out.data, this.data, rad);
    return out;
};

Mat4.prototype.rotateZ = function(rad) {
    var out = new Mat4();
    mat4.rotateZ(out.data, this.data, rad);
    return out;
};

Mat4.prototype.scale = function(vec) {
    var out = new Mat4();
    mat4.scale(out.data, this.data, vec.data ? vec.data : vec);
    return out;
};

Mat4.fromQuat = function(q) {
    var out = new Mat4();
    mat4.fromQuat(out.data, q.data ? q.data : q);
    return out;
};

Mat4.fromRotationTranslation = function(q, v) {
    var out = new Mat4();
    mat4.fromRotationTranslation(out.data, q.data ? q.data : q, v.data ? v.data : v);
    return out;
};

Mat4.prototype.transpose = function() {
    var out = new Mat4();
    mat4.transpose(out.data, this.data);
    return out;
};

Mat4.prototype.translate = function(vec) {
    var out = new Mat4();
    mat4.translate(out.data, this.data, vec.data ? vec.data : vec);
    return out;
};

Mat4.prototype.toDOMString = function() {
    return mat4.toDOMString(this.data);
};

Mat4.fromDOMString = function(str) {
    var out = new Mat4();
    out.data.set( mat4.fromDOMString(str) );
    return out;
};

Mat4.wrap = function(mat) {
    var m = Mat4();
    m.data = mat.data ? mat.data : mat;
    return m;
};


module.exports = Mat4;
