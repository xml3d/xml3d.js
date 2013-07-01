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
        this.parentChannels = [];

    }
    Xflow.DataSlot.prototype.addChannel = function(channel){
        this.parentChannels.push(channel);
    }
    Xflow.DataSlot.prototype.removeChannel = function(channel){
        var idx = this.parentChannels.indexOf(channel);
        if(idx != -1) this.parentChannels.splice(idx, 1);
    }

    Xflow.DataSlot.prototype.setDataEntry = function(dataEntry){
        this.dataEntry = dataEntry;
        this.notifyOnChange();
    }

    Xflow.DataSlot.prototype.notifyOnChange = function(){
        for(var i = 0; i < this.parentChannels.length; ++i){
            this.parentChannels[i].notifyOnChange();
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


    ChannelMap.prototype.getChannel = function(name, substitution)
    {
        if(!this.map[name])
            return null;

        var entry = this.map[name];
        var key = getEntryKey(entry, substitution);
        return entry.channels[key] ? entry.channels[key].channel : null;
    }

    ChannelMap.prototype.getProtoNames = function(name){
        if(!this.map[name])
            return null;
        return this.map[name].protoNames;
    }

    ChannelMap.prototype.mergeProtoNames = function(otherChannelMap){
        for(var name in otherChannelMap.map){
            this.addProtoNames(name, otherChannelMap.getProtoNames(name));
        }
    }
    ChannelMap.prototype.addProtoNames = function(name, protoNames){

        var entry = getEntry(this.map, name);
        Xflow.nameset.add(entry.protoNames, protoNames);
    }


    ChannelMap.prototype.merge = function(otherChannelMap, substitution){
        for(var name in otherChannelMap.map){
            this.addChannel(name, otherChannelMap.getChannel(name, substitution), substitution);
        }
    }

    ChannelMap.prototype.addChannel = function(name, channel, substitution){
        var entry = getEntry(this.map, name);
        mergeChannelsIntoMapEntry(this, entry, channel, substitution);
    }


    ChannelMap.prototype.addDataEntry = function(name, dataSlot, param, substitution)
    {
        var entry = getEntry(this.map, name);
        if(param && substitution){
            if(substitution.map[name]){
                mergeChannelsIntoMapEntry(this, entry, substitution.map[name], substitution);
                return;
            }else{
                // TODO: at this point we use default values - we need to show an error, if a default values does not exists.
            }
        }
        mergeDataSlotIntoMapEntry(this, entry, dataSlot, substitution);
    }

    ChannelMap.prototype.addOutputDataSlot = function(name, dataSlot, creatorNode, substitution){
        var entry = getEntry(this.map, name);
        var channel = mergeDataSlotIntoMapEntry(this, entry, dataSlot, substitution);
        channel.creatorProcessNode = creatorNode;
    }

    ChannelMap.prototype.markAsDone = function(substitution){
        for(var name in this.map){
            var entry = this.map[name];
            var entryKey = getEntryKey(entry, substitution);
            entry.channels[entryKey].done = true;
        }
    }

    ChannelMap.prototype.clearSubstitution = function(substitution){
        for(var name in this.map){
            var entry = this.map[name];
            var entryKey = getEntryKey(entry, substitution);
            var channel = entry.channels[entryKey] && entry.channels[entryKey].channel;
            if(channel){
                if(channel.map == this){
                    channel.useCount--;
                    if(channel.useCount == 0)
                        channel.clear();
                }
                if(channel.useCount == 0){
                    delete entry.channels[entryKey];
                }
            }

        }
    }

    ChannelMap.prototype.clearAll = function(){
        for(var name in this.map){
            var entry = this.map[name];
            for(var key in entry.channels){
                var channel = entry.channels[key].channel;
                if(channel && channel.map == this)
                    channel.clear();
            }
        }
        this.map = {};
    }

    Xflow.ChannelMap.Entry = function(){
        this.protoNames = [];
        this.origins = 0;
        this.channels = {};
    };

    function getEntry(map, name){
        if(!map[name])
            map[name] = new Xflow.ChannelMap.Entry();
        return map[name];
    }

    function getEntryKey(entry, substitution){
        if(substitution && entry.protoNames.length > 0){
            return substitution.getKey(entry.protoNames);
        }
        else
            return 0;
    }

    function mergeChannelsIntoMapEntry(map, entry, newChannel, substitution){
        var entryKey = getEntryKey(entry, substitution);
        if(!entry.channels[entryKey])
            entry.channels[entryKey] = {done: false, channel: null};
        var channelEntry = entry.channels[entryKey];
        if(channelEntry.done){
            if(channelEntry.channel.map == this)
                channelEntry.useCount++;
            return;
        }

        var finalChannel = mergeChannelIntoChannel(map, entry.channel, newChannel);
        channelEntry.channel = finalChannel;
    }

    function mergeChannelIntoChannel(map, currentChannel, newChannel){
        if(!currentChannel) return newChannel;
        if(!currentChannel.willMergeWithChannel(newChannel))
            return newChannel;
        currentChannel = getMapOwnedChannel(map, currentChannel);
        currentChannel.addChannelEntries(newChannel);
        return currentChannel;
    }


    function mergeDataSlotIntoMapEntry(map, entry, dataSlot, substitution){
        var entryKey = getEntryKey(entry, substitution);
        if(!entry.channels[entryKey])
            entry.channels[entryKey] = {done: false, channel: null};
        var channelEntry = entry.channels[entryKey];
        if(channelEntry.done){
            if(channelEntry.channel.map == this)
                channelEntry.useCount++;
            return channelEntry.channel;
        }
        var finalChannel = mergeDataSlotIntoChannel(map, channelEntry.channel, dataSlot);
        channelEntry.channel = finalChannel;
        return finalChannel;
    }

    function mergeDataSlotIntoChannel(map, currentChannel, dataSlot){
        if(!currentChannel)
            return new Xflow.Channel(map, dataSlot);
        if(!currentChannel.willMergeWithDataSlot(dataSlot))
            return new Xflow.Channel(map, dataSlot);
        currentChannel = getMapOwnedChannel(map, currentChannel);
        currentChannel.addDataSlot(dataSlot);
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
        this.useCount = 1;
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

    Channel.prototype.notifyOnChange = function(){
        for(var i = 0; i < this.listeners.length; i++){
            this.listeners[i](this);
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



//----------------------------------------------------------------------------------------------------------------------
// Xflow.Substitution
//----------------------------------------------------------------------------------------------------------------------

    Xflow.Substitution = function(channelMap, substitution, subtreeProtoNames){
        this.map = {};
        if(substitution && subtreeProtoNames){
            for(var i = 0; i < subtreeProtoNames.length; ++i){
                var name = subtreeProtoNames[i];
                this.map[name] = substitution.map[name];
            }
        }
        for(var name in channelMap.map){
            this.map[name] = channelMap.getChannel(name, substitution);
        }
    }
    var Substitution = Xflow.Substitution;

    Substitution.prototype.getKey = function(nameFilter){
        var result = [];
        if(nameFilter){
            for(var i = 0; i < nameFilter.length; ++i){
                var channel = this.map[nameFilter[i]];
                result[i] = nameFilter[i] + ">" + (channel && channel.id || "X" );
            }
        }
        else{
            var i = 0;
            for(var name in this.map){
                var channel = this.map[name];
                result[i++] = name + ">" + (channel && channel.id || "X" );
            }
        }
        return result.length > 0 ? result.join(";") : 0;
    }

})();

