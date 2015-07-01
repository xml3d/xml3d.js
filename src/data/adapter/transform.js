var Events = require("../../interface/notification.js");
var NodeAdapter = require("../../base/adapter.js").NodeAdapter;

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
        scaleOrientation: XML3D.math.mat4.create(),
        scaleOrientationInv: XML3D.math.mat4.create(),
        center: XML3D.math.mat4.create(),
        centerInverse: XML3D.math.mat4.create(),
        rotation: XML3D.math.mat4.create()
    };
    this.needsUpdate = true;
    this.checkForImproperNesting();
};

TransformDataAdapter.prototype.updateMatrix = function () {
    var n = this.node;
    var transform = this.transform;
    var centerVec = n.center;
    var so = n.scaleOrientation;
    var ro = n.rotation;

    XML3D.math.mat4.fromRotation(transform.scaleOrientation, so[3], so);
    XML3D.math.mat4.fromRotation(transform.rotation, ro[3], ro);

    XML3D.math.mat4.translate(transform.translate, IDENT_MAT, n.translation);
    XML3D.math.mat4.translate(transform.center, IDENT_MAT, centerVec);
    XML3D.math.mat4.translate(transform.centerInverse, IDENT_MAT, XML3D.math.vec3.negate(centerVec, centerVec));
    XML3D.math.mat4.scale(transform.scale, IDENT_MAT, n.scale);
    XML3D.math.mat4.invert(transform.scaleOrientationInv, transform.scaleOrientation);

    multiplyComponents(transform, this.matrix);
    this.needsUpdate = false;
};

function multiplyComponents(transform, matrix) {
    // M = T * C
    XML3D.math.mat4.multiply(matrix, transform.translate, transform.center);
    // M = T * C * R
    XML3D.math.mat4.multiply(matrix, matrix, transform.rotation);
    // M = T * C * R * SO
    XML3D.math.mat4.multiply(matrix, matrix, transform.scaleOrientation);
    // M = T * C * R * SO * S
    XML3D.math.mat4.multiply(matrix, matrix, transform.scale);
    // M = T * C * R * SO * S * -SO
    XML3D.math.mat4.multiply(matrix, matrix, transform.scaleOrientationInv);
    // M = T * C * R * SO * S * -SO * -C
    XML3D.math.mat4.multiply(matrix, matrix, transform.centerInverse);
}

TransformDataAdapter.prototype.getMatrix = function () {
    this.needsUpdate && this.updateMatrix();
    return this.matrix;
};

TransformDataAdapter.prototype.attributeChangedCallback = function (name, oldValue, newValue) {
   this.needsUpdate = true;
   this.notifyOppositeAdapters(Events.ADAPTER_VALUE_CHANGED);
};

TransformDataAdapter.prototype.notifyChanged = function (e) {
    if (e.type == Events.NODE_REMOVED) {
        this.dispose();
        this.notifyOppositeAdapters(Events.ADAPTER_HANDLE_CHANGED);
    }
};
TransformDataAdapter.prototype.dispose = function () {
    this.isValid = false;
};

TransformDataAdapter.prototype.checkForImproperNesting = function () {
    for (var i = 0; i < this.node.childNodes.length; i++) {
        if (this.node.childNodes[i].localName === "transform") {
            XML3D.debug.logError("Parsing error: Transform elements cannot be nested!", this.node);
        }
    }
};

// Export to XML3D.data namespace
module.exports = TransformDataAdapter;



