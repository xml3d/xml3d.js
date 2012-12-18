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
    this.result = null;
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
    if(this.result) this.result.removeListener(this.callback);
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
    this.callback = this.onResultChanged.bind(this);
};
XML3D.createClass(ComputeRequest, Xflow.Request);
Xflow.ComputeRequest = ComputeRequest;

ComputeRequest.prototype.getResult = function(){
    if(this.result) this.result.removeListener(this.callback);
    this.result = this._dataNode._getComputeResult(this._filter);
    if(this.result) this.result.addListener(this.callback);
    return this.result;
}

ComputeRequest.prototype.onResultChanged = function(notification){
    this.notify(notification);
}

})();