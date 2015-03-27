var Base = require("../base.js");
var C = require("../interface/constants.js");
var BufferEntry = require("../interface/data.js").BufferEntry;


//----------------------------------------------------------------------------------------------------------------------
// DataSlot
//----------------------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------------------------
// ChannelMap
//----------------------------------------------------------------------------------------------------------------------

/**
 * A map with channels.
 * @constructor
 */
var ChannelMap = function(){
    /**
     * A map of channels.
     * @type {Object.<string, {channel: Channel, childDataIndex: Number}>}
     */
    this.map = {};
};


/**
 * Return a list of all keys.
 * @returns {Array.<string>}
 */
ChannelMap.prototype.getNames = function()
{
    return Object.keys(this.map);
};

/**
 *
 * @param name
 * @returns {Channel}
 */
ChannelMap.prototype.getChannel = function(name)
{
    if(!this.map[name])
        return null;
    return this.map[name].channel;
};

ChannelMap.prototype.getChildDataIndex = function(name)
{
    if(!this.map[name])
        return undefined;
    return this.map[name].childDataIndex;
};
ChannelMap.prototype.getChildDataIndexForFilter = function(filter){
    var result;
    filter = filter || this.getNames();
    for(var i = 0; i < filter.length; ++i){
        var idx = this.getChildDataIndex(filter[i]);
        if(idx == undefined) continue;
        if(result != undefined && result != idx)
            result = -1;
        else
            result = idx;
    }
    return result;
};

/**
 * TODO: Add a mergeWithChildIndex method?
 * @param {ChannelMap} otherChannelMap
 * @param {number?} childDataIndex Index relative to DataNode. Used to mark if channel comes
 * from a specific child DataNode, undefined if ChannelMap should take over child index from otherChannelMap
 */
ChannelMap.prototype.merge = function(otherChannelMap, childDataIndex){
    for(var name in otherChannelMap.map){
        // Either use provided child index, otherwise use child index from ChannelMap to merge
        // For input channel map we define the childDataIndex directly, for applied filters we use the
        // childDataIndex of the provided ChannelMap (it's just a renaming)
        var index = childDataIndex == undefined ? otherChannelMap.getChildDataIndex(name) : childDataIndex;
        this.addChannel(name, otherChannelMap.getChannel(name), index);
    }
};
/**
 * Add a channel with a childDataIndex
 * The childDataIndex defines the origin of the channel.
 * If childDataIndex is undefined the value of the channel can't be determined from one single DataNode
 * @param {String} name
 * @param {Channel} channel
 * @param {Number?} childDataIndex
 */
ChannelMap.prototype.addChannel = function(name, channel, childDataIndex){
    // TODO: Check if this is ever called with a proper childDataIndex value
    if(!channel) return;
    if(childDataIndex == undefined) childDataIndex = -1;
    mergeChannelIntoChannel(this, name, channel, childDataIndex);
};

/**
 * Add DataSlot to the Channel
 * @param name
 * @param dataSlot
 */
ChannelMap.prototype.addDataEntry = function(name, dataSlot)
{
    mergeDataSlotIntoChannel(this, name, dataSlot, -1);
};
/**
 * Add an output DataSlot that originates from an operator
 * @param {String} name
 * @param {DataSlot} dataSlot
 * @param {ProcessNode} creatorNode
 */
ChannelMap.prototype.addOutputDataSlot = function(name, dataSlot, creatorNode){
    var finalChannel = mergeDataSlotIntoChannel(this, name, dataSlot, -1);
    finalChannel.creatorProcessNode = creatorNode;
};

/**
 * Empty the channel map.
 */
ChannelMap.prototype.clear = function(){
    for(var name in this.map){
        var channel = this.map[name];
        if(channel && channel.map == this)
            channel.clear();
    }
    this.map = {};
};

function initChannelSlot(channelMap, name){
    if(!channelMap.map[name]){
        channelMap.map[name] = {
            channel: null,
            childDataIndex: undefined
        }
    }
}

// TODO(ksons): Handle SEQUENCE.ARRAY?
function mergeChannelIntoChannel(channelMap, name, newChannel, childDataIndex){
    initChannelSlot(channelMap, name);
    var currentChannel = channelMap.map[name].channel;
    if(!currentChannel || !currentChannel.willMergeWithChannel(newChannel)) {
        channelMap.map[name].channel = newChannel;
        channelMap.map[name].childDataIndex = childDataIndex;
        return newChannel;
    }
    currentChannel = getMapOwnedChannel(channelMap, currentChannel);
    currentChannel.addChannelEntries(newChannel);
    channelMap.map[name].channel = currentChannel;
    channelMap.map[name].childDataIndex = -1;
    return currentChannel;
}

function mergeDataSlotIntoChannel(channelMap, name, dataSlot, childDataIndex){
    initChannelSlot(channelMap, name);
    var currentChannel = channelMap.map[name].channel;
    if(!currentChannel || !currentChannel.willMergeWithDataSlot(dataSlot)){
        var channel = new Channel(channelMap, dataSlot);
        channelMap.map[name].channel = channel;
        channelMap.map[name].childDataIndex = childDataIndex;
        return channel;
    }
    currentChannel = getMapOwnedChannel(channelMap, currentChannel);
    currentChannel.addDataSlot(dataSlot);
    channelMap.map[name].channel = currentChannel;
    channelMap.map[name].childDataIndex = -1;
    return currentChannel;
}


function getMapOwnedChannel(map, channel){
    if(channel.map != map){
        var newChannel = new Channel(map);
        newChannel.addChannelEntries(channel);
        newChannel.creatorProcessNode = channel.creatorProcessNode;
        return newChannel
    }
    return channel;
}


//----------------------------------------------------------------------------------------------------------------------
// Channel
//----------------------------------------------------------------------------------------------------------------------


/**
 * A channel may inclue several DataSlots/DataEntries
 * A declared Sequence will result in on channel with multiple DataEntries.
 * @constructor
 * @param {ChannelMap} map Owner of the channel
 * @param {DataSlot=} dataSlot Optional DataSlot added to the channel
 */
var Channel = function(map, dataSlot){
    /**
     * DataSlot entries sorted by key value
     * @type {Array.<DataSlot>}
     */
    this.entries = [];
    /**
     * Owner ChannelMap that created with channel.
     * Note: a channel can still exist in several ChannelMaps
     * @type {ChannelMap}
     */
    this.map = map;
    /**
     * Unique ID for this channel. Is used for several optimizations.
     */
    this.id = generateChannelId();
    /**
     * Listeners of this channels (usually ProcessNodes and RequestNodes)
     * @type {Array}
     */
    this.listeners = [];
    /**
     * The ProcessNode that created/extended the content of this channel
     * There can be only one creatorProcessNode per channel because
     * then ouput DataSlots of an operator will always have key "0"
     * If two operators influence the same sequence, the second operator'
     * output will replace the first operator's output, effectively removing the dependency.
     * @type {null}
     */
    this.creatorProcessNode = null;

    if(dataSlot){
        this.addDataSlot(dataSlot);
    }
};

/**
 * Add a dataSlot to the channel, adding dependencies.
 * No notifications send etc.
 * Makes sure that resulting channel has dataSlots ordered by key
 * @param dataSlot
 */
Channel.prototype.addDataSlot = function(dataSlot){
    dataSlot.addChannel(this);
    for(var i = 0; i < this.entries.length; ++i){
        var entry = this.entries[i];
        // We use epsilon here to detect data entries with "equal" key
        if(entry.key >= dataSlot.key - C.EPSILON ){
            if(Math.abs(entry.key - dataSlot.key) <= C.EPSILON){
                entry.removeChannel(this);
                this.entries.splice(i, 1, dataSlot);
            }
            else{
                this.entries.splice(i, 0, dataSlot);
            }
            break;
        }
    }
    this.entries.push(dataSlot);
};

Channel.prototype.getSequenceLength = function(){
    return this.entries.length;
};
Channel.prototype.getSequenceMinKey = function(){
    return this.entries[0].key;
};
Channel.prototype.getSequenceMaxKey = function(){
    return this.entries[this.entries.length - 1].key;
};
/**
 * The DataType of the channel.
 * Since all DataEntries within a channel have the same type, we can simply return the type of the first entry.
 * @returns {DATA_TYPE}
 */
Channel.prototype.getType = function(){
    if(this.entries.length == 0)
        return C.DATA_TYPE.UNKNOWN;
    else
        return this.entries[0].dataEntry._type;
};
/**
 * Merge another channel into this channel.
 */
Channel.prototype.addChannelEntries = function(otherChannel){
    for(var i = 0; i < otherChannel.entries.length; ++i){
        var slot = otherChannel.entries[i];
        this.addDataSlot(slot);
    }
    // FIXME: otherChannel might be without creatorProcessNode but still define a DataSlot with key 0
    // In this case we have to set creatorProcessNode to null
    if(otherChannel.creatorProcessNode)
        this.creatorProcessNode = otherChannel.creatorProcessNode;
    //else
    //    this.creatorProcessNode = null;
};
/**
 * Return a DataEntry from this channel depending on sequenceKey.
 * @param {C.SEQUENCE?} sequenceAccessType
 * @param {number?} sequenceKey
 * @returns {DataEntry}
 */
Channel.prototype.getDataEntry = function(sequenceAccessType, sequenceKey){
    if(this.entries.length == 0)
        return null;
    if(!sequenceAccessType){
        return this.entries[0].dataEntry;
    }


    var i = 0, max = this.entries.length;
    // TODO: Do binary search here?
    while(i < max && this.entries[i].key < sequenceKey) ++i;
    if(sequenceAccessType == C.SEQUENCE.PREV_BUFFER){
        return this.entries[i ? i -1 : 0].dataEntry;
    }
    else if(sequenceAccessType == C.SEQUENCE.NEXT_BUFFER){
        return this.entries[i < max ? i : max - 1].dataEntry;
    }
    else if(sequenceAccessType == C.SEQUENCE.LINEAR_WEIGHT){
        var weight1 = this.entries[i ? i - 1 : 0].key;
        var weight2 = this.entries[i < max ? i : max - 1].key;
        var value = new Float32Array(1);
        value[0] = weight2 == weight1 ? 0 : (sequenceKey - weight1) / (weight2 - weight1);
        // TODO: Check if repeated BufferEntry and Float32Array allocation is a serious bottleneck
        return new BufferEntry(C.DATA_TYPE.FLOAT, value);
    }
    return null;
};

/**
 * Return true of the two channels need to be merged (instead of replacing this channel with otherChannel)
 * @param otherChannel
 * @returns {boolean}
 */
Channel.prototype.willMergeWithChannel = function(otherChannel){
    if(this.entries.length != otherChannel.entries.length) return true;
    if(this.getType() != otherChannel.getType())
        return false;
    for(var i = 0; i < this.entries.length; i++){
        if(Math.abs(this.entries[i].key - otherChannel.entries[i].key) > C.EPSILON)
            return true;
    }
    return false;
};
/**
 * Return true if we need to merge the channel with this dataSlot
 * (instead of creating a new channel fromthis dataSlot)
 * @param dataSlot
 * @returns {boolean}
 */
Channel.prototype.willMergeWithDataSlot = function(dataSlot){
    if(this.entries.length > 1) return true;
    if(this.getType() != dataSlot.dataEntry._type) return false;
    return (Math.abs(this.entries[0].key - dataSlot.key) > C.EPSILON);
};

Channel.prototype.notifyOnChange = function(state){
    for(var i = 0; i < this.listeners.length; i++){
        this.listeners[i].onXflowChannelChange(this, state);
    }
};

Channel.prototype.addListener = function(processNode){
    this.listeners.push(processNode);
};
Channel.prototype.removeListener = function(processNode){
    var idx = this.listeners.indexOf(processNode);
    if(idx != -1) this.listeners.splice(idx, 1);
};

Channel.prototype.clear = function(){
    for(var i = 0; i < this.entries.length; ++i){
        this.entries[i].removeChannel(this);
    }
};

var c_channelKeyIdx = 0;
function generateChannelId(){
    return ++c_channelKeyIdx;
}

module.exports = {
    Channel: Channel,
    ChannelMap: ChannelMap
};
