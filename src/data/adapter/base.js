var ComputeRequest = require("../../xflow/interface/request.js").ComputeRequest;
var setShaderConstant = require("../../xflow/interface/vs-connect.js").setShaderConstant;
var registerErrorCallback = require("../../xflow/base.js").registerErrorCallback;
var XC = require("../../xflow/interface/constants.js");

var NodeAdapter = XML3D.base.NodeAdapter;
var createClass = XML3D.createClass;

/**
 * @extends NodeAdapter
 * @abstract
 *
 * @param factory
 * @param node
 */
var BaseDataAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
    this.xflowDataNode = null;
};
createClass(BaseDataAdapter, NodeAdapter);


BaseDataAdapter.prototype.getXflowNode = function () {
    return this.xflowDataNode;
};

BaseDataAdapter.prototype.getComputeRequest = function (filter, callback) {
    return new ComputeRequest(this.xflowDataNode, filter, callback);
};

BaseDataAdapter.prototype.getComputeResult = function (filter) {
    return this.xflowDataNode._getResult(XC.RESULT_TYPE.COMPUTE, filter);
};

BaseDataAdapter.prototype.getOutputNames = function () {
    return this.xflowDataNode.getOutputNames();
};

BaseDataAdapter.prototype.getOutputChannelInfo = function (name) {
    return this.xflowDataNode.getOutputChannelInfo(name);
};

setShaderConstant(XC.SHADER_CONSTANT_KEY.OBJECT_ID, "objectID");
setShaderConstant(XC.SHADER_CONSTANT_KEY.SCREEN_TRANSFORM, "modelViewProjectionMatrix");
setShaderConstant(XC.SHADER_CONSTANT_KEY.SCREEN_TRANSFORM_NORMAL, "modelViewProjectionNormalMatrix");
setShaderConstant(XC.SHADER_CONSTANT_KEY.VIEW_TRANSFORM, "modelViewMatrix");
setShaderConstant(XC.SHADER_CONSTANT_KEY.VIEW_TRANSFORM_NORMAL, "modelViewMatrixN");
setShaderConstant(XC.SHADER_CONSTANT_KEY.WORLD_TRANSFORM, "modelMatrix");
registerErrorCallback(function(message, xflowNode){
    message = "Xflow: " + message;
    var userData = xflowNode ? xflowNode.userData : null;
    if (userData && userData.ownerDocument) {
        if (userData.ownerDocument === document) {
            XML3D.debug.logError(message, userData);
        }
        else if (userData.id) {
            var uri = new XML3D.URI("#" + userData.id);
            uri = uri.getAbsoluteURI(userData.ownerDocument._documentURL || userData.ownerDocument.URL);
            XML3D.debug.logError(message, "External Node: " + uri);
        }
        else {
            XML3D.debug.logError(message, "External Document: " + userData.ownerDocument.URL);
        }
    }
    else if (typeof userData == "string") {
        XML3D.debug.logError(message, userData);
    }
    else {
        XML3D.debug.logError(message);
    }
});

module.exports = BaseDataAdapter;
