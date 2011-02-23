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
XML3DMatrix = function(_11, _12, _13, _14, 
					   _21, _22, _23, _24, 
					   _31, _32, _33, _34, 
					   _41, _42, _43, _44) 
{
	XML3DDataType.call(this);
	
	this._js = true;
	
	if (arguments.length == 0)
	{
		this._setMatrixInternal(1, 0, 0, 0, 
							    0, 1, 0, 0, 
							    0, 0, 1, 0, 
							    0, 0, 0, 1);
	} 
	else 
	{
		this._setMatrixInternal(_11, _12, _13, _14, 
							    _21, _22, _23, _24, 
							    _31, _32, _33, _34, 
							    _41, _42, _43, _44);
	}
};
XML3DMatrix.prototype             = new XML3DDataType();
XML3DMatrix.prototype.constructor = XML3DMatrix;

//Getter definition
XML3DMatrix.prototype.__defineGetter__("m11",  function () 
{
	return this._m11;
});

XML3DMatrix.prototype.__defineGetter__("m12",  function () 
{
	return this._m12;
});

XML3DMatrix.prototype.__defineGetter__("m13",  function () 
{
	return this._m13;
});

XML3DMatrix.prototype.__defineGetter__("m14",  function () 
{
	return this._m14;
});

XML3DMatrix.prototype.__defineGetter__("m21",  function () 
{
	return this._m21;
});

XML3DMatrix.prototype.__defineGetter__("m22",  function () 
{
	return this._m22;
});

XML3DMatrix.prototype.__defineGetter__("m23",  function () 
{
	return this._m23;
});

XML3DMatrix.prototype.__defineGetter__("m24",  function () 
{
	return this._m24;
});

XML3DMatrix.prototype.__defineGetter__("m31",  function () 
{
	return this._m31;
});

XML3DMatrix.prototype.__defineGetter__("m32",  function () 
{
	return this._m32;
});

XML3DMatrix.prototype.__defineGetter__("m33",  function () 
{
	return this._m33;
});

XML3DMatrix.prototype.__defineGetter__("m34",  function () 
{
	return this._m34;
});

XML3DMatrix.prototype.__defineGetter__("m41",  function () 
{
	return this._m41;
});

XML3DMatrix.prototype.__defineGetter__("m42",  function () 
{
	return this._m42;
});

XML3DMatrix.prototype.__defineGetter__("m43",  function () 
{
	return this._m43;
});

XML3DMatrix.prototype.__defineGetter__("m44",  function () 
{
	return this._m44;
});




//Setter definition

XML3DMatrix.prototype._setMatrixField = function(field, value)
{
	var values = new Array(16);
	
	values["m11"] = this._m11;
	values["m12"] = this._m12;
	values["m13"] = this._m13;
	values["m14"] = this._m14;
	
	values["m21"] = this._m21;
	values["m22"] = this._m22;
	values["m23"] = this._m23;
	values["m24"] = this._m24;
	
	values["m31"] = this._m31;
	values["m32"] = this._m32;
	values["m33"] = this._m33;
	values["m34"] = this._m34;
	
	values["m41"] = this._m41;
	values["m42"] = this._m42;
	values["m43"] = this._m43;
	values["m44"] = this._m44;
	
	// set the matrix field
	values[field] = value;
	
	this._setMatrixInternal(
			   values['m11'], values['m12'], values['m13'], values['m14'], 
	           values['m21'], values['m22'], values['m23'], values['m24'],
	           values['m31'], values['m32'], values['m33'], values['m34'], 
	           values['m41'], values['m42'], values['m43'], values['m44'] );
};

XML3DMatrix.prototype.__defineSetter__('m11',  function (value) 
{
	this._setMatrixField('m11', value);
});

XML3DMatrix.prototype.__defineSetter__('m12',  function (value) 
{
	this._setMatrixField('m12', value);
});

XML3DMatrix.prototype.__defineSetter__('m13',  function (value) 
{
	this._setMatrixField('m13', value);
});

XML3DMatrix.prototype.__defineSetter__('m14',  function (value) 
{
	this._setMatrixField('m14', value);
});


XML3DMatrix.prototype.__defineSetter__('m21',  function (value) 
{
	this._setMatrixField('m21', value);
});

XML3DMatrix.prototype.__defineSetter__('m22',  function (value) 
{
	this._setMatrixField('m22', value);
});

XML3DMatrix.prototype.__defineSetter__('m23',  function (value) 
{
	this._setMatrixField('m23', value);
});

XML3DMatrix.prototype.__defineSetter__('m24',  function (value) 
{
	this._setMatrixField('m24', value);
});


XML3DMatrix.prototype.__defineSetter__('m31',  function (value) 
{
	this._setMatrixField('m31', value);
});

XML3DMatrix.prototype.__defineSetter__('m32',  function (value) 
{
	this._setMatrixField('m32', value);
});

XML3DMatrix.prototype.__defineSetter__('m33',  function (value) 
{
	this._setMatrixField('m33', value);
});

XML3DMatrix.prototype.__defineSetter__('m34',  function (value) 
{
	this._setMatrixField('m34', value);
});


XML3DMatrix.prototype.__defineSetter__('m41',  function (value) 
{
	this._setMatrixField('m41', value);
});

XML3DMatrix.prototype.__defineSetter__('m42',  function (value) 
{
	this._setMatrixField('m42', value);
});

XML3DMatrix.prototype.__defineSetter__('m43',  function (value) 
{
	this._setMatrixField('m43', value);
});

XML3DMatrix.prototype.__defineSetter__('m44',  function (value) 
{
	this._setMatrixField('m44', value);
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
	
	if((m11 != this._m11) || (m12 != this._m12) || (m13 != this._m13) || (m14 != this._m14) || 
	   (m21 != this._m21) || (m22 != this._m22) || (m23 != this._m23) || (m24 != this._m24) ||
	   (m31 != this._m31) || (m32 != this._m32) || (m33 != this._m33) || (m34 != this._m34) ||
	   (m41 != this._m41) || (m42 != this._m42) || (m43 != this._m43) || (m44 != this._m44) )
	{
		var oldM11 = this._m11;
		var oldM12 = this._m12;
		var oldM13 = this._m13;
		var oldM14 = this._m14;
		var oldM21 = this._m21;
		var oldM22 = this._m22;
		var oldM23 = this._m23;
		var oldM24 = this._m24;
		var oldM31 = this._m31;
		var oldM32 = this._m32;
		var oldM33 = this._m33;
		var oldM34 = this._m34;
		var oldM41 = this._m41;
		var oldM42 = this._m42;
		var oldM43 = this._m43;
		var oldM44 = this._m44;
	
		this._m11 = m11;
		this._m12 = m12;
		this._m13 = m13;
		this._m14 = m14;
		this._m21 = m21;
		this._m22 = m22;
		this._m23 = m23;
		this._m24 = m24;
		this._m31 = m31;
		this._m32 = m32;
		this._m33 = m33;
		this._m34 = m34;
		this._m41 = m41;
		this._m42 = m42;
		this._m43 = m43;
		this._m44 = m44;
		
		var newValue = [m11, m12, m13, m14,
		                m21, m22, m23, m24,
		                m31, m32, m33, m34,
		                m41, m42, m43, m44];
		
		var oldValue = [oldM11, oldM12, oldM13, oldM14,
		                oldM21, oldM22, oldM23, oldM24,
		                oldM31, oldM32, oldM33, oldM34,
		                oldM41, oldM42, oldM43, oldM44];

		this.notifyOwnerNode(oldValue, newValue);
	}
};

/*
 * Multiply returns a new construct which is the result of this matrix multiplied by the 
 * argument which can be any of: XML3DMatrix, XML3DVec3, XML3DRotation.
 * This matrix is not modified.
 */
XML3DMatrix.prototype.multiply = function (that) 
{
	if (that.m44) 
	{
		return new XML3DMatrix(
				this._m11 * that.m11 + this._m12 * that.m21 + this._m13 * that.m31 + this._m14 * that.m41, 
				this._m11 * that.m12 + this._m12 * that.m22 + this._m13 * that.m32 + this._m14 * that.m42, 
				this._m11 * that.m13 + this._m12 * that.m23 + this._m13 * that.m33 + this._m14 * that.m43,
				this._m11 * that.m14 + this._m12 * that.m24 + this._m13 * that.m34 + this._m14 * that.m44, 
				
				this._m21 * that.m11 + this._m22 * that.m21 + this._m23 * that.m31 + this._m24 * that.m41, 
				this._m21 * that.m12 + this._m22 * that.m22 + this._m23 * that.m32 + this._m24 * that.m42, 
				this._m21 * that.m13 + this._m22 * that.m23 + this._m23 * that.m33 + this._m24 * that.m43, 
				this._m21 * that.m14 + this._m22 * that.m24 + this._m23 * that.m34 + this._m24 * that.m44, 
				
				this._m31 * that.m11 + this._m32 * that.m21 + this._m33 * that.m31 + this._m34 * that.m41, 
				this._m31 * that.m12 + this._m32 * that.m22 + this._m33 * that.m32 + this._m34 * that.m42, 
				this._m31 * that.m13 + this._m32 * that.m23 + this._m33 * that.m33 + this._m34 * that.m43, 
				this._m31 * that.m14 + this._m32 * that.m24 + this._m33 * that.m34 + this._m34 * that.m44, 
				
				this._m41 * that.m11 + this._m42 * that.m21 + this._m43 * that.m31 + this._m44 * that.m41, 
				this._m41 * that.m12 + this._m42 * that.m22 + this._m43 * that.m32 + this._m44 * that.m42, 
				this._m41 * that.m13 + this._m42 * that.m23 + this._m43 * that.m33 + this._m44 * that.m43, 
				this._m41 * that.m14 + this._m42 * that.m24 + this._m43 * that.m34 + this._m44 * that.m44);
	}


	if (that.w) 
	{
		return new XML3DRotation(this._m11 * that.x + this._m12 * that.y
				+ this._m13 * that.z + this._m14 * that.w, this._m21 * that.x + this._m22 * that.y
				+ this._m23 * that.z + this._m24 * that.w, this._m31 * that.x + this._m32 * that.y
				+ this._m33 * that.z + this._m34 * that.w, this._m41 * that.x + this._m42 * that.y
				+ this._m43 * that.z + this._m44 * that.w);
	}
	
	return new XML3DVec3(this._m11 * that.x + this._m12 * that.y
						+ this._m13 * that.z, this._m21 * that.x + this._m22 * that.y
						+ this._m23 * that.z, this._m31 * that.x + this._m32 * that.y
						+ this._m33 * that.z);
};

XML3DMatrix.prototype.det3 = function(a1, a2, a3, b1, b2, b3,
		c1, c2, c3) {
	var d = (a1 * b2 * c3) + (a2 * b3 * c1) + (a3 * b1 * c2) - (a1 * b3 * c2)
			- (a2 * b1 * c3) - (a3 * b2 * c1);
	return d;
};
XML3DMatrix.prototype.det = function() {
	var a1, a2, a3, a4, b1, b2, b3, b4, c1, c2, c3, c4, d1, d2, d3, d4;
	a1 = this._m11;
	b1 = this._m21;
	c1 = this._m31;
	d1 = this._m41;
	a2 = this._m12;
	b2 = this._m22;
	c2 = this._m32;
	d2 = this._m42;
	a3 = this._m13;
	b3 = this._m23;
	c3 = this._m33;
	d3 = this._m43;
	a4 = this._m14;
	b4 = this._m24;
	c4 = this._m34;
	d4 = this._m44;
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
	a1 = this._m11;
	b1 = this._m21;
	c1 = this._m31;
	d1 = this._m41;
	a2 = this._m12;
	b2 = this._m22;
	c2 = this._m32;
	d2 = this._m42;
	a3 = this._m13;
	b3 = this._m23;
	c3 = this._m33;
	d3 = this._m43;
	a4 = this._m14;
	b4 = this._m24;
	c4 = this._m34;
	d4 = this._m44;
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
	return new XML3DMatrix(this._m11, this._m21, this._m31,
			this._m41, this._m12, this._m22, this._m32, this._m42, this._m13,
			this._m23, this._m33, this._m43, this._m14, this._m24, this._m34,
			this._m44);
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
	return '[XML3DMatrix ' + this._m11 + ', ' + this._m12 + ', ' + this._m13 + ', '
			+ this._m14 + '; ' + this._m21 + ', ' + this._m22 + ', ' + this._m23
			+ ', ' + this._m24 + '; ' + this._m31 + ', ' + this._m32 + ', '
			+ this._m33 + ', ' + this._m34 + '; ' + this._m41 + ', ' + this._m42
			+ ', ' + this._m43 + ', ' + this._m44 + ']';
};

XML3DMatrix.prototype.toGL = function() {
	return [ this._m11, this._m21, this._m31, this._m41, this._m12, this._m22,
			this._m32, this._m42, this._m13, this._m23, this._m33, this._m43,
			this._m14, this._m24, this._m34, this._m44 ];
};


//------------------------------------------------------------

XML3DVec3 = function(x, y, z) 
{	
	XML3DDataType.call(this);
	
	// Note that there is no owner node registered yet. Therefore, the setXYZ() method
	// can be used at this point since no notification can be triggered.
	if (arguments.length == 0) 
	{
		this._setXYZ(0, 0, 0);
	} 
	else 
	{
		this._setXYZ(x, y, z);
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
	
	if (arguments.length == 0)
	{
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.w = 1;
	} 
	else if (arguments.length == 2) 
	{
		this.setAxisAngle(x, y);
	} 
	else 
	{
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}
};
XML3DRotation.prototype             = new XML3DDataType();
XML3DRotation.prototype.constructor = XML3DRotation;



XML3DRotation.prototype.multiply = function(that) {
	return new XML3DRotation(this.w * that.x + this.x * that.w
			+ this.y * that.z - this.z * that.y, this.w * that.y + this.y
			* that.w + this.z * that.x - this.x * that.z, this.w * that.z
			+ this.z * that.w + this.x * that.y - this.y * that.x, this.w
			* that.w - this.x * that.x - this.y * that.y - this.z * that.z);
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

/***********************************************************************/
