(function(){


//----------------------------------------------------------------------------------------------------------------------
// Xflow.ProcessNode
//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @extends {Xflow.GraphNode}
 */
Xflow.ProcessNode = function(channelNode, operator, substitution){
    this.owner = channelNode;
    this.operator = operator;
    this.inputChannels = {};
    this.outputDataSlots = {};
    this.processed = false;
    this.valid = false;
    this.loading = false;
    this.useCount = 0;

    this.children = [];
    this.descendants = [];
    this.channelListener = this.onChannelChange.bind(this);
    constructProcessNode(this, channelNode, operator, substitution);
};
var ProcessNode = Xflow.ProcessNode;

ProcessNode.prototype.onChannelChange = function(channel){
    this.processed = false;
    for(var name in this.outputDataSlots){
        this.outputDataSlots[name].notifyOnChange();
    }
}

ProcessNode.prototype.clear = function(){
    for(var name in this.inputChannels){
        this.inputChannels[name].removeListener(this.channelListener);
    }
}
/**
 *
 */
ProcessNode.prototype.process = function(){
    if(!this.processed){
        this.loading = false;
        this.valid = true;
        for(var i = 0; i < this.children.length; ++i){
            this.children[i].process();
            if(this.children[i].loading){
                this.loading = true;
                return;
            }
        }
        this.processed = true;
        if(isInputLoading(this.operator, this.inputChannels)){
            this.loading = true;
            return;
        }
        if(!checkInput(this.operator, this.owner.owner._computeInputMapping, this.inputChannels)){
            this.valid = false;
            return;
        }
        this.applyOperator();
    }

}

function constructProcessNode(processNode, channelNode, operator, substitution){
    var dataNode = channelNode.owner;
    synchronizeInputChannels(processNode, channelNode, dataNode, substitution);
    synchronizeChildren(processNode.children, processNode.descendants, processNode.inputChannels);
    synchronizeOutput(processNode.operator, processNode.outputDataSlots);
}

function synchronizeInputChannels(processNode, channelNode, dataNode, substitution){
    var operator = processNode.operator, inputMapping = dataNode._computeInputMapping;
    for(var i = 0; i < operator.params.length; ++i){
        var sourceName = operator.params[i].source;
        var dataName = inputMapping.getScriptInputName(i, sourceName);
        if(dataName){
            var channel = channelNode.inputChannels.getChannel(dataName, substitution);
            if(channel) channel.addListener(processNode.channelListener);
            processNode.inputChannels[sourceName] = channel;
        }
    }
}

function isInputLoading(operator, inputChannels){
    for(var i in operator.params){
        var entry = operator.params[i];
        var channel = inputChannels[entry.source];
        if(!channel) continue;
        var dataEntry = channel.getDataEntry();
        if(!dataEntry) continue;
        if(dataEntry.isLoading && dataEntry.isLoading()) return true;
    }
    return false;
}

function checkInput(operator, inputMapping, inputChannels){
    for(var i in operator.params){
        var entry = operator.params[i];
        var dataName = inputMapping.getScriptInputName(i, entry.source);
        if(!entry.optional && !dataName){
            XML3D.debug.logError("Xflow: operator " + operator.name + ": Missing input argument for "
                + entry.source);
            return false;
        }
        if(dataName){
            var channel = inputChannels[entry.source];
            if(!channel){
                XML3D.debug.logError("Xflow: operator " + operator.name + ": Input of name '" + dataName +
                    "' not found. Used for parameter " + entry.source);
                return false;
            }
            var dataEntry = channel.getDataEntry();
            if(!entry.optional && (!dataEntry || dataEntry.getLength() == 0)){
                XML3D.debug.logError("Xflow: operator " + operator.name + ": Input for " + entry.source +
                    ' contains no data.');
                return false;
            }
            if(dataEntry && dataEntry.type != entry.type){
                XML3D.debug.logError("Xflow: operator " + operator.name + ": Input for " + entry.source +
                    " has wrong type. Expected: " + Xflow.getTypeName(entry.type)
                    + ", but got: " +  Xflow.getTypeName(dataEntry.type) );
                return false;
            }
        }
    }
    return true;
}

function synchronizeChildren(children, descendants, inputChannels){
    var channel, idx;
    for(var name in inputChannels){
        channel = inputChannels[name];
        if(channel && channel.creatorProcessNode){
            Xflow.utils.setAdd(children, channel.creatorProcessNode);
            Xflow.utils.setAdd(descendants, channel.creatorProcessNode.descendants);
        }
    }
    Xflow.utils.setRemove(children, descendants);
    Xflow.utils.setAdd(descendants, children);
}

function synchronizeOutput(operator, outputs){
    for(var i in operator.outputs){
        var d = operator.outputs[i];

        var entry;
        var type = d.type;
        if(type != Xflow.DATA_TYPE.TEXTURE){
            entry = new Xflow.BufferEntry(type, null);
        }
        else{
            entry = new Xflow.TextureEntry(null);
        }
        outputs[d.name] = new Xflow.DataSlot(entry, 0);
    }
}

//----------------------------------------------------------------------------------------------------------------------
// Xflow.RequestNode
//----------------------------------------------------------------------------------------------------------------------
/**
 * @constructor
 * @param channelNode
 * @param filter
 */
Xflow.RequestNode = function(channelNode, filter){
    this.owner = channelNode;
    this.filter = filter;
    this.results = {};

    this.channels = {};
    this.children = [];

    this.channelListener = this.onChannelChange.bind(this);

    this.outOfSync = true;
    this.processed = false;
}
var RequestNode = Xflow.RequestNode;

RequestNode.prototype.synchronize = function(){
    if(this.outOfSync){
        this.outOfSync = false;
        synchronizeRequestChannels(this, this.owner);
        synchronizeChildren(this.children, [], this.channels);
    }
}

RequestNode.prototype.getResult = function(resultType){
    this.synchronize();
    this.loading = this.owner.loading;
    if(!this.loading)
        doRequestNodeProcessing(this);
    var result = null;
    if(resultType == Xflow.RESULT_TYPE.COMPUTE){
        result = getRequestComputeResult(this);
    }
    result.loading = this.loading;
    return result;
}

RequestNode.prototype.setStructureOutOfSync = function(){
    this.outOfSync = true;
    this.processed = false;
    this.loading = false;
    for(var type in this.results){
        this.results[type].notifyChanged(Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    }
    for(var name in this.channels){
        this.channels[name].removeListener(this.channelListener);
    }
    this.channels = [];
    this.children = [];
}

RequestNode.prototype.onChannelChange = function(channel){
    this.processed = false;
    for(var type in this.results){
        this.results[type].notifyChanged(Xflow.RESULT_STATE.CHANGED_DATA);
    }
}

function synchronizeRequestChannels(requestNode, channelNode){
    var names = requestNode.filter;
    if(!names){
        names = [];
        for(var name in channelNode.finalOutputChannels.map){
            names.push(name);
        }
    }

    for(var i = 0; i < names.length; ++i){
        var name = names[i];
        var channel = channelNode.finalOutputChannels.getChannel(name);
        if(channel){
            requestNode.channels[name] = channel;
            channel.addListener(requestNode.channelListener);
        }

    }
}

function doRequestNodeProcessing(requestNode){
    if(!requestNode.processed){
        requestNode.loading = false;
        requestNode.processed = true;
        for(var i = 0; i < requestNode.children.length; ++i){
            requestNode.children[i].process();
            if(requestNode.children[i].loading){
                requestNode.loading = true;
                return;
            }
        }
    }
}

function getRequestComputeResult(requestNode)
{
    if(!requestNode.results[Xflow.RESULT_TYPE.COMPUTE])
        requestNode.results[Xflow.RESULT_TYPE.COMPUTE] = new Xflow.ComputeResult();
    var result = requestNode.results[Xflow.RESULT_TYPE.COMPUTE];
    result._dataEntries = {}; result._outputNames = [];
    for(var name in requestNode.channels){
        var entry = requestNode.channels[name].getDataEntry();
        result._dataEntries[name] = entry && !entry.isEmpty() ? entry : null;
        result._outputNames.push(name);
    }
    return result;
}


})();

