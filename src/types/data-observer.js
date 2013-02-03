// box.js
(function($) {
    // Is native?
    if($) return;

    var c_XflowObserverList = [];

    var XML3DDataObserver = function(callback){
        this.callback = callback;
        this.observed = [];
    }
    window.XML3DDataObserver = XML3DDataObserver;

    XML3DDataObserver.prototype.observe = function(node, options){
        if(this.observed.length == 0)
            c_XflowObserverList.push(this);
        var dataAdapter = XML3D.data.factory.getAdapter(node);
        if(dataAdapter){

            var entry = {
                node: node,
                changed: false,
                request: null
            };

            var names = options['names'];
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
        }

    }

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
    }


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
    }

    var XML3DDataRecord = function(target, result){
        this.target = target;
        this.result = result;
    }
    window.XML3DDataRecord = XML3DDataRecord;


    var XML3DDataResult = function(result){
        this._entries = {};
        constructDataResult(this, result);
    }
    window.XML3DDataResult = XML3DDataResult;

    XML3DDataResult.prototype.getValue = function(name) {
        if (this._entries[name])
            return this._entries[name].value;
        return null;
    }

    XML3DDataResult.prototype.getType = function(name) {
        if (this._entries[name])
            return this._entries[name].type;
        return null;
    }

    XML3DDataResult.prototype.getNames = function(){
        var result = [];
        for(var name in this._entries){
            result.push(name);
        }
        return result;
    }


    function constructDataResult(dataResult, result){
        for(var i = 0; i < result.outputNames.length; ++i){
            var name = result.outputNames[i];
            var entry = result.getOutputData(name);
            var value = entry && entry.getValue();
            if (value !== null) {
                var type = getXML3DDataType(entry.type);
                dataResult._entries[name] = new XML3DDataEntry(type, value);
            }
        }
    }

    function getXML3DDataType(type){
        switch(type){
            case Xflow.DATA_TYPE.FLOAT : return XML3DDataEntry.FLOAT;
            case Xflow.DATA_TYPE.FLOAT2 : return XML3DDataEntry.FLOAT2;
            case Xflow.DATA_TYPE.FLOAT3 : return XML3DDataEntry.FLOAT3;
            case Xflow.DATA_TYPE.FLOAT4 : return XML3DDataEntry.FLOAT4;
            case Xflow.DATA_TYPE.FLOAT4X4 : return XML3DDataEntry.FLOAT4X4;
            case Xflow.DATA_TYPE.INT : return XML3DDataEntry.INT;
            case Xflow.DATA_TYPE.INT4 : return XML3DDataEntry.INT4;
            case Xflow.DATA_TYPE.BOOL : return XML3DDataEntry.BOOL;
            case Xflow.DATA_TYPE.TEXTURE : return XML3DDataEntry.TEXTURE;
            case Xflow.DATA_TYPE.BYTE : return XML3DDataEntry.BYTE;
            case Xflow.DATA_TYPE.UBYTE : return XML3DDataEntry.UBYTE;
            default: throw new Error("WHAT IS THIS I DON'T EVEN...");
        }
    }

    var XML3DDataEntry = function(type, value){
        this.type = type;
        this.value = value;
    }
    window.XML3DDataEntry = XML3DDataEntry;

    XML3DDataEntry.FLOAT  = 0;
    XML3DDataEntry.FLOAT2 = 1;
    XML3DDataEntry.FLOAT3 = 2;
    XML3DDataEntry.FLOAT4 = 3;
    XML3DDataEntry.FLOAT4X4 = 4;
    XML3DDataEntry.INT = 10;
    XML3DDataEntry.INT4 = 11;
    XML3DDataEntry.BOOL = 20;
    XML3DDataEntry.TEXTURE = 30;
    XML3DDataEntry.BYTE = 40;
    XML3DDataEntry.UBYTE = 50;

    var XML3DDataChannelInfo = function(type, origin, originalName, seqLength, seqMinKey, seqMaxKey){
        this.type = getXML3DDataType(type);
        this.origin = origin;
        this.originalName = originalName;
        this.seqLength = seqLength;
        this.seqMinKey = seqMinKey;
        this.seqMaxKey = seqMaxKey;
    }
    window.XML3DDataChannelInfo = XML3DDataChannelInfo;

    XML3DDataChannelInfo.ORIGIN_CHILD = 1;
    XML3DDataChannelInfo.ORIGIN_COMPUTE = 2;
    XML3DDataChannelInfo.ORIGIN_PROTO = 3;



}(XML3D._native));
