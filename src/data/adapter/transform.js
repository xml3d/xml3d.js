var Events = require("../../interface/notification.js");
var NodeAdapter = require("../../base/adapter.js").NodeAdapter;

var TransformDataAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
    this.isValid = true;
    this.needsUpdate = true;
};

XML3D.createClass(TransformDataAdapter, NodeAdapter);

var IDENT_MAT = new XML3D.Mat4();

TransformDataAdapter.prototype.init = function () {
    // Create all matrices, no valid values yet
    this.matrix = new XML3D.Mat4();
    this.transform = {
        translate: new XML3D.Mat4(),
        scale: new XML3D.Mat4(),
        scaleOrientation: new XML3D.Mat4(),
        scaleOrientationInv: new XML3D.Mat4(),
        center: new XML3D.Mat4(),
        centerInverse: new XML3D.Mat4(),
        rotation: new XML3D.Mat4()
    };
    this.needsUpdate = true;
    this.checkForImproperNesting();
};

TransformDataAdapter.prototype.updateMatrix = function () {
    this.matrix.identity();
    var n = this.node;
    var transform = this.transform;
    var centerVec = n.center;
    var so = n.scaleOrientation;
    var ro = n.rotation;

    transform.scaleOrientation.identity().rotate(so.angle, so.axis);
    transform.rotation.identity().rotate(ro.angle, ro.axis);

    transform.translate.identity().translate(n.translation);
    transform.center.identity().translate(centerVec);
    transform.centerInverse.identity().translate(centerVec.negate());
    transform.scale.identity().scale(n.scale);
    XML3D.math.mat4.invert(transform.scaleOrientationInv.data, transform.scaleOrientation.data);

    multiplyComponents(transform, this.matrix);
    this.needsUpdate = false;
};

function multiplyComponents(transform, matrix) {
    // M = T * C
    XML3D.math.mat4.multiply(matrix.data, transform.translate.data, transform.center.data);
    // M = T * C * R
    matrix.multiply(transform.rotation);
    // M = T * C * R * SO
    matrix.multiply(transform.scaleOrientation);
    // M = T * C * R * SO * S
    matrix.multiply(transform.scale);
    // M = T * C * R * SO * S * -SO
    matrix.multiply(transform.scaleOrientationInv);
    // M = T * C * R * SO * S * -SO * -C
    matrix.multiply(transform.centerInverse);
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



