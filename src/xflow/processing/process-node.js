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
    this.useCount = 0;

    this.children = [];
    this.descendants = [];
    this.channelListener = this.onChannelChange.bind(this);
    constructProcessNode(this, channelNode, operator, substitution);
};
var ProcessNode = Xflow.ProcessNode;

ProcessNode.prototype.onChannelChange = function(channel){
    this.processed = false;
    for(var i = 0; i < this.outputDataSlots.length; ++i){
        this.outputDataSlots[i].notifyOnChange();
    }
}

ProcessNode.prototype.clear = function(){
    for(var name in this.inputChannels){
        this.inputChannels[name].removeListener(this.channelListener);
    }
}

ProcessNode.prototype.process = function(){
    if(!this.processed){
        for(var i = 0; i < this.children.length; ++i){
            this.children[i].process();
        }
        // TODO: Do some actual processing
        this.processed = true;
    }
}

function constructProcessNode(processNode, channelNode, operator, substitution){
    var dataNode = channelNode.owner;
    synchronizeInputChannels(processNode, channelNode, dataNode, substitution);
    if(!checkInput(operator, dataNode._computeInputMapping, processNode.inputChannels)){
        processNode.valid = false;
    }
    synchronizeChildren(processNode.children, processNode.descendants, processNode.inputChannels);
    synchronizeOutput(processNode.operator, processNode.outputDataSlots);
}

function synchronizeInputChannels(processNode, channelNode, dataNode, substitution){
    var operator = processNode.operator, inputMapping = dataNode._computeInputMapping;
    for(var i = 0; i < operator.params.length; ++i){
        var dataName = inputMapping.getScriptInputName(i, operator.params[i].source);
        if(dataName){
            var channel = channelNode.inputChannels.getChannel(dataName, substitution);
            if(channel) channel.addListener(this.channelListener);
            processNode.inputChannels[dataName] = channel;
        }
    }
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
            var channel = inputChannels[dataName];
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
        if(channel.creatorProcessNode){
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
    doRequestNodeProcessing(this);
    if(resultType == Xflow.RESULT_TYPE.COMPUTE){
        return getRequestComputeResult(this);
    }
    return null;
}

RequestNode.prototype.setStructureOutOfSync = function(){
    this.outOfSync = true;
    this.processed = false;
    for(var type in this.results){
        this.results[type].notifyChanged(Xflow.RESULT_STATE.CHANGED_STRUCTURE);
    }
    for(var name in this.channels){
        this.channels[name].removeListener(this.channelListener);
    }
    this.channels = [];
}

RequestNode.prototype.onChannelChange = function(channel){
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
        for(var i = 0; i < requestNode.children.length; ++i){
            requestNode.children[i].process();
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
        result._dataEntries[name] = requestNode.channels[name].getDataEntry();
        result._outputNames.push(name);
    }
    return result;
}


})();

