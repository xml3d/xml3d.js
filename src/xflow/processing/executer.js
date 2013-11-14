(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.Executer
//----------------------------------------------------------------------------------------------------------------------

    Xflow.Executer = function(ownerNode, platform){

        this.platform = platform;
        this.mergedNodes = [];
        this.subNodes = [];
        this.unprocessedDataNames = [];

        this.operatorList =  new Xflow.OperatorList(platform);
        this.programData =  new Xflow.ProgramData();

        this.program = null;

        constructExecuter(this, ownerNode);
    }

    Xflow.Executer.prototype.run = function(){
        runSubNodes(this);
        updateIterateState(this);

        this.program = Xflow.createProgram(this.operatorList);

        if(this.program){
            this.operatorList.allocateOutput(this.programData);
            this.program.run(this.programData);
        }
    }

    Xflow.Executer.prototype.getVertexShader = function(){
        runSubNodes(this);
        updateIterateState(this);

        this.program = Xflow.createProgram(this.operatorList);

        return this.program;
    }


    function constructExecuter(executer, ownerNode){
        var cData = {
            blockedNodes: [],
            doneNodes: [],
            constructionOrder: [],
            inputSlots: {},
            finalOutput: null,
            firstOperator: null
        }
        initRequestNode(cData, executer, ownerNode);

        constructPreScan(cData, ownerNode, executer.platform);

        setConstructionOrderAndSubNodes(cData, executer, ownerNode);

        constructFromData(executer, cData);
    }

    function initRequestNode(cData, executer, ownerNode){
        if(ownerNode instanceof Xflow.RequestNode){
            cData.finalOutput = {};
            var filter = ownerNode.filter || ownerNode.owner.outputChannels.getNames();
            for(var i = 0; i < filter.length; ++i){
                var name = filter[i];
                var channel = ownerNode.owner.outputChannels.getChannel(name);
                if(channel && channel.creatorProcessNode)
                    cData.finalOutput[name] = channel.getDataEntry();
            }
            Xflow.nameset.add(executer.unprocessedDataNames, filter);
        }
    }

    function constructPreScan(cData, node, platform){
        if(cData.blockedNodes.indexOf(node) != -1)
            return;

        if(node.operator){
            if(!canOperatorMerge(cData, node.operator, platform)){
                blockSubtree(cData, node);
                return;
            }
            else{
                if(!cData.firstOperator) cData.firstOperator = node.operator;
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
            constructPreScan(cData, node.children[i], platform);
        }
    }

    function canOperatorMerge(cData, operator, platform){
        // TODO: Detect merge support
        return !cData.firstOperator ||
            (platform == Xflow.PLATFORM.GLSL && cData.firstOperator.evaluate_glsl && operator.evaluate_glsl);
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
            var node = cData.constructionOrder[i];
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
            if(channel && channel.creatorProcessNode && (operatorIndex =
                executer.mergedNodes.indexOf(channel.creatorProcessNode) ) != -1 )
            {
                // it's transfer input
                var outputIndex = getOperatorOutputIndex(channel.creatorProcessNode, channel);
                entry.setTransferInput(j, operatorIndex, outputIndex);
                if(!executer.operatorList.entries[operatorIndex].isFinalOutput(outputIndex))
                    executer.operatorList.entries[operatorIndex].setTransferOutput(outputIndex);
                continue;
            }

            var mappedInputName = node.owner.owner._computeInputMapping.getScriptInputName(mapping[j].paramIdx,
                mapping[j].source);

            var connection = new Xflow.ProgramInputConnection();
            connection.channel = channel;
            connection.arrayAccess = mapping[j].array || false;
            connection.sequenceAccessType = mapping[j].sequence || 0;
            if(connection.sequenceAccessType)
                connection.sequenceKeySourceChannel = node.inputChannels[mapping[j].keySource];

            var connectionKey = connection.getKey();
            var inputSlotIdx = cData.inputSlots[connectionKey];
            if(channel && inputSlotIdx != undefined){
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
            var node = cData.constructionOrder[i];
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
            var iterateCount = entry ? entry.getIterateCount ? entry.getIterateCount() : 1 : 0;
            if(!iterateCount)
                executer.operatorList.setInputIterateType(i, Xflow.ITERATION_TYPE.NULL);
            else if(!inputs[i].arrayAccess && iterateCount > 1)
                executer.operatorList.setInputIterateType(i, Xflow.ITERATION_TYPE.MANY);
            else
                executer.operatorList.setInputIterateType(i, Xflow.ITERATION_TYPE.ONE);

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
        }
    }

})();