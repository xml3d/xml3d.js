var vec3 = require("gl-matrix").vec3;

var Vec3 = function(vec) {
    if (this instanceof Vec3) {
        this.data = vec3.create();
        if (vec) {
            this.data.set(vec.data ? vec.data : vec);
        }
    } else return new Vec3(vec);
};

Object.defineProperty(Vec3.prototype, "x", {
    set: function(x){
        this.data[0] = x;
    },
    get: function(){ return this.data[0]; }
});
Object.defineProperty(Vec3.prototype, "y", {
    set: function(y){
        this.data[1] = y;
    },
    get: function(){ return this.data[1]; }
});
Object.defineProperty(Vec3.prototype, "z", {
    set: function(z){
        this.data[2] = z;
    },
    get: function(){ return this.data[2]; }
});

Vec3.prototype.add = function(b) {
    var out = new Vec3();
    vec3.add(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec3.prototype.clone = function() {
   return new Vec3(this);
};

Vec3.prototype.cross = function(b) {
    var out = new Vec3();
    vec3.cross(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec3.prototype.dist = Vec3.prototype.distance = function() {
    return vec3.dist(this.data);
};

Vec3.prototype.divide = function(b) {
    var out = new Vec3();
    vec3.divide(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec3.prototype.dot = function(b) {
    return vec3.dot(this.data, b.data ? b.data : b);
};

Vec3.fromValues = function(x, y, z) {
    return new Vec3(vec3.fromValues(x,y,z));
};

Vec3.prototype.len = Vec3.prototype.length = function() {
    return vec3.length(this.data);
};

Vec3.prototype.lerp = function(b, t) {
    var out = new Vec3();
    vec3.lerp(out.data, this.data, b.data ? b.data : b, t);
    return out;
};

Vec3.prototype.max = function(b) {
    var m = new Vec3();
    vec3.max(m.data, this.data, b.data ? b.data : b);
    return m;
};

Vec3.prototype.min = function(b) {
    var m = new Vec3();
    vec3.max(m.data, this.data, b.data ? b.data : b);
    return m;
};

Vec3.prototype.mul = Vec3.prototype.multiply = function(b) {
    var out = new Vec3();
    vec3.mul(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec3.prototype.negate = function() {
    var out = new Vec3();
    vec3.negate(out.data, this.data);
    return out;
};

Vec3.prototype.normalize = function() {
    var out = new Vec3();
    vec3.normalize(out.data, this.data);
    return out;
};

Vec3.prototype.random = function(scale) {
    var m = new Vec3();
    vec3.random(m.data, scale);
    return m;
};

Vec3.prototype.reciprocal = function() {
    var out = new Vec3();
    XML3D.math.vec3.reciprocal(out.data, this.data);
    return out;
};

Vec3.prototype.scale = function(s) {
    var out = new Vec3();
    vec3.scale(out.data, this.data, s);
    return out;
};

Vec3.prototype.sub = Vec3.prototype.subtract = function(b) {
    var out = new Vec3();
    vec3.sub(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec3.prototype.transformDirection = function(m) {
    var out = new Vec3();
    XML3D.math.vec3.transformDirection(out.data, this.data, m.data ? m.data : m);
    return out;
};

Vec3.prototype.transformMat3 = function(m) {
    var out = new Vec3();
    vec3.transformMat3(out.data, this.data, m.data ? m.data : m);
    return out;
};

Vec3.prototype.transformMat4 = function(m) {
    var out = new Vec3();
    vec3.transformMat4(out.data, this.data, m.data ? m.data : m);
    return out;
};

Vec3.prototype.transformQuat = function(q) {
    var out = new Vec3();
    vec3.transformQuat(out.data, this.data, q.data ? q.data : q);
    return out;
};

Vec3.prototype.toDOMString = function() {
    return vec3.toDOMString(this.data);
};

Vec3.fromDOMString = function(str) {
    var out = new Vec3();
    out.data.set( vec3.fromDOMString(str) );
    return out;
};

Vec3.wrap = function(vec) {
    var v = Vec3();
    v.data = vec.data ? vec.data : vec;
    return v;
};

module.exports = Vec3;
