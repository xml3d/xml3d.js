var vec2 = require("gl-matrix").vec2;

var Vec2 = function(vec) {
    if (this instanceof Vec2) {
        this.data = vec2.create();
        if (vec) {
            this.data.set(vec.data ? vec.data : vec);
        }
        Object.freeze(this);
    } else return new Vec2(vec);
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
    var out = new Vec2();
    vec2.add(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec2.prototype.clone = function() {
    return new Vec2(this);
};

Vec2.prototype.dist = Vec2.prototype.distance = function() {
    return vec2.dist(this.data);
};

Vec2.prototype.divide = function(b) {
    var out = new Vec2();
    vec2.divide(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec2.prototype.dot = function(b) {
    return vec2.dot(this.data, b.data ? b.data : b);
};

Vec2.fromValues = function(x, y) {
    return new Vec2(vec2.fromValues(x,y));
};

Vec2.prototype.len = Vec2.prototype.length = function() {
    return vec2.length(this.data);
};

Vec2.prototype.lerp = function(b, t) {
    var out = new Vec2();
    vec2.lerp(out.data, this.data, b.data ? b.data : b, t);
    return out;
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
    var out = new Vec2();
    vec2.mul(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec2.prototype.negate = function() {
    var out = new Vec2();
    vec2.negate(out.data, this.data);
    return out;
};

Vec2.prototype.normalize = function() {
    var out = new Vec2();
    vec2.normalize(out.data, this.data);
    return out;
};

Vec2.random = function(scale) {
    var m = new Vec2();
    vec2.random(m.data, scale);
    return m;
};

Vec2.prototype.scale = function(s) {
    var out = new Vec2();
    vec2.scale(out.data, this.data, s);
    return out;
};

Vec2.prototype.sub = Vec2.prototype.subtract = function(b) {
    var out = new Vec2();
    vec2.sub(out.data, this.data, b.data ? b.data : b);
    return out;
};

Vec2.prototype.transformMat2 = function(m) {
    var out = new Vec2();
    vec2.transformMat2(out.data, this.data, m.data ? m.data : m);
    return out;
};

Vec2.prototype.transformMat3 = function(m) {
    var out = new Vec2();
    vec2.transformMat3(out.data, this.data, m.data ? m.data : m);
    return out;
};

Vec2.prototype.transformMat4 = function(m) {
    var out = new Vec2();
    vec2.transformMat4(out.data, this.data, m.data ? m.data : m);
    return out;
};

Vec2.prototype.toDOMString = function() {
    return vec2.toDOMString(this.data);
};

Vec2.fromDOMString = function(str) {
    var out = new Vec2();
    out.data.set( vec2.fromDOMString(str) );
    return out;
};

Vec2.wrap = function(vec) {
    var v = Vec2();
    v.data = vec.data ? vec.data : vec;
    return v;
};

module.exports = Vec2;
