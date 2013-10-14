(function(){


//----------------------------------------------------------------------------------------------------------------------
// Xflow.ChannelNode
//----------------------------------------------------------------------------------------------------------------------

    /**
     * @constructor
     * @extends {Xflow.GraphNode}
     */
    Xflow.ChannelNode = function(dataNode, substitution){
        this.owner = dataNode;
        this.substitution = substitution;
        this.loading = false;
        this.inputSlots = {};
        this.inputChannels = new Xflow.ChannelMap();
        this.computedChannels = new Xflow.ChannelMap();
        this.outputChannels = new Xflow.ChannelMap();

        this.operator = null;
        this.dataflowChannelNode = null;
        this.processNode = null;
        this.requestNodes = {};
        this.useCount = 1;
        // State:
        this.outOfSync = true; // true if ChannelNode is not synchronized for no substitution
    };


    Xflow.ChannelNode.prototype.synchronize = function(){
        if(this.outOfSync){
            synchronizeChildren(this);
            updateInputChannels(this);
            updateComputedChannels(this);
            updateOutputChannels(this);
            this.outOfSync = false;
        }
    }

    Xflow.ChannelNode.prototype.clear = function(){
        this.useCount = 0;
         this.inputChannels.clear();
         this.outputChannels.clear();
         // TODO: Make sure everything is cleaned up there!
        return true;
    }

    Xflow.ChannelNode.prototype.increaseRef = function(){
        this.useCount++;
    }

    Xflow.ChannelNode.prototype.decreaseRef = function(){
        this.useCount--;
        if(this.useCount == 0){
            this.clear();
        }
        return false;
    }

    Xflow.ChannelNode.prototype.getOutputNames = function(){
        this.synchronize();
        return this.outputChannels.getNames();
    }

    Xflow.ChannelNode.prototype.setStructureOutOfSync = function()
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

    Xflow.ChannelNode.prototype.notifyDataChange = function(inputNode, changeType){
        var key = inputNode._name + ";" + inputNode._key;
        if(this.inputSlots[key])
            this.inputSlots[key].setDataEntry(inputNode._data, changeType);
    }

    Xflow.ChannelNode.prototype.getResult = function(type, filter)
    {
        this.synchronize();

        var key = filter ? filter.join(";") : "[null]";
        if(!this.requestNodes[key]){
            this.requestNodes[key] = new Xflow.RequestNode(this, filter);
        }
        return this.requestNodes[key].getResult(type);
    }


    Xflow.ChannelNode.prototype.getOutputChannelInfo = function(name){
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
        var preFilterName = this.owner._filterMapping.getRenameSrcName(name);
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



    function synchronizeChildren(channelNode){


        var dataNode = channelNode.owner;
        channelNode.loading = dataNode._subTreeLoading;

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
            channelNode.inputChannels.merge(owner._sourceNode._getChannelNode(channelNode.substitution).outputChannels);
        }
        else{
            var children = owner._children;
            for(var i = 0; i < children.length; ++i){
                if(children[i]._getChannelNode){
                    channelNode.inputChannels.merge(children[i]._getChannelNode(channelNode.substitution).outputChannels);
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

        if( owner._computeUsesDataflow){
            channelNode.operator = null;
            updateDataflowChannelNode(channelNode);
            updateComputedChannelsFromDataflow(channelNode);
        }
        else if(owner._computeOperator){
            channelNode.dataflowChannelNode = null;
            updateOperator(channelNode);
            updateComputedChannelsFromOperator(channelNode);
        }

        if(oldDataflowChannelNode && oldDataflowChannelNode != channelNode.dataflowChannelNode){
            oldDataflowChannelNode.owner._removeSubstitutionNode(oldDataflowChannelNode);
        }
    }

    function updateOperator(channelNode){
        var owner = channelNode.owner;
        if(typeof owner._computeOperator == "string"){
            var operatorName = owner._computeOperator, operator = null;
            if(operatorName){
                operator = Xflow.getOperator(operatorName);
                if(!operator){
                    Xflow.notifyError("Unknown operator: '" + operatorName+"'", channelNode.owner);
                }
            }
            channelNode.operator = operator;
        }
        else{
            channelNode.operator = owner._computeOperator;
        }
    }

    function updateComputedChannelsFromOperator(channelNode){
        var owner = channelNode.owner;
        if(channelNode.operator){
            var procNode = channelNode.processNode = new Xflow.ProcessNode(channelNode);
            var index = 0;
            for(var name in procNode.outputDataSlots){
                var destName = owner._computeOutputMapping.getScriptOutputName(index, name);
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
        dataNode._filterMapping.applyFilterOnChannelMap(channelNode.outputChannels, channelNode.computedChannels,
            dataNode._filterType, setChannelFilterCallback);
    }

    function setChannelFilterCallback(destMap, destName, srcMap, srcName){
        var channel = srcMap.getChannel(srcName);
        destMap.addChannel(destName, channel);
    }

//----------------------------------------------------------------------------------------------------------------------
// Xflow.Substitution
//----------------------------------------------------------------------------------------------------------------------

    Xflow.Substitution = function(dataflowNode, userChannelNode){
        this.map = {};

        createSubstitution(this, dataflowNode, userChannelNode);
    }

    Xflow.Substitution.prototype.hasChannel = function(name){
        return !!this.map[name];
    }
    Xflow.Substitution.prototype.getChannel = function(name){
        return this.map[name];
    }
    Xflow.Substitution.prototype.getKey = function(subDataflowNode){
        var key = "";
        var globalParamNames = subDataflowNode._getGlobalParamNames();
        for(var i = 0; i < globalParamNames.length; ++i){
            key+= this.map[globalParamNames[i]].id + "!";
        }
        var paramNames = subDataflowNode._getParamNames();
        for(var i = 0; i < paramNames.length; ++i){
            key+= this.map[paramNames[i]].id + ".";
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

})();

