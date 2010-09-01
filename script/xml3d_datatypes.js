// Check, if basics have already been defined
var org;
if (!org || !org.xml3d)
	throw new Error("xml3d.js has to be included first");

// Create the XML3D data types for JS
if (!org.xml3d._native)
{
/*
 * Returns a new 4x4 XML3DMatrix from given arguments.
 * If no arguments are given it returns an identity matrix.
 */
XML3DMatrix = function(_11, _12, _13, _14, _21, _22, _23,
		_24, _31, _32, _33, _34, _41, _42, _43, _44) {
	if (arguments.length == 0){
		this._js = true;
		this.m11 = 1;
		this.m12 = 0;
		this.m13 = 0;
		this.m14 = 0;
		this.m21 = 0;
		this.m22 = 1;
		this.m23 = 0;
		this.m24 = 0;
		this.m31 = 0;
		this.m32 = 0;
		this.m33 = 1;
		this.m34 = 0;
		this.m41 = 0;
		this.m42 = 0;
		this.m43 = 0;
		this.m44 = 1;
	} else {
		this._js = true;
		this.m11 = _11;
		this.m12 = _12;
		this.m13 = _13;
		this.m14 = _14;
		this.m21 = _21;
		this.m22 = _22;
		this.m23 = _23;
		this.m24 = _24;
		this.m31 = _31;
		this.m32 = _32;
		this.m33 = _33;
		this.m34 = _34;
		this.m41 = _41;
		this.m42 = _42;
		this.m43 = _43;
		this.m44 = _44;
	}
};

/*
 * Populates this matrix with values from a given string.
 */
XML3DMatrix.setMatrixValue = function(str) {
	var m = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/.exec(str);
	if (m.length != 16)
		throw new DOMException();
	this.m11 = m[0];
	this.m12 = m[1];
	this.m13 = m[2];
	this.m14 = m[3];
	this.m21 = m[4];
	this.m22 = m[5];
	this.m23 = m[6];
	this.m24 = m[7];
	this.m31 = m[8];
	this.m32 = m[9];
	this.m33 = m[10];
	this.m34 = m[11];
	this.m41 = m[12];
	this.m42 = m[13];
	this.m43 = m[14];
	this.m44 = m[15];
};

/*
 * Multiply returns a new construct which is the result of this matrix multiplied by the 
 * argument which can be any of: XML3DMatrix, XML3DVec3, XML3DRotation.
 * This matrix is not modified.
 */
XML3DMatrix.prototype.multiply = function (that) {
	if (that.m44) {
		return new XML3DMatrix(this.m11 * that.m11 + this.m12
				* that.m21 + this.m13 * that.m31 + this.m14 * that.m41, this.m11
				* that.m12 + this.m12 * that.m22 + this.m13 * that.m32 + this.m14
				* that.m42, this.m11 * that.m13 + this.m12 * that.m23 + this.m13
				* that.m33 + this.m14 * that.m43, this.m11 * that.m14 + this.m12
				* that.m24 + this.m13 * that.m34 + this.m14 * that.m44, this.m21
				* that.m11 + this.m22 * that.m21 + this.m23 * that.m31 + this.m24
				* that.m41, this.m21 * that.m12 + this.m22 * that.m22 + this.m23
				* that.m32 + this.m24 * that.m42, this.m21 * that.m13 + this.m22
				* that.m23 + this.m23 * that.m33 + this.m24 * that.m43, this.m21
				* that.m14 + this.m22 * that.m24 + this.m23 * that.m34 + this.m24
				* that.m44, this.m31 * that.m11 + this.m32 * that.m21 + this.m33
				* that.m31 + this.m34 * that.m41, this.m31 * that.m12 + this.m32
				* that.m22 + this.m33 * that.m32 + this.m34 * that.m42, this.m31
				* that.m13 + this.m32 * that.m23 + this.m33 * that.m33 + this.m34
				* that.m43, this.m31 * that.m14 + this.m32 * that.m24 + this.m33
				* that.m34 + this.m34 * that.m44, this.m41 * that.m11 + this.m42
				* that.m21 + this.m43 * that.m31 + this.m44 * that.m41, this.m41
				* that.m12 + this.m42 * that.m22 + this.m43 * that.m32 + this.m44
				* that.m42, this.m41 * that.m13 + this.m42 * that.m23 + this.m43
				* that.m33 + this.m44 * that.m43, this.m41 * that.m14 + this.m42
				* that.m24 + this.m43 * that.m34 + this.m44 * that.m44);
		}
	if (that.w) {
		return new XML3DRotation(this.m11 * that.x + this.m12 * that.y
				+ this.m13 * that.z + this.m14 * that.w, this.m21 * that.x + this.m22 * that.y
				+ this.m23 * that.z + this.m24 * that.w, this.m31 * that.x + this.m32 * that.y
				+ this.m33 * that.z + this.m34 * that.w, this.m41 * that.x + this.m42 * that.y
				+ this.m43 * that.z + this.m44 * that.w);
	}
	return new XML3DVec3(this.m11 * that.x + this.m12 * that.y
			+ this.m13 * that.z, this.m21 * that.x + this.m22 * that.y
			+ this.m23 * that.z, this.m31 * that.x + this.m32 * that.y
			+ this.m33 * that.z);
};

XML3DMatrix.prototype.det3 = function(a1, a2, a3, b1, b2, b3,
		c1, c2, c3) {
	var d = (a1 * b2 * c3) + (a2 * b3 * c1) + (a3 * b1 * c2) - (a1 * b3 * c2)
			- (a2 * b1 * c3) - (a3 * b2 * c1);
	return d;
};
XML3DMatrix.prototype.det = function() {
	var a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4;
	a1 = this.m11;
	b1 = this.m21;
	c1 = this.m31;
	d1 = this.m41;
	a2 = this.m12;
	b2 = this.m22;
	c2 = this.m32;
	d2 = this.m42;
	a3 = this.m13;
	b3 = this.m23;
	c3 = this.m33;
	d3 = this.m43;
	a4 = this.m14;
	b4 = this.m24;
	c4 = this.m34;
	d4 = this.m44;
	var d = +a1 * this.det3(b2, b3, b4, c2, c3, c4, d2, d3, d4) - b1
			* this.det3(a2, a3, a4, c2, c3, c4, d2, d3, d4) + c1
			* this.det3(a2, a3, a4, b2, b3, b4, d2, d3, d4) - d1
			* this.det3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
	return d;
};

/*
 * Inverse returns a new matrix which is the inverse of this matrix.
 * This matrix is not modified.
 * Throws: DOMException when the matrix cannot be inverted.
 */
XML3DMatrix.prototype.inverse = function() {
	var a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4;
	a1 = this.m11;
	b1 = this.m21;
	c1 = this.m31;
	d1 = this.m41;
	a2 = this.m12;
	b2 = this.m22;
	c2 = this.m32;
	d2 = this.m42;
	a3 = this.m13;
	b3 = this.m23;
	c3 = this.m33;
	d3 = this.m43;
	a4 = this.m14;
	b4 = this.m24;
	c4 = this.m34;
	d4 = this.m44;
	var rDet = this.det();
	if (Math.abs(rDet) < 0.000001) {
		org.xml3d.debug.logInfo("Invert matrix: singular matrix, no inverse!");
		throw new DOMException();
		return new XML3DMatrix();
	}
	rDet = 1.0 / rDet;
	return new XML3DMatrix(+this.det3(b2, b3, b4, c2, c3, c4,
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
/*
 * Transpose returns a new matrix which is the transposed form of this matrix.
 * This matrix is not modified.
 */
XML3DMatrix.prototype.transpose = function() {
	return new XML3DMatrix(this.m11, this.m21, this.m31,
			this.m41, this.m12, this.m22, this.m32, this.m42, this.m13,
			this.m23, this.m33, this.m43, this.m14, this.m24, this.m34,
			this.m44);
};

/*
 * Translate returns a new matrix which is this matrix multiplied by a translation
 * matrix containing the passed values. 
 * This matrix is not modified.
 */
XML3DMatrix.prototype.translate = function(vec) {
	var tm = new XML3DMatrix(1, 0, 0, vec.x, 0, 1, 0, vec.y, 0,
			0, 1, vec.z, 0, 0, 0, 1);
	return this.multiply(tm);
	
};

/*
 * Scale returns a new matrix which is this matrix multiplied by a scale matrix containing
 * the passed values. If the z component is undefined a 1 is used in its place. If the y 
 * component is undefined the x component value is used in its place.
 * This matrix is not modified.
 */
XML3DMatrix.prototype.scale = function(vec) {
	if (!vec.z) vec.z = 1;
	if (!vec.y) vec.y = vec.x;
	var sm = new XML3DMatrix(vec.x, 0, 0, 0, 0, vec.y, 0, 0, 0,
			0, vec.z, 0, 0, 0, 0, 1);
	return this.multiply(sm);
};

/* 
 * This method returns a new matrix which is this matrix multiplied by each of 3 rotations
 * about the major axes. If the y and z components are undefined, the x value is used to 
 * rotate the object about the z axis. Rotation values are in RADIANS. 
 * This matrix is not modified.
 */
XML3DMatrix.prototype.rotate = function(rotX, rotY, rotZ) {
	var cx, cy, cz, sx, sy, sz;
	if (!rotY && !rotZ) {
		cx = Math.cos(rotX);
		sx = Math.sin(rotX);
		var rm = new XML3DMatrix(cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
		return this.multiply(rm);
	} else {
		cx = Math.cos(rotX);
		sx = Math.sin(rotX);
		var rm = new XML3DMatrix(1, 0, 0, 0, 0, cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1);
		if (rotY) {	
			cy = Math.cos(rotY);
			sy = Math.sin(rotY);
			rm = rm.multiply(new XML3DMatrix(cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1));
		}
		if (rotZ) {			
			cz = Math.cos(rotZ);
			sz = Math.sin(rotZ);
			rm = rm.multiply(new XML3DMatrix(cz, sz, 0, 0, -sz, cz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
		}
		return this.multiply(rm);
	}
};

/*
 * RotateAxisAngle returns a new matrix which is this matrix multiplied by a rotation matrix
 * with the given XML3DRotation. Rotation values are in RADIANS.
 * This matrix is not modified.
 */
XML3DMatrix.prototype.rotateAxisAngle = function(rot) {
	var x, y, z, ca, sa, ta, theta;
	x = rot.x;
	y = rot.y;
	z = rot.z;
	theta = rot.w;// * Math.PI / 180;
	ca = Math.cos(theta);
	sa = Math.sin(theta);
	ta = 1 - ca;
	var rm = new XML3DMatrix(ta*x*x + ca, ta*x*y + sa*z, ta*x*z - sa*y, 0, 
							 ta*x*y - sa*z, ta*y*y + ca, ta*y*z + sa*x, 0,
							 ta*x*z + sa*y, ta*y*z - sa*x, ta*z*z + ca, 0,
							 0, 0, 0, 1).transpose();
	return this.multiply(rm);
	
};

XML3DMatrix.prototype.toString = function() {
	return '[XML3DMatrix ' + this.m11 + ', ' + this.m12 + ', ' + this.m13 + ', '
			+ this.m14 + '; ' + this.m21 + ', ' + this.m22 + ', ' + this.m23
			+ ', ' + this.m24 + '; ' + this.m31 + ', ' + this.m32 + ', '
			+ this.m33 + ', ' + this.m34 + '; ' + this.m41 + ', ' + this.m42
			+ ', ' + this.m43 + ', ' + this.m44 + ']';
};

XML3DMatrix.prototype.toGL = function() {
	return [ this.m11, this.m21, this.m31, this.m41, this.m12, this.m22,
			this.m32, this.m42, this.m13, this.m23, this.m33, this.m43,
			this.m14, this.m24, this.m34, this.m44 ];
};

XML3DVec3 = function(x, y, z) {
	if (arguments.length == 0) {
		this.x = this.y = this.z = 0;
	} else {
		this.x = x;
		this.y = y;
		this.z = z;
	}
};

XML3DVec3.prototype.setVec3Value = function(str) {
	var m = /^(\S+)\s+(\S+)\s+(\S+)$/.exec(str);
	this.x = +m[1];
	this.y = +m[2];
	this.z = +m[3];
};

XML3DVec3.prototype.add = function(that) {
	return new XML3DVec3(this.x + that.x, this.y + that.y,
			this.z + that.z);
};
XML3DVec3.prototype.subtract = function(that) {
	return new XML3DVec3(this.x - that.x, this.y - that.y,
			this.z - that.z);
};
XML3DVec3.prototype.negate = function() {
	return new XML3DVec3(-this.x, -this.y, -this.z);
};
XML3DVec3.prototype.dot = function(that) {
	return (this.x * that.x + this.y * that.y + this.z * that.z);
};
XML3DVec3.prototype.cross = function(that) {
	return new XML3DVec3(this.y * that.z - this.z * that.y,
			this.z * that.x - this.x * that.z, this.x * that.y - this.y
					* that.x);
};
/*org.xml3d.dataTypes.Vec3f.prototype.reflect = function(n) {
	var d2 = this.dot(n) * 2;
	return new XML3DVec3(this.x - d2 * n.x, this.y - d2 * n.y,
			this.z - d2 * n.z);
};*/
XML3DVec3.prototype.length = function() {
	return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
};

XML3DVec3.prototype.normalize = function(that) {
	var n = this.length();
	if (n)
		n = 1.0 / n;
	else throw new DOMException();
	
	return new XML3DVec3(this.x * n, this.y * n, this.z * n);
};

XML3DVec3.prototype.scale = function(n) {
	return new XML3DVec3(this.x * n, this.y * n, this.z * n);
};

XML3DVec3.prototype.toGL = function() {
	return [ this.x, this.y, this.z ];
};

XML3DVec3.prototype.toString = function() {
	return "XML3DVec3(" + this.x + " " + this.y + " " + this.z + ")";
};



XML3DRotation = function(x, y, z, w) {
	if (arguments.length == 0)
	{
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.w = 1;
	} else if (arguments.length == 2) {
		this.setAxisAngle(x, y);
		} else {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
		}
};

XML3DRotation.prototype.multiply = function(that) {
	return new XML3DRotation(this.w * that.x + this.x * that.w
			+ this.y * that.z - this.z * that.y, this.w * that.y + this.y
			* that.w + this.z * that.x - this.x * that.z, this.w * that.z
			+ this.z * that.w + this.x * that.y - this.y * that.x, this.w
			* that.w - this.x * that.x - this.y * that.y - this.z * that.z);
};

XML3DRotation.fromMatrix = function(mat) {
	var q = new XML3DRotation();
	var trace = mat.m11 + mat.m21 + mat.m31;
	if (trace > 0) {
		var s = 0.5 / Math.sqrt(trace + 1.0);
		q.w = 0.25 / s;
		q.x = (mat.m32 - mat.m23) * s;
		q.y = (mat.m13 - mat.m31) * s;
		q.z = (mat.m21 - mat.m12) * s;
	} else {
		if (mat.m11 > mat.m22 && mat.m11 > mat.m33) {
			var s = 2.0 * sqrtf(1.0 + mat.m11 - mat.m22 - mat.m33);
			q.w = (mat._21 - mat._12) / s;
			q.x = 0.25 * s;
			q.y = (mat.m12 + mat.m21) / s;
			q.z = (mat.m13 + mat.m31) / s;
		} else if (mat.m22 > mat.m33) {
			var s = 2.0 * Math.sqrt(1.0 + mat.m22 - mat.m11 - mat.m33);
			q.w = (mat.m13 - mat.m31) / s;
			q.x = (mat.m12 + mat.m21) / s;
			q.y = 0.25 * s;
			q.z = (mat.m23 + mat.m32) / s;
		} else {
			var s = 2.0 * Math.sqrt(1.0 + mat.m33 - mat.m11 - mat.m22);
			q.w = (mat.m21 - mat.m12) / s;
			q.x = (mat.m13 + mat.m31) / s;
			q.y = (mat.m23 + mat.m32) / s;
			q.z = 0.25 * s;
		}
	}
	return q;
};

XML3DRotation.fromBasis = function(x, y, z) {
	var normX = x.length();
	var normY = y.length();
	var normZ = z.length();

	var m = new XML3DMatrix();
	m.m11 = x.x / normX;
	m.m12 = y.x / normY;
	m.m13 = z.x / normZ;
	m.m21 = x.y / normX;
	m.m22 = y.y / normY;
	m.m23 = z.y / normZ;
	m.m31 = x.z / normX;
	m.m32 = y.z / normY;
	m.m33 = z.z / normZ;

	return XML3DRotation.fromMatrix(m);
};

XML3DRotation.axisAngle = function(axis, a) {
	var t = axis.length();
	if (t > 0.000001) {
		var s = Math.sin(a / 2) / t;
		var c = Math.cos(a / 2);
		return new XML3DRotation(axis.x * s, axis.y * s,
				axis.z * s, c);
	} else {
		return new XML3DRotation(0, 0, 0, 1);
	}
};

XML3DRotation.prototype.setAxisAngle = function(axis, a) {
		
		var t = axis.length();
		if (t > 0.000001) {
			var s = Math.sin(a / 2) / t;
			var c = Math.cos(a / 2);
			this.x = axis.x * s;
			this.y = axis.y * s;
			this.z = axis.z * s;
			this.w = c;
		} else {
			this.x = this.y = this.z = 0;
			this.w = 1;
		}
	
};

XML3DRotation.prototype.setAxisAngleValue = function(str) {
	var m = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/.exec(str);
	this.setAxisAngle(new XML3DVec3(+m[1], +m[2], +m[3]), +m[4]);
};

XML3DRotation.prototype.toMatrix = function() {
	var xx = this.x * this.x * 2;
	var xy = this.x * this.y * 2;
	var xz = this.x * this.z * 2;
	var yy = this.y * this.y * 2;
	var yz = this.y * this.z * 2;
	var zz = this.z * this.z * 2;
	var wx = this.w * this.x * 2;
	var wy = this.w * this.y * 2;
	var wz = this.w * this.z * 2;
	return new XML3DMatrix(1 - (yy + zz), xy - wz, xz + wy,
			0, xy + wz, 1 - (xx + zz), yz - wx, 0, xz - wy, yz + wx,
			1 - (xx + yy), 0, 0, 0, 0, 1);
};

XML3DRotation.prototype.__defineGetter__("axis", function() {
	var s = Math.sqrt(1 - this.w * this.w);
	if (s < 0.001) {
		return new XML3DVec3(0, 0, 1);
	}
	return new XML3DVec3(this.x / s, this.y / s, this.z / s);
});

XML3DRotation.prototype.__defineGetter__("angle", function() {
	var angle = 2 * Math.acos(this.w);
	var s = Math.sqrt(1 - this.w * this.w);
	if (s < 0.001) {
		return 0.0;
	}
	return angle;
});

XML3DRotation.prototype.toAxisAngle = function() {
	var angle = 2 * Math.acos(this.w);
	var s = Math.sqrt(1 - this.w * this.w);
	if (s < 0.001) {
		return [ this.x, this.y, this.z, angle ];
	}
	return [ this.x / s, this.y / s, this.z / s, angle ];
};

XML3DRotation.prototype.rotateVec3 = function(v) {
	var q00 = 2.0 * this.x * this.x;
	var q11 = 2.0 * this.y * this.y;
	var q22 = 2.0 * this.z * this.z;

	var q01 = 2.0 * this.x * this.y;
	var q02 = 2.0 * this.x * this.z;
	var q03 = 2.0 * this.x * this.w;

	var q12 = 2.0 * this.y * this.z;
	var q13 = 2.0 * this.y * this.w;

	var q23 = 2.0 * this.z * this.w;

	return new XML3DVec3((1.0 - q11 - q22) * v.x + (q01 - q23)
			* v.y + (q02 + q13) * v.z, (q01 + q23) * v.x + (1.0 - q22 - q00)
			* v.y + (q12 - q03) * v.z, (q02 - q13) * v.x + (q12 + q03) * v.y
			+ (1.0 - q11 - q00) * v.z);
};

XML3DRotation.prototype.dot = function(that) {
	return this.x * that.x + this.y * that.y + this.z * that.z + this.w
			* that.w;
};
XML3DRotation.prototype.add = function(that) {
	return new XML3DRotation(this.x + that.x, this.y + that.y,
			this.z + that.z, this.w + that.w);
};
XML3DRotation.prototype.subtract = function(that) {
	return new XML3DRotation(this.x - that.x, this.y - that.y,
			this.z - that.z, this.w - that.w);
};
XML3DRotation.prototype.multScalar = function(s) {
	return new XML3DRotation(this.x * s, this.y * s, this.z
			* s, this.w * s);
};

XML3DRotation.prototype.normalised = function(that) {
	var d2 = this.dot(that);
	var id = 1.0;
	if (d2)
		id = 1.0 / Math.sqrt(d2);
	return new XML3DRotation(this.x * id, this.y * id, this.z
			* id, this.w * id);
};

XML3DRotation.prototype.length = function() {
	return Math.sqrt(this.dot(this));
};

XML3DRotation.prototype.normalize = function(that) {
	var l = this.length();
	if (l) {
		var id = 1.0 / l;
		return new XML3DRotation(this.x * id, this.y * id, this.z * id, this.w * id);
	}
	return new XML3DRotation();
};


XML3DRotation.prototype.negate = function() {
	return new XML3DRotation(this.x, this.y, this.z, -this.w);
};
XML3DRotation.prototype.interpolate = function(that, t) {
	var cosom = this.dot(that);
	var rot1;
	if (cosom < 0.0) {
		
		cosom = -cosom;
		rot1 = that.negate();
	} else {
		rot1 = new XML3DRotation(that.x, that.y, that.z,
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
XML3DRotation.prototype.toString = function() {
	return "XML3DRotation(" + this.axis + ", " + this.angle + ")";
};

} // End createXML3DDatatypes
else {
	// Create global constructors if not available
	if(Object.prototype.constructor === XML3DVec3.prototype.constructor) {
		XML3DVec3 = function(x, y, z) {
			var v =org.xml3d._xml3d.createXML3DVec3();
			if (arguments.length == 3) {
				v.x = x;
				v.y = y;
				v.z = z;
			} 
			return v;
		};
	};
	
	if(Object.prototype.constructor === XML3DRotation.prototype.constructor) {
		XML3DRotation = function(axis, angle) {
			var v =org.xml3d._xml3d.createXML3DRotation();
			if (arguments.length == 2) {
				v.setAxisAngle(axis, angle);
			} 
			return v;
		};
	};

	if(Object.prototype.constructor === XML3DMatrix.prototype.constructor) {
		XML3DMatrix = function(m11,m12,m13,m14,m21,m22,m23,m24,m31,m32,m33,m34,m41,m42,m43,m44) {
			var m = org.xml3d._xml3d.createXML3DMatrix();
			if (arguments.length == 16) {
	            m.m11 = m11; m.m12 = m12; m.m13 = m13; m.m14 = m14;  
	            m.m21 = m21; m.m22 = m22; m.m23 = m23; m.m24 = m24;
	            m.m31 = m31; m.m32 = m32; m.m33 = m33; m.m34 = m34;
	            m.m41 = m41; m.m42 = m42; m.m43 = m43; m.m44 = m44;
			} 
			return m;
		};
	};

	// Create nice toString Functions (does not work for FF :\)
	if (XML3DVec3.prototype.toString == Object.prototype.toString) {
		XML3DVec3.prototype.toString = function() { return "XML3DVec3(" + this.x + " " + this.y + " " + this.z + ")";};
	}
	if (XML3DRotation.prototype.toString == Object.prototype.toString) {
		XML3DRotation.prototype.toString = function() { return "XML3DRotation(" + this.axis + ", " + this.angle + ")";};
	}
	if (XML3DMatrix.prototype.toString == Object.prototype.toString) {
		XML3DMatrix.prototype.toString = function() { 
			return "XML3DMatrix(" +
			+ this.m11 + ', ' + this.m12 + ', ' + this.m13 + ', ' + this.m14 + '; ' 
            + this.m21 + ', ' + this.m22 + ', ' + this.m23 + ', ' + this.m24 + '; ' 
            + this.m31 + ', ' + this.m32 + ', ' + this.m33 + ', ' + this.m34 + '; ' 
            + this.m41 + ', ' + this.m42 + ', ' + this.m43 + ', ' + this.m44
			+ ")";};
	}
}

