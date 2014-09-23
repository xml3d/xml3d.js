(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.Executer
//----------------------------------------------------------------------------------------------------------------------

    Xflow.Executer = function(ownerNode, platform){

        this.platform = platform;
        this.mergedNodes = [];
        this.mergedOutputNodes = [];
        this.subNodes = [];
        this.unprocessedDataNames = [];

        /**
         *  TODO: Maybe we should just store the cl-platform objects in XFlow.cl so they are more easily available and
         *  to avoid long prototype chains. Or we could pass the graph context to each node of the graph.
         *  However, it would be good to allow each Graph object to have at least own context, cmdQueue and kernelManager.
         *  e.g. passing graph information here requires a long prototype chain
         */
        this.operatorList =  new Xflow.OperatorList(platform, ownerNode.owner.owner._graph);
        this.programData =  new Xflow.ProgramData();

        this.program = null;

        constructExecuter(this, ownerNode);
    }

    Xflow.Executer.prototype.isProcessed = function(){
        var i = this.mergedOutputNodes.length;
        while(i--){
            if(this.mergedOutputNodes[i].status != Xflow.PROCESS_STATE.PROCESSED)
                return false;
        }
        return true;
    }


    Xflow.Executer.prototype.run = function(asyncCallback){
        runSubNodes(this);
        updateIterateState(this);

        this.program = Xflow.createProgram(this.operatorList);

        if(this.program){
            this.operatorList.allocateOutput(this.programData, !!asyncCallback);
            this.program.run(this.programData, asyncCallback);
        }
        if(this.platform != Xflow.PLATFORM.ASYNC){
            var i = this.mergedOutputNodes.length;
            while(i--){
                this.mergedOutputNodes[i].status = Xflow.PROCESS_STATE.PROCESSED;
            }
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
        var requestNode = initRequestNode(cData, executer, ownerNode);

        var noOperators = false;
        constructPreScan(cData, ownerNode, executer.platform, noOperators);

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
            return true;
        }
        return false;
    }

    function constructPreScan(cData, node, platform, noOperators){
        if(cData.blockedNodes.indexOf(node) != -1)
            return;

        if(node.operator){
            if(noOperators || !canUseOperator(cData, node.operator, platform)){
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
            constructPreScan(cData, node.children[i], platform, noOperators);
        }
    }

    function canUseOperator(cData, operator, platform){

        if(!operator.platforms[platform]) return false;

        var shadeJsSupport = (Xflow.shadejs.hasSupport() && operator.evaluate_shadejs);

        if(cData.firstOperator && !shadeJsSupport)
            return false; // We can only merge with shadeJs Operators

        if(platform == Xflow.PLATFORM.GLSL_VS || platform == Xflow.PLATFORM.GLSL_FS){
            if(!shadeJsSupport) return false;
        }

        return true;
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

            var entry = new Xflow.OperatorEntry(node.operator);

            constructInputConnection(executer, entry, cData, node);

            var isOutputNode = constructOutputConnection(executer, entry, cData, node);

            executer.programData.operatorData.push({});
            executer.operatorList.addEntry(entry);
            executer.mergedNodes.push(node);
            if(isOutputNode || (i == cData.constructionOrder.length-1))
                executer.mergedOutputNodes.push(node)

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

            var mappedInputName = mapping[j].source;
            if(node.owner.owner._computeInputMapping)
                mappedInputName = node.owner.owner._computeInputMapping.getScriptInputName(mapping[j].paramIdx, mapping[j].source);

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
        var isOutputNode = true;
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
            else{
                isOutputNode = false;
            }
        }
        return isOutputNode;
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
        return platform == Xflow.PLATFORM.GLSL_VS;
    }


    function runSubNodes(executer){
        for(var i = 0; i < executer.subNodes.length; ++i){
            executer.subNodes[i].process();
        }
    }

})();