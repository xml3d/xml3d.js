(function(){

/**
 * @constructor
 * @param {Xflow.DataNode} dataNode
 * @param {Array.<string>} filter
 */
var Result = function(){
    this.loading = false;
    this._outputNames = [];
    /** @type {Object.<string,DataEntry>} */
    this._dataEntries = {};
};
Xflow.Result = Result;

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
var ComputeResult = function(){
    Xflow.Result.call(this);
};
XML3D.createClass(ComputeResult, Xflow.Result);
Xflow.ComputeResult = ComputeResult;

})();