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
var Request = function(dataNode, filter){
    this._dataNode = dataNode;
    this._filter = filter;
    this._listeners = [];
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
 * @param {function(Xflow.Request, Xflow.RequestNotification)} callback
 */
Request.prototype.addListener = function(callback){
    this._listeners.push(callback)
};
/**
 * @param {function(Xflow.DataEntry, Xflow.RequestNotification)} callback
 */
Request.prototype.removeListener = function(callback){
    Array.erase(this._listeners, callback);
};

/**
 * @param {Xflow.Request} request
 * @param {Xflow.RequestNotification} notification
 */
function notifyListeners(request, notification){
    for(var i = 0; i < request._listeners.length; ++i){
        request._listeners[i](request, notification)
    }
};

/**
 * @constructor
 * @extends {Xflow.Request}
 * @param {Xflow.DataNode} dataNode
 * @param {Array.<string>} filter
 */
var ComputeRequest = function(dataNode, filter){
    Xflow.Request.call(this, dataNode, filter);
};
XML3D.createClass(ComputeRequest, Xflow.Request);
Xflow.ComputeRequest = ComputeRequest;

ComputeRequest.prototype.getResult = function(){
    return this._dataNode._getOutputs(this.filter);
}

})();