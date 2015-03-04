var Base = require("../base.js");
var C = require("../interface/constants");
var utils = require("../utils/utils");
var Executor = require("./executor");
var Result = require("../interface/result");
var Operator = require("../operator/operator");
var Data = require("../interface/data");
var DataSlot = require("../processing/data-slot");

var BufferEntry = Data.BufferEntry;
var TextureEntry = Data.TextureEntry;
var ImageDataTextureEntry = Data.ImageDataTextureEntry;

//----------------------------------------------------------------------------------------------------------------------
// C.ProcessNode
//----------------------------------------------------------------------------------------------------------------------

var ASYNC_PROCESS_STATE = {
    IDLE : 0,
    RUNNING : 1,
    RESCHEDULED : 2,
    INIT: 3
};


/**
 * Optimized representation for the processing graph. Only created for ChannelNodes with operators.
 * Is connected directly to other ProcessNodes, ignoring channels that are not relevant for processing
 * @param {ChannelNode} channelNode
 * @constructor
 * @extends {GraphNode}
 */
var ProcessNode = function(channelNode){
    this.owner = channelNode;
    this.operator = channelNode.operator;

    /**
     * Input channels for the operator
     * @type {Object.<string, Channel>}
     */
    this.inputChannels = {};

    /**
     * Outputs of operator
     * @type {Object.<string, DataSlot>}
     */
    this.outputDataSlots = {};

    /**
     * @type {exports.C.PROCESS_STATE}
     */
    this.status = C.PROCESS_STATE.MODIFIED;

    /**
     * @type {ASYNC_PROCESS_STATE}
     */
    this.asyncProcessState = ASYNC_PROCESS_STATE.INIT;

    /**
     * Direct Children without transitive children of children
     * TODO: Use Set()?
     * @type {Array.<ProcessNode>}
     */
    this.children = [];

    /**
     * Children with transitive dependencies
     * TODO: Use Set()?
     * @type {Array.<ProcessNode>}
     */
    this.descendants = [];

    /**
     * Callback, the executor needs to call when the computation is ready
     * @type {Function}
     * @private
     */
    this._bindedAsyncCallback = null;

    /**
     * Index of array matches platform id (C.PLATFORM)
     * @type {Array.<Executor>}
     */
    this.executers = [];

    constructProcessNode(this, channelNode);

    if(Operator.isOperatorAsync(this.operator)){
        this._bindedAsyncCallback = this.receiveAsyncProcessing.bind(this);
    }
};

ProcessNode.prototype.onXflowChannelChange = function(channel, state){
    if (Operator.isOperatorAsync(this.operator)) {
        if (this.status == C.PROCESS_STATE.LOADING || this.asyncProcessState != ASYNC_PROCESS_STATE.INIT) {
            this.status = C.PROCESS_STATE.MODIFIED;
            this.updateState();
        }
    }
    else {

        if (state == C.DATA_ENTRY_STATE.CHANGED_VALUE && this.status > C.PROCESS_STATE.UNPROCESSED) {
            this.status = C.PROCESS_STATE.UNPROCESSED;
        } else {
            this.status = C.PROCESS_STATE.MODIFIED;
        }
        this.notifyOutputChanged(state);
    }
};

ProcessNode.prototype.startAsyncProcessing = function(){
    if(this.asyncProcessState == ASYNC_PROCESS_STATE.IDLE || this.asyncProcessState == ASYNC_PROCESS_STATE.INIT){
        this.asyncProcessState = ASYNC_PROCESS_STATE.RUNNING;
        var executer = getOrCreateExecuter(this, C.PLATFORM.ASYNC);
        executer.run(this._bindedAsyncCallback);
    }
    else{
        this.asyncProcessState = ASYNC_PROCESS_STATE.RESCHEDULED;
    }
};
ProcessNode.prototype.receiveAsyncProcessing = function(){
    this.status = C.PROCESS_STATE.PROCESSED;
    this.notifyOutputChanged(C.DATA_ENTRY_STATE.CHANGED_SIZE_TYPE);
    if(this.asyncProcessState == ASYNC_PROCESS_STATE.RESCHEDULED){
        this.asyncProcessState = ASYNC_PROCESS_STATE.IDLE;
        this.status = C.PROCESS_STATE.MODIFIED;
        this.updateState();
    }
    else{
        this.asyncProcessState = ASYNC_PROCESS_STATE.IDLE;
    }
    Base._flushResultCallbacks();
};



ProcessNode.prototype.notifyOutputChanged = function(state){
    for(var name in this.outputDataSlots){
        this.outputDataSlots[name].notifyOnChange(state);
    }
};


ProcessNode.prototype.clear = function(){
    for(var name in this.inputChannels){
        this.inputChannels[name] && this.inputChannels[name].removeListener(this);
    }
};

ProcessNode.prototype.updateState = function(){
    if(this.status == C.PROCESS_STATE.MODIFIED){
        this.status = C.PROCESS_STATE.UNPROCESSED;

        XML3D.debug.assert(!this.owner.loading, "This should never happen");

        if(this.owner.loading)
            this.status = C.PROCESS_STATE.LOADING;
        else{
            for(var i = 0; i < this.children.length; ++i){
                this.status = Math.min(this.status, this.children[i].updateState());
            }
            if(this.status > C.PROCESS_STATE.LOADING && isInputLoading(this.operator, this.inputChannels))
                this.status = C.PROCESS_STATE.LOADING;

            if(this.status > Xflow.PROCESS_STATE.INVALID &&
                !checkInput(this, this.operator, this.owner.owner._computeInputMapping, this.inputChannels))
                this.status = Xflow.PROCESS_STATE.INVALID;

            if(this.status == C.PROCESS_STATE.UNPROCESSED && Operator.isOperatorAsync(this.operator)){
                this.status = this.asyncProcessState == ASYNC_PROCESS_STATE.INIT ? C.PROCESS_STATE.LOADING
                    : C.PROCESS_STATE.PROCESSED;
                this.startAsyncProcessing();
            }

        }
    }
    return this.status;
};

ProcessNode.prototype.process = function(){

    if(this.status == C.PROCESS_STATE.UNPROCESSED){
        var executer = getOrCreateExecuter(this, this.owner.platform);
        executer.run();
        this.status = C.PROCESS_STATE.PROCESSED;
    }
};

/**
 *
 * @param {ProcessNode} processNode
 * @param {ChannelNode} channelNode
 */
function constructProcessNode(processNode, channelNode){
    var dataNode = channelNode.owner;
    synchronizeInputChannels(processNode, channelNode, dataNode);
    synchronizeChildrenAndDescendants(processNode.children, processNode.descendants, processNode.inputChannels);
    synchronizeOutput(processNode.operator, processNode.outputDataSlots);
}

/**
 *
 * @param processNode
 * @param channelNode
 * @param dataNode
 */
function synchronizeInputChannels(processNode, channelNode, dataNode){
    var operator = processNode.operator, inputMapping = dataNode._computeInputMapping;
    for(var i = 0; i < operator.params.length; ++i){
        var sourceName = operator.params[i].source;
        var dataName = inputMapping ? inputMapping.getScriptInputName(i, sourceName) : sourceName;
        if(dataName){
            var channel = channelNode.inputChannels.getChannel(dataName);
            if(channel) channel.addListener(processNode);
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

function checkInput(processNode, operator, inputMapping, inputChannels){
    var dataNode = processNode.owner.owner;
    for(var i in operator.params){
        var entry = operator.params[i];
        var dataName = inputMapping ? inputMapping.getScriptInputName(i, entry.source) : entry.source;
        if(!entry.optional && !dataName){
            Base.notifyError("Xflow: operator " + operator.name + ": Missing input argument for "
                + entry.source, dataNode);
            return false;
        }
        if(dataName){
            var channel = inputChannels[entry.source];
            if(!channel){
                if(!inputMapping) continue;
                Base.notifyError("Xflow: operator " + operator.name + ": Input of name '" + dataName +
                    "' not found. Used for parameter " + entry.source, dataNode);
                return false;
            }
            var dataEntry = channel.getDataEntry();

            if(!channel.creatorProcessNode){
                if(!entry.optional && (!dataEntry || dataEntry.isEmpty())){
                    Base.notifyError("Xflow: operator " + operator.name + ": Input for " + entry.source +
                        ' contains no data.', dataNode);
                    return false;
                }
            }
            if(dataEntry && dataEntry.type != entry.type){
                Base.notifyError("Xflow: operator " + operator.name + ": Input for " + entry.source +
                    " has wrong type. Expected: " + C.getTypeName(entry.type)
                    + ", but got: " +  C.getTypeName(dataEntry.type), dataNode);
                return false;
            }
        }
    }
    return true;
}

function synchronizeChildrenAndDescendants(children, descendants, inputChannels){
    var channel;
    for(var name in inputChannels){
        channel = inputChannels[name];
        if(channel && channel.creatorProcessNode){
            utils.set.add(children, channel.creatorProcessNode);
            utils.set.add(descendants, channel.creatorProcessNode.descendants);
        }
    }
    utils.set.remove(children, descendants);
    utils.set.add(descendants, children);
}

function synchronizeOutput(operator, outputs){
    var async = Operator.isOperatorAsync(operator);
    for(var i in operator.outputs){
        var dataEntry = operator.outputs[i];

        var entry, asyncEntry;
        var type = dataEntry.type;
        if(type != C.DATA_TYPE.TEXTURE){
            entry = new BufferEntry(type, null);
            if(async) asyncEntry = new BufferEntry(type, null);
        }
        else{
            entry = window.document ? new TextureEntry(null) : new ImageDataTextureEntry(null);
            if(async) asyncEntry = window.document ? new TextureEntry(null) : new ImageDataTextureEntry(null);
        }
        outputs[dataEntry.name] = new DataSlot(entry, 0);
        if(async) outputs[dataEntry.name].asyncDataEntry = asyncEntry;
    }
}

function getOrCreateExecuter(node, platform){
    if(!node.executers[platform]){
        node.executers[platform] = new Executor(node, platform);
    }
    return node.executers[platform];
}


//----------------------------------------------------------------------------------------------------------------------
// RequestNode
//----------------------------------------------------------------------------------------------------------------------
/**
 *
 * FIXME: RequestNodes are never deleted.
 * @param {ChannelNode} channelNode
 * @param {Array.<string>} filter
 * @constructor
 */
var RequestNode = function(channelNode, filter){
    this.owner = channelNode;
    this.filter = filter;

    /**
     *
     * @type {Object<C.PLATFORM, exports.Result>}
     */
    this.results = {};

    /**
     * @type {exports.C.PROCESS_STATE}
     */
    this.status = C.PROCESS_STATE.MODIFIED;

    /**
     * @type {Object.<string, Channel>}
     */
    this.channels = {};

    /**
     * @see ProcessNode.children
     * @type {Array}
     */
    this.children = [];

    /**
     * @see ProcessNode.executers
     * @type {Array}
     */
    this.executers = [];

    /**
     * @see ProcessNode.outOfSync
     * @type {boolean}
     */
    this.outOfSync = true;
};

RequestNode.prototype.synchronize = function(){
    if(this.outOfSync){
        this.outOfSync = false;
        synchronizeRequestChannels(this, this.owner);
        synchronizeChildrenAndDescendants(this.children, [], this.channels);
    }
};

RequestNode.prototype.updateState = function(){
    this.synchronize();
    if(this.status == C.PROCESS_STATE.MODIFIED){
        this.status = C.PROCESS_STATE.UNPROCESSED;

        if(this.owner.loading) {
            this.status = C.PROCESS_STATE.LOADING;
        } else {
            for(var i = 0; i < this.children.length; ++i){
                this.status = Math.min(this.status, this.children[i].updateState());
            }
        }
    }
    return this.status;
};

RequestNode.prototype.getResult = function(resultType){
    this.updateState();

    // TODO: This could be in getRequestComputeResult
    if(this.status == C.PROCESS_STATE.UNPROCESSED){
        if(resultType == C.RESULT_TYPE.COMPUTE){
            var executer = getOrCreateExecuter(this, this.owner.platform);
            if(!executer.isProcessed())
                executer.run();
        }
        this.status = C.PROCESS_STATE.PROCESSED;
    }
    var result = null;
    if (resultType == C.RESULT_TYPE.COMPUTE) {
        result = getRequestComputeResult(this);
    } else if (resultType == C.RESULT_TYPE.VS) {
        result = getRequestVSResult(this);
    }
    result.loading = (this.status == C.PROCESS_STATE.LOADING);
    return result;
};

RequestNode.prototype.setStructureOutOfSync = function(){
    this.outOfSync = true;
    this.status = C.PROCESS_STATE.MODIFIED;
    for(var type in this.results){
        this.results[type]._notifyChanged(C.RESULT_STATE.CHANGED_STRUCTURE);
    }
    for(var name in this.channels){
        this.channels[name].removeListener(this);
    }
    this.channels = [];
    this.children = [];
    this.executers = [];
};

RequestNode.prototype.onXflowChannelChange = function(channel, state){
    if(channel.creatorProcessNode)
        this.status = C.PROCESS_STATE.MODIFIED;
    var notifyState = (state == C.DATA_ENTRY_STATE.CHANGED_VALUE ? C.RESULT_STATE.CHANGED_DATA_VALUE
            : C.RESULT_STATE.CHANGED_DATA_SIZE);

    for(var type in this.results){
        this.results[type]._notifyChanged(notifyState);
    }
};

/**
 *
 * @param requestNode
 * @param channelNode
 */
function synchronizeRequestChannels(requestNode, channelNode){
    var names = requestNode.filter;
    if(!names){
        names = channelNode.outputChannels.getNames();
    }

    for(var i = 0; i < names.length; ++i){
        var name = names[i];
        var channel = channelNode.outputChannels.getChannel(name);
        if(channel){
            requestNode.channels[name] = channel;
            channel.addListener(requestNode);
        }
    }
}

/**
 *
 * @param {RequestNode} requestNode
 * @returns {Result}
 */
function getRequestComputeResult(requestNode)
{
    if(!requestNode.results[C.RESULT_TYPE.COMPUTE])
        requestNode.results[C.RESULT_TYPE.COMPUTE] = new Result.ComputeResult();

    var result = requestNode.results[C.RESULT_TYPE.COMPUTE];
    result._dataEntries = {}; result._outputNames = [];

    for(var name in requestNode.channels){
        var entry = requestNode.channels[name].getDataEntry();
        result._dataEntries[name] = entry && !entry.isEmpty() ? entry : null;
        result._outputNames.push(name);
    }
    return result;
}

/**
 *
 * @param requestNode
 * @returns {exports.VSDataResult}
 */
function getRequestVSResult(requestNode)
{
    var executer = getOrCreateExecuter(requestNode, C.PLATFORM.GLSL);
    if(!requestNode.results[C.RESULT_TYPE.VS])
        requestNode.results[C.RESULT_TYPE.VS] = new Result.VSDataResult();
    var result = requestNode.results[C.RESULT_TYPE.VS];

    var program = executer.getVertexShader();
    result._program = program;
    result._programData = executer.programData;
    return result;
}


module.exports = {
    RequestNode: RequestNode,
    ProcessNode: ProcessNode
};

