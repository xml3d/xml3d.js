var Base = require("../base.js");
var C = require("../interface/constants");
var Channels = require("./channel.js");
var RequestNode = require("./process-node.js").RequestNode;
var ProcessNode = require("./process-node.js").ProcessNode;
var DataSlot = require("./data-slot.js");
var Operator = require("../operator/operator");

var ChannelMap = Channels.ChannelMap;

//----------------------------------------------------------------------------------------------------------------------
// ChannelNode
//----------------------------------------------------------------------------------------------------------------------

/**
 * Is created for each substitution (via dataflow) of a DataNode.
 * Stores an optimized representation of the data with ChannelMaps and Channels
 * On construction a ChannelNode is marked outOfSync and synchronized only once data is requested.
 * When the structure of a DataNode is changed in any way (e.g. rename InputNode, add/remove children) a channelNode
 * is marked outOfSync.
 * @param {DataNode} dataNode
 * @param {Substitution} substitution
 * @constructor
 */
var ChannelNode = function(dataNode, substitution){
    this.owner = dataNode;
    this.platform = C.PLATFORM.JAVASCRIPT;
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
    this.outOfSync = true;
};

/**
 * If node is out of sync, reconstruct all channels
 */
ChannelNode.prototype.synchronize = function(){

    if(this.outOfSync){
        updatePlatform(this);
        synchronizeChildren(this);
        updateInputChannels(this);
        updateComputedChannels(this);
        updateOutputChannels(this);
        this.outOfSync = false;
    }
};

ChannelNode.prototype.clear = function(){
    this.useCount = 0;
     this.inputChannels.clear();
     this.outputChannels.clear();
     // TODO: Make sure everything is cleaned up there!
    return true;
};

ChannelNode.prototype.increaseRef = function(){
    this.useCount++;
};

ChannelNode.prototype.decreaseRef = function(){
    this.useCount--;
    if(this.useCount == 0){
        this.clear();
    }
    return false;
};

ChannelNode.prototype.getOutputNames = function(){
    this.synchronize();
    return this.outputChannels.getNames();
};

ChannelNode.prototype.getChildDataIndex = function(filter){
    this.synchronize();
    return this.outputChannels.getChildDataIndexForFilter(filter);
};

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
};

ChannelNode.prototype.notifyDataChange = function(inputNode, changeType){
    var key = inputNode._name + ";" + inputNode._key;
    if(this.inputSlots[key])
        this.inputSlots[key].setDataEntry(inputNode._data, changeType);
};

ChannelNode.prototype.getResult = function(type, filter) {
    this.synchronize();

    var key = filter ? filter.join(";") : "[null]";
    if(!this.requestNodes[key]){
        this.requestNodes[key] = new RequestNode(this, filter);
    }
    return this.requestNodes[key].getResult(type);
};


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
    };
    var preFilterName = this.owner._filterMapping ? this.owner._filterMapping.getRenameSrcName(name) : name;
    var dataEntry = channel.getDataEntry();
    if(this.dataflowChannelNode){
        var protoInputChannel = this.inputChannels.getChannel(preFilterName);
        if(!protoInputChannel || dataEntry != protoInputChannel.getDataEntry()){
            result.origin = C.ORIGIN.PROTO;
            result.originalName = preFilterName;
            return result;
        }
    }
    if(this.operator){
        var inputChannel = this.inputChannels.getChannel(preFilterName);
        if(!inputChannel || dataEntry != inputChannel.getDataEntry()){
            result.origin = C.ORIGIN.COMPUTE;
            result.originalName = this.owner._computeOutputMapping.getScriptOutputNameInv(preFilterName, this.operator.outputs);
            return result;
        }
    }
    result.origin = C.ORIGIN.CHILD;
    result.originalName = preFilterName;
    return result;
};

/**
 * Select the platform to compute the attached platform
 * @param {ChannelNode} channelNode
 */
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

    platform = owner._platform !== null && graph.platform !== C.PLATFORM.JAVASCRIPT ? owner._platform : graph.platform;

    channelNode.platform = platform;
}

/**
 *
 * @param {ChannelNode} channelNode
 */
function synchronizeChildren(channelNode){
    var dataNode = channelNode.owner;
    channelNode.loading = dataNode.isSubtreeLoading();

    /**
     * If the channel node represents a substitution, we also need to
     * synchronize the main ChannelNode of the DataNode
     */
    if(channelNode.substitution) {
        dataNode._channelNode.synchronize();
    }

    // Now synchronize all children (either referenced data node, or real children)
    // TODO: Change here if we change behaviour of src attribute
    if(dataNode._sourceNode){
        dataNode._sourceNode._getOrCreateChannelNode(channelNode.substitution).synchronize();
    }
    else{
        for(var i = 0; i < dataNode._children.length; ++i){
            if(dataNode._children[i]._getOrCreateChannelNode){
                dataNode._children[i]._getOrCreateChannelNode(channelNode.substitution).synchronize();
            }
        }
    }
}

/**
 *
 * @param {ChannelNode} channelNode
 */
function updateInputChannels(channelNode){
    var owner = channelNode.owner;
    // TODO: Change here if we change behaviour of src attribute
    if(owner._sourceNode){
        channelNode.inputChannels.merge(owner._sourceNode._getOrCreateChannelNode(channelNode.substitution).outputChannels, 0);
    }
    else{
        var children = owner._children;
        // First the DataNodes than the input nodes in order to override the DataNode channels
        mergeInputChannelDataNodes(channelNode, children);
        mergeInputChannelInputNodes(channelNode, children);
    }
}

/**
 * @param {ChannelNode} channelNode
 * @param {Array.<GraphNode>} children
 */
function mergeInputChannelInputNodes(channelNode, children) {
    for (var i = 0; i < children.length; ++i) {
        if (!children[i]._getOrCreateChannelNode) {  // Child is an InputNode
            var child = children[i];
            var key = child._name + ";" + child._key;
            if (!channelNode.substitution) {  // No dataflow
                var slot = new DataSlot(child._data, child._key);
                channelNode.inputSlots[key] = slot;
                channelNode.inputChannels.addDataEntry(child._name, slot);
            } else {
                if (child._paramName && channelNode.substitution.hasChannel(child._paramName)) {
                    channelNode.inputChannels.addChannel(child._name, channelNode.substitution.getChannel(child._paramName));
                } else {
                    channelNode.inputChannels.addDataEntry(child._name, channelNode.owner._channelNode.inputSlots[key]);
                }
            }
        }
    }
}

/**
 * @param {ChannelNode} channelNode
 * @param {Array.<GraphNode>} children
 */
function mergeInputChannelDataNodes(channelNode, children) {
    for (var i = 0; i < children.length; ++i) {
        if (children[i]._getOrCreateChannelNode) {  // Child is a DataNode
            channelNode.inputChannels.merge(children[i]._getOrCreateChannelNode(channelNode.substitution).outputChannels, i);
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

/**
 * Find and set the operator for the given ChannelNode
 * @param channelNode
 */
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
            if(operator) { // TODO: Is this good? We calculated the platform before, now it just gets overriden
                channelNode.platform = operator.platform;
            }
        }
        channelNode.operator = operator;
    }else{
        channelNode.operator = owner._computeOperator;
    }
}

var c_typeComparisons = [];

/**
 * Find operator based on name in dataNode, platform and input mapping (signature)
 * @param {ChannelNode} channelNode
 * @param {DataNode} dataNode
 * @returns {Object|null}
 */
function findOperatorByName(channelNode, dataNode){
    var operatorName = dataNode._computeOperator,
        inputMapping = dataNode._computeInputMapping,
        inputChannels = channelNode.inputChannels;

    var operators = Operator.getOperators(operatorName, channelNode.platform) ||
                Operator.getOperators(operatorName, C.PLATFORM.JAVASCRIPT);
    if(!operators){
        Base.notifyError("No operator with name '" + operatorName+"' found", channelNode.owner);
    }

    var i = operators.length;
    while(i--){
        if(checkOperator(operators[i], inputMapping, inputChannels)){
            return operators[i];
        }
    }
    c_typeComparisons.length = 0;
    i = operators.length;
    while(i--){
        checkOperator(operators[i], inputMapping, inputChannels, c_typeComparisons);
    }
    var errorMessage = "No operator '" + operatorName+"' with matching type signature found:\n\n"
                        + c_typeComparisons.join("\n");
    Base.notifyError(errorMessage, channelNode.owner);
    return null;
}

/**
 *
 * @param operator
 * @param inputMapping
 * @param inputChannels
 * @param {Array?} typeComparisonsOutput If array is give, save error information
 * @returns {boolean}
 */
function checkOperator(operator, inputMapping, inputChannels, typeComparisonsOutput){
    var inputs, errors;
    if(typeComparisonsOutput){
        inputs = []; errors = [];
    }
    for(var i = 0; i < operator.params.length; ++i){
        var inputEntry = operator.params[i], sourceName = inputEntry.source;
        var dataName = inputMapping ? inputMapping.getScriptInputName(i, sourceName) : sourceName;
        var errorHeader;
        if(typeComparisonsOutput){
            errorHeader = "For " + (i+1) + ". argument '" + sourceName + "': ";
            inputs.push( C.getTypeName(inputEntry.type) + " " + sourceName + (inputEntry.optional ? " [optional]" : ""));
        }
        if(dataName){
            var channel = inputChannels.getChannel(dataName);
            if(!channel && !inputEntry.optional){
                if(!typeComparisonsOutput)
                    return false;
                else{
                    errors.push(errorHeader + "DataEntry '" + dataName + "' does not exist");
                }
            }
            if(channel && channel.getType() != inputEntry.type){
                if(!typeComparisonsOutput)
                    return false;
                else{
                    errors.push(errorHeader + "DataEntry '" + dataName + "' has wrong type '" + C.getTypeName(channel.getType()) + "'");
                }
            }
        }
    }
    if(typeComparisonsOutput){
        typeComparisonsOutput.push(operator.name + "(" + inputs.join(", ") + ")\n\t * " + errors.join("\n\t * "));
    }
    return true;
}

/**
 *
 * @param channelNode
 */
function updateComputedChannelsFromOperator(channelNode){
    var owner = channelNode.owner;
    if(channelNode.operator){
        var procNode = channelNode.processNode = new ProcessNode(channelNode);
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

/**
 *
 * @param {ChannelNode} channelNode
 */
function updateDataflowChannelNode(channelNode){
    var owner = channelNode.owner;
    var subSubstitution = new Substitution(owner._dataflowNode, channelNode);
    channelNode.dataflowChannelNode = owner._dataflowNode._getOrCreateChannelNode(subSubstitution);
}

/**
 * @param {ChannelNode} channelNode
 */
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
    if(dataNode._filterMapping) {
        // TODO: This is the only location where applyFilterOnChannelMap is used. Can be simplified (e.g. without callback)
        dataNode._filterMapping.applyFilterOnChannelMap(channelNode.outputChannels, channelNode.computedChannels, dataNode._filterType, setChannelFilterCallback);
    }
    else
        channelNode.outputChannels.merge(channelNode.computedChannels);
}

function setChannelFilterCallback(destMap, destName, srcMap, srcName){
    var channel = srcMap.getChannel(srcName);
    destMap.addChannel(destName, channel, srcMap.getChildDataIndex(srcName));
}

//----------------------------------------------------------------------------------------------------------------------
// Substitution
//----------------------------------------------------------------------------------------------------------------------

/**
 * TODO: Think of replacing this with a channel map
 * @param dataflowNode
 * @param userChannelNode
 * @constructor
 */
var Substitution = function(dataflowNode, userChannelNode){
    this.map = {};

    createSubstitution(this, dataflowNode, userChannelNode);
};

Substitution.prototype.hasChannel = function(name){
    return !!this.map[name];
};
Substitution.prototype.getChannel = function(name){
    return this.map[name];
};

/**
 * Create a hashable key for the substiution
 * @param subDataflowNode
 * @returns {string}
 */
Substitution.prototype.getKey = function(subDataflowNode){
    var key = "";
    var globalParamNames = subDataflowNode._getGlobalParamNames();
    for(var i = 0; i < globalParamNames.length; ++i){
        var channel = this.map[globalParamNames[i]];
        key+= (channel && channel.id || "-") + "!";
    }
    var paramNames = subDataflowNode._getParamNames();
    for(i = 0; i < paramNames.length; ++i){
        channel = this.map[paramNames[i]];
        key+= (channel && channel.id || "-") + ".";
    }
    return key;
};

/**
 *
 * @param {Substitution} substitution
 * @param {DataNode} dataflowNode
 * @param {ChannelNode} userChannelNode
 */
function createSubstitution(substitution, dataflowNode, userChannelNode){
    var userOwner = userChannelNode.owner;

    // Find channels for global parameters
    var globalParamNames = dataflowNode._getGlobalParamNames();
    for(var i = 0; i < globalParamNames.length; ++i){
        substitution.map[globalParamNames[i]] = userChannelNode.inputChannels.getChannel(globalParamNames[i]);
    }

    // Find channels for local parameters. These will override existing global parameters
    var paramNames = dataflowNode._getParamNames();
    for(i = 0; i < paramNames.length; ++i){
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
