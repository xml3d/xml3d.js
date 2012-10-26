(function(){


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

Channel.prototype.getDataEntry = function(key){
    if(this.entries.length == 0)
        return null;
    if(key == undefined)
        return this.entries[0].value;

    for(var i = 0; i < this.entries.length; ++i){
        var entry = this.entries[i];
        if(Math.abs(entry.key - key) <= Xflow.EPSILON){
            return entry.value;
        }
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
    this._results = [];
    this._dataMap = {};
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
    if(this._results[key])
        return this._results[key];
    var result =  this._createComputeResult(filter)
    this._results[key] = result;
    return result;
}

DataNode.prototype._createComputeResult = function(filter){
    var result = new Xflow.ComputeResult();

    this._populateDataMap();

    for(var i in this._dataMap){
        if(!filter || filter.indexOf(i) != -1){
            result._outputNames.push(i);
            result._dataEntries[i] = this._dataMap[i].getDataEntry();
        }
    }
    return result;
}
DataNode.prototype._populateDataMap = function(){
    if(this._state == Xflow.RESULT_STATE.NONE) return;
    this._state = Xflow.RESULT_STATE.NONE;

    // Prepare input:
    var inputMap = {};
    if(this._sourceNode){
        transferDataMap(inputMap, this._sourceNode);
    }
    else{
        for(var i in this._children){
            if(this._children[i] instanceof Xflow.DataNode){
                transferDataMap(inputMap, this._children[i]);
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
}

function transferDataMap(destMap, node){
    node._populateDataMap();
    for(var i in node._dataMap){
        destMap[i] = node._dataMap[i];
    }
}

})();

