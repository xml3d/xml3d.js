var quat = require("gl-matrix").quat;

var Quat = function(vec, y, z, w) {
    if (this instanceof Quat) {
        this.data = quat.create();
        if (w !== undefined) {
            this.x = vec;
            this.y = y;
            this.z = z;
            this.w = w;
        } else
        if (vec) {
            this.data.set(vec.data ? vec.data : vec);
        } else {
            this.w = 1;
        }
    } else return new Quat(vec, y, z, w);
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
    var out = new Quat();
    quat.add(out.data, this.data, b.data ? b.data : b);
    return out;
};

Quat.prototype.calculateW = function() {
    var out = new Quat();
    quat.calculateW(out.data, this.data);
    return out;
};

Quat.prototype.clone = function() {
   return new Quat(this);
};

Quat.prototype.conjugate = function() {
    var out = new Quat();
    quat.conjugate(out.data, this.data);
    return out;
};

Quat.prototype.dot = function(b) {
    return quat.dot(this.data, b.data ? b.data : b);
};

Quat.prototype.invert = function() {
    var out = new Quat();
    quat.invert(out.data, this.data);
    return out;
};

Quat.prototype.len = Quat.prototype.length = function() {
    return quat.length(this.data);
};

Quat.prototype.lerp = function(b, t) {
    var out = new Quat();
    quat.lerp(out.data, this.data, b.data ? b.data : b, t);
    return out;
};

Quat.prototype.mul = Quat.prototype.multiply = function(b) {
    var out = new Quat();
    quat.mul(out.data, this.data, b.data ? b.data : b);
    return out;
};

Quat.prototype.normalize = function() {
    var out = new Quat();
    quat.normalize(out.data, this.data);
    return out;
};

Quat.prototype.rotateX = function(rad) {
    var out = new Quat();
    quat.rotateX(out.data, this.data, rad);
    return out;
};

Quat.prototype.rotateY = function(rad) {
    var out = new Quat();
    quat.rotateY(out.data, this.data, rad);
    return out;
};

Quat.prototype.rotateZ = function(rad) {
    var out = new Quat();
    quat.rotateZ(out.data, this.data, rad);
    return out;
};

Quat.prototype.scale = function(s) {
    var out = new Quat();
    quat.scale(out.data, this.data, s);
    return out;
};

Quat.fromAxisAngle = function(axis, rad) {
    var out = new Quat();
    if (rad === undefined) {
        quat.setAxisAngle(out.data, axis.data ? axis.data : axis, axis.data ? axis.data[3] : axis[3]);
    } else {
        quat.setAxisAngle(out.data, axis.data ? axis.data : axis, rad);
    }
    quat.normalize(out.data, out.data);
    return out;
};

Quat.fromBasis = function(x, y, z) {
    var out = new Quat();
    XML3D.math.quat.setFromBasis(out.data, x.data ? x.data : x, y.data ? y.data : y, z.data ? z.data : z);
    quat.normalize(out.data, out.data);
    return out;
};

Quat.fromMat3 = function(m) {
    var out = new Quat();
    quat.fromMat3(out.data, m.data ? m.data : m);
    quat.normalize(out.data, out.data);
    return out;
};

Quat.fromRotationTo = function(from, to) {
    var out = new Quat();
    quat.rotationTo(out.data, from.data ? from.data : from, to.data ? to.data : to);
    quat.normalize(out.data, out.data);
    return out;
};

Quat.prototype.slerp = function(b, t) {
    var out = new Quat();
    quat.slerp(out.data, this.data, b.data ? b.data : b, t);
    return out;
};

Quat.prototype.toDOMString = function() {
    return quat.toDOMString(this.data);
};

Quat.fromDOMString = function(str) {
    var out = new Quat();
    out.data.set( quat.fromDOMString(str) );
    return out;
};

Quat.wrap = function(vec) {
    var v = Quat();
    v.data = vec.data ? vec.data : vec;
    return v;
};

module.exports = Quat;
