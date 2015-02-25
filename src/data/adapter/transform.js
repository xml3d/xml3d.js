var NodeAdapter = XML3D.base.NodeAdapter;

var TransformDataAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
    this.isValid = true;
    this.needsUpdate = true;
};

XML3D.createClass(TransformDataAdapter, NodeAdapter);

var IDENT_MAT = XML3D.math.mat4.identity(XML3D.math.mat4.create());

TransformDataAdapter.prototype.init = function () {
    // Create all matrices, no valid values yet
    this.matrix = XML3D.math.mat4.create();
    this.transform = {
        translate: XML3D.math.mat4.create(),
        scale: XML3D.math.mat4.create(),
        scaleOrientationInv: XML3D.math.mat4.create(),
        center: XML3D.math.mat4.create(),
        centerInverse: XML3D.math.mat4.create()
        //rotation               : XML3D.math.mat4.create()
    };
    this.needsUpdate = true;
    this.checkForImproperNesting();
};

TransformDataAdapter.prototype.updateMatrix = function () {
    var n = this.node, transform = this.transform, transVec = n.translation._data, centerVec = n.center._data, s = n.scale._data, so = n.scaleOrientation.toMatrix()._data, rot = n.rotation.toMatrix()._data;

    XML3D.math.mat4.translate(transform.translate, IDENT_MAT, transVec);
    XML3D.math.mat4.translate(transform.center, IDENT_MAT, centerVec);
    XML3D.math.mat4.translate(transform.centerInverse, IDENT_MAT, XML3D.math.vec3.negate(centerVec, centerVec));
    XML3D.math.mat4.scale(transform.scale, IDENT_MAT, s);
    XML3D.math.mat4.invert(transform.scaleOrientationInv, so);

    // M = T * C
    XML3D.math.mat4.multiply(this.matrix, transform.translate, transform.center);
    // M = T * C * R
    XML3D.math.mat4.multiply(this.matrix, this.matrix, rot);
    // M = T * C * R * SO
    XML3D.math.mat4.multiply(this.matrix, this.matrix, so);
    // M = T * C * R * SO * S
    XML3D.math.mat4.multiply(this.matrix, this.matrix, transform.scale);
    // M = T * C * R * SO * S * -SO
    XML3D.math.mat4.multiply(this.matrix, this.matrix, transform.scaleOrientationInv);
    // M = T * C * R * SO * S * -SO * -C
    XML3D.math.mat4.multiply(this.matrix, this.matrix, transform.centerInverse);

    this.needsUpdate = false;
};

TransformDataAdapter.prototype.getMatrix = function () {
    this.needsUpdate && this.updateMatrix();
    return this.matrix;
};


TransformDataAdapter.prototype.notifyChanged = function (e) {
    if (e.type == 1) {
        this.needsUpdate = true;
    } else if (e.type == 2) {
        this.dispose();
    }
    this.notifyOppositeAdapters();
};
TransformDataAdapter.prototype.dispose = function () {
    this.isValid = false;
};

TransformDataAdapter.prototype.checkForImproperNesting = function() {
    for (var i=0; i < this.node.childNodes.length; i++) {
        if (this.node.childNodes[i].localName === "transform") {
            XML3D.debug.logError("Parsing error: Transform elements cannot be nested!", this.node);
        }
    }
};

// Export to XML3D.data namespace
module.exports = TransformDataAdapter;



