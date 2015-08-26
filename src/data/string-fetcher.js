var ComputeRequest = require("../xflow/interface/request.js").ComputeRequest;
var Events = require("../interface/notification.js");
var CSS = require("../utils/css.js");
var mat4 = require("gl-matrix").mat4;

var DOMStringFetcher = function (owner, attrName, dataName) {
    this.owner = owner;
    this.node = owner.node;
    this.attrName = attrName;
    this.dataName = dataName;
    this.adapterHandle = null;
    this.xflowRequest = null;
    this._bindedCallback = this._onChange.bind(this);
    this.update();
};
DOMStringFetcher.prototype.clear = function () {
    this.xflowRequest && this.xflowRequest.clear();
    this.xflowRequest = null;
    this.adapterHandle && this.adapterHandle.removeListener(this._bindedCallback);
    this.adapterHandle = null;
};

DOMStringFetcher.prototype.update = function () {
    var attrValue = this.node.getAttribute(this.attrName);
    if (!attrValue || !attrValue.match(/#/)) {
        this.clear();
        return; //Simple value, no need to register an adapterhandle
    }
    var newHandle = this.owner.getAdapterHandle(attrValue, "data", 0);
    if (newHandle != this.adapterHandle) {
        this.clear();
        this.adapterHandle = newHandle;
        if (newHandle)
            newHandle.addListener(this._bindedCallback)
    }
};

DOMStringFetcher.prototype.getValue = function() {
    if (!this.adapterHandle) {
        return this.node.getAttribute(this.attrName);
    }
    var adapter;
    if (adapter = this.adapterHandle.getAdapter()) {
        if (adapter.getXflowNode) {
            if (!this.xflowRequest)
                this.xflowRequest = new ComputeRequest(adapter.getXflowNode(), [this.dataName], this._bindedCallback);
            var dataResult = this.xflowRequest.getResult();
            var stringData = (dataResult.getOutputData(this.dataName) && dataResult.getOutputData(this.dataName).getValue());
            if (stringData && stringData.length)
                return stringData[0];
        }
    }
    return "";
};

DOMStringFetcher.prototype._onChange = function (evt) {
    if (evt.type == Events.ADAPTER_VALUE_CHANGED) {
        this.owner.attributeChangedCallback(this.attrName, evt.adapterHandle.getAdapter().getValue(), this.getValue());
    } else {
        this.update();
        this.owner.attributeChangedCallback(this.attrName, null, this.getValue());
    }
};

module.exports = DOMStringFetcher;
