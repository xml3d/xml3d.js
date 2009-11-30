// Create global symbol org
var org;
if (!org)
	org = {};
else if (typeof org != "object")
	throw new Error("org already exists and is not an object");

if (!org.xml3d)
	org.xml3d = {};
else if (typeof org.xml3d != "object")
	throw new Error("org.xml3d already exists and is not an object");

if (!org.xml3d.dataTypes)
	org.xml3d.dataTypes = {};
else if (typeof org.xml3d.dataTypes != "object")
	throw new Error("org.xml3d.dataTypes already exists and is not an object");

org.xml3d.dataTypes = {};
org.xml3d.dataTypes.SFMatrix4 = function(_00, _01, _02, _03, _10, _11, _12,
		_13, _20, _21, _22, _23, _30, _31, _32, _33) {
	if (arguments.length == 0) {
		this._00 = 1;
		this._01 = 0;
		this._02 = 0;
		this._03 = 0;
		this._10 = 0;
		this._11 = 1;
		this._12 = 0;
		this._13 = 0;
		this._20 = 0;
		this._21 = 0;
		this._22 = 1;
		this._23 = 0;
		this._30 = 0;
		this._31 = 0;
		this._32 = 0;
		this._33 = 1;
	} else {
		this._00 = _00;
		this._01 = _01;
		this._02 = _02;
		this._03 = _03;
		this._10 = _10;
		this._11 = _11;
		this._12 = _12;
		this._13 = _13;
		this._20 = _20;
		this._21 = _21;
		this._22 = _22;
		this._23 = _23;
		this._30 = _30;
		this._31 = _31;
		this._32 = _32;
		this._33 = _33;
	}
};
org.xml3d.dataTypes.SFMatrix4.prototype.e0 = function() {
	var baseVec = new org.xml3d.dataTypes.Vec3f(this._00, this._10, this._20);
	return baseVec.normalised();
};
org.xml3d.dataTypes.SFMatrix4.prototype.e1 = function() {
	var baseVec = new org.xml3d.dataTypes.Vec3f(this._01, this._11, this._21);
	return baseVec.normalised();
};
org.xml3d.dataTypes.SFMatrix4.prototype.e2 = function() {
	var baseVec = new org.xml3d.dataTypes.Vec3f(this._02, this._12, this._22);
	return baseVec.normalised();
};
org.xml3d.dataTypes.SFMatrix4.prototype.e3 = function() {
	return new org.xml3d.dataTypes.Vec3f(this._03, this._13, this._23);
};
org.xml3d.dataTypes.SFMatrix4.identity = function() {
	return new org.xml3d.dataTypes.SFMatrix4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
			0, 0, 0, 0, 1);
};
org.xml3d.dataTypes.SFMatrix4.translation = function(vec) {
	return new org.xml3d.dataTypes.SFMatrix4(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0,
			0, 1, vec.z, 0, 0, 0, 1);
};
org.xml3d.dataTypes.SFMatrix4.rotationX = function(a) {
	var c = Math.cos(a);
	var s = Math.sin(a);
	return new org.xml3d.dataTypes.SFMatrix4(1, 0, 0, 0, 0, c, -s, 0, 0, s, c,
			0, 0, 0, 0, 1);
};
org.xml3d.dataTypes.SFMatrix4.rotationY = function(a) {
	var c = Math.cos(a);
	var s = Math.sin(a);
	return new org.xml3d.dataTypes.SFMatrix4(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c,
			0, 0, 0, 0, 1);
};
org.xml3d.dataTypes.SFMatrix4.rotationZ = function(a) {
	var c = Math.cos(a);
	var s = Math.sin(a);
	return new org.xml3d.dataTypes.SFMatrix4(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1,
			0, 0, 0, 0, 1);
};
org.xml3d.dataTypes.SFMatrix4.scale = function(vec) {
	return new org.xml3d.dataTypes.SFMatrix4(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0,
			0, vec.z, 0, 0, 0, 0, 1);
};
org.xml3d.dataTypes.SFMatrix4.prototype.setTranslate = function(vec) {
	this._03 = vec.x;
	this._13 = vec.y;
	this._23 = vec.z;
};
org.xml3d.dataTypes.SFMatrix4.prototype.setScale = function(vec) {
	this._00 = vec.x;
	this._11 = vec.y;
	this._22 = vec.z;
};
org.xml3d.dataTypes.SFMatrix4.parseRotation = function(str) {
	var m = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/.exec(str);
	var x = +m[1], y = +m[2], z = +m[3], a = +m[4];
	var d = Math.sqrt(x * x + y * y + z * z);
	if (d == 0) {
		x = 1;
		y = z = 0;
	} else {
		x /= d;
		y /= d;
		z /= d;
	}
	var c = Math.cos(a);
	var s = Math.sin(a);
	var t = 1 - c;
	return new org.xml3d.dataTypes.SFMatrix4(t * x * x + c, t * x * y + s * z,
			t * x * z - s * y, 0, t * x * y - s * z, t * y * y + c, t * y * z
					+ s * x, 0, t * x * z + s * y, t * y * z - s * x, t * z * z
					+ c, 0, 0, 0, 0, 1).transpose();
};
org.xml3d.dataTypes.SFMatrix4.prototype.mult = function(that) {
	return new org.xml3d.dataTypes.SFMatrix4(this._00 * that._00 + this._01
			* that._10 + this._02 * that._20 + this._03 * that._30, this._00
			* that._01 + this._01 * that._11 + this._02 * that._21 + this._03
			* that._31, this._00 * that._02 + this._01 * that._12 + this._02
			* that._22 + this._03 * that._32, this._00 * that._03 + this._01
			* that._13 + this._02 * that._23 + this._03 * that._33, this._10
			* that._00 + this._11 * that._10 + this._12 * that._20 + this._13
			* that._30, this._10 * that._01 + this._11 * that._11 + this._12
			* that._21 + this._13 * that._31, this._10 * that._02 + this._11
			* that._12 + this._12 * that._22 + this._13 * that._32, this._10
			* that._03 + this._11 * that._13 + this._12 * that._23 + this._13
			* that._33, this._20 * that._00 + this._21 * that._10 + this._22
			* that._20 + this._23 * that._30, this._20 * that._01 + this._21
			* that._11 + this._22 * that._21 + this._23 * that._31, this._20
			* that._02 + this._21 * that._12 + this._22 * that._22 + this._23
			* that._32, this._20 * that._03 + this._21 * that._13 + this._22
			* that._23 + this._23 * that._33, this._30 * that._00 + this._31
			* that._10 + this._32 * that._20 + this._33 * that._30, this._30
			* that._01 + this._31 * that._11 + this._32 * that._21 + this._33
			* that._31, this._30 * that._02 + this._31 * that._12 + this._32
			* that._22 + this._33 * that._32, this._30 * that._03 + this._31
			* that._13 + this._32 * that._23 + this._33 * that._33);
};
org.xml3d.dataTypes.SFMatrix4.prototype.multMatrixPnt = function(vec) {
	return new org.xml3d.dataTypes.Vec3f(this._00 * vec.x + this._01 * vec.y
			+ this._02 * vec.z + this._03, this._10 * vec.x + this._11 * vec.y
			+ this._12 * vec.z + this._13, this._20 * vec.x + this._21 * vec.y
			+ this._22 * vec.z + this._23);
};
org.xml3d.dataTypes.SFMatrix4.prototype.multMatrixVec = function(vec) {
	return new org.xml3d.dataTypes.Vec3f(this._00 * vec.x + this._01 * vec.y
			+ this._02 * vec.z, this._10 * vec.x + this._11 * vec.y + this._12
			* vec.z, this._20 * vec.x + this._21 * vec.y + this._22 * vec.z);
};
org.xml3d.dataTypes.SFMatrix4.prototype.multFullMatrixPnt = function(vec) {
	var w = this._30 * vec.x + this._31 * vec.y + this._32 * vec.z + this._33;
	if (w)
		w = 1.0 / w;
	return new org.xml3d.dataTypes.Vec3f((this._00 * vec.x + this._01 * vec.y
			+ this._02 * vec.z + this._03)
			* w,
			(this._10 * vec.x + this._11 * vec.y + this._12 * vec.z + this._13)
					* w, (this._20 * vec.x + this._21 * vec.y + this._22
					* vec.z + this._23)
					* w);
};
org.xml3d.dataTypes.SFMatrix4.prototype.transpose = function() {
	return new org.xml3d.dataTypes.SFMatrix4(this._00, this._10, this._20,
			this._30, this._01, this._11, this._21, this._31, this._02,
			this._12, this._22, this._32, this._03, this._13, this._23,
			this._33);
};
org.xml3d.dataTypes.SFMatrix4.prototype.toGL = function() {
	return [ this._00, this._10, this._20, this._30, this._01, this._11,
			this._21, this._31, this._02, this._12, this._22, this._32,
			this._03, this._13, this._23, this._33 ];
};
org.xml3d.dataTypes.SFMatrix4.prototype.decompose = function() {
	var T = new SFVec3(this._03, this._13, this._23);
	var S = new SFVec3(1, 1, 1);
	var angle_x, angle_y, angle_y, tr_x, tr_y, C;
	angle_y = Math.asin(this._02);
	C = Math.cos(angle_y);
	if (Math.abs(C) > 0.005) {
		tr_x = this._22 / C;
		tr_y = -this._12 / C;
		angle_x = Math.atan2(tr_y, tr_x);
		tr_x = this._00 / C;
		tr_y = -this._01 / C;
		angle_z = Math.atan2(tr_y, tr_x);
	} else {
		angle_x = 0;
		tr_x = this._11;
		tr_y = this._10;
		angle_z = Math.atan2(tr_y, tr_x);
	}
	return [ T, S, angle_x, angle_y, angle_z ];
};
org.xml3d.dataTypes.SFMatrix4.prototype.det3 = function(a1, a2, a3, b1, b2, b3,
		c1, c2, c3) {
	var d = (a1 * b2 * c3) + (a2 * b3 * c1) + (a3 * b1 * c2) - (a1 * b3 * c2)
			- (a2 * b1 * c3) - (a3 * b2 * c1);
	return d;
};
org.xml3d.dataTypes.SFMatrix4.prototype.det = function() {
	var a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4;
	a1 = this._00;
	b1 = this._10;
	c1 = this._20;
	d1 = this._30;
	a2 = this._01;
	b2 = this._11;
	c2 = this._21;
	d2 = this._31;
	a3 = this._02;
	b3 = this._12;
	c3 = this._22;
	d3 = this._32;
	a4 = this._03;
	b4 = this._13;
	c4 = this._23;
	d4 = this._33;
	var d = +a1 * this.det3(b2, b3, b4, c2, c3, c4, d2, d3, d4) - b1
			* this.det3(a2, a3, a4, c2, c3, c4, d2, d3, d4) + c1
			* this.det3(a2, a3, a4, b2, b3, b4, d2, d3, d4) - d1
			* this.det3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
	return d;
};
org.xml3d.dataTypes.SFMatrix4.prototype.inverse = function() {
	var a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4;
	a1 = this._00;
	b1 = this._10;
	c1 = this._20;
	d1 = this._30;
	a2 = this._01;
	b2 = this._11;
	c2 = this._21;
	d2 = this._31;
	a3 = this._02;
	b3 = this._12;
	c3 = this._22;
	d3 = this._32;
	a4 = this._03;
	b4 = this._13;
	c4 = this._23;
	d4 = this._33;
	var rDet = this.det();
	if (Math.abs(rDet) < 0.000001) {
		org.xml3d.debug.logInfo("Invert matrix: singular matrix, no inverse!");
		return org.xml3d.dataTypes.SFMatrix4.identity();
	}
	rDet = 1.0 / rDet;
	return new org.xml3d.dataTypes.SFMatrix4(+this.det3(b2, b3, b4, c2, c3, c4,
			d2, d3, d4)
			* rDet, -this.det3(a2, a3, a4, c2, c3, c4, d2, d3, d4) * rDet,
			+this.det3(a2, a3, a4, b2, b3, b4, d2, d3, d4) * rDet, -this.det3(
					a2, a3, a4, b2, b3, b4, c2, c3, c4)
					* rDet, -this.det3(b1, b3, b4, c1, c3, c4, d1, d3, d4)
					* rDet, +this.det3(a1, a3, a4, c1, c3, c4, d1, d3, d4)
					* rDet, -this.det3(a1, a3, a4, b1, b3, b4, d1, d3, d4)
					* rDet, +this.det3(a1, a3, a4, b1, b3, b4, c1, c3, c4)
					* rDet, +this.det3(b1, b2, b4, c1, c2, c4, d1, d2, d4)
					* rDet, -this.det3(a1, a2, a4, c1, c2, c4, d1, d2, d4)
					* rDet, +this.det3(a1, a2, a4, b1, b2, b4, d1, d2, d4)
					* rDet, -this.det3(a1, a2, a4, b1, b2, b4, c1, c2, c4)
					* rDet, -this.det3(b1, b2, b3, c1, c2, c3, d1, d2, d3)
					* rDet, +this.det3(a1, a2, a3, c1, c2, c3, d1, d2, d3)
					* rDet, -this.det3(a1, a2, a3, b1, b2, b3, d1, d2, d3)
					* rDet, +this.det3(a1, a2, a3, b1, b2, b3, c1, c2, c3)
					* rDet);
};
org.xml3d.dataTypes.SFMatrix4.prototype.toString = function() {
	return '[SFMatrix4 ' + this._00 + ', ' + this._01 + ', ' + this._02 + ', '
			+ this._03 + '; ' + this._10 + ', ' + this._11 + ', ' + this._12
			+ ', ' + this._13 + '; ' + this._20 + ', ' + this._21 + ', '
			+ this._22 + ', ' + this._23 + '; ' + this._30 + ', ' + this._31
			+ ', ' + this._32 + ', ' + this._33 + ']';
};
org.xml3d.dataTypes.Vec2f = function(x, y) {
	if (arguments.length == 0) {
		this.x = this.y = 0;
	} else {
		this.x = x;
		this.y = y;
	}
};
org.xml3d.dataTypes.Vec2f.parse = function(str) {
	var m = /^([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)$/.exec(str);
	return new org.xml3d.dataTypes.Vec2f(+m[1], +m[2]);
};
org.xml3d.dataTypes.Vec2f.prototype.add = function(that) {
	return new org.xml3d.dataTypes.Vec2f(this.x + that.x, this.y + that.y);
};
org.xml3d.dataTypes.Vec2f.prototype.subtract = function(that) {
	return new org.xml3d.dataTypes.Vec2f(this.x - that.x, this.y - that.y);
};
org.xml3d.dataTypes.Vec2f.prototype.negate = function() {
	return new org.xml3d.dataTypes.Vec2f(-this.x, -this.y);
};
org.xml3d.dataTypes.Vec2f.prototype.dot = function(that) {
	return this.x * that.x + this.y * that.y;
};
org.xml3d.dataTypes.Vec2f.prototype.reflect = function(n) {
	var d2 = this.dot(n) * 2;
	return new org.xml3d.dataTypes.Vec2f(this.x - d2 * n.x, this.y - d2 * n.y);
};
org.xml3d.dataTypes.Vec2f.prototype.normalised = function(that) {
	var n = this.length();
	if (n)
		n = 1.0 / n;
	return new org.xml3d.dataTypes.Vec2f(this.x * n, this.y * n);
};
org.xml3d.dataTypes.Vec2f.prototype.multiply = function(n) {
	return new org.xml3d.dataTypes.Vec2f(this.x * n, this.y * n);
};
org.xml3d.dataTypes.Vec2f.prototype.length = function() {
	return Math.sqrt((this.x * this.x) + (this.y * this.y));
};
org.xml3d.dataTypes.Vec2f.prototype.toGL = function() {
	return [ this.x, this.y ];
};
org.xml3d.dataTypes.Vec2f.prototype.toString = function() {
	return "{ x " + this.x + " y " + this.y + " }";
};
org.xml3d.dataTypes.Vec2f.prototype.setValueByStr = function(s) {
	var m = /^([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)$/.exec(s);
	this.x = +m[1];
	this.y = +m[2];
	return this;
};
org.xml3d.dataTypes.Vec3f = function(x, y, z) {
	if (arguments.length == 0) {
		this.x = this.y = this.z = 0;
	} else {
		this.x = x;
		this.y = y;
		this.z = z;
	}
};
org.xml3d.dataTypes.Vec3f.parse = function(str) {
	var m = /^(\S+)\s+(\S+)\s+(\S+)$/.exec(str);
	return new org.xml3d.dataTypes.Vec3f(+m[1], +m[2], +m[3]);
};
org.xml3d.dataTypes.Vec3f.prototype.add = function(that) {
	return new org.xml3d.dataTypes.Vec3f(this.x + that.x, this.y + that.y,
			this.z + that.z);
};
org.xml3d.dataTypes.Vec3f.prototype.subtract = function(that) {
	return new org.xml3d.dataTypes.Vec3f(this.x - that.x, this.y - that.y,
			this.z - that.z);
};
org.xml3d.dataTypes.Vec3f.prototype.negate = function() {
	return new org.xml3d.dataTypes.Vec3f(-this.x, -this.y, -this.z);
};
org.xml3d.dataTypes.Vec3f.prototype.dot = function(that) {
	return (this.x * that.x + this.y * that.y + this.z * that.z);
};
org.xml3d.dataTypes.Vec3f.prototype.cross = function(that) {
	return new org.xml3d.dataTypes.Vec3f(this.y * that.z - this.z * that.y,
			this.z * that.x - this.x * that.z, this.x * that.y - this.y
					* that.x);
};
org.xml3d.dataTypes.Vec3f.prototype.reflect = function(n) {
	var d2 = this.dot(n) * 2;
	return new org.xml3d.dataTypes.Vec3f(this.x - d2 * n.x, this.y - d2 * n.y,
			this.z - d2 * n.z);
};
org.xml3d.dataTypes.Vec3f.prototype.length = function() {
	return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
};
org.xml3d.dataTypes.Vec3f.prototype.normalised = function(that) {
	var n = this.length();
	if (n)
		n = 1.0 / n;
	return new org.xml3d.dataTypes.Vec3f(this.x * n, this.y * n, this.z * n);
};
org.xml3d.dataTypes.Vec3f.prototype.scale = function(n) {
	return new org.xml3d.dataTypes.Vec3f(this.x * n, this.y * n, this.z * n);
};
org.xml3d.dataTypes.Vec3f.prototype.toGL = function() {
	return [ this.x, this.y, this.z ];
};
org.xml3d.dataTypes.Vec3f.prototype.toString = function() {
	return "{ x " + this.x + " y " + this.y + " z " + this.z + " }";
};
org.xml3d.dataTypes.Quaternion = function(x, y, z, w) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
};
org.xml3d.dataTypes.Quaternion.prototype.mult = function(that) {
	return new org.xml3d.dataTypes.Quaternion(this.w * that.x + this.x * that.w
			+ this.y * that.z - this.z * that.y, this.w * that.y + this.y
			* that.w + this.z * that.x - this.x * that.z, this.w * that.z
			+ this.z * that.w + this.x * that.y - this.y * that.x, this.w
			* that.w - this.x * that.x - this.y * that.y - this.z * that.z);
};
org.xml3d.dataTypes.Quaternion.parseAxisAngle = function(str) {
	var m = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/.exec(str);
	return org.xml3d.dataTypes.Quaternion.axisAngle(
			new org.xml3d.dataTypes.Vec3f(+m[1], +m[2], +m[3]), +m[4]);
};

org.xml3d.dataTypes.Quaternion.fromMatrix = function(mat) {
	var q = new org.xml3d.dataTypes.Quaternion();
	var trace = mat._00 + mat._11 + mat._22;
	if (trace > 0) {
		var s = 0.5 / Math.sqrt(trace + 1.0);
		q.w = 0.25 / s;
		q.x = (mat._21 - mat._12) * s;
		q.y = (mat._02 - mat._20) * s;
		q.z = (mat._10 - mat._01) * s;
	} else {
		if (mat._00 > mat._11 && mat._00 > mat._22) {
			var s = 2.0 * sqrtf(1.0 + mat._00 - mat._11 - mat._22);
			q.w = (mat._21 - mat._12) / s;
			q.x = 0.25 * s;
			q.y = (mat._01 + mat._10) / s;
			q.z = (mat._02 + mat._20) / s;
		} else if (mat._11 > mat._22) {
			var s = 2.0 * Math.sqrt(1.0 + mat._11 - mat._00 - mat._22);
			q.w = (mat._02 - mat._20) / s;
			q.x = (mat._01 + mat._10) / s;
			q.y = 0.25 * s;
			q.z = (mat._12 + mat._21) / s;
		} else {
			var s = 2.0 * Math.sqrt(1.0 + mat._22 - mat._00 - mat._11);
			q.w = (mat._10 - mat._01) / s;
			q.x = (mat._02 + mat._20) / s;
			q.y = (mat._12 + mat._21) / s;
			q.z = 0.25 * s;
		}
	}
	return q;
};

org.xml3d.dataTypes.Quaternion.fromBasis = function(x, y, z) {
	var normX = x.length();
	var normY = y.length();
	var normZ = z.length();

	var m = new org.xml3d.dataTypes.SFMatrix4();
	m._00 = x.x / normX;
	m._01 = y.x / normY;
	m._02 = z.x / normZ;
	m._10 = x.y / normX;
	m._11 = y.y / normY;
	m._12 = z.y / normZ;
	m._20 = x.z / normX;
	m._21 = y.z / normY;
	m._22 = z.z / normZ;

	return org.xml3d.dataTypes.Quaternion.fromMatrix(m);
};

org.xml3d.dataTypes.Quaternion.axisAngle = function(axis, a) {
	var t = axis.length();
	if (t > 0.000001) {
		var s = Math.sin(a / 2) / t;
		var c = Math.cos(a / 2);
		return new org.xml3d.dataTypes.Quaternion(axis.x * s, axis.y * s,
				axis.z * s, c);
	} else {
		return new org.xml3d.dataTypes.Quaternion(0, 0, 0, 1);
	}
};

org.xml3d.dataTypes.Quaternion.prototype.toMatrix = function() {
	var xx = this.x * this.x * 2;
	var xy = this.x * this.y * 2;
	var xz = this.x * this.z * 2;
	var yy = this.y * this.y * 2;
	var yz = this.y * this.z * 2;
	var zz = this.z * this.z * 2;
	var wx = this.w * this.x * 2;
	var wy = this.w * this.y * 2;
	var wz = this.w * this.z * 2;
	return new org.xml3d.dataTypes.SFMatrix4(1 - (yy + zz), xy - wz, xz + wy,
			0, xy + wz, 1 - (xx + zz), yz - wx, 0, xz - wy, yz + wx,
			1 - (xx + yy), 0, 0, 0, 0, 1);
};

org.xml3d.dataTypes.Quaternion.prototype.toAxisAngle = function() {
	var angle = 2 * Math.acos(this.w);
	var s = Math.sqrt(1 - this.w * this.w);
	if (s < 0.001) {
		return [ this.x, this.y, this.z, angle ];
	}
	return [ this.x / s, this.y / s, this.z / s, angle ];
};

org.xml3d.dataTypes.Quaternion.prototype.rotateVec = function(v) {
	var q00 = 2.0 * this.x * this.x;
	var q11 = 2.0 * this.y * this.y;
	var q22 = 2.0 * this.z * this.z;

	var q01 = 2.0 * this.x * this.y;
	var q02 = 2.0 * this.x * this.z;
	var q03 = 2.0 * this.x * this.w;

	var q12 = 2.0 * this.y * this.z;
	var q13 = 2.0 * this.y * this.w;

	var q23 = 2.0 * this.z * this.w;

	return new org.xml3d.dataTypes.Vec3f((1.0 - q11 - q22) * v.x + (q01 - q23)
			* v.y + (q02 + q13) * v.z, (q01 + q23) * v.x + (1.0 - q22 - q00)
			* v.y + (q12 - q03) * v.z, (q02 - q13) * v.x + (q12 + q03) * v.y
			+ (1.0 - q11 - q00) * v.z);
};

org.xml3d.dataTypes.Quaternion.prototype.dot = function(that) {
	return this.x * that.x + this.y * that.y + this.z * that.z + this.w
			* that.w;
};
org.xml3d.dataTypes.Quaternion.prototype.add = function(that) {
	return new org.xml3d.dataTypes.Quaternion(this.x + that.x, this.y + that.y,
			this.z + that.z, this.w + that.w);
};
org.xml3d.dataTypes.Quaternion.prototype.subtract = function(that) {
	return new org.xml3d.dataTypes.Quaternion(this.x - that.x, this.y - that.y,
			this.z - that.z, this.w - that.w);
};
org.xml3d.dataTypes.Quaternion.prototype.multScalar = function(s) {
	return new org.xml3d.dataTypes.Quaternion(this.x * s, this.y * s, this.z
			* s, this.w * s);
};
org.xml3d.dataTypes.Quaternion.prototype.normalised = function(that) {
	var d2 = this.dot(that);
	var id = 1.0;
	if (d2)
		id = 1.0 / Math.sqrt(d2);
	return new org.xml3d.dataTypes.Quaternion(this.x * id, this.y * id, this.z
			* id, this.w * id);
};
org.xml3d.dataTypes.Quaternion.prototype.negate = function() {
	return new org.xml3d.dataTypes.Quaternion(this.x, this.y, this.z, this.w);
};
org.xml3d.dataTypes.Quaternion.prototype.slerp = function(that, t) {
	var cosom = this.dot(that);
	var rot1;
	if (cosom < 0.0) {
		cosom = -cosom;
		rot1 = that.negate();
	} else {
		rot1 = new org.xml3d.dataTypes.Quaternion(that.x, that.y, that.z,
				that.w);
	}
	var scalerot0, scalerot1;
	if ((1.0 - cosom) > 0.00001) {
		var omega = Math.acos(cosom);
		var sinom = Math.sin(omega);
		scalerot0 = Math.sin((1.0 - t) * omega) / sinom;
		scalerot1 = Math.sin(t * omega) / sinom;
	} else {
		scalerot0 = 1.0 - t;
		scalerot1 = t;
	}
	return this.multScalar(scalerot0).add(rot1.multScalar(scalerot1));
};
org.xml3d.dataTypes.Quaternion.prototype.toString = function() {
	return '((' + this.x + ', ' + this.y + ', ' + this.z + '), ' + this.w + ')';
};
org.xml3d.dataTypes.MFRotation = function(rotArray) {
	if (arguments.length == 0) {
	} else {
		rotArray.map(function(v) {
			this.push(v);
		}, this);
	}
};
org.xml3d.dataTypes.MFRotation.prototype = new Array;
org.xml3d.dataTypes.MFRotation.parse = function(str) {
	var mc = str.match(/([+-]?\d*\.?\d*\s*){4},?\s*/g);
	var vecs = [];
	for ( var i = 0; i < mc.length; ++i) {
		var c = /^([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*),?\s*([+-]?\d*\.*\d*),?\s*$/
				.exec(mc[i]);
		if (c[0])
			vecs.push(org.xml3d.dataTypes.Quaternion.axisAngle(
					new org.xml3d.dataTypes.Vec3f(+c[1], +c[2], +c[3]), +c[4]));
	}
	return new org.xml3d.dataTypes.MFRotation(vecs);
};
org.xml3d.dataTypes.MFRotation.prototype.toGL = function() {
	var a = [];
	return a;
};
org.xml3d.dataTypes.SFColor = function(r, g, b) {
	if (arguments.length == 0) {
		this.r = this.g = this.b = 0;
	} else {
		this.r = r;
		this.g = g;
		this.b = b;
	}
};
org.xml3d.dataTypes.SFColor.parse = function(str) {
	var m = /^([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)$/
			.exec(str);
	return new org.xml3d.dataTypes.SFColor(+m[1], +m[2], +m[3]);
};
org.xml3d.dataTypes.SFColor.prototype.toGL = function() {
	return [ this.r, this.g, this.b ];
};
org.xml3d.dataTypes.SFColor.prototype.toString = function() {
	return "{ r " + this.r + " g " + this.g + " b " + this.b + " }";
};
org.xml3d.dataTypes.MFColor = function(colorArray) {
	if (arguments.length == 0) {
	} else {
		colorArray.map(function(c) {
			this.push(c);
		}, this);
	}
};
org.xml3d.dataTypes.MFColor.prototype = new Array;
org.xml3d.dataTypes.MFColor.parse = function(str) {
	var mc = str.match(/([+-]?\d*\.?\d*\s*){3},?\s*/g);
	var colors = [];
	for ( var i = 0; i < mc.length; ++i) {
		var c = /^([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*),?\s*$/
				.exec(mc[i]);
		if (c[0])
			colors.push(new org.xml3d.dataTypes.SFColor(+c[1], +c[2], +c[3]));
	}
	return new org.xml3d.dataTypes.MFColor(colors);
};
org.xml3d.dataTypes.MFColor.prototype.toGL = function() {
	var a = [];
	Array.map(this, function(c) {
		a.push(c.r);
		a.push(c.g);
		a.push(c.b);
	});
	return a;
};
org.xml3d.dataTypes.MFVec3 = function(vec3Array) {
	if (arguments.length == 0) {
	} else {
		vec3Array.map(function(v) {
			this.push(v);
		}, this);
	}
};
org.xml3d.dataTypes.MFVec3.prototype = new Array;
org.xml3d.dataTypes.MFVec3.parse = function(str) {
	var mc = str.match(/([+-]?\d*\.?\d*\s*){3},?\s*/g);
	var vecs = [];
	for ( var i = 0; i < mc.length; ++i) {
		var c = /^([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*),?\s*$/
				.exec(mc[i]);
		if (c[0])
			vecs.push(new org.xml3d.dataTypes.Vec3f(+c[1], +c[2], +c[3]));
	}
	return new org.xml3d.dataTypes.MFVec3(vecs);
};
org.xml3d.dataTypes.MFVec3.prototype.toGL = function() {
	var a = [];
	Array.map(this, function(c) {
		a.push(c.x);
		a.push(c.y);
		a.push(c.z);
	});
	return a;
};
org.xml3d.dataTypes.MFVec2 = function(vec2Array) {
	if (arguments.length == 0) {
	} else {
		vec2Array.map(function(v) {
			this.push(v);
		}, this);
	}
};
org.xml3d.dataTypes.MFVec2.prototype = new Array;
org.xml3d.dataTypes.MFVec2.parse = function(str) {
	var mc = str.match(/([+-]?\d*\.?\d*\s*){2},?\s*/g);
	var vecs = [];
	for ( var i = 0; i < mc.length; ++i) {
		var c = /^([+-]?\d*\.*\d*)\s*,?\s*([+-]?\d*\.*\d*)\s*,?\s*$/
				.exec(mc[i]);
		if (c[0])
			vecs.push(new org.xml3d.dataTypes.Vec2f(+c[1], +c[2]));
	}
	return new org.xml3d.dataTypes.MFVec2(vecs);
};
org.xml3d.dataTypes.MFVec2.prototype.toGL = function() {
	var a = [];
	Array.map(this, function(v) {
		a.push(v.x);
		a.push(v.y);
	});
	return a;
};
org.xml3d.dataTypes.Line = function(pos, dir) {
	if (arguments.length == 0) {
		this.pos = new org.xml3d.dataTypes.Vec3f(0, 0, 0);
		this.dir = new org.xml3d.dataTypes.Vec3f(0, 0, 1);
		this.t = 1;
	} else {
		this.pos = new org.xml3d.dataTypes.Vec3f(pos.x, pos.y, pos.z);
		var n = dir.length();
		this.t = n;
		if (n)
			n = 1.0 / n;
		this.dir = new org.xml3d.dataTypes.Vec3f(dir.x * n, dir.y * n, dir.z
				* n);
	}
};
org.xml3d.dataTypes.Line.prototype.toString = function() {
	var str = 'Line: [' + this.pos.toString() + '; ' + this.dir.toString()
			+ ']';
	return str;
};
org.xml3d.dataTypes.Line.prototype.intersect = function(low, high) {
	var Eps = 0.000001;
	var isect = 0.0;
	var out = Number.MAX_VALUE;
	var r, te, tl;
	if (this.dir.x > Eps) {
		r = 1.0 / this.dir.x;
		te = (low.x - this.pos.x) * r;
		tl = (high.x - this.pos.x) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
	} else if (this.dir.x < -Eps) {
		r = 1.0 / this.dir.x;
		te = (high.x - this.pos.x) * r;
		tl = (low.x - this.pos.x) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
	} else if (this.pos.x < low.x || this.pos.x > high.x) {
		return false;
	}
	if (this.dir.y > Eps) {
		r = 1.0 / this.dir.y;
		te = (low.y - this.pos.y) * r;
		tl = (high.y - this.pos.y) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
		if (isect - out >= Eps)
			return false;
	} else if (this.dir.y < -Eps) {
		r = 1.0 / this.dir.y;
		te = (high.y - this.pos.y) * r;
		tl = (low.y - this.pos.y) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
		if (isect - out >= Eps)
			return false;
	} else if (this.pos.y < low.y || this.pos.y > high.y) {
		return false;
	}
	if (this.dir.z > Eps) {
		r = 1.0 / this.dir.z;
		te = (low.z - this.pos.z) * r;
		tl = (high.z - this.pos.z) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
	} else if (this.dir.z < -Eps) {
		r = 1.0 / this.dir.z;
		te = (high.z - this.pos.z) * r;
		tl = (low.z - this.pos.z) * r;
		if (tl < out)
			out = tl;
		if (te > isect)
			isect = te;
	} else if (this.pos.z < low.z || this.pos.z > high.z) {
		return false;
	}
	this.enter = isect;
	this.exit = out;
	return (isect - out < Eps);
};

function MFString_parse(str) {
	if (str[0] == '"') {
		var re = /"((?:[^\\"]|\\\\|\\")*)"/g;
		var m;
		var ret = [];
		while (m = re.exec(str)) {
			ret.push(m[1].replace(/\\([\\"])/, "$1"));
		}
		return ret;
	} else {
		return [ str ];
	}
}