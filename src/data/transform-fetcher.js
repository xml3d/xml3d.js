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
    this.adapterHandle && this.adapterHandle.removeListener(this._bindedCallback)
};

DOMTransformFetcher.prototype.update = function () {
    var newHandle = this.owner.getAdapterHandle(this.node.getAttribute(this.attrName), XML3D.data, 0);
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

DOMTransformFetcher.prototype.getMatrix = ( function () {
    var IDENTITY = XML3D.math.mat4.create();
    return function () {
        if (!this.onlyDataTransform) {
            var cssMatrix = XML3D.css.getCSSMatrix(this.node);
            if (cssMatrix) {
                return XML3D.css.convertCssToMat4(cssMatrix);
            }
        }
        var adapter;
        if (this.adapterHandle && (adapter = this.adapterHandle.getAdapter())) {
            if (adapter.getXflowNode) {
                if (!this.xflowRequest)
                    this.xflowRequest = new Xflow.ComputeRequest(adapter.getXflowNode(), [this.dataName], this._bindedCallback);
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

DOMTransformFetcher.prototype._onChange = function () {
    this.updateMatrix();
};

module.exports = DOMTransformFetcher;
