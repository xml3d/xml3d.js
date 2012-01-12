// Temporary fixes for native XML3D implementations

if(org.xml3d._native)
{
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
