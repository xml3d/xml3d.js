// methods.js
XML3D.methods = XML3D.methods || {};

new (function() {

    var methods = {};

    methods.xml3dCreateXML3DVec3 = function() {
        return new window.XML3DVec3();
    };

    methods.xml3dCreateXML3DRay = function() {
        return new window.XML3DRay();
    };

    methods.xml3dGetElementByRay = function() {
        XML3D.debug.logError(this.nodeName + "::getElementByRay is not implemeted yet.");
        return null;
    };

    methods.xml3dCreateXML3DMatrix = function() {
        return new window.XML3DMatrix();
    };

    methods.xml3dCreateXML3DRotation = function() {
        return new window.XML3DRotation();
    };

    methods.viewGetDirection = function() {
        return this.orientation.rotateVec3(new window.XML3DVec3(0, 0, -1));
    };

    methods.viewSetPosition = function(pos) {
        this.position = pos;
    };

    var tmpX = vec3.create();
    var tmpY = vec3.create();
    var tmpZ = vec3.create();

    quat4.setFromMat3 = function(m, dest) {
        var tr = m[0] + m[4] + m[8];

        if (tr > 0) {
            var s = Math.sqrt(tr + 1.0) * 2; // s=4*dest[3]
            dest[0] = (m[7] - m[5]) / s;
            dest[1] = (m[2] - m[6]) / s;
            dest[2] = (m[3] - m[1]) / s;
            dest[3] = 0.25 * s;
        } else if ((m[0] > m[4]) & (m[0] > m[8])) {
            var s = Math.sqrt(1.0 + m[0] - m[4] - m[8]) * 2; // s=4*qx
            dest[3] = (m[7] - m[5]) / s;
            dest[0] = 0.25 * s;
            dest[1] = (m[1] + m[3]) / s;
            dest[2] = (m[2] + m[6]) / s;
        } else if (m[4] > m[8]) {
            var s = Math.sqrt(1.0 + m[4] - m[0] - m[8]) * 2; // s=4*qy
            dest[3] = (m[2] - m[6]) / s;
            dest[0] = (m[1] + m[3]) / s;
            dest[1] = 0.25 * s;
            dest[2] = (m[5] + m[7]) / s;
        } else {
            var s = Math.sqrt(1.0 + m[8] - m[0] - m[4]) * 2; // s=4*qz
            dest[3] = (m[3] - m[1]) / s;
            dest[0] = (m[2] + m[6]) / s;
            dest[1] = (m[5] + m[7]) / s;
            dest[2] = 0.25 * s;
        }
    };

    quat4.setFromBasis = function(X,Y,Z,dest) {
        var lx = 1.0 / vec3.length(X);
        var ly = 1.0 / vec3.length(Y);
        var lz = 1.0 / vec3.length(Z);
        var m = mat3.create();
        m[0] = X[0] * lx;
        m[1] = Y[0] * ly;
        m[2] = Z[0] * lz;
        m[3] = X[1] * lx;
        m[4] = Y[1] * ly;
        m[5] = Z[1] * lz;
        m[6] = X[2] * lx;
        m[7] = Y[2] * ly;
        m[8] = Z[2] * lz;
        quat4.setFromMat3(m,dest);
    };

    methods.viewSetDirection = function(direction) {
        direction = direction || new window.XML3DVec3(0,0,-1);
        direction = direction.normalize();

        var up = this.orientation.rotateVec3(new window.XML3DVec3(0,1,0));
        up = up.normalize();

        vec3.cross(direction._data,up._data,tmpX);
        if(!vec3.length(tmpX)) {
                tmpX = this.orientation.rotateVec3(new window.XML3DVec3(1,0,0))._data;
        }
        vec3.cross(tmpX,direction._data,tmpY);
        vec3.negate(direction._data,tmpZ);

        var q = quat4.create();
        quat4.setFromBasis(tmpX, tmpY, tmpZ, q);
        this.orientation._setQuaternion(q);
    };

    methods.viewSetUpVector = function(up) {
    	up = up || new window.XML3DVec3(0,1,0);
    	up = up.normalize();

    	var r = new window.XML3DRotation();
    	r.setRotation(new window.XML3DVec3(0,1,0),up);
    	r = this.orientation.multiply(r);
    	r = r.normalize();
    	this.orientation.set(r);
    };

    methods.viewGetUpVector = function() {
        return this.orientation.rotateVec3(new window.XML3DVec3(0, 1, 0));
    };

    methods.viewLookAt = function(point) {
        this.setDirection(point.subtract(this.position));
    };

    methods.viewGetViewMatrix = function() {
        var adapters = this._configured.adapters || {};
        for ( var adapter in adapters) {
            if (adapters[adapter].getViewMatrix) {
                return adapters[adapter].getViewMatrix();
            }
        }
        // Fallback implementation
        var p = this.position;
        var r = this.orientation;
        var a = r.axis;
        return new window.XML3DMatrix().translate(p.x, p.y, p.z).rotateAxisAngle(a.x, a.y, a.z, r.angle).inverse();
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
        return new window.XML3DRay();
    };

    methods.groupGetLocalMatrix = function() {
        var adapters = this._configured.adapters || {};
        for ( var adapter in adapters) {
            if (adapters[adapter].getLocalMatrix) {
                return adapters[adapter].getLocalMatrix();
            }
        }
        return new window.XML3DMatrix();
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
        return new window.XML3DBox();
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
        return new window.XML3DBox();
    };

    methods.XML3DGraphTypeGetWorldMatrix = function() {
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getWorldMatrix) {
                return adapters[adapter].getWorldMatrix();
            }
        }
        return new window.XML3DMatrix();
    };

    methods.dataGetOutputFieldNames = function() {
        XML3D.debug.logError(this.nodeName + "::getOutputFieldNames is not implemeted yet.");
        return null;
    };

    methods.dataGetResult = function() {
        XML3D.debug.logError(this.nodeName + "::getResult is not implemeted yet.");
        return null;
    };

    // Export to xml3d namespace
    XML3D.extend(XML3D.methods, methods);
});
