var vec4 = require("gl-matrix").vec4;
var Vec3 = require("./vec3.js");

var Vec4 = function(vec) {
    if (this instanceof Vec4) {
        this.data = vec4.create();
        if (vec) {
            this.data.set(vec.data ? vec.data : vec);
        }
    } else return new Vec4(vec);
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

Vec4.prototype.add = function(b) {
    var out = new Vec4();
    vec4.add(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec4.prototype.clone = function() {
   return new Vec4(this);
};

Vec4.prototype.dist = Vec4.prototype.distance = function() {
    return vec4.dist(this.data);
};

Vec4.prototype.divide = function(b) {
    var out = new Vec4();
    vec4.divide(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec4.prototype.dot = function(b) {
    return vec4.dot(this.data, b.data ? b.data : b);
};

Vec4.fromValues = function(x, y, z, w) {
    return new Vec4(vec4.fromValues(x,y,z,w));
};

Vec4.prototype.len = Vec4.prototype.length = function() {
    return vec4.length(this.data);
};

Vec4.prototype.lerp = function(b, t) {
    var out = new Vec4();
    vec4.lerp(out.data, this.data, b.data ? b.data : b, t);
    return out;
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
    var out = new Vec4();
    vec4.mul(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec4.prototype.negate = function() {
    var out = new Vec4();
    vec4.negate(out.data, this.data);
    return out;
};

Vec4.prototype.normalize = function() {
    var out = new Vec4();
    vec4.normalize(out.data, this.data);
    return out;
};

Vec4.prototype.random = function(scale) {
    var m = new Vec4();
    vec4.random(m.data, scale);
    return m;
};

Vec4.prototype.scale = function(s) {
    var out = new Vec4();
    vec4.scale(out.data, this.data, s);
    return out;
};

Vec4.prototype.sub = Vec4.prototype.subtract = function(b) {
    var out = new Vec4();
    vec4.sub(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec4.prototype.transformMat4 = function(m) {
    var out = new Vec4();
    vec4.transformMat4(out.data, this.data, m.data ? m.data : m);
    return out;
};

Vec4.prototype.transformQuat = function(q) {
    var out = new Vec4();
    vec4.transformQuat(out.data, this.data, q.data ? q.data : q);
    return out;
};

Vec4.prototype.toDOMString = function() {
    return vec4.toDOMString(this.data);
};

Vec4.fromDOMString = function(str) {
    var out = new Vec4();
    out.data.set( vec4.fromDOMString(str) );
    return out;
};

Vec4.wrap = function(vec) {
    var v = Vec4();
    v.data = vec.data ? vec.data : vec;
    return v;
};

module.exports = Vec4;
