var quat = require("gl-matrix").quat;

var Quat = function(vec) {
    if (vec) {
        this.data = vec.data ? vec.data : vec;
    } else {
        this.data = quat.create();
    }
};

Object.defineProperty(Quat.prototype, "x", {
    set: function(x){
        this.data[0] = x;
    },
    get: function(){ return this.data[0]; }
});
Object.defineProperty(Quat.prototype, "y", {
    set: function(y){
        this.data[1] = y;
    },
    get: function(){ return this.data[1]; }
});
Object.defineProperty(Quat.prototype, "z", {
    set: function(z){
        this.data[2] = z;
    },
    get: function(){ return this.data[2]; }
});
Object.defineProperty(Quat.prototype, "w", {
    set: function(w){
        this.data[3] = w;
    },
    get: function(){ return this.data[3]; }
});

Quat.prototype.add = function(b) {
    quat.add(this.data, this.data, b.data ? b.data : b);
    return this;
};

Quat.prototype.calculateW = function() {
    quat.calculateW(this.data, this.data);
    return this;
};

Quat.prototype.clone = function() {
   return new Quat().copy(this);
};

Quat.prototype.conjugate = function() {
    quat.conjugate(this.data, this.data);
    return this;
};

Quat.prototype.copy = function(b) {
    quat.copy(this.data, b.data ? b.data : b);
    return this;
};

Quat.prototype.dot = function(b) {
    return quat.dot(this.data, b.data ? b.data : b);
};

Quat.prototype.identity = function() {
    quat.identity(this.data);
    return this;
};

Quat.prototype.invert = function() {
    quat.invert(this.data, this.data);
    return this;
};

Quat.prototype.len = Quat.prototype.length = function() {
    return quat.length(this.data);
};

Quat.prototype.lerp = function(b, t) {
    quat.lerp(this.data, this.data, b.data ? b.data : b, t);
    return this;
};

Quat.prototype.mul = Quat.prototype.multiply = function(b) {
    quat.mul(this.data, this.data, b.data ? b.data : b);
    return this;
};

Quat.prototype.negate = function() {
    quat.negate(this.data, this.data);
    return this;
};

Quat.prototype.normalize = function() {
    quat.normalize(this.data, this.data);
    return this;
};

Quat.prototype.rotateX = function(rad) {
    quat.rotateX(this.data, this.data, rad);
    return this;
};

Quat.prototype.rotateY = function(rad) {
    quat.rotateY(this.data, this.data, rad);
    return this;
};

Quat.prototype.rotateZ = function(rad) {
    quat.rotateZ(this.data, this.data, rad);
    return this;
};

Quat.prototype.scale = function(s) {
    quat.scale(this.data, this.data, s);
    return this;
};

Quat.prototype.set = function(x, y, z, w) {
    quat.set(this.data, x, y, z, w);
    return this;
};

Quat.prototype.setFromAxisAngle = function(axis, rad) {
    if (rad === undefined) {
        quat.setAxisAngle(this.data, axis.data ? axis.data : axis, axis.data ? axis.data[3] : axis[3]);
    } else {
        quat.setAxisAngle(this.data, axis.data ? axis.data : axis, rad);
    }
    return this;
};

Quat.prototype.setFromBasis = function(x, y, z) {
    XML3D.math.quat.setFromBasis(this.data, x.data ? x.data : x, y.data ? y.data : y, z.data ? z.data : z);
    return this;
};

Quat.prototype.setFromMat3 = function(m) {
    quat.fromMat3(this.data, m.data ? m.data : m);
    return this;
};

Quat.prototype.setFromRotationTo = function(from, to) {
    quat.rotationTo(this.data, from.data ? from.data : from, to.data ? to.data : to);
    return this;
};

Quat.prototype.slerp = function(b, t) {
    quat.slerp(this.data, this.data, b.data ? b.data : b, t);
    return this;
};

Quat.prototype.sqrLen = Quat.prototype.squaredLength = function() {
    return quat.sqrLen(this.data);
};

Quat.prototype.toDOMString = function() {
    return quat.toDOMString(this.data);
};

Quat.prototype.fromDOMString = function(str) {
    return new Quat(quat.fromDOMString(str));
};

module.exports = Quat;