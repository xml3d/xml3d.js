(function(){

/**
 * @constructor
 * @param {Xflow.DataNode} dataNode
 * @param {Array.<string>} filter
 */
Xflow.Result = function(){
    this.loading = false;
    this.valid = false;
    this._listeners = [];
    this._requests = [];
};
var Result = Xflow.Result;

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

/**
 * @param {function(Xflow.Result, Xflow.RESULT_STATE)} callback
 */
Result.prototype._addRequest = function(request){
    this._requests.push(request);
};

/**
 * @param {function(Xflow.Result, Xflow.RESULT_STATE)} callback
 */
Result.prototype._removeRequest = function(request){
    Array.erase(this._requests, request);
};


Result.prototype._notifyChanged = function(state){
    this.valid = false;
    for(var i = 0; i < this._requests.length; ++i){
        this._requests[i]._onResultChanged(state);
    }
    Xflow._listCallback(this, state);
}

Result.prototype._onListedCallback = function(state){
    for(var i = 0; i < this._listeners.length; ++i){
        this._listeners[i](this, state);
    }
}



/**
 * @constructor
 * @extends {Xflow.Result}
 */
Xflow.ComputeResult = function(){
    Xflow.Result.call(this);
    this._outputNames = [];
    /** @type {Object.<string,DataEntry>} */
    this._dataEntries = {};
};
Xflow.createClass(Xflow.ComputeResult, Xflow.Result);
var ComputeResult = Xflow.ComputeResult;

Object.defineProperty(ComputeResult.prototype, "outputNames", {
    set: function(v){
        throw new Error("outputNames is readonly");
    },
    get: function(){ return this._outputNames; }
});

ComputeResult.prototype.getOutputData = function(name){
    return this._dataEntries[name];
};

/**
 * @returns {Object.<string,DataEntry>}
 */
ComputeResult.prototype.getOutputMap = function() {
    return this._dataEntries;
};



    /**
 * @constructor
 * @extends {Xflow.Result}
 */
Xflow.VertexShaderResult = function(){
    Xflow.Result.call(this);
    this._shaderInputNames = null;
    this._program = null;
    this._programData = null;

};
Xflow.createClass(Xflow.VertexShaderResult, Xflow.Result);
var VertexShaderResult = Xflow.VertexShaderResult;

Object.defineProperty(VertexShaderResult.prototype, "shaderInputNames", {
    set: function(v){
        throw new Error("shaderInputNames is readonly");
    },
    get: function(){ return this._program._shaderInputNames; }
});
Object.defineProperty(VertexShaderResult.prototype, "shaderOutputNames", {
    set: function(v){
        throw new Error("shaderOutputNames is readonly");
    },
    get: function(){ return this._program._shaderOutputNames; }
});


VertexShaderResult.prototype.getShaderInputData = function(name){
    return this._program.getInputData(name, this._programData);
};

VertexShaderResult.prototype.isShaderInputUniform = function(name){
    return this._program.isInputUniform(name);
}

VertexShaderResult.prototype.isShaderOutputUniform = function(name){
    return this._program.isOutputUniform(name);
}
VertexShaderResult.prototype.getShaderOutputType = function(name){
    return this._program.getShaderOutputType(name);
}

VertexShaderResult.prototype.getUniformOutputData = function(name){
    return this._program.getUniformOutputData(name, this._programData);
}
VertexShaderResult.prototype.isShaderOutputNull = function(name){
    return this._program.isOutputNull(name);
}



VertexShaderResult.prototype.getGLSLCode = function(){
    return this._program._glslCode;
}



})();
