var Base = require("../base.js");
var C = require("./constants.js");
var DataNode = require("./graph.js").DataNode;

/**
 * Content of this file:
 * Classes to request results from an Xflow graph.
 */

/**
 * Abstract Request class.
 * Any Request is created from a DataNode to receive the result of that DataNode.
 * To allow effective optimization, it is recommended to create only one Request per DataNode and receive all
 * results through that Request.
 * @abstract
 * @param {DataNode} dataNode The DataNode from which to request results
 * @param {?Array.<string>} filter A list of names filtering the values to be received (only return values with names inside the filter)
 * @param {?function} callback A callback function that gets called whenever the result of the Request changes
 */
var Request = function(dataNode, filter, callback){
    this._dataNode = dataNode;
    this._filter = filter ? filter.slice().sort() : null;
    this._listener = callback;

    /**
     * Cached result of this request
     * @type {Result}
     */
    this._result = null;

    /**
     * Cached callback function attached to data node
     * @private
     */
    this._dataNodeListener = this._onDataNodeChange.bind(this);

    this._dataNode.addListener(this._dataNodeListener);
};

Object.defineProperty(Request.prototype, "dataNode", {
    set: function(){
       throw new Error("dataNode is readonly");
    },
    get: function(){ return this._dataNode; }
});

Object.defineProperty(Request.prototype, "filter", {
    set: function(){
        throw new Error("filter is read-only");
    },
    get: function(){ return this._filter; }
});

/**
 * Call this function, whenever the request is not required anymore.
 * Cleans up cached data and listeners
 */
Request.prototype.clear = function(){
    this._listener = null;
    if(this._result) this._result._removeRequest(this);
    this._dataNode.removeListener(this._dataNodeListener);
};

/**
 * @param {C.RESULT_STATE} data
 * @private
 */
Request.prototype._onPostponedResultChanged = function(data){
    this._listener && this._listener(this, data);
};

/**
 * Change the result of the request and update request list of old and new
 * result.
 * @private
 * @param {Request} request
 * @param {Result?} newResult
 * @returns {Result}
 */
function swapResultRequest(request, newResult){
    if(request._result) request._result._removeRequest(request);
    request._result = newResult;
    if(newResult) newResult._addRequest(request);
    return newResult;
}

/**
 * @param {Request} request
 * @param {C.RESULT_STATE} notification
 * @private
 */
function notifyListeners(request, notification){
    Base._queueResultCallback(request, notification);
}

/**
 * @param {C.RESULT_STATE} notification
 */
Request.prototype._onDataNodeChange = function(notification){
    notifyListeners(this, notification);
};

/**
 * A ComputeRequest is a Request for a ComputeResult, which contains a named map of typed values.
 * @constructor
 * @extends {Request}
 * @param {DataNode} dataNode The DataNode from which to request results
 * @param {?Array.<string>} filter A list of names filtering the values to be received (only return values with names inside the filter)
 * @param {?function} callback A callback function that gets called whenever the result of the Request changes
 */
var ComputeRequest = function(dataNode, filter, callback){
    Request.call(this, dataNode, filter, callback);
};
Base.createClass(ComputeRequest, Request);

/**
 * @returns {Result}
 */
ComputeRequest.prototype.getResult = function(){
    // swapResultRequest is called here because the result object of the request may change, e.g.
    // different forward node.
    return swapResultRequest(this, this._dataNode._getResult(C.RESULT_TYPE.COMPUTE, this._filter));
};

ComputeRequest.prototype._onResultChanged = function(notification){
    this._onDataNodeChange(notification);
};


var c_vsConnectNodeCount = {},
    c_vsConnectNodeKey = {},
    c_vsConnectNodeCache = {};

/**
 * A VertexShaderRequest is a Request for a VSDataResult, used to generate a VertexShader that includes
 * dataflow processing.
 * @constructor
 * @extends {Request}
 * @param {DataNode} dataNode
 * @param {VSConfig} vsConfig Configuration for the output of the generated vertex shader
 * @param {?function} callback A callback function that gets called whenever the result of the Request changes
 */
var VertexShaderRequest = function(dataNode, vsConfig, callback){
    var filter = vsConfig.getFilter();
    if(filter.length == 0)
        throw new Error("vsConfig requires at least one attribute entry.");
    Request.call(this, dataNode, filter, callback);
    this._vsConfig = vsConfig;
    this._vsConnectNode = getVsConnectNode(dataNode, vsConfig);
};
Base.createClass(VertexShaderRequest, Request);

VertexShaderRequest.prototype.getConfig = function(){
    return this._vsConfig;
};

/**
 * @see ComputeRequest.getResult
 * @returns {Result}
 */
VertexShaderRequest.prototype.getResult = function(){
    return swapResultRequest(this, this._vsConnectNode._getResult(C.RESULT_TYPE.VS, this._filter));
};

VertexShaderRequest.prototype._onDataNodeChange = function(notification){
    if(notification == C.RESULT_STATE.CHANGED_STRUCTURE){
        var newVSConnectedNode = getVsConnectNode(this._dataNode, this._vsConfig, this._filter);
        if(newVSConnectedNode != this._vsConnectNode){
            clearVsConnectNode(this._vsConnectNode);
            this._vsConnectNode = newVSConnectedNode;
        }
    }
    Request.prototype._onDataNodeChange.call(this, notification);
};

VertexShaderRequest.prototype.getVertexShader = function(){
    this.getResult(); // Update the result first
    if(!this._vertexShader){
        this._vertexShader = this._result.getVertexShader(this._vsConfig);
    }
    return this._vertexShader;
};

VertexShaderRequest.prototype._onResultChanged = function(notification){
    this._onDataNodeChange(notification);
};

function getVsConnectNode(dataNode, vsConfig, filter){
    var forwardNode = dataNode._getForwardNode(filter);

    var key = getDataNodeShaderKey(forwardNode, vsConfig);
    var connectNode;
    if(!(connectNode = c_vsConnectNodeCache[key])){
        connectNode = new DataNode(false);
        connectNode.appendChild(forwardNode);

        connectNode.computeOperator = vsConfig.getOperator();
        connectNode.computeInputMapping = null;
        connectNode.computeOutputMapping = null;

        c_vsConnectNodeCache[key] = connectNode;
        c_vsConnectNodeCount[connectNode.id] = 1;
        c_vsConnectNodeKey[connectNode.id] = key;
    }
    else{
        c_vsConnectNodeCount[connectNode.id]++;
    }

    return connectNode;
}

function clearVsConnectNode(connectNode){
    c_vsConnectNodeCount[connectNode.id]--;
    if(!c_vsConnectNodeCount[connectNode.id]){
        var key = c_vsConnectNodeKey[connectNode.id];
        c_vsConnectNodeCache[key] = null;
        connectNode.clearChildren();
    }
}


function getDataNodeShaderKey(dataNode, vsConfig){
    return dataNode.id + "|" + vsConfig.getKey();
}

module.exports = {
    ComputeRequest:  ComputeRequest,
    VertexShaderRequest: VertexShaderRequest
};
