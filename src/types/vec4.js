var vec4 = require("gl-matrix").vec4;
var Vec3 = require("./vec3.js");

var Vec4 = function(vec) {
    if (vec) {
        this.data = vec4.clone(vec.data ? vec.data : vec);
    } else {
        this.data = vec4.create();
    }
};

Object.defineProperty(Vec4.prototype, "x", {
    set: function(x){
        this.data[0] = x;
    },
    get: function(){ return this.data[0]; }
});
Object.defineProperty(Vec4.prototype, "y", {
    set: function(y){
        this.data[1] = y;
    },
    get: function(){ return this.data[1]; }
});
Object.defineProperty(Vec4.prototype, "z", {
    set: function(z){
        this.data[2] = z;
    },
    get: function(){ return this.data[2]; }
});
Object.defineProperty(Vec4.prototype, "w", {
    set: function(w){
        this.data[3] = w;
    },
    get: function(){ return this.data[3]; }
});
Object.defineProperty(Vec4.prototype, "axis", {
    set: function(vec){
        this.data[0] = vec.data ? vec.data[0] : vec[0];
        this.data[1] = vec.data ? vec.data[1] : vec[1];
        this.data[2] = vec.data ? vec.data[2] : vec[2];
    },
    get: function(){ return new Vec3(this.data) }
});
Object.defineProperty(Vec4.prototype, "angle", {
    set: function(a){
        this.data[3] = a;
    },
    get: function(){ return this.data[3]; }
});

Vec4.prototype.add = function(b) {
    vec4.add(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec4.prototype.clone = function() {
   return new Vec4(this);
};

Vec4.prototype.copy = function(b) {
    vec4.copy(this.data, b.data ? b.data : b);
    return this;
};

Vec4.prototype.dist = Vec4.prototype.distance = function() {
    return vec4.dist(this.data);
};

Vec4.prototype.divide = function(b) {
    vec4.divide(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec4.prototype.dot = function(b) {
    return vec4.dot(this.data, b.data ? b.data : b);
};

Vec4.prototype.fromValues = function(x, y, z, w) {
    return new Vec4(vec4.fromValues(x,y,z,w));
};

Vec4.prototype.len = Vec4.prototype.length = function() {
    return vec4.length(this.data);
};

Vec4.prototype.lerp = function(b, t) {
    vec4.lerp(this.data, this.data, b.data ? b.data : b, t);
    return this;
};

Vec4.prototype.max = function(b) {
    var m = new Vec4();
    vec4.max(m.data, this.data, b.data ? b.data : b);
    return m;
};

Vec4.prototype.min = function(b) {
    var m = new Vec4();
    vec4.max(m.data, this.data, b.data ? b.data : b);
    return m;
};

Vec4.prototype.mul = Vec4.prototype.multiply = function(b) {
    vec4.mul(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec4.prototype.negate = function() {
    vec4.negate(this.data, this.data);
    return this;
};

Vec4.prototype.normalize = function() {
    vec4.normalize(this.data, this.data);
    return this;
};

Vec4.prototype.random = function(scale) {
    var m = new Vec4();
    vec4.random(m.data, scale);
    return m;
};

Vec4.prototype.scale = function(s) {
    vec4.scale(this.data, this.data, s);
    return this;
};

Vec4.prototype.scaleAndAdd = function(b, scale) {
    vec4.scaleAndAdd(this.data, this.data, b.data ? b.data : b, scale);
    return this;
};

Vec4.prototype.set = function(x, y, z, w) {
    vec4.set(this.data, x, y, z, w);
    return this;
};

Vec4.prototype.setFromQuat = function(q) {
    this.data = XML3D.math.vec4.fromQuat(q.data ? q.data : q);
    return this;
};

Vec4.prototype.sqrDist = Vec4.prototype.squaredDistance = function(b) {
    return vec4.sqrDist(this.data, b.data ? b.data : b);
};

Vec4.prototype.sqrLen = Vec4.prototype.squaredLength = function() {
    return vec4.sqrLen(this.data);
};

Vec4.prototype.sub = Vec4.prototype.subtract = function(b) {
    vec4.sub(this.data, this.data, b.data ? b.data : b);
    return this;
};

Vec4.prototype.transformMat4 = function(m) {
    vec4.transformMat4(this.data, this.data, m.data ? m.data : m);
    return this;
};

Vec4.prototype.transformQuat = function(q) {
    vec4.transformQuat(this.data, this.data, q.data ? q.data : q);
    return this;
};

Vec4.prototype.toDOMString = function() {
    return vec4.toDOMString(this.data);
};

Vec4.prototype.fromDOMString = function(str) {
    return new Vec4(vec4.fromDOMString(str));
};

module.exports = Vec4;