var XC = require("../xflow/interface/constants.js");
var Resource = require("../resource");

var c_XflowObserverList = [];

var XML3DDataObserver = function(callback){
    this.callback = callback;
    this.observed = [];
};

XML3DDataObserver.prototype.observe = function(node, options){
    if(!node)
        throw new Error("The node to observe is null.");


    if(!node._configured)
        throw new Error("Note to observe is not   (yet). Make sure to pass an XML3D node and to execute " +
            "this function after XML3D has been configured e.g. inside a DOMContentLoaded listener.");


    var dataAdapter = Resource.getAdapter(node, "data");
    if(!dataAdapter)
        throw new Error("Can't observe node. XML3DataObserver can only observe data containers such as <data>, <mesh> or <shader>");

    if(this.observed.length == 0)
        c_XflowObserverList.push(this);

    var entry = {
        node: node,
        changed: false,
        request: null
    };

    var names = options && options['names'];
    var typeOfNames = Object.prototype.toString.call(names).slice(8, -1);
    if (typeOfNames === "String") {
        names = [names];
    }

    entry.request = dataAdapter.getComputeRequest(names, function(request, changeType){
        entry.changed = true;
    });
    // Fetch result to synchronize Xflow structures and connect to callbacks
    // TODO: Find an option to connect request to callback structure without computing result
    entry.request.getResult();

    this.observed.push(entry);
};

XML3DDataObserver.prototype.disconnect = function(){
    for(var i = 0; i < this.observed.length; ++i){
        this.observed[i].request.clear();
    }
    this.observed = [];
    var i = c_XflowObserverList.length;
    while(i--){
        if(c_XflowObserverList[i] == this)
            c_XflowObserverList.splice(i, 1);
    }
};


XML3D.updateXflowObserver = function(){
    for(var i = 0; i < c_XflowObserverList.length; ++i){
        var observer = c_XflowObserverList[i];
        var records = [];
        for(var j = 0; j < observer.observed.length; ++j){
            var entry = observer.observed[j];
            if(entry.changed){
                entry.changed = false;
                var result = entry.request.getResult();
                var dataResult = new XML3DDataResult(result);
                records.push( new XML3DDataRecord(entry.node, dataResult));
            }
        }
        if(records.length > 0 && observer.callback){
            observer.callback(records, observer);
        }
    }
};

var XML3DDataRecord = function(target, result){
    this.target = target;
    this.result = result;
};


var XML3DDataResult = function(result){
    this._entries = {};
    constructDataResult(this, result);
};

XML3DDataResult.prototype.getValue = function(name) {
    if (this._entries[name])
        return this._entries[name].value;
    return null;
};

XML3DDataResult.prototype.getType = function(name) {
    if (this._entries[name])
        return this._entries[name].type;
    return null;
};

XML3DDataResult.prototype.getNames = function(){
    var result = [];
    for(var name in this._entries){
        result.push(name);
    }
    return result;
};

XML3DDataResult.FLOAT  = 0;
XML3DDataResult.FLOAT2 = 1;
XML3DDataResult.FLOAT3 = 2;
XML3DDataResult.FLOAT4 = 3;
XML3DDataResult.FLOAT4X4 = 4;
XML3DDataResult.INT = 10;
XML3DDataResult.INT4 = 11;
XML3DDataResult.BOOL = 20;
XML3DDataResult.TEXTURE = 30;
XML3DDataResult.BYTE = 40;
XML3DDataResult.UBYTE = 50;


function constructDataResult(dataResult, result){
    for(var i = 0; i < result.outputNames.length; ++i){
        var name = result.outputNames[i];
        var entry = result.getOutputData(name);
        var value = entry && entry.getValue();
        if (value !== null) {
            var type = getXML3DDataType(entry.type);
            dataResult._entries[name] = { type: type, value: value};
        }
    }
}

function getXML3DDataType(type){
    switch(type){
        case XC.DATA_TYPE.FLOAT : return XML3DDataResult.FLOAT;
        case XC.DATA_TYPE.FLOAT2 : return XML3DDataResult.FLOAT2;
        case XC.DATA_TYPE.FLOAT3 : return XML3DDataResult.FLOAT3;
        case XC.DATA_TYPE.FLOAT4 : return XML3DDataResult.FLOAT4;
        case XC.DATA_TYPE.FLOAT4X4 : return XML3DDataResult.FLOAT4X4;
        case XC.DATA_TYPE.INT : return XML3DDataResult.INT;
        case XC.DATA_TYPE.INT4 : return XML3DDataResult.INT4;
        case XC.DATA_TYPE.BOOL : return XML3DDataResult.BOOL;
        case XC.DATA_TYPE.TEXTURE : return XML3DDataResult.TEXTURE;
        case XC.DATA_TYPE.BYTE : return XML3DDataResult.BYTE;
        case XC.DATA_TYPE.UBYTE : return XML3DDataResult.UBYTE;
        default: throw new Error("WHAT IS THIS I DON'T EVEN...");
    }
}

var XML3DDataChannelInfo = function(type, origin, originalName, seqLength, seqMinKey, seqMaxKey){
    this.type = getXML3DDataType(type);
    this.origin = origin;
    this.originalName = originalName;
    this.seqLength = seqLength;
    this.seqMinKey = seqMinKey;
    this.seqMaxKey = seqMaxKey;
};

XML3DDataChannelInfo.ORIGIN_CHILD = 1;
XML3DDataChannelInfo.ORIGIN_COMPUTE = 2;
XML3DDataChannelInfo.ORIGIN_PROTO = 3;

module.exports = {
    XML3DDataChannelInfo: XML3DDataChannelInfo,
    XML3DDataResult: XML3DDataResult,
    XML3DDataObserver: XML3DDataObserver
};
