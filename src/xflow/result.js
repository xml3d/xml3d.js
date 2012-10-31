(function(){

/**
 * @constructor
 * @param {Xflow.DataNode} dataNode
 * @param {Array.<string>} filter
 */
Xflow.Result = function(){
    this.loading = false;
    this._outputNames = [];
    /** @type {Object.<string,DataEntry>} */
    this._dataEntries = {};
};
var Result = Xflow.Result;

Object.defineProperty(Result.prototype, "outputNames", {
    set: function(v){
       throw "outputNames is readonly";
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
 * @constructor
 * @extends {Xflow.Result}
 */
Xflow.ComputeResult = function(){
    Xflow.Result.call(this);
};
XML3D.createClass(Xflow.ComputeResult, Xflow.Result);
var ComputeResult = Xflow.ComputeResult;

})();