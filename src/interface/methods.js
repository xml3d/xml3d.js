// methods.js
xml3d.methods = xml3d.methods || {};

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
        /*var dir = vec.negate().normalize();

        if (this._upVector)
            var up = this._upVector;
        else
            var up = new XML3DVec3(0, 1, 0);
        var right = up.cross(dir).normalize();
        up = dir.cross(right).normalize();
        this.orientation = XML3DRotation.fromBasis(right, up, dir);*/
        console.error("view::setDirection not implemented yet");
    };

    methods.viewSetUpVector = function(up) {
        console.error("view::setUpVector not implemented yet");
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
    xml3d.extend(xml3d.methods, methods);
});
