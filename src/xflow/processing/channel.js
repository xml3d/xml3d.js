(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.DataSlot
//----------------------------------------------------------------------------------------------------------------------

    /**
     * @contructuor
     * @param {Xflow.DataEntry} value
     * @param {number=} key
     */
    Xflow.DataSlot = function(dataEntry, key){
        this.key = key || 0;
        this.dataEntry = dataEntry;
        this.asyncDataEntry = null;
        this.parentChannels = [];

    }
    Xflow.DataSlot.prototype.addChannel = function(channel){
        this.parentChannels.push(channel);
    }
    Xflow.DataSlot.prototype.removeChannel = function(channel){
        var idx = this.parentChannels.indexOf(channel);
        if(idx != -1) this.parentChannels.splice(idx, 1);
    }
    Xflow.DataSlot.prototype.swapAsync = function(){
        var tmp = this.dataEntry;
        this.dataEntry = this.asyncDataEntry;
        this.asyncDataEntry = tmp;
    }

    Xflow.DataSlot.prototype.setDataEntry = function(dataEntry, changeType){
        this.dataEntry = dataEntry;
        var state = changeType == Xflow.RESULT_STATE.CHANGED_DATA_VALUE ? Xflow.DATA_ENTRY_STATE.CHANGED_VALUE :
            Xflow.DATA_ENTRY_STATE.CHANGED_SIZE;
        this.notifyOnChange(state);
    }

    Xflow.DataSlot.prototype.notifyOnChange = function(state){
        for(var i = 0; i < this.parentChannels.length; ++i){
            this.parentChannels[i].notifyOnChange(state);
        }
    }

//----------------------------------------------------------------------------------------------------------------------
// Xflow.ChannelMap
//----------------------------------------------------------------------------------------------------------------------

    /**
     * @constructor
     */
    Xflow.ChannelMap = function(){
        this.map = {};
    }
    var ChannelMap = Xflow.ChannelMap;


    ChannelMap.prototype.getNames = function()
    {
        var result = [];
        for(var name in this.map){
            result.push(name);
        }
        return result;
    }

    ChannelMap.prototype.getChannel = function(name)
    {
        if(!this.map[name])
            return null;
        return this.map[name].channel;
    }

    ChannelMap.prototype.getChildDataIndex = function(name)
    {
        if(!this.map[name])
            return undefined;
        return this.map[name].childDataIndex;
    }
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
    }

    ChannelMap.prototype.merge = function(otherChannelMap, childDataIndex){
        for(var name in otherChannelMap.map){
            var index = childDataIndex == undefined ? otherChannelMap.getChildDataIndex(name) : childDataIndex;
            this.addChannel(name, otherChannelMap.getChannel(name), index);
        }
    }

    ChannelMap.prototype.addChannel = function(name, channel, childDataIndex){
        if(!channel) return;
        if(childDataIndex == undefined) childDataIndex = -1;
        mergeChannelIntoChannel(this, name, channel, childDataIndex);
    }

    ChannelMap.prototype.addDataEntry = function(name, dataSlot)
    {
        mergeDataSlotIntoChannel(this, name, dataSlot, -1);
    }

    ChannelMap.prototype.addOutputDataSlot = function(name, dataSlot, creatorNode){
        var finalChannel = mergeDataSlotIntoChannel(this, name, dataSlot, -1);
        finalChannel.creatorProcessNode = creatorNode;
    }

    ChannelMap.prototype.clear = function(){
        for(var name in this.map){
            var channel = this.map[name];
            if(channel && channel.map == this)
                channel.clear();
        }
        this.map = {};
    }

    function initChannelSlot(channelMap, name){
        if(!channelMap.map[name]){
            channelMap.map[name] = {
                channel: null,
                childDataIndex: undefined
            }
        }
    }

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
            var channel = new Xflow.Channel(channelMap, dataSlot);
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
            var newChannel = new Xflow.Channel(map);
            newChannel.addChannelEntries(channel);
            newChannel.creatorProcessNode = channel.creatorProcessNode;
            return newChannel
        }
        return channel;
    }


//----------------------------------------------------------------------------------------------------------------------
// Xflow.Channel
//----------------------------------------------------------------------------------------------------------------------


    /**
     * @constructor
     * @param {Xflow.ChannelMap} map Owner of the channel
     * @param {Xflow.DataSlot=} dataEntry Optional DataEntry added to the channel
     */
    Xflow.Channel = function(map, dataSlot){
        this.entries = [];
        this.map = map;
        this.id = generateChannelId();
        this.listeners = [];
        this.creatorProcessNode = null;

        if(dataSlot){
            this.addDataSlot(dataSlot);
        }
    }
    var Channel = Xflow.Channel;

    Channel.prototype.addDataSlot = function(dataSlot){
        dataSlot.addChannel(this);
        for(var i = 0; i < this.entries.length; ++i){
            var entry = this.entries[i];
            if(entry.key >= dataSlot.key - Xflow.EPSILON ){
                if(Math.abs(entry.key - dataSlot.key) <= Xflow.EPSILON){
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
    }
    Channel.prototype.getSequenceMinKey = function(){
        return this.entries[0].key;
    }
    Channel.prototype.getSequenceMaxKey = function(){
        return this.entries[this.entries.length - 1].key;
    }

    Channel.prototype.getType = function(){
        if(this.entries.length == 0)
            return Xflow.DATA_TYPE.UNKNOWN;
        else
            return this.entries[0].dataEntry._type;
    }

    Channel.prototype.addChannelEntries = function(otherChannel){
        for(var i = 0; i < otherChannel.entries.length; ++i){
            var slot = otherChannel.entries[i];
            this.addDataSlot(slot);
        }
        if(otherChannel.creatorProcessNode)
            this.creatorProcessNode = otherChannel.creatorProcessNode;
    }

    Channel.prototype.getDataEntry = function(sequenceAccessType, sequenceKey){
        if(this.entries.length == 0)
            return null;
        if(!sequenceAccessType)
            return this.entries[0].dataEntry;

        var i = 0, max = this.entries.length;
        while(i < max && this.entries[i].key < sequenceKey) ++i;
        if(sequenceAccessType == Xflow.SEQUENCE.PREV_BUFFER){
            return this.entries[i ? i -1 : 0].dataEntry;
        }
        else if(sequenceAccessType == Xflow.SEQUENCE.NEXT_BUFFER){
            return this.entries[i < max ? i : max - 1].dataEntry;
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


    Channel.prototype.willMergeWithChannel = function(otherChannel){
        if(this.entries.length != otherChannel.entries.length) return true;
        if(this.getType() != otherChannel.getType())
            return false;
        for(var i = 0; i < this.entries.length; i++){
            if(Math.abs(this.entries[i].key - otherChannel.entries[i].key) > Xflow.EPSILON)
                return true;
        }
        return false;
    }
    Channel.prototype.willMergeWithDataSlot = function(dataSlot){
        if(this.entries.length > 1) return true;
        if(this.getType() != dataSlot.dataEntry._type) return false;
        if(Math.abs(this.entries[0].key - dataSlot.key) > Xflow.EPSILON)
            return true;
        return false;
    }

    Channel.prototype.notifyOnChange = function(state){
        for(var i = 0; i < this.listeners.length; i++){
            this.listeners[i].onXflowChannelChange(this, state);
        }
    }

    Channel.prototype.addListener = function(processNode){
        this.listeners.push(processNode);
    }
    Channel.prototype.removeListener = function(processNode){
        var idx = this.listeners.indexOf(processNode);
        if(idx != -1) this.listeners.splice(idx, 1);
    }

    Channel.prototype.clear = function(){
        for(var i = 0; i < this.entries.length; ++i){
            this.entries[i].removeChannel(this);
        }
    }

    var c_channelKeyIdx = 0;
    function generateChannelId(){
        return ++c_channelKeyIdx;
    }


})();

