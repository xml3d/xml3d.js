(function(){


//----------------------------------------------------------------------------------------------------------------------
// Xflow.ChannelNode
//----------------------------------------------------------------------------------------------------------------------

    /**
     * @constructor
     * @extends {Xflow.GraphNode}
     */
    Xflow.ChannelNode = function(dataNode){
        this.owner = dataNode;
        this.inputSlots = {};
        this.inputChannels = new Xflow.ChannelMap();
        this.protoInputChannels = new Xflow.ChannelMap();
        this.finalOutputChannels = new Xflow.ChannelMap();

        this.operator = null;
        this.protoNames = [];
        this.operatorProtoNames = [];
        this.emptySubstitutionNode = null;
        this.processNodes = {};
        this.requestNodes = {};

        // State:
        this.outOfSync = true; // true if ChannelNode is not synchronized for no substitution
    };
    var ChannelNode = Xflow.ChannelNode;

    ChannelNode.prototype.synchronize = function(){
        if(this.outOfSync){
            synchronizeChildren(this.owner);
            setInputProtoNames(this);
            setOperatorProtoNames(this);
            setProtoInputProtoNames(this);
            setFinalOutputProtoNames(this);
            this.outOfSync = false;
        }
    }

    ChannelNode.prototype.getSubstitutionNode = function(substitution){
        this.synchronize();
        if(!substitution){
            if(!this.emptySubstitutionNode)
                this.emptySubstitutionNode = new Xflow.SubstitutionNode(this, null);

            return this.emptySubstitutionNode;
        }
        else{
            return new Xflow.SubstitutionNode(this, substitution);
        }
    }

    ChannelNode.prototype.getProcessNode = function(substitution){
        if(!this.operator)
            return null;

        var key = substitution ? substitution.getKey(this.operatorProtoNames) : 0;
        if(!this.processNodes[key])
            this.processNodes[key] = new Xflow.ProcessNode(this, this.operator, substitution);

        this.processNodes[key].useCount++;
        return this.processNodes[key];
    }

    ChannelNode.prototype.clearProcessNode = function(substitution){
        if(!this.operator)
            return;
        var key = substitution ? substitution.getKey(this.operatorProtoNames) : 0;
        var procNode = this.processNodes[key];
        if(procNode){
            procNode.useCount--;
            if(procNode.useCount == 0)
                delete this.processNodes[key];
        }
    }

    ChannelNode.prototype.notifyDataChange = function(inputNode){
        var key = inputNode._name + ";" + inputNode._seqnr;
        if(this.inputSlots[key])
            this.inputSlots[key].setDataEntry(inputNode._data);
    }


    ChannelNode.prototype.setStructureOutOfSync = function()
    {
        if(!this.outOfSync){
            this.outOfSync = true;
            this.inputChannels.clearAll();
            this.protoInputChannels.clearAll();
            this.finalOutputChannels.clearAll();
            if(this.emptySubstitutionNode)
                this.emptySubstitutionNode.clear();
            this.emptySubstitutionNode = null;

            for(var key in this.requestNodes){
                this.requestNodes[key].setStructureOutOfSync();
            }
        }
    }

    ChannelNode.prototype.getComputeResult = function(filter){
        this.synchronize();
        this.getSubstitutionNode(null); // create emptySubstitutionNode if not available

        var key = filter ? filter.join(";") : "[null]";
        if(!this.requestNodes[key]){
            this.requestNodes[key] = new Xflow.RequestNode(this, filter);
        }
        return this.requestNodes[key].getResult(Xflow.RESULT_TYPE.COMPUTE);
    }

    function synchronizeChildren(dataNode){
        if(dataNode._sourceNode)
            dataNode._sourceNode._channelNode.synchronize();
        else{
            for(var i = 0; i < dataNode._children.length; ++i){
                if(dataNode._children[i]._channelNode){
                    dataNode._children[i]._channelNode.synchronize();
                }
            }
        }
    }

    function setInputProtoNames(channelNode){
        var owner = channelNode.owner, child;
        if(owner._sourceNode){
            channelNode.inputChannels.mergeProtoNames(owner._sourceNode._channelNode.finalOutputChannels);
        }
        else{
            for(var i = 0; i < owner._children.length; ++i){
                if(child = owner._children[i]._channelNode){
                    channelNode.inputChannels.mergeProtoNames(child.finalOutputChannels);
                    Xflow.nameset.add(channelNode.protoNames, child.protoNames);
                }
            }
            for(var i = 0; i < owner._children.length; ++i){
                if((child = owner._children[i]) && !child._channelNode){
                    if(child._param){
                        channelNode.inputChannels.addProtoNames(child._name, child._name);
                        Xflow.nameset.add(channelNode.protoNames, child._name);
                    }
                    var key = child._name + ";" + child._seqnr;
                    channelNode.inputSlots[key] = new Xflow.DataSlot(child._data, child._seqnr);

                }
            }
        }
    }

    function setOperatorProtoNames(channelNode){
        channelNode.operator = Xflow.getOperator(channelNode.owner._computeOperator);
        if(channelNode.operator){
            var operator = channelNode.operator, inputMapping = channelNode.owner._computeInputMapping;
            for(var i = 0; i < operator.params.length; ++i){
                var dataName = inputMapping.getScriptInputName(i, operator.params[i].source);
                if(dataName){
                    Xflow.nameset.add(channelNode.operatorProtoNames, channelNode.inputChannels.getProtoNames(dataName));
                }
            }
        }
    }

    function setProtoInputProtoNames(channelNode){
        var dataNode = channelNode.owner;
        channelNode.protoInputChannels.mergeProtoNames(channelNode.inputChannels);
        var operator = channelNode.operator;
        if(operator){
            for(var i = 0; i < operator.outputs.length; ++i){
                var name = operator.outputs[i].name;
                var destName = dataNode._computeOutputMapping.getScriptOutputName(i, name);
                channelNode.protoInputChannels.addProtoNames(destName, channelNode.operatorProtoNames);
            }
        }
    }

    function setFinalOutputProtoNames(channelNode){
        var dataNode = channelNode.owner;
        dataNode._filterMapping.applyFilterOnChannelMap(channelNode.finalOutputChannels, channelNode.protoInputChannels,
            null, dataNode._filterType, setChannelMapProtoName);

        if(dataNode._protoNode){
            var protoOutput = dataNode._protoNode._channelNode.finalOutputChannels;
            dataNode._filterMapping.applyFilterOnChannelMap(channelNode.finalOutputChannels, protoOutput,
                channelNode.protoNames, dataNode._filterType, setChannelMapProtoProtoName);
        }
    }

    function setChannelMapProtoName(destMap, destName, srcMap, srcName){
        var protoNames = srcMap.getProtoNames(srcName);
        destMap.addProtoNames(destName, protoNames);
    }

    function setChannelMapProtoProtoName(destMap, destName, srcMap, srcName, protoNames){
        destMap.addProtoNames(destName, protoNames);
    }

//----------------------------------------------------------------------------------------------------------------------
// Xflow.SubstitutionNode
//----------------------------------------------------------------------------------------------------------------------

    /**
     * @constructor
     * @extends {Xflow.GraphNode}
     */
    Xflow.SubstitutionNode = function(channelNode, substitution){
        this.owner = channelNode;
        this.substitution = substitution;
        this.childSubNodes = [];
        this.processNode = null;
        this.protoSubNode = null;

        constructSubNode(this, channelNode, substitution);
    };
    var SubstitutionNode = Xflow.SubstitutionNode;

    SubstitutionNode.prototype.clear = function(){
        if(this.substitution){
            clearSubstitution(this.owner, this.substitution);
            for(var i = 0; i < this.childSubNodes.length; ++i){
                this.childSubNodes[i].clear();
            }
        }
        if(this.protoSubNode){
            this.protoSubNode.clear();
        }
        if(this.processNode){
            this.owner.clearProcessNode(this.substitution);
        }
    }


    function constructSubNode(subNode, channelNode, substitution){
        setSubNodeChildren(subNode, channelNode.owner, substitution);
        setSubNodeInputChannels(channelNode, substitution);
        setSubNodeProcessNode(subNode, channelNode, substitution);
        setSubNodeProtoInputChannels(subNode, channelNode, substitution);
        setSubNodeFinalOutputChannels(subNode, channelNode, substitution);
        markChannelsAsDone(channelNode, substitution);
    }

    function setSubNodeChildren(subNode, dataNode, substitution){
        if(dataNode._sourceNode)
            subNode.childSubNodes.push(dataNode._sourceNode._channelNode.getSubstitutionNode(substitution));
        else{
            var child;
            for(var i = 0; i < dataNode._children.length; ++i){
                if(child = dataNode._children[i]._channelNode){
                    subNode.childSubNodes.push(child.getSubstitutionNode(substitution));
                }
            }
        }
    }

    function setSubNodeInputChannels(channelNode, substitution){
        var owner = channelNode.owner, child;
        if(owner._sourceNode){
            channelNode.inputChannels.merge(owner._sourceNode._channelNode.finalOutputChannels, substitution);
        }
        else{
            for(var i = 0; i < owner._children.length; ++i){
                if(child = owner._children[i]._channelNode){
                    channelNode.inputChannels.merge(child.finalOutputChannels, substitution);
                }
            }
            for(var i = 0; i < owner._children.length; ++i){
                if((child = owner._children[i]) && !child._channelNode){
                    var key = child._name + ";" + child._seqnr;
                    channelNode.inputChannels.addDataEntry(child._name, channelNode.inputSlots[key],
                        child._param, substitution);
                }
            }
        }
    }

    function setSubNodeProcessNode(subNode, channelNode, substitution)
    {
        subNode.processNode = channelNode.getProcessNode(substitution);
    }

    function setSubNodeProtoInputChannels(subNode, channelNode, substitution){
        mergeOperatorOutput(subNode, channelNode, substitution);

        var dataNode = channelNode.owner;
        if(dataNode._protoNode){
            var subSubstitution = new Xflow.Substitution(channelNode.protoInputChannels, substitution);
            subNode.protoSubNode = dataNode._protoNode._channelNode.getSubstitutionNode(subSubstitution);
        }
    }

    function mergeOperatorOutput(subNode, channelNode, substitution){
        var dataNode = channelNode.owner;
        channelNode.protoInputChannels.merge(channelNode.inputChannels, substitution);
        var procNode = subNode.processNode;
        if(procNode){
            var index = 0;
            for(var name in procNode.outputDataSlots){
                var destName = dataNode._computeOutputMapping.getScriptOutputName(index, name);
                if(destName){
                    channelNode.protoInputChannels.addOutputDataSlot(destName, procNode.outputDataSlots[name],
                        procNode, substitution);
                }
                index++;
            }
        }
    }

    function setSubNodeFinalOutputChannels(subNode, channelNode, substitution){
        var dataNode = channelNode.owner;
        dataNode._filterMapping.applyFilterOnChannelMap(channelNode.finalOutputChannels, channelNode.protoInputChannels,
            substitution, dataNode._filterType, setChannelMapChannel);

        if(subNode.protoSubNode){
            var protoChannelNode = subNode.protoSubNode.owner;
            var protoOutput = protoChannelNode.finalOutputChannels;
            dataNode._filterMapping.applyFilterOnChannelMap(channelNode.finalOutputChannels, protoOutput,
                subNode.protoSubNode.substitution, dataNode._filterType, setChannelMapChannel);
        }
    }

    function setChannelMapChannel(destMap, destName, srcMap, srcName, substitution){
        var channel = srcMap.getChannel(srcName, substitution);
        destMap.addChannel(destName, channel, substitution);
    }

    function markChannelsAsDone(channelNode, substitution){
        channelNode.inputChannels.markAsDone(substitution);
        channelNode.protoInputChannels.markAsDone(substitution);
        channelNode.finalOutputChannels.markAsDone(substitution);
    }



    function clearSubstitution(channelNode, substitution){
        channelNode.inputChannels.clearSubstitution(substitution);
        channelNode.protoInputChannels.clearSubstitution(substitution);
        channelNode.finalOutputChannels.clearSubstitution(substitution);
    }

})();

