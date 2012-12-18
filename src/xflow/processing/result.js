(function(){

/**
 * @constructor
 * @param {Xflow.DataNode} dataNode
 * @param {Array.<string>} filter
 */
Xflow.Result = function(){
    this.loading = false;
    this.valid = false;
    this._outputNames = [];
    /** @type {Object.<string,DataEntry>} */
    this._dataEntries = {};
    this._listeners = [];
};
var Result = Xflow.Result;

Object.defineProperty(Result.prototype, "outputNames", {
    set: function(v){
       throw new Error("outputNames is readonly");
    },
    get: function(){ return this._outputNames; }
});

Result.prototype.getOutputData = function(name){
    return this._dataEntries[name];
};

/**
 * @returns {Object.<string,DataEntry>}
 */
Result.prototype.getOutputMap = function() {
    return this._dataEntries;
};


/**
 * @param {function(Xflow.Result, Xflow.RESULT_STATE)} callback
 */
Result.prototype.addListener = function(callback){
    this._listeners.push(callback);
};

/**
 * @param {function(Xflow.Result, Xflow.RESULT_STATE)} callback
 */
Result.prototype.removeListener = function(callback){
    Array.erase(this._listeners, callback);
};

Result.prototype.notifyChanged = function(state){
    this.valid = false;
    for(var i = 0; i < this._listeners.length; ++i){
        this._listeners[i](this, state);
    }
}


/**
 * @constructor
 * @extends {Xflow.Result}
 */
Xflow.ComputeResult = function(channelNode){
    Xflow.Result.call(this, channelNode);
};
XML3D.createClass(Xflow.ComputeResult, Xflow.Result);
var ComputeResult = Xflow.ComputeResult;


})();