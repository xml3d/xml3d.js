var vec4 = require("gl-matrix").vec4;
var Vec3 = require("./vec3.js");

var AxisAngle = function(vec, y, z, angle) {
    if (this instanceof AxisAngle) {
        this.data = vec4.create();
        if (angle !== undefined) {
            this.data[0] = vec;
            this.data[1] = y;
            this.data[2] = z;
            this.data[3] = angle;
        } else
        if (vec) {
            this.data.set(vec.data ? vec.data : vec);
        } else {
            this.data[2] = 1;
        }
    } else return new AxisAngle(vec, y, z, angle);
};


Object.defineProperty(AxisAngle.prototype, "axis", {
    set: function(vec){
        this.data[0] = vec.data ? vec.data[0] : vec[0];
        this.data[1] = vec.data ? vec.data[1] : vec[1];
        this.data[2] = vec.data ? vec.data[2] : vec[2];
    },
    get: function(){ return Vec3.wrap(this.data) }
});
Object.defineProperty(AxisAngle.prototype, "angle", {
    set: function(a){
        this.data[3] = a;
    },
    get: function(){ return this.data[3]; }
});

AxisAngle.prototype.clone = function() {
   return new AxisAngle(this);
};

AxisAngle.fromQuat = function(q) {
    var out = new AxisAngle();
    out.data.set(XML3D.math.vec4.fromQuat(q.data ? q.data : q));
    return out;
};

AxisAngle.prototype.toDOMString = function() {
    return vec4.toDOMString(this.data);
};

AxisAngle.fromDOMString = function(str) {
    var out = new AxisAngle();
    out.data.set( vec4.fromDOMString(str) );
    return out;
};

AxisAngle.prototype.toQuat = function() {
    var out = new Quat();
    quat.setAxisAngle(out.data, this.data, this.data[3]);
    return out;
};

AxisAngle.wrap = function(vec) {
    var v = AxisAngle();
    v.data = vec.data ? vec.data : vec;
    return v;
};

module.exports = AxisAngle;
