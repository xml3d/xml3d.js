var Events = require("../../interface/notification.js");
var NodeAdapter = require("../../base/adapter.js").NodeAdapter;
var mat4 = require("gl-matrix").mat4;
var vec3 = require("gl-matrix").vec3;

var TransformDataAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
    this.isValid = true;
    this.needsUpdate = true;
};

XML3D.createClass(TransformDataAdapter, NodeAdapter);

var IDENT_MAT = mat4.create();

TransformDataAdapter.prototype.init = function () {
    // Create all matrices, no valid values yet
    this.matrix = mat4.create();
    this.transform = {
        translate: mat4.create(),
        scale: mat4.create(),
        scaleOrientation: mat4.create(),
        scaleOrientationInv: mat4.create(),
        center: mat4.create(),
        centerInverse: mat4.create(),
        rotation: mat4.create()
    };
    this.needsUpdate = true;
    this.checkForImproperNesting();
};

TransformDataAdapter.prototype.updateMatrix = function () {
    var n = this.node;
    var transform = this.transform;
    var centerVec = n.center.data;
    var so = n.scaleOrientation.data;
    var ro = n.rotation.data;

    mat4.fromRotation(transform.scaleOrientation, so[3], so);
    mat4.fromRotation(transform.rotation, ro[3], ro);

    mat4.translate(transform.translate, IDENT_MAT, n.translation.data);
    mat4.translate(transform.center, IDENT_MAT, centerVec);
    mat4.translate(transform.centerInverse, IDENT_MAT, vec3.negate(centerVec, centerVec));
    mat4.scale(transform.scale, IDENT_MAT, n.scale.data);
    mat4.invert(transform.scaleOrientationInv, transform.scaleOrientation);

    multiplyComponents(transform, this.matrix);
    this.needsUpdate = false;
};

function multiplyComponents(transform, matrix) {
    // M = T * C
    mat4.multiply(matrix, transform.translate, transform.center);
    // M = T * C * R
    mat4.multiply(matrix, matrix, transform.rotation);
    // M = T * C * R * SO
    mat4.multiply(matrix, matrix, transform.scaleOrientation);
    // M = T * C * R * SO * S
    mat4.multiply(matrix, matrix, transform.scale);
    // M = T * C * R * SO * S * -SO
    mat4.multiply(matrix, matrix, transform.scaleOrientationInv);
    // M = T * C * R * SO * S * -SO * -C
    mat4.multiply(matrix, matrix, transform.centerInverse);
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



