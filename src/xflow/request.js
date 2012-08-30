(function(){

/**
 * @enum {Number}
 */
Xflow.RequestNotification = {
    CHANGED_CONTENT: 0,
    CHANGED_STRUCTURE: 1
};

/**
 * @constructor
 * @param {Xflow.DataNode} dataNode
 * @param {Array.<string>} filter
 */
var Request = function(dataNode, filter, callback){
    this._dataNode = dataNode;
    this._filter = filter ? filter.slice().sort() : null;
    this._listener = callback;

    this._dataNode._requests.push(this);
};
Xflow.Request = Request;

Object.defineProperty(Request.prototype, "dataNode", {
    set: function(v){
       throw "dataNode is readonly"
    },
    get: function(){ return this._dataNode; }
});

Object.defineProperty(Request.prototype, "filter", {
    set: function(v){
        throw "filter is read-only"
    },
    get: function(){ return this._filter; }
});

/**
 * Call this function, whenever the request is not required anymore.
 */
Request.prototype.clear = function(callback){
    this._listener = null;
    Array.erase(this._dataNode._requests, callback);
};

/**
 * @param {Xflow.Request} request
 * @param {Xflow.RequestNotification} notification
 */
function notifyListeners(request, notification){
    request._listener(request, notification)
};

/**
 * @param {Xflow.RequestNotification} notification
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
};
XML3D.createClass(ComputeRequest, Xflow.Request);
Xflow.ComputeRequest = ComputeRequest;

ComputeRequest.prototype.getResult = function(){
    return this._dataNode._getComputeResult(this._filter);
}

})();