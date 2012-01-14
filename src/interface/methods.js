// methods.js
org.xml3d.methods = org.xml3d.methods || {};

new (function() {

    var methods = {};

    methods.xml3dCreateXML3DVec3 = function() {
        return new XML3DVec3();
    };

    methods.xml3dCreateXML3DRay = function() {
        return new XML3DRay();
    };

    methods.xml3dGetElementByRay = function() {
        throw (this.nodeName + "::getElementByRay is not implemeted yet.");
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
        var dir = vec.negate().normalize();
        if (this._upVector)
            var up = this._upVector;
        else
            var up = new XML3DVec3(0, 1, 0);
        var right = up.cross(dir).normalize();
        up = dir.cross(right).normalize();
        this.orientation = XML3DRotation.fromBasis(right, up, dir);

    };

    methods.viewSetUpVector = function(up) {
        this._upVector = up.normalize();
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

        for (i = 0; i < this.adapters.length; i++) {
            if (this.adapters[i].getViewMatrix) {
                return this.adapters[i].getViewMatrix();
            }
        }

        return new XML3DMatrix();
    };

    methods.xml3dGetElementByPoint = function(x, y, hitPoint, hitNormal) {
        for (i = 0; i < this.adapters.length; i++) {
            if (this.adapters[i].getElementByPoint) {
                return this.adapters[i].getElementByPoint(x, y, hitPoint, hitNormal);
            }
        }

        return null;
    };

    methods.xml3dGenerateRay = function(x, y) {
        for (i = 0; i < this.adapters.length; i++) {
            if (this.adapters[i].generateRay) {
                return this.adapters[i].generateRay(x, y);
            }
        }

        return new XML3DRay();
    };

    methods.groupGetLocalMatrix = function() {

        var xfmNode = this.getTransformNode();
        if (xfmNode) {
            for (i = 0; i < xfmNode.adapters.length; i++) {
                if (xfmNode.adapters[i].getMatrix) {
                    return xfmNode.adapters[i].getMatrix();
                }
            }
        }

        return new XML3DMatrix();
    };

    /**
     * return the bounding box that is the bounding box of all children.
     */
    methods.groupGetBoundingBox = function() {

        var bbox = new XML3DBox();
        var locMat = this.getLocalMatrix();

        var child = this.firstElementChild;
        while (child !== null) {
            if (child.getBoundingBox) {
                var chBBox = child.getBoundingBox();

                chBBox.min = locMat.mulVec3(chBBox.min);
                chBBox.max = locMat.mulVec3(chBBox.max);

                bbox.extend(chBBox);
            }

            child = child.nextElementSibling;
        }

        return bbox;
    };
    methods.xml3dGetBoundingBox = methods.groupGetBoundingBox;

    /**
     * returns the bounding box of this mesh in world space.
     */
    methods.meshGetBoundingBox = function() {

        for (i = 0; i < this.adapters.length; i++) {
            if (this.adapters[i].getBoundingBox)
                return this.adapters[i].getBoundingBox();
        }

        return new XML3DBox();
    };

    methods.XML3DGraphTypeGetWorldMatrix = function() {

        var node = this;

        var mat = new XML3DMatrix();

        // accumulate matrix until xml3d tag is reached
        while (node.nodeName !== "xml3d") {
            if (node.nodeName === "group")
                mat = node.getLocalMatrix().multiply(mat);

            node = node.parentNode;
        }

        return mat;
    };
    // Export to org.xml3d namespace
    org.xml3d.extend(org.xml3d.methods, methods);
});
