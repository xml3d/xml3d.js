var Base = require("../base.js");

var Xflow = Base.Xflow;

//----------------------------------------------------------------------------------------------------------------------
// ChannelNode
//----------------------------------------------------------------------------------------------------------------------

/**
 * Is created for each substitution (via dataflow) of a DataNode.
 * Stores an optimized representation of the data with ChannelMaps and Channels
 * On construction a ChannelNode is marked outOfSync and synchronized only once data is requested.
 * When the structure of a DataNode is changed in any way (e.g. rename InputNode, add/remove children) a channelNode
 * is marked outOfSync.
 * @constructor
 */
var ChannelNode = function(dataNode, substitution){
    this.owner = dataNode;
    this.platform = Xflow.PLATFORM.JAVASCRIPT;
    this.substitution = substitution;   // Substitution is defined by the dataflow instance
    this.loading = false;   // is true if any value in the sub tree is loading and the result can't be calculated
    this.inputSlots = {};   // DataEntries from direct InputNode children of the DataNode
    this.inputChannels = new ChannelMap();    // channel map for input data prio to operator execution
    this.computedChannels = new ChannelMap(); // channel map extend by operator output
    this.outputChannels = new ChannelMap();   // channel map with applied filter => final output

    /**
     * Operator attached to DataNode (guaranteed to be resolved)
     * @type {Object}
     */
    this.operator = null;
    /**
     * Channel node of the dataflowNode (analogue to dataflowNode of DataNode)
     * @type {ChannelNode}
     */
    this.dataflowChannelNode = null;
    /**
     * Process node - only constructed if an operator/dataflow is defined
     * @type {ProcessNode}
     */
    this.processNode = null;
    /**
     * Request Nodes created for each result request on this dataNode.
     * @type {Object.<String,RequestNode>}
     */
    this.requestNodes = {};
    /**
     * Number of uses of channel node. This is only relevant for channel nodes created with substitution.
     * These nodes are cached and the useCount is used to clean this cache.
     * TODO: Use weakmap here to avoid explicit reference count
     * @type {number}
     */
    this.useCount = 1;
    /**
     * True if the channel node is out of sync and internal channel maps need to be reconstructed
     * @type {boolean}
     */
    this.outOfSync = true; // true if ChannelNode is not synchronized for no substitution
};


ChannelNode.prototype.synchronize = function(){

    if(this.outOfSync){
        updatePlatform(this);
        synchronizeChildren(this);
        updateInputChannels(this);
        updateComputedChannels(this);
        updateOutputChannels(this);
        this.outOfSync = false;
    }
}

ChannelNode.prototype.clear = function(){
    this.useCount = 0;
     this.inputChannels.clear();
     this.outputChannels.clear();
     // TODO: Make sure everything is cleaned up there!
    return true;
}

ChannelNode.prototype.increaseRef = function(){
    this.useCount++;
}

ChannelNode.prototype.decreaseRef = function(){
    this.useCount--;
    if(this.useCount == 0){
        this.clear();
    }
    return false;
}

ChannelNode.prototype.getOutputNames = function(){
    this.synchronize();
    return this.outputChannels.getNames();
}

ChannelNode.prototype.getChildDataIndex = function(filter){
    this.synchronize();
    return this.outputChannels.getChildDataIndexForFilter(filter);
}

ChannelNode.prototype.setStructureOutOfSync = function()
{
    if(!this.outOfSync){
        this.outOfSync = true;
        this.inputChannels.clear();
        this.computedChannels.clear();
        this.outputChannels.clear();
        this.processNode && this.processNode.clear();
        for(var key in this.requestNodes){
            this.requestNodes[key].setStructureOutOfSync();
        }
    }
}

ChannelNode.prototype.notifyDataChange = function(inputNode, changeType){
    var key = inputNode._name + ";" + inputNode._key;
    if(this.inputSlots[key])
        this.inputSlots[key].setDataEntry(inputNode._data, changeType);
}

ChannelNode.prototype.getResult = function(type, filter)
{
    this.synchronize();

    var key = filter ? filter.join(";") : "[null]";
    if(!this.requestNodes[key]){
        this.requestNodes[key] = new Xflow.RequestNode(this, filter);
    }
    return this.requestNodes[key].getResult(type);
}


ChannelNode.prototype.getOutputChannelInfo = function(name){
    this.synchronize();

    var channel = this.outputChannels.getChannel(name);
    if(!channel)
        return null;
    var result = {
        type: channel.getType(),
        seqLength: channel.getSequenceLength(),
        seqMinKey: channel.getSequenceMinKey(),
        seqMaxKey: channel.getSequenceMaxKey(),
        origin: 0,
        originalName: ""
    }
    var preFilterName = this.owner._filterMapping ? this.owner._filterMapping.getRenameSrcName(name) : name;
    var dataEntry = channel.getDataEntry();
    if(this.dataflowChannelNode){
        var protoInputChannel = this.inputChannels.getChannel(preFilterName);
        if(!protoInputChannel || dataEntry != protoInputChannel.getDataEntry()){
            result.origin = Xflow.ORIGIN.PROTO;
            result.originalName = preFilterName;
            return result;
        }
    }
    if(this.operator){
        var inputChannel = this.inputChannels.getChannel(preFilterName);
        if(!inputChannel || dataEntry != inputChannel.getDataEntry()){
            result.origin = Xflow.ORIGIN.COMPUTE;
            result.originalName = this.owner._computeOutputMapping.getScriptOutputNameInv(preFilterName, this.operator.outputs);
            return result;
        }
    }
    result.origin = Xflow.ORIGIN.CHILD;
    result.originalName = preFilterName;
    return result;
}


function updatePlatform(channelNode) {
    var platform;
    var owner = channelNode.owner;
    var graph = owner._graph;

    // Platforms other than JavaScript are available only for computing operators
    if(!channelNode.owner._computeOperator) {
        return;
    }

    //TODO: Improve platform selection logic.
    // Currently we use forced platform if graph platform is something other than JavaScript
    // and forced platform (owner._platform) is defined

    platform = owner._platform !== null && graph.platform !== Xflow.PLATFORM.JAVASCRIPT ? owner._platform : graph.platform;

    channelNode.platform = platform;
}


function synchronizeChildren(channelNode){


    var dataNode = channelNode.owner;
    channelNode.loading = dataNode.isSubtreeLoading();

    if(channelNode.substitution)
        dataNode._channelNode.synchronize();

    if(dataNode._sourceNode){
        dataNode._sourceNode._getChannelNode(channelNode.substitution).synchronize();
    }
    else{
        for(var i = 0; i < dataNode._children.length; ++i){
            if(dataNode._children[i]._getChannelNode){
                dataNode._children[i]._getChannelNode(channelNode.substitution).synchronize();
            }
        }
    }
}

function updateInputChannels(channelNode){
    var owner = channelNode.owner;
    if(owner._sourceNode){
        channelNode.inputChannels.merge(owner._sourceNode._getChannelNode(channelNode.substitution).outputChannels, 0);
    }
    else{
        var children = owner._children;
        for(var i = 0; i < children.length; ++i){
            if(children[i]._getChannelNode){
                channelNode.inputChannels.merge(children[i]._getChannelNode(channelNode.substitution).outputChannels, i);
            }
        }
        for(var i = 0; i < children.length; ++i){
            if(!children[i]._getChannelNode){
                var child = children[i];
                var key = child._name + ";" + child._key;
                if(!channelNode.substitution){
                    var slot = new Xflow.DataSlot(child._data, child._key);
                    channelNode.inputSlots[key] = slot;
                    channelNode.inputChannels.addDataEntry(child._name, slot);
                }
                else{
                    if(child._paramName && channelNode.substitution.hasChannel(child._paramName)){
                        channelNode.inputChannels.addChannel(child._name,
                            channelNode.substitution.getChannel(child._paramName));
                    }
                    else{
                        channelNode.inputChannels.addDataEntry(child._name, owner._channelNode.inputSlots[key]);
                    }
                }
            }
        }
    }
}

function updateComputedChannels(channelNode){
    var owner = channelNode.owner;
    channelNode.computedChannels.merge(channelNode.inputChannels);

    var oldDataflowChannelNode = channelNode.dataflowChannelNode;

    if( owner._computeUsesDataflow && owner._dataflowNode){
        channelNode.operator = null;
        updateDataflowChannelNode(channelNode);
        updateComputedChannelsFromDataflow(channelNode);
    }
    else if(!owner._computeUsesDataflow && owner._computeOperator){
        channelNode.dataflowChannelNode = null;
        updateOperator(channelNode);
        updateComputedChannelsFromOperator(channelNode);
    }

    if(oldDataflowChannelNode && oldDataflowChannelNode != channelNode.dataflowChannelNode){
        oldDataflowChannelNode.owner._removeSubstitutionNode(oldDataflowChannelNode);
    }
}

function updateOperator(channelNode){
    var operatorName, operator;
    var owner = channelNode.owner;

    if(channelNode.loading){
        channelNode.operator = null;
        return;
    }
    if(typeof owner._computeOperator == "string"){
        operatorName = owner._computeOperator;
        operator = null;

        // Getting a correct operator for the selected platform. If operator is not available, we'll try to get
        // the default JavaScript platform operator
        if(operatorName){
            operator = findOperatorByName(channelNode, owner);
            if(operator){
                channelNode.platform = operator.platform;
            }
        }
        channelNode.operator = operator;
    }else{
        channelNode.operator = owner._computeOperator;
    }
}

var c_typeComparisons = [];

function findOperatorByName(channelNode, dataNode){
    var operatorName = dataNode._computeOperator,
        inputMapping = dataNode._computeInputMapping,
        inputChannels = channelNode.inputChannels;

    var operators = Xflow.getOperators(operatorName, channelNode.platform) ||
                Xflow.getOperators(operatorName, Xflow.PLATFORM.JAVASCRIPT);
    if(!operators){
        Xflow.notifyError("No operator with name '" + operatorName+"' found", channelNode.owner);
    }

    var i = operators.length;
    while(i--){
        if(checkOperator(operators[i], inputMapping, inputChannels)){
            return operators[i];
        }
    }
    c_typeComparisons.length = 0;
    var i = operators.length;
    while(i--){
        checkOperator(operators[i], inputMapping, inputChannels, c_typeComparisons);
    }
    var errorMessage = "No operator '" + operatorName+"' with matching type signature found:\n\n"
                        + c_typeComparisons.join("\n");
    Xflow.notifyError(errorMessage, channelNode.owner);
    return null;
}
function checkOperator(operator, inputMapping, inputChannels, typeComparisons){
    var inputs, errors;
    if(typeComparisons){
        inputs = [], errors = [];
    }
    for(var i = 0; i < operator.params.length; ++i){
        var inputEntry = operator.params[i], sourceName = inputEntry.source;
        var dataName = inputMapping ? inputMapping.getScriptInputName(i, sourceName) : sourceName;
        var errorHeader;
        if(typeComparisons){
            errorHeader = "For " + (i+1) + ". argument '" + sourceName + "': ";
            inputs.push( Xflow.getTypeName(inputEntry.type) + " " + sourceName + (inputEntry.optional ? " [optional]" : ""));
        }
        if(dataName){
            var channel = inputChannels.getChannel(dataName);
            if(!channel && !inputEntry.optional){
                if(!typeComparisons)
                    return false;
                else{
                    errors.push(errorHeader + "DataEntry '" + dataName + "' does not exist");
                }
            }
            if(channel && channel.getType() != inputEntry.type){
                if(!typeComparisons)
                    return false;
                else{
                    errors.push(errorHeader + "DataEntry '" + dataName + "' has wrong type '" + Xflow.getTypeName(channel.getType()) + "'");
                }
            }
        }
    }
    if(typeComparisons){
        typeComparisons.push(operator.name + "(" + inputs.join(", ") + ")\n\t * " + errors.join("\n\t * "));
    }
    return true;
}


function updateComputedChannelsFromOperator(channelNode){
    var owner = channelNode.owner;
    if(channelNode.operator){
        var procNode = channelNode.processNode = new Xflow.ProcessNode(channelNode);
        var index = 0;
        for(var name in procNode.outputDataSlots){
            var destName = name;
            if(owner._computeOutputMapping) destName = owner._computeOutputMapping.getScriptOutputName(index, name);
            if(destName){
                channelNode.computedChannels.addOutputDataSlot(destName, procNode.outputDataSlots[name], procNode);
            }
            index++;
        }
    }
}

function updateDataflowChannelNode(channelNode){
    var owner = channelNode.owner;
    var subSubstitution = new Xflow.Substitution(owner._dataflowNode, channelNode);
    channelNode.dataflowChannelNode = owner._dataflowNode._getChannelNode(subSubstitution);
}

function updateComputedChannelsFromDataflow(channelNode){
    var owner = channelNode.owner;
    if(channelNode.dataflowChannelNode){
        var dataflowCNode = channelNode.dataflowChannelNode;
        dataflowCNode.synchronize();
        // TODO: We have to make sure to get outputNames in the right order to apply output mapping correctly
        var outputNames = dataflowCNode.outputChannels.getNames();
        for(var i = 0; i < outputNames.length; ++i){
            var srcName = outputNames[i], destName = srcName;
            if(owner._computeOutputMapping)
                destName = owner._computeOutputMapping.getScriptOutputName(i, srcName);
            if(destName)
                channelNode.computedChannels.addChannel(destName, dataflowCNode.outputChannels.getChannel(srcName));
        }
    }
}

function updateOutputChannels(channelNode){
    var dataNode = channelNode.owner;
    if(dataNode._filterMapping)
        dataNode._filterMapping.applyFilterOnChannelMap(channelNode.outputChannels, channelNode.computedChannels,
            dataNode._filterType, setChannelFilterCallback);
    else
        channelNode.outputChannels.merge(channelNode.computedChannels);
}

function setChannelFilterCallback(destMap, destName, srcMap, srcName){
    var channel = srcMap.getChannel(srcName);
    destMap.addChannel(destName, channel, srcMap.getChildDataIndex(srcName));
}

//----------------------------------------------------------------------------------------------------------------------
// Xflow.Substitution
//----------------------------------------------------------------------------------------------------------------------

var Substitution = function(dataflowNode, userChannelNode){
    this.map = {};

    createSubstitution(this, dataflowNode, userChannelNode);
}

Substitution.prototype.hasChannel = function(name){
    return !!this.map[name];
}
Substitution.prototype.getChannel = function(name){
    return this.map[name];
}
Substitution.prototype.getKey = function(subDataflowNode){
    var key = "";
    var globalParamNames = subDataflowNode._getGlobalParamNames();
    for(var i = 0; i < globalParamNames.length; ++i){
        var channel = this.map[globalParamNames[i]];
        key+= (channel && channel.id || "-") + "!";
    }
    var paramNames = subDataflowNode._getParamNames();
    for(var i = 0; i < paramNames.length; ++i){
        var channel = this.map[paramNames[i]];
        key+= (channel && channel.id || "-") + ".";
    }
    return key;
}

function createSubstitution(substitution, dataflowNode, userChannelNode){
    var userOwner = userChannelNode.owner;
    var globalParamNames = dataflowNode._getGlobalParamNames();
    for(var i = 0; i < globalParamNames.length; ++i){
        substitution.map[globalParamNames[i]] = userChannelNode.inputChannels.getChannel(globalParamNames[i]);
    }
    var paramNames = dataflowNode._getParamNames();
    for(var i = 0; i < paramNames.length; ++i){
        var destName = paramNames[i], srcName = destName;
        if(userOwner._computeInputMapping){
            srcName = userOwner._computeInputMapping.getScriptInputName(i, destName);
        }
        substitution.map[destName] = userChannelNode.inputChannels.getChannel(srcName);
    }
}

module.exports = {
    ChannelNode:  ChannelNode,
    Substitution: Substitution
};