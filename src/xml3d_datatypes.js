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


//------------------------------------------------------------




//-----------------------------------------------------------------





//-----------------------------------------------------------------

/** returns an XML3DBox, which is an axis-aligned box, described 
*  by two vectors min and max.
*   
*  @param min either XML3DBox acting as copy constructor or instance of XML3DVec3 for the smallest point of the box
*  @param max (optional) instance of XML3DVec3 for the biggest point of the box. In the 
*  			case of min being a XML3DBox this parameter is ignored.   
*/
XML3DBox = function(min, max) 
{
	XML3DDataType.call(this);
	if(arguments.length == 1 && arguments[0].constructor === XML3DBox)
	{
		// copy constructor
		this.min = new XML3DVec3(arguments[0].min); 
		this.max = new XML3DVec3(arguments[0].max); 
	}
	else if(arguments.length === 2) 
	{
		this.min = new XML3DVec3(min); 
		this.max = new XML3DVec3(max); 
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
		if(arguments[0].constructor === XML3DRay)
		{
			// copy constructor
			this.origin = new XML3DVec3(arguments[0].origin);
			this.direction = new XML3DVec3(arguments[0].direction); 
		}
		else
		{
			this.origin = origin; 
			this.direction = new XML3DVec3(0, 0, -1);
		}
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