var vec2 = require("gl-matrix").vec2;

var Vec2 = function(vec) {
    if (vec) {
        this.data = vec.data ? vec.data : vec;
    } else {
        this.data = vec2.create();
    }
};

Object.defineProperty(Vec2.prototype, "x", {
    set: function(x){
        this.data[0] = x;
    },
    get: function(){ return this.data[0]; }
});
Object.defineProperty(Vec2.prototype, "y", {
    set: function(y){
        this.data[1] = y;
    },
    get: function(){ return this.data[1]; }
});

Vec2.prototype.add = function(b) {
    vec2.add(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec2.prototype.clone = function() {
   return new Vec2().copy();
};

Vec2.prototype.copy = function(b) {
    vec2.copy(this.data, b.data ? b.data : b);
    return this;
};

Vec2.prototype.cross = function(b) {
    var r = new Vec3();
    vec3.cross(r.data, this.data, b.data ? b.data : b);
    return r;
};

Vec2.prototype.dist = Vec2.prototype.distance = function() {
    return vec2.dist(this.data);
};

Vec2.prototype.divide = function(b) {
    vec2.divide(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec2.prototype.dot = function(b) {
    return vec2.dot(this.data, b.data ? b.data : b);
};

Vec2.prototype.fromValues = function(x, y) {
    return new Vec2(vec2.fromValues(x,y));
};

Vec2.prototype.len = Vec2.prototype.length = function() {
    return vec2.length(this.data);
};

Vec2.prototype.lerp = function(b, t) {
    vec2.lerp(this.data, this.data, b.data ? b.data : b, t);
    return this;
};

Vec2.prototype.max = function(b) {
    var m = new Vec2();
    vec2.max(m.data, this.data, b.data ? b.data : b);
    return m;
};

Vec2.prototype.min = function(b) {
    var m = new Vec2();
    vec2.max(m.data, this.data, b.data ? b.data : b);
    return m;
};

Vec2.prototype.mul = Vec2.prototype.multiply = function(b) {
    vec2.mul(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec2.prototype.negate = function() {
    vec2.negate(this.data, this.data);
    return this;
};

Vec2.prototype.normalize = function() {
    vec2.normalize(this.data, this.data);
    return this;
};

Vec2.prototype.random = function(scale) {
    var m = new Vec2();
    vec2.random(m.data, scale);
    return m;
};

Vec2.prototype.scale = function(s) {
    vec2.scale(this.data, this.data, s);
    return this;
};

Vec2.prototype.scaleAndAdd = function(b, scale) {
    vec2.scaleAndAdd(this.data, this.data, b.data ? b.data : b, scale);
    return this;
};

Vec2.prototype.set = function(x, y) {
    vec2.set(this.data, x, y);
    return this;
};

Vec2.prototype.sqrDist = Vec2.prototype.squaredDistance = function(b) {
    return vec2.sqrDist(this.data, b.data ? b.data : b);
};

Vec2.prototype.sqrLen = Vec2.prototype.squaredLength = function() {
    return vec2.sqrLen(this.data);
};

Vec2.prototype.sub = Vec2.prototype.subtract = function(b) {
    vec2.sub(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec2.prototype.transformMat2 = function(m) {
    vec2.transformMat2(this.data, this.data, m.data ? m.data : m);
    return this;
};

Vec2.prototype.transformMat3 = function(m) {
    vec2.transformMat3(this.data, this.data, m.data ? m.data : m);
    return this;
};

Vec2.prototype.transformMat4 = function(m) {
    vec2.transformMat4(this.data, this.data, m.data ? m.data : m);
    return this;
};

Vec2.prototype.transformQuat = function(q) {
    vec2.transformQuat(this.data, this.data, q.data ? q.data : q);
    return this;
};

Vec2.prototype.toDOMString = function() {
    return vec2.toDOMString(this.data);
};

Vec2.prototype.fromDOMString = function(str) {
    return new Vec2(vec2.fromDOMString(str));
};

module.exports = Vec2;