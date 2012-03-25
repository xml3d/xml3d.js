// methods.js
XML3D.methods = XML3D.methods || {};

new (function() {

    var methods = {};

    methods.xml3dCreateXML3DVec3 = function() {
        return new XML3DVec3();
    };

    methods.xml3dCreateXML3DRay = function() {
        return new XML3DRay();
    };

    methods.xml3dGetElementByRay = function() {
        console.error(this.nodeName + "::getElementByRay is not implemeted yet.");
        return null;
    };

    methods.xml3dCreateXML3DMatrix = function() {
        return new XML3DMatrix();
    };

    methods.xml3dCreateXML3DRotation = function() {
        return new XML3DRotation();
    };

    methods.viewGetDirection = function() {
        return this.orientation.rotateVec3(new XML3DVec3(0, 0, -1));
    };

    methods.viewSetPosition = function(pos) {
        this.position = pos;
    };

    methods.viewSetDirection = function(vec) {
        vec = vec || new XML3DVec3(0,0,-1);
        vec = vec.normalize();
        
        var up = this.orientation.rotateVec3(new XML3DVec3(0,1,0));
        up = up.normalize();
        var right = up.cross(vec);

        var w = Math.sqrt(1 + right.x + up.y + vec.z)/2;
        //What to do if w is 0?
        var wscale = w * 4;
        var axis = new XML3DVec3(vec.y - up.z, right.z - vec.x, up.x - right.y).scale(1/wscale);
        var orient = new XML3DRotation();
        orient._setQuaternion([axis.x, axis.y, axis.z, w]);
        this.orientation.set(orient);
    };

    methods.viewSetUpVector = function(up) {
    	up = up || new XML3DVec3(0,1,0);
    	up = up.normalize();
    	
        var vec = this.orientation.rotateVec3(new XML3DVec3(0,0,-1));
        vec = vec.normalize();
        var right = up.cross(vec);
        
        var w = Math.sqrt(1 + right.x + up.y + vec.z)/2;
        var wscale = w * 4;
        var axis = new XML3DVec3(vec.y - up.z, right.z - vec.x, up.x - right.y).scale(1/wscale);
        var orient = new XML3DRotation();
        orient._setQuaternion([axis.x, axis.y, axis.z, w]);
        this.orientation.set(orient);
    };

    methods.viewGetUpVector = function() {
        return this.orientation.rotateVec3(new XML3DVec3(0, 1, 0));
    };

    methods.viewLookAt = function(point) {
        var vector = point.subtract(this.position);
        vector = vector.normalize();
        this.setDirection(vector);
    };

    methods.viewGetViewMatrix = function() {
        var adapters = this._configured.adapters || {};
        for ( var adapter in adapters) {
            if (adapters[adapter].viewGetViewMatrix) {
                return adapters[adapter].viewGetViewMatrix(x, y, hitPoint, hitNormal);
            }
        }
        // Fallback implementation
        var p = this.position;
        var r = this.orientation;
        var a = r.axis;
        return new XML3DMatrix().translate(p.x, p.y, p.z).rotateAxisAngle(a.x, a.y, a.z, r.angle).inverse();
    };

    methods.xml3dGetElementByPoint = function(x, y, hitPoint, hitNormal) {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getElementByPoint) {
                return adapters[adapter].getElementByPoint(x, y, hitPoint, hitNormal);
            }
        }
        return null;
    };

    methods.xml3dGenerateRay = function(x, y) {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].xml3dGenerateRay) {
                return adapters[adapter].xml3dGenerateRay(x, y);
            }
        }
        return new XML3DRay();
    };

    methods.groupGetLocalMatrix = function() {
        var adapters = this._configured.adapters || {};
        for ( var adapter in adapters) {
            if (adapters[adapter].getLocalMatrix) {
                return adapters[adapter].getLocalMatrix();
            }
        }
        return new XML3DMatrix();
    };

    /**
     * return the bounding box that is the bounding box of all children.
     */
    methods.groupGetBoundingBox = function() {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getBoundingBox) {
                return adapters[adapter].getBoundingBox();
            }
        }
        return new XML3DBox();
    };
    methods.xml3dGetBoundingBox = methods.groupGetBoundingBox;

    /**
     * returns the bounding box of this mesh in world space.
     */
    methods.meshGetBoundingBox = function() {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getBoundingBox) {
                return adapters[adapter].getBoundingBox();
            }
        }
        return new XML3DBox();
    };

    methods.XML3DGraphTypeGetWorldMatrix = function() {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getWorldMatrix) {
                return adapters[adapter].getWorldMatrix();
            }
        }
        return new XML3DMatrix();
    };

    methods.dataGetOutputFieldNames = function() {
        console.error(this.nodeName + "::getOutputFieldNames is not implemeted yet.");
        return null;
    };

    methods.dataGetResult = function() {
        console.error(this.nodeName + "::getResult is not implemeted yet.");
        return null;
    };

    // Export to xml3d namespace
    XML3D.extend(XML3D.methods, methods);
});
