/*************************************************************************/
/*                                                                       */
/*  xml3d.js                                                             */
/*  XML3D data types (XML3DMatrix, XML3DVec, XML3DRotation)				 */
/*                                                                       */
/*  Copyright (C) 2010                                                   */
/*  DFKI - German Research Center for Artificial Intelligence            */
/* 	partly based on code originally provided by Philip Taylor, 			 */
/*  Peter Eschler, Johannes Behr and Yvonne Jung 						 */
/*  (philip.html5.org, www.x3dom.org)                                    */
/*                                                                       */
/*  This file is part of xml3d.js                                        */
/*                                                                       */
/*  xml3d.js is free software; you can redistribute it and/or modify     */
/*  under the terms of the GNU General Public License as                 */
/*  published by the Free Software Foundation; either version 2 of       */
/*  the License, or (at your option) any later version.                  */
/*                                                                       */
/*  xml3d.js is distributed in the hope that it will be useful, but      */
/*  WITHOUT ANY WARRANTY; without even the implied warranty of           */
/*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.                 */
/*  See the GNU General Public License                                   */
/*  (http://www.fsf.org/licensing/licenses/gpl.html) for more details.   */
/*                                                                       */
/*************************************************************************/

// Check, if basics have already been defined
var org;
if (!org || !org.xml3d)
	throw new Error("xml3d.js has to be included first");

// Create the XML3D data types for JS
if (!org.xml3d._native)
{
	//------------------------------------------------------------
	XML3DDataType = function()
	{
		this.ownerNode = null;
		this.attrName  = null;
	};

	XML3DDataType.prototype.setOwnerNode = function(attrName, ownerNode)
	{
		if( attrName  === undefined || attrName  == null || 
			ownerNode === undefined || ownerNode == null)
		{
			throw new Error("Passed invalid parameter values ( " +
							"attrName="  + attrName  + "; " +
							"ownerNode=" + ownerNode + 
					 	    " ) for method XML3DDataType.setOwnerNode()");
		}
		
		this.attrName  = attrName;
		this.ownerNode = ownerNode;
	};

	XML3DDataType.prototype.removeOwnerNode = function()
	{
		this.ownerNode = null;
		this.attrName  = null;
	};

	XML3DDataType.prototype.notifyOwnerNode = function(prevValue, newValue)
	{
		if(this.ownerNode != null && this.ownerNode.notificationRequired())
		{
			this.ownerNode.notify(new org.xml3d.Notification(this.ownerNode, 
															 MutationEvent.MODIFICATION, 
															 this.attrName, 
															 prevValue, 
															 newValue));
		}
	};

	//------------------------------------------------------------
	
/*
 * Returns a new 4x4 XML3DMatrix from given arguments.
 * If no arguments are given it returns an identity matrix.
 */
XML3DMatrix = function() 
{
	XML3DDataType.call(this);
	
	this._js = true;
	this._data = new Array(16);
	
	if (arguments.length == 0)
	{
		this._setMatrixInternal(1, 0, 0, 0, 
							    0, 1, 0, 0, 
							    0, 0, 1, 0, 
							    0, 0, 0, 1);
	} 
	else if (arguments.length == 1)
	{

		var m = arguments[0];
		if (m.length < 16) {
			org.xml3d.debug.logError("Tried to initialize a XML3DMatrix from a Float32Array with less than 16 members");
			return null;
		}
		this._setMatrixInternal(m[0], m[1], m[2], m[3], 
								m[4], m[5], m[6], m[7], 
								m[8], m[9], m[10], m[11], 
								m[12], m[13], m[14], m[15]);
	}
	else 
	{
		this._setMatrixInternal(arguments[0], arguments[1], arguments[2], arguments[3], 
				arguments[4], arguments[5], arguments[6], arguments[7], 
				arguments[8], arguments[9], arguments[10], arguments[11], 
				arguments[12], arguments[13], arguments[14], arguments[15]);
		
	}
};

XML3DMatrix.prototype             = new XML3DDataType();
XML3DMatrix.prototype.constructor = XML3DMatrix;

//Getter definition
XML3DMatrix.prototype.__defineGetter__("m11",  function () 
{
	return this._data[0];
});

XML3DMatrix.prototype.__defineGetter__("m12",  function () 
{
	return this._data[1];
});

XML3DMatrix.prototype.__defineGetter__("m13",  function () 
{
	return this._data[2];
});

XML3DMatrix.prototype.__defineGetter__("m14",  function () 
{
	return this._data[3];
});

XML3DMatrix.prototype.__defineGetter__("m21",  function () 
{
	return this._data[4];
});

XML3DMatrix.prototype.__defineGetter__("m22",  function () 
{
	return this._data[5];
});

XML3DMatrix.prototype.__defineGetter__("m23",  function () 
{
	return this._data[6];
});

XML3DMatrix.prototype.__defineGetter__("m24",  function () 
{
	return this._data[7];
});

XML3DMatrix.prototype.__defineGetter__("m31",  function () 
{
	return this._data[8];
});

XML3DMatrix.prototype.__defineGetter__("m32",  function () 
{
	return this._data[9];
});

XML3DMatrix.prototype.__defineGetter__("m33",  function () 
{
	return this._data[10];
});

XML3DMatrix.prototype.__defineGetter__("m34",  function () 
{
	return this._data[11];
});

XML3DMatrix.prototype.__defineGetter__("m41",  function () 
{
	return this._data[12];
});

XML3DMatrix.prototype.__defineGetter__("m42",  function () 
{
	return this._data[13];
});

XML3DMatrix.prototype.__defineGetter__("m43",  function () 
{
	return this._data[14];
});

XML3DMatrix.prototype.__defineGetter__("m44",  function () 
{
	return this._data[15];
});




//Setter definition

XML3DMatrix.prototype._setMatrixField = function(offset, value)
{
	if (isNaN(value)) {
		throw new Error("Attempted to set a bad matrix value: "+value);
	}
	
	if (this._data[offset] != value) {
		var oldValues = this._data;
		
		this._data[offset] = value;
		
		this.notifyOwnerNode(oldValues, this._data);
	}
};

XML3DMatrix.prototype.__defineSetter__('m11',  function (value) 
{
	this._setMatrixField(0, value);
});

XML3DMatrix.prototype.__defineSetter__('m12',  function (value) 
{
	this._setMatrixField(1, value);
});

XML3DMatrix.prototype.__defineSetter__('m13',  function (value) 
{
	this._setMatrixField(2, value);
});

XML3DMatrix.prototype.__defineSetter__('m14',  function (value) 
{
	this._setMatrixField(3, value);
});


XML3DMatrix.prototype.__defineSetter__('m21',  function (value) 
{
	this._setMatrixField(4, value);
});

XML3DMatrix.prototype.__defineSetter__('m22',  function (value) 
{
	this._setMatrixField(5, value);
});

XML3DMatrix.prototype.__defineSetter__('m23',  function (value) 
{
	this._setMatrixField(6, value);
});

XML3DMatrix.prototype.__defineSetter__('m24',  function (value) 
{
	this._setMatrixField(7, value);
});


XML3DMatrix.prototype.__defineSetter__('m31',  function (value) 
{
	this._setMatrixField(8, value);
});

XML3DMatrix.prototype.__defineSetter__('m32',  function (value) 
{
	this._setMatrixField(9, value);
});

XML3DMatrix.prototype.__defineSetter__('m33',  function (value) 
{
	this._setMatrixField(10, value);
});

XML3DMatrix.prototype.__defineSetter__('m34',  function (value) 
{
	this._setMatrixField(11, value);
});


XML3DMatrix.prototype.__defineSetter__('m41',  function (value) 
{
	this._setMatrixField(12, value);
});

XML3DMatrix.prototype.__defineSetter__('m42',  function (value) 
{
	this._setMatrixField(13, value);
});

XML3DMatrix.prototype.__defineSetter__('m43',  function (value) 
{
	this._setMatrixField(14, value);
});

XML3DMatrix.prototype.__defineSetter__('m44',  function (value) 
{
	this._setMatrixField(15, value);
});


/*
 * Populates this matrix with values from a given string.
 */
XML3DMatrix.prototype.setMatrixValue = function(str) 
{
	var m = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/.exec(str);

	if (m.length != 17) // m[0] is the whole string, the rest is the actual result
		throw new Error("Illegal number of elements: " + (m.length - 1) + "expected: 16");
	
	this._setMatrixInternal(m[1],  m[2],  m[3],  m[4], 
							m[5],  m[6],  m[7],  m[8], 
							m[9],  m[10], m[11], m[12], 
							m[13], m[14], m[15], m[16]);
};


XML3DMatrix.prototype._setMatrixInternal = function(m11, m12, m13, m14,
													m21, m22, m23, m24,
													m31, m32, m33, m34,
													m41, m42, m43, m44)
{
	if(isNaN(m11) || isNaN(m12) || isNaN(m13) || isNaN(m14) || 
	   isNaN(m21) || isNaN(m22) || isNaN(m23) || isNaN(m24) ||
	   isNaN(m31) || isNaN(m32) || isNaN(m33) || isNaN(m34) ||
	   isNaN(m41) || isNaN(m42) || isNaN(m43) || isNaN(m44) )
	{
		var matrixString = "( " + m11 + " " + m12 + " " + m13 + " " + m14 + "\n" +
						   		  m21 + " " + m22 + " " + m23 + " " + m24 + "\n" +
						   		  m31 + " " + m32 + " " + m33 + " " + m34 + "\n" +
						   		  m41 + " " + m42 + " " + m43 + " " + m44 + " )";
			
		throw new Error("Invalid matrix value :\n" + matrixString);
	}
	
	if((m11 != this._data[0]) || (m12 != this._data[1]) || (m13 != this._dataa[2]) || (m14 != this._data[3]) || 
	   (m21 != this._data[4]) || (m22 != this._data[5]) || (m23 != this._data[6]) || (m24 != this._data[7]) ||
	   (m31 != this._data[8]) || (m32 != this._data[9]) || (m33 != this._data[10]) || (m34 != this._data[11]) ||
	   (m41 != this._data[12]) || (m42 != this._data[13]) || (m43 != this._data[14]) || (m44 != this._data[15]) )
	{

		var oldValue = this._data;

		this._data = [m11, m12, m13, m14,
		                m21, m22, m23, m24,
		                m31, m32, m33, m34,
		                m41, m42, m43, m44];

		this.notifyOwnerNode(oldValue, this._data);
	}
};

/*
 * Multiply returns a new construct which is the result of this matrix multiplied by the 
 * argument which can be any of: XML3DMatrix, XML3DVec3, XML3DRotation.
 * This matrix is not modified.
 */
XML3DMatrix.prototype.multiply = function (that) 
{
	var a = this._data;
	
	if (that.m44 !== undefined) 
	{
		var b = that._data;
		
		return new XML3DMatrix(
				a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12], 
				a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13], 
				a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14],
				a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15], 
				
				a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12], 
				a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13], 
				a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14], 
				a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15], 
				
				a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12], 
				a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13], 
				a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14], 
				a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15], 
				
				a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12], 
				a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13], 
				a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14], 
				a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15]);
	}

	if (that.w !== undefined) 
	{
		return new XML3DRotation(a[0] * that.x + a[1] * that.y
				+ a[2] * that.z + a[3] * that.w, a[4] * that.x + a[5] * that.y
				+ a[6] * that.z + a[7] * that.w, a[8] * that.x + a[9] * that.y
				+ a[10] * that.z + a[11] * that.w, a[12] * that.x + a[13] * that.y
				+ a[14] * that.z + a[15] * that.w);
	}
	
	return new XML3DVec3(a[0] * that.x + a[1] * that.y
						+ a[2] * that.z, a[4] * that.x + a[5] * that.y
						+ a[6] * that.z, a[8] * that.x + a[9] * that.y
						+ a[10] * that.z);
};

XML3DMatrix.prototype.mulVec3 = function(that, w) {
	return new XML3DVec3(
//		this._m11 * that.x + this._m21 * that.y + this._m31 * that.z + this._m41 * w, 
//		this._m12 * that.x + this._m22 * that.y + this._m32 * that.z + this._m42 * w, 
//		this._m13 * that.x + this._m23 * that.y + this._m33 * that.z + this._m43 * w
		this._data[0] * that.x + this._data[1] * that.y + this._data[2] * that.z + this._data[3] * w, 
		this._data[4] * that.x + this._data[5] * that.y + this._data[6] * that.z + this._data[7] * w, 
		this._data[8] * that.x + this._data[9] * that.y + this._data[10] * that.z + this._data[11] * w
		);
};


XML3DMatrix.prototype.det3 = function(a1, a2, a3, b1, b2, b3,
		c1, c2, c3) {
	var d = (a1 * b2 * c3) + (a2 * b3 * c1) + (a3 * b1 * c2) - (a1 * b3 * c2)
			- (a2 * b1 * c3) - (a3 * b2 * c1);
	return d;
};
XML3DMatrix.prototype.det = function() {
	var a = this._data;
	
	var a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4;
	a1 = a[0];
	b1 = a[4];
	c1 = a[8];
	d1 = a[12];
	
	a2 = a[1];
	b2 = a[5];
	c2 = a[9];
	d2 = a[13];
	
	a3 = a[2];
	b3 = a[6];
	c3 = a[10];
	d3 = a[14];
	
	a4 = a[3];
	b4 = a[7];
	c4 = a[11];
	d4 = a[15];
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
	var a = this._data;
	
	var a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4;
	a1 = a[0];
	b1 = a[4];
	c1 = a[8];
	d1 = a[12];
	
	a2 = a[1];
	b2 = a[5];
	c2 = a[9];
	d2 = a[13];
	
	a3 = a[2];
	b3 = a[6];
	c3 = a[10];
	d3 = a[14];
	
	a4 = a[3];
	b4 = a[7];
	c4 = a[11];
	d4 = a[15];
	
	var rDet = this.det();
	
	if (Math.abs(rDet) < 0.000001) 
	{
		org.xml3d.debug.logInfo("Invert matrix: singular matrix, no inverse!");
		throw new Error("Invert matrix: singular matrix, no inverse!");
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

	return new XML3DMatrix(this._data[0], this._data[4], this._data[8],
			this._data[12], this._data[1], this._data[5], this._data[9], this._data[13], this._data[2],
			this._data[6], this._data[10], this._data[14], this._data[3], this._data[7], this._data[11],
			this._data[15]);
};

/*
 * Translate returns a new matrix which is this matrix multiplied by a translation
 * matrix containing the passed values. 
 * This matrix is not modified.
 */
XML3DMatrix.prototype.translate = function(x , y, z) 
{
	var tm = new XML3DMatrix(1, 0, 0, x, 
							 0, 1, 0, y, 
							 0, 0, 1, z, 
							 0, 0, 0, 1);
	return this.multiply(tm);
	
};

/*
 * Scale returns a new matrix which is this matrix multiplied by a scale matrix containing
 * the passed values. If the z component is undefined a 1 is used in its place. If the y 
 * component is undefined the x component value is used in its place.
 * This matrix is not modified.
 */
XML3DMatrix.prototype.scale = function(scaleX, scaleY, scaleZ) 
{
	if (!scaleZ) scaleZ = 1;
	if (!scaleY) scaleY = scaleX;
	var sm = new XML3DMatrix(scaleX,      0,  0,      0,      
			                 0,      scaleY,  0,      0, 
			                 0,           0,  scaleZ, 0, 
			                 0,           0,       0, 1);
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
XML3DMatrix.prototype.rotateAxisAngle = function(x, y, z, angle)
{
	var ca, sa, ta;
	
	ca = Math.cos(angle);
	sa = Math.sin(angle);
	
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

	return [ this._data[0], this._data[4], this._data[8],
				this._data[12], this._data[1], this._data[5], this._data[9], this._data[13], this._data[2],
				this._data[6], this._data[10], this._data[14], this._data[3], this._data[7], this._data[11],
				this._data[15] ];
};

XML3DMatrix.prototype.to3x3GL = function() {
	return [this._data[0], this._data[4], this._data[8], this._data[1], this._data[5], this._data[9],
	        this._data[2], this._data[6], this._data[10]];
};

XML3DMatrix.prototype.getColumnV3 = function(colnum) {
	switch (colnum) {
	case 1: return new XML3DVec3(this._data[0], this._data[4], this._data[8]);
	case 2: return new XML3DVec3(this._data[1], this._data[5], this._data[9]);
	case 3: return new XML3DVec3(this._data[2], this._data[6], this._data[10]);
	case 4: return new XML3DVec3(this._data[3], this._data[7], this._data[11]);
	default: return null;
	}
};

//------------------------------------------------------------

XML3DVec3 = function(x, y, z) 
{	
	XML3DDataType.call(this);
	
	// Note that there is no owner node registered yet. Therefore, the setXYZ() method
	// can be used at this point since no notification can be triggered.
	var n = arguments.length;
	switch(n) {
		case 1:
			if (arguments[0] instanceof Array || arguments[0] instanceof Float32Array) {
				this._setXYZ(x[0], x[1], x[2]);
			} else {
				this._setXYZ(x, x, x);
			}
			break;
		case 3:
			this._setXYZ(x, y, z);
			break;
		default:
			this._setXYZ(0, 0, 0);
			break;
	}
};
XML3DVec3.prototype             = new XML3DDataType();
XML3DVec3.prototype.constructor = XML3DVec3;

XML3DVec3.prototype._setXYZ = function(x, y, z)
{
	if( isNaN(x) || isNaN(y) || isNaN(z))
	{
		throw new Error("XML3DVec3._setXYZ(): ( " + 
							   x + ", " + y + ", " + z + 
							   " ) are not valid vector components" );
	}
	
	var oldX = this._x;
	var oldY = this._y;
	var oldZ = this._z;
	
	if(oldX != x || oldY != y || oldZ != z)
	{
		this._x = x;
		this._y = y;
		this._z = z;
		
		this.notifyOwnerNode([oldX, oldY, oldZ], 
							 [x,    y,    z]);
	}	
};


XML3DVec3.prototype.__defineSetter__("x", function (value) 
{
	this._setXYZ(value, this._y, this._z);
});

XML3DVec3.prototype.__defineGetter__("x", function () 
{
	return this._x;
});


XML3DVec3.prototype.__defineSetter__("y", function (value) 
{
	this._setXYZ(this._x, value, this._z);
});

XML3DVec3.prototype.__defineGetter__("y", function () 
{
	return this._y;
});

XML3DVec3.prototype.__defineSetter__("z", function (value) 
{
	this._setXYZ(this._x, this._y, value);
});

XML3DVec3.prototype.__defineGetter__("z", function () 
{
	return this._z;
});


XML3DVec3.prototype.setVec3Value = function(str) 
{
	var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(str);
	this._setXYZ(+m[1], +m[2], +m[3]);
};

XML3DVec3.prototype.add = function(that) {
	return new XML3DVec3(this._x + that.x, this._y + that.y,
			this._z + that.z);
};
XML3DVec3.prototype.subtract = function(that) {
	return new XML3DVec3(this._x - that.x, this._y - that.y,
			this._z - that.z);
};
XML3DVec3.prototype.multiply = function(that) {
	return new XML3DVec3(this.x * that.x, this.y * that.y,
			this.z * that.z);
};
XML3DVec3.prototype.negate = function() {
	return new XML3DVec3(-this._x, -this._y, -this._z);
};
XML3DVec3.prototype.dot = function(that) {
	return (this._x * that.x + this._y * that.y + this._z * that.z);
};
XML3DVec3.prototype.cross = function(that) {
	return new XML3DVec3(this._y * that.z - this._z * that.y,
			this._z * that.x - this._x * that.z, this._x * that.y - this._y
					* that.x);
};
/*org.xml3d.dataTypes.Vec3f.prototype.reflect = function(n) {
	var d2 = this.dot(n) * 2;
	return new XML3DVec3(this.x - d2 * n.x, this._y - d2 * n.y,
			this.z - d2 * n.z);
};*/
XML3DVec3.prototype.length = function() {
	return Math.sqrt((this._x * this._x) + (this._y * this._y) + (this._z * this._z));
};

XML3DVec3.prototype.normalize = function(that) {
	var n = this.length();
	if (n)
		n = 1.0 / n;
	else throw new Error();
	
	return new XML3DVec3(this._x * n, this._y * n, this._z * n);
};

XML3DVec3.prototype.scale = function(n) {
	return new XML3DVec3(this._x * n, this._y * n, this._z * n);
};

XML3DVec3.prototype.toGL = function() {
	return [ this._x, this._y, this._z ];
};

XML3DVec3.prototype.toString = function() {
	return "XML3DVec3(" + this._x + " " + this._y + " " + this._z + ")";
};



//-----------------------------------------------------------------


XML3DRotation = function(x, y, z, w) 
{
	XML3DDataType.call(this);
	var n = arguments.length;
	switch(n) {
	case 1:
		this.x = x[0];
		this.y = x[1];
		this.z = x[2];
		this.w = x[3];
		break;
	case 2:
		this.setAxisAngle(x,y);
		break;
	case 4:
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
		break;
	default:
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.w = 1;
		break;
	}

};
XML3DRotation.prototype             = new XML3DDataType();
XML3DRotation.prototype.constructor = XML3DRotation;



XML3DRotation.prototype.multiply = function(that) {
	return new XML3DRotation(
			this.w * that.x + this.x * that.w + this.y * that.z - this.z * that.y, 
			this.w * that.y + this.y * that.w + this.z * that.x - this.x * that.z, 
			this.w * that.z	+ this.z * that.w + this.x * that.y - this.y * that.x, 
			this.w * that.w - this.x * that.x - this.y * that.y - this.z * that.z);
};

XML3DRotation.fromMatrix = function(mat) {
	var q = new XML3DRotation();
	var trace = mat.m11 + mat.m22 + mat.m33;
	if (trace > 0) {		
		var s = 2.0 * Math.sqrt(trace + 1.0);
		q.w = 0.25 * s;
		q.x = (mat.m32 - mat.m23) / s;
		q.y = (mat.m13 - mat.m31) / s;
		q.z = (mat.m21 - mat.m12) / s;
	} else {
		if (mat.m11 > mat.m22 && mat.m11 > mat.m33) {
			var s = 2.0 * Math.sqrt(1.0 + mat.m11 - mat.m22 - mat.m33);
			q.w = (mat.m32 - mat.m23) / s;
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

XML3DRotation.prototype.setAxisAngle = function(axis, a) 
{
		if(typeof axis != 'object' || isNaN(a))
		{
			throw new Error("Illegal axis and/or angle values: " +
						    "( axis=" + axis + " angle=" + a + " )");
		}
			
		var t    = axis.length();
		var oldX = this.x;
		var oldY = this.y;
		var oldZ = this.z;
		var oldW = this.w;
		
		if (t > 0.000001) 
		{
			var s = Math.sin(a / 2) / t;
			var c = Math.cos(a / 2);
			this.x = axis.x * s;
			this.y = axis.y * s;
			this.z = axis.z * s;
			this.w = c;
		} 
		else 
		{
			this.x = this.y = this.z = 0;
			this.w = 1;
		}
	
		
		if(oldX != this.x || oldY != this.y || oldZ != this.z || oldW != this.w)
		{
			this.notifyOwnerNode([oldX,   oldY,   oldZ,   oldW],
								 [this.x, this.y, this.z, this.w]);
		}
};

XML3DRotation.prototype.setAxisAngleValue = function(str) 
{
	var m = /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/.exec(str);
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

/** Replaces the existing rotation with one computed from the two 
 * vectors passed as arguments.
 */
XML3DRotation.prototype.setRotation = function(from, to) {
	
	var axis = from.cross(to); 
	var angle = Math.acos(from.dot(to)); 
	
	this.setAxisAngle(axis, angle); 
}; 

XML3DRotation.prototype.toGL = function() {
	return [this.x, this.y, this.z, this.w];
};


//-----------------------------------------------------------------

/** returns an XML3DBox, which is an axis-aligned box, described 
*  by two vectors min and max.
*   
*  @param min (optional) instance of XML3DVec3 for the smallest point of the box
*  @param max (optional) instance of XML3DVec3 for the biggest point of the box   
*/
XML3DBox = function(min, max) 
{
	XML3DDataType.call(this);
	if(arguments.length === 2) 
	{
		this.min = min; 
		this.max = max; 
	}
	else
	{
		this.makeEmpty(); 
	}
	
	return this; 
};

XML3DBox.prototype             = new XML3DDataType();
XML3DBox.prototype.constructor = XML3DBox;

/** @returns XML3DVec3 describing the size of the box */ 
XML3DBox.prototype.size = function() 
{
	var v = this.max.subtract(this.min);
	if(v.x < 0)
		v.x = 0; 
	if(v.y < 0)
		v.y = 0; 
	if(v.z < 0)
		v.z = 0; 
	
	return v; 
}; 

/** @returns XML3DVec3 that is the center of the box */ 
XML3DBox.prototype.center = function() 
{
	return this.min.add(this.max).scale(0.5); 
}; 

/** sets min's components to Number.MAX_VALUE and max' components to -Number.MAX_VALUE.
*/
XML3DBox.prototype.makeEmpty = function() 
{
	this.min = new XML3DVec3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE); 
	this.max = new XML3DVec3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
}; 

/** @returns whether at least one of min's components is bigger than the corresponding 
*  component in max.
*/
XML3DBox.prototype.isEmpty = function() 
{
	return (this.min.x > this.max.x 
		 || this.min.y > this.max.y
		 || this.min.z > this.max.z); 
};

/** updates the min or max accoring to the given point or bounding box. 
* 
* @param that the object used for extension, which can be a XML3DVec3 or XML3DBox
*/
XML3DBox.prototype.extend = function(that)
{
	var min, max; 
	if(that.constructor === XML3DBox)
	{	
		min = that.min; 
		max = that.max; 
	}
	else if(that.constructor === XML3DVec3)
	{
		min = that; 
		max = that; 
	}
	else
		return; 

	if(min.x < this.min.x)
		this.min.x = min.x;
	if(min.y < this.min.y)
		this.min.y = min.y; 
	if(min.z < this.min.z)
		this.min.z = min.z;
	
	if(max.x > this.max.x)
		this.max.x = max.x;
	if(max.y > this.max.y)
		this.max.y = max.y; 
	if(max.z > this.max.z)
		this.max.z = max.z;
}; 

//-----------------------------------------------------------------

/** returns an XML3DRay that has an origin and a direction.
* 
* If the arguments are not given, the ray's origin is (0,0,0) and 
* points down the negative z-axis.  
*   
*  @param origin (optional) instance of XML3DVec3 for the origin of the ray
*  @param direction (optional) instance of XML3DVec3 for the direction of the ray   
*/
XML3DRay = function(origin, direction) 
{
	XML3DDataType.call(this);
	
	switch(arguments.length) {		
	case 1: 
		this.origin = origin; 
		this.direction = new XML3DVec3(0, 0, -1); 
		break; 
		
	case 2: 
		this.origin = origin; 
		this.direction = direction; 
		
	default: 
		this.origin = new XML3DVec3(0, 0, 0);
		this.direction = new XML3DVec3(0, 0, -1);
		break; 
	}
	
	return this; 
};

XML3DRay.prototype             = new XML3DDataType();
XML3DRay.prototype.constructor = XML3DRay;

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