var ComputeRequest = require("../xflow/interface/request.js").ComputeRequest;
var Events = require("../interface/notification.js");
var CSS = require("../utils/css.js");
var mat4 = require("gl-matrix").mat4;

var DOMTransformFetcher = function (owner, attrName, dataName, onlyDataTransform) {
    this.owner = owner;
    this.node = owner.node;
    this.attrName = attrName;
    this.dataName = dataName;
    this.adapterHandle = null;
    this.xflowRequest = null;
    this.onlyDataTransform = onlyDataTransform || false;
    this._bindedCallback = this._onChange.bind(this);
};
DOMTransformFetcher.prototype.clear = function () {
    this.xflowRequest && this.xflowRequest.clear();
    this.xflowRequest = null;
    this.adapterHandle && this.adapterHandle.removeListener(this._bindedCallback);
};

DOMTransformFetcher.prototype.dispose = function() {
    this.clear();
    delete this.owner;
    delete this.node;
};

DOMTransformFetcher.prototype.update = function () {
    var newHandle = this.owner.getAdapterHandle(this.node.getAttribute(this.attrName), "data", 0);
    if (newHandle != this.adapterHandle) {
        this.clear();
        this.adapterHandle = newHandle;
        if (newHandle)
            newHandle.addListener(this._bindedCallback)
    }
    this.updateMatrix();
};

DOMTransformFetcher.prototype.updateMatrix = function () {
    this.owner.onTransformChange(this.attrName, this.getMatrix());
};

DOMTransformFetcher.prototype.updateCSSTransition = function() {
    var cssMatrix = this.owner.style.transform;
    if (cssMatrix && cssMatrix !== "none") {
        this.owner.onTransformChange(this.attrName, CSS.matrixStringToMat4(cssMatrix).data);
    }
};

DOMTransformFetcher.prototype.getMatrix = ( function () {
    var IDENTITY = mat4.create();

    return function () {
        if (!this.onlyDataTransform) {
            var cssMatrix = CSS.getCSSMatrix(this.node);
            if (cssMatrix && cssMatrix !== "none") {
                if (this.owner.style.transitionDuration !== "0s") {
                    this.handleCSSTransition();
                }
                return CSS.matrixStringToMat4(cssMatrix).data;
            }
        }
        var adapter;
        if (this.adapterHandle && (adapter = this.adapterHandle.getAdapter())) {
            if (adapter.getXflowNode) {
                if (!this.xflowRequest)
                    this.xflowRequest = new ComputeRequest(adapter.getXflowNode(), [this.dataName], this._bindedCallback);
                var dataResult = this.xflowRequest.getResult();
                var transformData = (dataResult.getOutputData(this.dataName) && dataResult.getOutputData(this.dataName).getValue());
                if (transformData)
                    return transformData;
            }
            if (adapter.getMatrix) {
                return adapter.getMatrix();
            }
        }
        return this.onlyDataTransform ? null : IDENTITY;
    };
}());

DOMTransformFetcher.prototype.handleCSSTransition = function() {
    var duration = CSS.getLargestTransitionDurationMS(this.owner.style.transitionDuration);
    if (duration) {
        CSS.addTransitionCallback(this.updateCSSTransition.bind(this), duration);
    }
};

DOMTransformFetcher.prototype._onChange = function (evt) {
    if (evt.type == Events.ADAPTER_VALUE_CHANGED) {
        this.owner.onTransformChange(this.attrName, evt.adapterHandle.getAdapter().getMatrix());
    } else { // If the adapter changed, we need to re-evaluate the matrix
        this.updateMatrix();
    }
};

module.exports = DOMTransformFetcher;
