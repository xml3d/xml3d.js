(function(){


/**
 * @constructor
 * @param {Xflow.DataNode} dataNode
 * @param {Array.<string>} filter
 */
var Request = function(dataNode, filter, callback){
    this._dataNode = dataNode;
    this._filter = filter ? filter.slice().sort() : null;
    this._listener = callback;
    this._result = null;
    this._dataNode._requests.push(this);
};
Xflow.Request = Request;

Object.defineProperty(Request.prototype, "dataNode", {
    set: function(v){
       throw new Error("dataNode is readonly");
    },
    get: function(){ return this._dataNode; }
});

Object.defineProperty(Request.prototype, "filter", {
    set: function(v){
        throw new Error("filter is read-only");
    },
    get: function(){ return this._filter; }
});

/**
 * Call this function, whenever the request is not required anymore.
 */
Request.prototype.clear = function(){
    this._listener = null;
    if(this._result) this._result.removeListener(this.callback);
    Array.erase(this._dataNode._requests, this);
};

/**
 * @param {Xflow.Request} request
 * @param {Xflow.RESULT_STATE} notification
 */
function notifyListeners(request, notification){
    if(request._listener)
        request._listener(request, notification)
};

/**
 * @param {Xflow.RESULT_STATE} notification
 */
Request.prototype.notify = function(notification){
    notifyListeners(this, notification);
}

/**
 * @constructor
 * @extends {Xflow.Request}
 * @param {Xflow.DataNode} dataNode
 * @param {Array.<string>} filter
 */
var ComputeRequest = function(dataNode, filter, callback){
    Xflow.Request.call(this, dataNode, filter, callback);
    this._bindedResultChange = this.onResultChanged.bind(this);
};
Xflow.createClass(ComputeRequest, Xflow.Request);
Xflow.ComputeRequest = ComputeRequest;

ComputeRequest.prototype.getResult = function(){
    if(this._result) this._result.removeListener(this._bindedResultChange);
    this._result = this._dataNode._getResult(Xflow.RESULT_TYPE.COMPUTE, this._filter);
    if(this._result) this._result.addListener(this._bindedResultChange);
    return this._result;
}

ComputeRequest.prototype.onResultChanged = function(result, notification){
    this.notify(notification);
}


var c_vsConnectNodeCount = {},
    c_vsConnectNodeCache = {};

/**
 * @constructor
 * @extends {Xflow.Request}
 * @param {Xflow.DataNode} dataNode
 * @param {Xflow.VSConfig} vsConfig
 */
var VertexShaderRequest = function(dataNode, vsConfig, callback){
    var filter = vsConfig.getFilter();
    Xflow.Request.call(this, dataNode, filter, callback);
    this._vsConfig = vsConfig;
    this._vsConnectNode = getVsConnectNode(dataNode, vsConfig);
    this._bindedResultChange = this.onResultChanged.bind(this);
};
Xflow.createClass(VertexShaderRequest, Xflow.Request);
Xflow.VertexShaderRequest = VertexShaderRequest;

VertexShaderRequest.prototype.getResult = function(){
    if(this._result) this._result.removeListener(this._bindedResultChange);
    this._result = this._vsConnectNode._getResult(Xflow.RESULT_TYPE.VS, this._filter);
    if(this._result) this._result.addListener(this._bindedResultChange);
    return this._result;
}

VertexShaderRequest.prototype.notify = function(notification){
    if(notification == Xflow.RESULT_STATE.CHANGED_STRUCTURE){
        var newVSConnectedNode = getVsConnectNode(this._dataNode, this._vsConfig);
        if(newVSConnectedNode != this._vsConnectNode){
            clearVsConnectNode(this._vsConnectNode, this._dataNode, this._vsConfig);
            this._vsConnectNode = newVSConnectedNode;
        }
    }
    Request.prototype.notify.call(this, notification);
}

VertexShaderRequest.prototype.onResultChanged = function(result, notification){
    this.notify(notification);
}

function getVsConnectNode(dataNode, vsConfig){
    var forwardNode ;
    while(forwardNode = dataNode._getForwardNode())
        dataNode = forwardNode;

    var key = getDataNodeShaderKey(dataNode, vsConfig);
    var connectNode;
    if(!(connectNode = c_vsConnectNodeCache[key])){
        var graph = dataNode._graph;
        connectNode = graph.createDataNode(false);
        connectNode.appendChild(dataNode);

        var operator = vsConfig.getOperator();
        connectNode.computeOperator = operator;
        vsConfig.setInputMapping(connectNode._computeInputMapping);
        vsConfig.setOutputMapping(connectNode._computeOutputMapping);

        c_vsConnectNodeCache[key] = connectNode;
        c_vsConnectNodeCount[connectNode.id] = 1;
    }
    else{
        c_vsConnectNodeCount[connectNode.id]++;
    }

    return connectNode;
}

function clearVsConnectNode(connectNode, dataNode, vsConfig){
    c_vsConnectNodeCount[connectNode.id]--;
    if(!c_vsConnectNodeCount[connectNode.id]){
        var key = getDataNodeShaderKey(dataNode, vsConfig);
        c_vsConnectNodeCache[key] = null;
        connectNode.clearChildren();
    }
}


function getDataNodeShaderKey(dataNode, vsConfig){
    return dataNode.id + "|" + vsConfig.getKey();
}

})();
