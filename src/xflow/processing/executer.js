(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.Executer
//----------------------------------------------------------------------------------------------------------------------

    Xflow.Executer = function(ownerNode, platform){

        this.platform = platform;
        this.mergedNodes = [];
        this.subNodes = [];
        this.unprocessedDataNames = [];

        this.operatorList =  new Xflow.OperatorList();
        this.programData =  new Xflow.ProgramData();

        this.program = null;

        constructExecuter(this, ownerNode);
    }

    Xflow.Executer.prototype.run = function(){
        if(!runSubNodes(this))
            return false;

        /*
        if(!this.operatorList.checkInput(this.programData)){
            setMergedNodesValid(this, false);
            return false;
        }
        */

        updateIterateState(this);

        if(!this.program){
            this.program = Xflow.createProgram(this.operatorList);
        }

        if(this.program){
            this.operatorList.allocateOutput(this.programData);
            this.program.run(this.programData);
        }
    }

    Xflow.Executer.prototype.getVertexShader = function(){
        // TODO: Implement
    }


    function constructExecuter(executer, ownerNode){
        var cData = {
            blockedNodes: [],
            doneNodes: [],
            constructionOrder: [],
            inputSlots: {},
            finalOutput: null
        }
        initRequestNode(cData, executer, ownerNode);

        constructPreScan(cData, ownerNode);

        setConstructionOrderAndSubNodes(cData, executer, ownerNode);

        constructFromData(executer, cData);
    }

    function initRequestNode(cData, executer, ownerNode){
        if(ownerNode instanceof Xflow.RequestNode){
            cData.finalOutput = {};
            for(var name in ownerNode.filter){
                var channel = ownerNode.owner.finalOutputChannels.getChannel();
                if(channel && channel.creatorProcessNode)
                    cData.finalOutput[name] = channel.getDataEntry();
            }
            Xflow.nameset.add(executer.unprocessedDataNames, ownerNode.filter);
        }
    }

    function constructPreScan(cData, node){
        if(cData.blockedNodes.indexOf(node) != -1)
            return;

        if(node.operator){
            if(!canOperatorMerge(cData, node.operator)){
                blockSubtree(cData, node);
                return;
            }
            else{
                var mapping = node.operator.mapping;
                for(var i = 0; i < mapping.length; ++i){
                    if(mapping[i].sequence){
                        blockInput(cData, node, mapping[i].source);
                        blockInput(cData, node, mapping[i].keySource);
                    }
                    else if(mapping[i].array){
                        // TODO: Check for other things that cancel merging
                        blockInput(cData, node, mapping[i].source);
                    }
                }
            }
        }
        for(var i = 0; i < node.children.length; ++i){
            constructPreScan(cData, node.children[i]);
        }
    }

    function canOperatorMerge(cData, operator){
        // TODO: Detech merge support
        return false;
    }

    function blockSubtree(cData, node){
        if(cData.blockedNodes.indexOf(node) != -1)
            return;

        cData.blockedNodes.push(node);
        for(var i = 0; i < node.children.length; ++i){
            blockSubtree(cData, node.children[i]);
        }
    }

    function blockInput(cData, node, inputName){
        var channel = node.inputChannels[inputName];
        if(channel && channel.creatorProcessNode){
            blockSubtree(cData, channel.creatorProcessNode);
        }
    }

    function setConstructionOrderAndSubNodes(cData, executer, node){
        if(cData.doneNodes.indexOf(node) != -1)
            return;

        cData.doneNodes.push(node);

        if(cData.blockedNodes.indexOf(node) != -1){
            executer.subNodes.push(node);
        }
        else{
            for(var i = 0; i < node.children.length; ++i){
                setConstructionOrderAndSubNodes(cData, executer, node.children[i]);
            }

            if(node.operator){
                cData.constructionOrder.push(node);
            }
        }
    }

    function constructFromData(executer, cData){

        for(var i = 0; i < cData.constructionOrder.length; ++i){
            var node = data.constructionOrder[i];
            var currentIdx = i;

            var entry = new Xflow.OperatorEntry(node.operator);

            constructInputConnection(executer, entry, cData, node);

            constructOutputConnection(executer, entry, cData, node);

            executer.programData.operatorData.push({});
            executer.operatorList.addEntry(entry);
            executer.mergedNodes.push(node);

        }

        constructLostOutput(executer, cData);
    }

    function constructInputConnection(executer, entry, cData, node){
        var mapping = node.operator.mapping;
        for(var j = 0; j < mapping.length; ++j){
            var channel = node.inputChannels[mapping[j].source];
            var operatorIndex;
            if(channel.creatorProcessNode && (operatorIndex =
                executer.mergedNodes.indexOf(channel.creatorProcessNode) ) != -1 )
            {
                // it's transfer input
                var outputIndex = getOperatorOutputIndex(channel.creatorProcessNode, channel);
                entry.setTransferInput(j, operatorIndex, outputIndex);
                if(!executer.operatorList[operatorIndex].isFinalOutput(outputIndex))
                    executer.operatorList[operatorIndex].setTransferOutput(outputIndex);
                continue;
            }

            var mappedInputName = node.owner.owner._computeInputMapping.getScriptInputName(entry.paramIdx, entry.source);

            var connection = new Xflow.ProgramInputConnection();
            connection.channel = channel;
            connection.arrayAccess = mapping[j].array;
            connection.sequenceAccessType = mapping[j].sequence;
            if(connection.sequenceAccessType)
                connection.sequenceKeySourceChannel = node.inputChannels[mapping[j].keySource];

            var connectionKey = connection.getKey();
            var inputSlotIdx = cData.inputSlots[connectionKey];
            if(inputSlotIdx != undefined){
                // Direct input already exists
                entry.setDirectInput(j, inputSlotIdx, mappedInputName);
            }
            else{
                // new direct input
                inputSlotIdx = executer.programData.inputs.length;
                cData.inputSlots[connectionKey] = inputSlotIdx;
                executer.programData.inputs.push(connection);
                entry.setDirectInput(j, inputSlotIdx, mappedInputName);
            }
        }
    }

    function constructOutputConnection(executer, entry, cData, node){
        var outputs = node.operator.outputs;
        for(var i = 0; i < outputs.length; ++i){
            var slot = node.outputDataSlots[outputs[i].name];
            var finalOutputName = getFinalOutputName(slot, cData);
            if(finalOutputName){
                var index =  executer.programData.outputs.length;
                executer.programData.outputs.push(slot);
                entry.setFinalOutput(i, index);
                if(finalOutputName !== true){
                    Xflow.nameset.remove(executer.unprocessedDataNames, finalOutputName);
                }
            }
        }
    }


    function getOperatorOutputIndex(processNode, channel){
        var outputs = processNode.operator.outputs;
        for(var i = 0; i < outputs.length; ++i){
            if(channel.getDataEntry() == processNode.outputDataSlots[outputs[i].name].dataEntry){
                return i;
            }
        }
        return null;
    }

    function getFinalOutputName(dataSlot, cData){
        if(!cData.finalOutput)
            return true;
        for(var name in cData.finalOutput){
            if(cData.finalOutput[name] == dataSlot.dataEntry){
                return name;
            }
        }
        return false;
    }

    function constructLostOutput(executor, cData){
        for(var i = 0; i < cData.constructionOrder.length; ++i){
            var node = data.constructionOrder[i];
            var entry = executor.operatorList.entries[i];

            var outputs = node.operator.outputs;
            for(var j = 0; j < outputs.length; ++j){
                if(!entry.isFinalOutput(j) && ! entry.isTransferOutput(j)){
                    var index = executor.programData.outputs.length;
                    executor.programData.outputs.push(node.outputDataSlots[outputs[j].name]);
                    entry.setLostOutput(j, index);
                }
            }
        }
    }


    function updateIterateState(executer){
        var inputs = executer.programData.inputs;
        for(var i = 0; i < executer.programData.inputs.length; ++i){
            var entry = executer.programData.getDataEntry(i);
            var iterateCount = entry && entry.getIterateCount ? entry.getIterateCount() : 1;
            if(!inputs[i].arrayAccess && iterateCount > 1)
                executer.operatorList.setInputIterate(i, true);
            else
                executer.operatorList.setInputIterate(i, false);
            if(inputs[i].arrayAccess && platformRequiresArraySize(executer. platform)){
                executer.operatorList.setInputSize(i, iterateCount);
            }
        }
    }

    function platformRequiresArraySize(platform){
        return platform == Xflow.PLATFORM.GLSL;
    }


    function runSubNodes(executer){
        for(var i = 0; i < executer.subNodes.length; ++i){
            executer.subNodes[i].process();
            if(!executer.subNodes[i].valid)
                return false;
        }
    }

})();