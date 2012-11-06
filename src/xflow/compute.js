(function(){

/**
 * @constructor
 * @param {Xflow.DataNode} owner Owner of the channel - always a DataNode
 * @param {Xflow.DataEntry=} dataEntry Optional DataEntry added to the channel
 * @param {number=} key Optional key of the added DataEntry
 */
var Channel = function(owner, dataEntry, key){
    this.entries = [];
    this.owner = owner;

    if(dataEntry){
        this.addDataEntry(dataEntry, key);
    }
}
Xflow.Channel = Channel;

Channel.prototype.addDataEntry = function(dataEntry, key){
    var insertObj = {
        key: key,
        value: dataEntry
    }
    for(var i = 0; i < this.entries.length; ++i){
        var entry = this.entries[i];
        if(entry.key >= key - Xflow.EPSILON ){
            if(Math.abs(entry.key - key) <= Xflow.EPSILON){
                this.entries.splice(i, 1, insertObj);
            }
            else{
                this.entries.splice(i, 0, insertObj);
            }
            break;
        }
    }
    this.entries.push(insertObj);
};

Channel.prototype.getDataEntry = function(sequenceAccessType, sequenceKey){
    if(this.entries.length == 0)
        return null;
    if(!sequenceAccessType)
        return this.entries[0].value;

    var i = 0, max = this.entries.length;
    while(i < max && this.entries[i].key < sequenceKey) ++i;
    if(sequenceAccessType == Xflow.SEQUENCE.PREV_BUFFER){
        return this.entries[i ? i -1 : 0].value;
    }
    else if(sequenceAccessType == Xflow.SEQUENCE.NEXT_BUFFER){
        return this.entries[i < max ? i : max - 1].value;
    }
    else if(sequenceAccessType == Xflow.SEQUENCE.LINEAR_WEIGHT){
        var weight1 = this.entries[i ? i - 1 : 0].key;
        var weight2 = this.entries[i < max ? i : max - 1].key;
        var value = new Float32Array(1);
        value[0] = weight2 == weight1 ? 0 : (sequenceKey - weight1) / (weight2 - weight1);
        // TODO: Check if repeated BufferEntry and Float32Array allocation is a serious bottleneck
        return new Xflow.BufferEntry(Xflow.DATA_TYPE.FLOAT, value);
    }
    return null;
};


var DataNode = Xflow.DataNode;


function getForwardNode(dataNode){
    if(!dataNode._filterMapping.isEmpty()  || dataNode._computeOperator)
        return null;
    if(dataNode._sourceNode && dataNode._children.length == 0)
        return dataNode._sourceNode;
    if(dataNode._children.length == 1 && dataNode._children[0] instanceof DataNode)
        return dataNode._children[0];
    return null;
}

DataNode.prototype._initCompute = function(){
    this._results = [];
    this._dataMap = {};
}

DataNode.prototype._updateComputeCache = function(state){
    this._dataMap = {};

    for(var i in this._results){
        this._results[i].notifyChanged(state);
    }

    if(state == Xflow.RESULT_STATE.CHANGED_STRUCTURE){
        this._operatorData = null;
    }
}

DataNode.prototype._getComputeResult = function(filter){
    var forwardNode = getForwardNode(this);
    if(forwardNode){
        this._state = Xflow.RESULT_STATE.NONE;
        return forwardNode._getComputeResult(filter);
    }

    var key = filter ? filter.join(";") : "[null]";
    if(!this._results[key])
        this._results[key] = new Xflow.ComputeResult();

    if(!this._results[key].valid)
        this._createComputeResult(filter, this._results[key]);

    return this._results[key];
}

DataNode.prototype._createComputeResult = function(filter, result){
    result._outputNames = [];
    result._dataEntries = {};
    var loading = this._populateDataMap();

    for(var i in this._dataMap){
        if(!filter || filter.indexOf(i) != -1){
            result._outputNames.push(i);
            result._dataEntries[i] = this._dataMap[i].getDataEntry();
        }
    }
    result.loading = loading;
    result.valid = true;
}
DataNode.prototype._populateDataMap = function(){
    if(this._state == Xflow.RESULT_STATE.NONE) return;
    this._state = Xflow.RESULT_STATE.NONE;

    if(this.loading)
        return true;

    // Prepare input:
    var inputMap = {};
    if(this._sourceNode){
        if(transferDataMap(inputMap, this._sourceNode))
            return true;
    }
    else{
        for(var i in this._children){
            if(this._children[i] instanceof Xflow.DataNode){
                if(transferDataMap(inputMap, this._children[i]))
                    return true;
            }
        }
        for(var i in this._children)
        {
            if(this._children[i] instanceof Xflow.InputNode){
                var inputNode = this._children[i];
                var channel = inputMap[inputNode._name];
                if(!channel || channel.owner != this){
                    channel = new Channel(this);
                }
                channel.addDataEntry(inputNode._data, inputNode._seqnr);
                inputMap[inputNode._name] = channel;
            }
        }
    }
    this._applyOperator(inputMap);

    this._filterMapping.applyFilterOnMap(this._dataMap, inputMap, this._filterType);

    return false;
}

function transferDataMap(destMap, node){
    var loading = node._populateDataMap();
    if(loading)
        return true;

    for(var i in node._dataMap){
        destMap[i] = node._dataMap[i];
    }
    return false;
}

})();

