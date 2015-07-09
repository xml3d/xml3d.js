var vec3 = require("gl-matrix").vec3;

var Vec3 = function(vec) {
    if (vec) {
        this.data = vec.data ? vec.data : vec;
    } else {
        this.data = vec3.create();
    }

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
    vec3.add(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec3.prototype.clone = function() {
   return new Vec3().copy(this);
};

Vec3.prototype.copy = function(b) {
    vec3.copy(this.data, b.data ? b.data : b);
    return this;
};

Vec3.prototype.cross = function(b) {
    vec3.cross(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec3.prototype.dist = Vec3.prototype.distance = function() {
    return vec3.dist(this.data);
};

Vec3.prototype.divide = function(b) {
    vec3.divide(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec3.prototype.dot = function(b) {
    return vec3.dot(this.data, b.data ? b.data : b);
};

Vec3.prototype.len = Vec3.prototype.length = function() {
    return vec3.length(this.data);
};

Vec3.prototype.lerp = function(b, t) {
    vec3.lerp(this.data, this.data, b.data ? b.data : b, t);
    return this;
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
    vec3.mul(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec3.prototype.negate = function() {
    vec3.negate(this.data, this.data);
    return this;
};

Vec3.prototype.normalize = function() {
    vec3.normalize(this.data, this.data);
    return this;
};

Vec3.prototype.random = function(scale) {
    var m = new Vec3();
    vec3.random(m.data, scale);
    return m;
};

Vec3.prototype.reciprocal = function() {
    XML3D.math.reciprocal(this.data, this.data);
    return this;
};

Vec3.prototype.scale = function(s) {
    vec3.scale(this.data, this.data, s);
    return this;
};

Vec3.prototype.scaleAndAdd = function(b, scale) {
    vec3.scaleAndAdd(this.data, this.data, b.data ? b.data : b, scale);
    return this;
};

Vec3.prototype.set = function(x, y, z) {
    vec3.set(this.data, x, y, z);
    return this;
};

Vec3.prototype.sqrDist = Vec3.prototype.squaredDistance = function(b) {
    return vec3.sqrDist(this.data, b.data ? b.data : b);
};

Vec3.prototype.sqrLen = Vec3.prototype.squaredLength = function() {
    return vec3.sqrLen(this.data);
};

Vec3.prototype.sub = Vec3.prototype.subtract = function(b) {
    vec3.sub(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec3.prototype.transformMat3 = function(m) {
    vec3.transformMat3(this.data, this.data, m.data ? m.data : m);
    return this;
};

Vec3.prototype.transformMat4 = function(m) {
    vec3.transformMat4(this.data, this.data, m.data ? m.data : m);
    return this;
};

Vec3.prototype.transformQuat = function(q) {
    vec3.transformQuat(this.data, this.data, q.data ? q.data : q);
    return this;
};

Vec3.prototype.toDOMString = function() {
    return vec3.toDOMString(this.data);
};

Vec3.prototype.fromDOMString = function(str) {
    return new Vec3(vec3.fromDOMString(str));
};

module.exports = Vec3;