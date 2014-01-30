(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.OperatorList
//----------------------------------------------------------------------------------------------------------------------

    Xflow.OperatorEntry = function(operator){
        this.index = 0;
        this.operator = operator;
        this.inputInfo = [];
        this.outputInfo = [];
    }
    Xflow.OperatorEntry.prototype.isTransferInput = function(mappingIndex){
        return this.inputInfo[mappingIndex].operatorIndex !== undefined;
    }
    Xflow.OperatorEntry.prototype.getTransferInputOperatorIndex = function(mappingIndex){
        return this.inputInfo[mappingIndex].operatorIndex;
    }
    Xflow.OperatorEntry.prototype.getTransferInputOutputIndex = function(mappingIndex){
        return this.inputInfo[mappingIndex].outputIndex;
    }

    Xflow.OperatorEntry.prototype.getTransferInputId = function(mappingIdx){
        var info = this.inputInfo[mappingIdx];
        return info.operatorIndex + "_" + info.outputIndex;
    }
    Xflow.OperatorEntry.prototype.getTransferOutputId = function(outputIndex){
        return this.index + "_" + outputIndex;
    }

    Xflow.OperatorEntry.prototype.getInputMappingName = function(mappingIdx){
        return this.inputInfo[mappingIdx].mappedName;
    }
    Xflow.OperatorEntry.prototype.getDirectInputIndex = function(mappingIdx){
        return this.inputInfo[mappingIdx].inputIndex;
    }

    Xflow.OperatorEntry.prototype.getOutputIndex = function(operatorOutputIdx){
        return this.outputInfo[operatorOutputIdx].finalOut || this.outputInfo[operatorOutputIdx].lost || 0;
    }


    Xflow.OperatorEntry.prototype.isFinalOutput = function(outputIndex){
        return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].finalOut !== undefined;
    }
    Xflow.OperatorEntry.prototype.isTransferOutput = function(outputIndex){
        return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].transfer;
    }
    Xflow.OperatorEntry.prototype.isLostOutput = function(outputIndex){
        return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].lost !== undefined;
    }


    Xflow.OperatorEntry.prototype.setTransferInput = function(mappingIndex, operatorIndex, outputIndex){
        this.inputInfo[mappingIndex] = { operatorIndex: operatorIndex, outputIndex: outputIndex};
    }

    Xflow.OperatorEntry.prototype.setDirectInput = function(mappingIndex, inputIndex, mappedName){
        this.inputInfo[mappingIndex] = { inputIndex: inputIndex, mappedName: mappedName };
    }

    Xflow.OperatorEntry.prototype.setFinalOutput = function(operatorOutputIndex, globalOutputIndex){
        this.outputInfo[operatorOutputIndex] = { finalOut : globalOutputIndex };
    }
    Xflow.OperatorEntry.prototype.setTransferOutput = function(operatorOutputIndex){
        this.outputInfo[operatorOutputIndex] = { transfer: true };
    }
    Xflow.OperatorEntry.prototype.setLostOutput = function(operatorOutputIndex, globalOutputIndex){
        this.outputInfo[operatorOutputIndex] = { lost: globalOutputIndex};
    }

    Xflow.OperatorEntry.prototype.getKey = function(){
        var key = this.operator.name + "*O";
        for(var i = 0; i <this.outputInfo.length; ++i){
            var info = this.outputInfo[i];
            key += "*" + ( info.transfer ? "_" : info.finalOut || (info.lost + "?"));
        }
        key += + "*I";
        for(var i = 0; i <this.inputInfo.length; ++i){
            var info = this.inputInfo[i];
            key += "*" + (info.inputIndex ? info.inputInfo : info.operatorIndex + ">" + info.outputIndex);
        }
        return key;
    }

    Xflow.OperatorList = function(platform, graph){
        this.graph = graph;
        this.platform = platform;
        this.entries = [];
        this.inputInfo = {};
    }

    Xflow.OperatorList.prototype.addEntry = function(entry){
        entry.index = this.entries.length;
        this.entries.push(entry);
    }

    Xflow.OperatorList.prototype.getKey = function(){
        var keys = [];
        for(var i = 0; i < this.entries.length; ++i){
            keys.push(this.entries[i].getKey());
        }
        var result = this.platform + ">" + keys.join("!") + "|";
        for(var i in this.inputInfo){
            result += i + ">" + (this.inputInfo[i].iterate || 0) + "x" + (this.inputInfo[i].size || 0);
        }
        return result;
    }

    Xflow.OperatorList.prototype.setInputIterateType = function(inputIndex, type){
        if(!this.inputInfo[inputIndex]) this.inputInfo[inputIndex] = {};
        this.inputInfo[inputIndex].iterate = type;
    }
    Xflow.OperatorList.prototype.setInputSize = function(inputIndex, size){
        if(!this.inputInfo[inputIndex]) this.inputInfo[inputIndex] = {};
        this.inputInfo[inputIndex].size = size;
    }


    Xflow.OperatorList.prototype.isInputIterate = function(inputIndex){
        return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].iterate == Xflow.ITERATION_TYPE.MANY;
    }
    Xflow.OperatorList.prototype.isInputUniform = function(inputIndex){
        return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].iterate == Xflow.ITERATION_TYPE.ONE;
    }
    Xflow.OperatorList.prototype.isInputNull = function(inputIndex){
        return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].iterate == Xflow.ITERATION_TYPE.NULL;
    }
    Xflow.OperatorList.prototype.getInputIterateType = function(inputIndex){
        return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].iterate;
    }

    Xflow.OperatorList.prototype.getInputSize = function(inputIndex){
        return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].size || 0;
    }

    Xflow.OperatorList.prototype.getIterateCount = function(programData){
        var count = -1;
        for(var i = 0; i < programData.inputs.length; ++i){
            if(this.isInputIterate(i)){
                var dataEntry = programData.getDataEntry(i);
                if(dataEntry && dataEntry.getIterateCount){
                    var size = dataEntry.getIterateCount();
                    count = count < 0 ? size : Math.min(size, count);
                }
            }
        }
        return count < 0 ? 1 : count;
    }

    var c_sizes = {};

    Xflow.OperatorList.prototype.allocateOutput = function(programData){
        for(var i = 0; i < this.entries.length; ++i){
            var entry = this.entries[i];
            var operator = entry.operator;
            var operatorData = programData.operatorData[i];
            var iterateCount = this.getIterateCount(programData);
            if(operator.alloc){
                var args = [c_sizes];
                addInputToArgs(args, entry, programData);
                args.push(iterateCount);
                operator.alloc.apply(operatorData, args);
            }
            for(var j = 0; j < operator.outputs.length; ++j){
                var d = operator.outputs[j];
                var dataEntry = programData.outputs[entry.getOutputIndex(j)].dataEntry;


                if (dataEntry.type == Xflow.DATA_TYPE.TEXTURE) {
                    // texture entry
                    if (d.customAlloc)
                    {
                        var texParams = c_sizes[d.name];
                        var newWidth = texParams.imageFormat.width;
                        var newHeight = texParams.imageFormat.height;
                        var newFormatType = texParams.imageFormat.type;
                        var newSamplerConfig = texParams.samplerConfig;
                        dataEntry._createImage(newWidth, newHeight, newFormatType, newSamplerConfig);
                    } else if (d.sizeof) {
                        var srcEntry = null;
                        for(var k = 0; k < operator.mapping.length; ++k){
                            if (operator.mapping[k].source == d.sizeof) {
                                srcEntry = programData.getDataEntry(entry.getDirectInputIndex(k));
                                break;
                            }
                        }
                        if (srcEntry) {
                            var newWidth = Math.max(srcEntry.getWidth(), 1);
                            var newHeight = Math.max(srcEntry.getHeight(), 1);
                            var newFormatType = d.formatType || srcEntry.getFormatType();
                            var newSamplerConfig = d.samplerConfig || srcEntry.getSamplerConfig();
                            dataEntry._createImage(newWidth, newHeight, newFormatType, newSamplerConfig);
                        }
                        else
                            throw new Error("Unknown texture input parameter '" + d.sizeof+"' in operator '"+operator.name+"'");
                    } else
                        throw new Error("Cannot create texture. Use customAlloc or sizeof parameter attribute");
                } else {

                    var size = (d.customAlloc ? c_sizes[d.name] : iterateCount) * dataEntry.getTupleSize();

                    if( !dataEntry._value || dataEntry._value.length != size){
                        switch(dataEntry.type){
                            case Xflow.DATA_TYPE.FLOAT:
                            case Xflow.DATA_TYPE.FLOAT2:
                            case Xflow.DATA_TYPE.FLOAT3:
                            case Xflow.DATA_TYPE.FLOAT4:
                            case Xflow.DATA_TYPE.FLOAT4X4: dataEntry._setValue(new Float32Array(size)); break;
                            case Xflow.DATA_TYPE.INT:
                            case Xflow.DATA_TYPE.INT4:
                            case Xflow.DATA_TYPE.BOOL: dataEntry._setValue(new Int32Array(size)); break;
                            default: XML3D.debug.logWarning("Could not allocate output buffer of TYPE: " + dataEntry.type);
                        }
                    }
                    else{
                        dataEntry._notifyChanged();
                    }
                }
            }
        }
    }

    /*
    Xflow.OperatorList.prototype.checkInput = function(programData){
        for(var i = 0; i < this.entries.length; ++i){
            var entry = this.entries[i];
            var mapping = entry.operator.mapping;
            for(var j = 0; j < mapping.length; ++j){
                if(entry.isTransferInput(j)){
                    var outputType = this.entries[entry.getTransferInputOperatorIndex(j)].operator.outputs[
                        entry.getTransferInputOutputIndex(j)].type;

                    if(outputType != entry.type){
                        XML3D.debug.logError("Xflow: operator " + entry.operator.name + ": Input for " + entry.source +
                            " has wrong type. Expected: " + Xflow.getTypeName(entry.type)
                            + ", but got: " +  Xflow.getTypeName(outputType) );
                        return false;
                    }

                }
                else{
                    var mappingName = entry.getInputMappingName(j);
                    if(!entry.optional && !mappingName){
                        XML3D.debug.logError("Xflow: operator " + entry.operator.name + ": Missing input argument for "
                            + entry.source);
                        return false;
                    }
                    if(mappingName){
                        var channel = programData.getChannel(entry.getDirectInputIndex(j));
                        if(!channel){
                            XML3D.debug.logError("Xflow: operator " + entry.operator.name + ": Input of name '" + mappingName +
                                "' not found. Used for parameter " + entry.source);
                            return false;
                        }
                        var dataEntry = channel.getDataEntry();
                        if(!entry.optional && (!dataEntry || dataEntry.getLength() == 0)){
                            XML3D.debug.logError("Xflow: operator " + entry.operator.name + ": Input for " + entry.source +
                                ' contains no data.');
                            return false;
                        }
                        if(dataEntry && dataEntry.type != entry.type){
                            XML3D.debug.logError("Xflow: operator " + entry.operator.name + ": Input for " + entry.source +
                                " has wrong type. Expected: " + Xflow.getTypeName(entry.type)
                                + ", but got: " +  Xflow.getTypeName(dataEntry.type) );
                            return false;
                        }
                    }
                }
            }
        }
    }
    */




    Xflow.ProgramData = function(){
        this.inputs = [];
        this.outputs = [];
        this.operatorData = [];
    }

    Xflow.ProgramData.prototype.getChannel = function(index){
        return this.inputs[index].channel;
    }

    Xflow.ProgramData.prototype.getDataEntry = function(index){
        var entry = this.inputs[index];
        var channel = entry.channel;
        if(!channel) return null;
        var key = 0;
        if(entry.sequenceKeySourceChannel){
            var keyDataEntry = entry.sequenceKeySourceChannel.getDataEntry();
            key = keyDataEntry && keyDataEntry._value ? keyDataEntry._value[0] : 0;
        }

        return channel.getDataEntry(entry.sequenceAccessType, key);
    }

    Xflow.ProgramInputConnection = function(){
        this.channel = null;
        this.arrayAccess = false;
        this.sequenceAccessType = Xflow.SEQUENCE.NO_ACCESS;
        this.sequenceKeySourceChannel = null;
    }

    Xflow.ProgramInputConnection.prototype.getKey = function(){
        return (this.channel ? this.channel.id : "NULL") + ";" + this.arrayAccess + ";" + this.sequenceAccessType + ";" +
        ( this.sequenceKeySourceChannel ? this.sequenceKeySourceChannel.id : "");
    }


    var c_program_cache = {};

    Xflow.createProgram = function(operatorList){
        var firstOperator;

        if(operatorList.entries.length === 0) {
            return null;
        }

        firstOperator = operatorList.entries[0].operator;

        var key = operatorList.getKey();
        if(!c_program_cache[key]){
            // GLSL operators are implemented in a different way, so platform information is fetched from the operatorList
            // as a fallback mode to not break the old implementations
            if(operatorList.platform === Xflow.PLATFORM.GLSL){
                c_program_cache[key] = new Xflow.VSProgram(operatorList);

            } else if (firstOperator.platform === Xflow.PLATFORM.CL) {
                c_program_cache[key] = new Xflow.CLProgram(operatorList);

            }else if(firstOperator.platform === Xflow.PLATFORM.JAVASCRIPT && operatorList.entries.length === 1 ) {
                c_program_cache[key] = new Xflow.SingleProgram(operatorList);

            }else {
                Xflow.notifyError("Could not create program from operatorList");
            }
        }
        return c_program_cache[key];
    }



    Xflow.SingleProgram = function(operatorList){
        this.list = operatorList;
        this.entry = operatorList.entries[0];
        this.operator = this.entry.operator;
        this._inlineLoop = null;
    }

    Xflow.SingleProgram.prototype.run = function(programData){
        var operatorData = prepareOperatorData(this.list, 0, programData);

        if(this.operator.evaluate_core){
            applyCoreOperation(this, programData, operatorData);
        }
        else{
            applyDefaultOperation(this.entry, programData, operatorData);
        }
    }

    function applyDefaultOperation(entry, programData, operatorData){
        var args = assembleFunctionArgs(entry, programData);
        args.push(operatorData);
        entry.operator.evaluate.apply(operatorData, args);
    }

    function applyCoreOperation(program, programData, operatorData){
        var args = assembleFunctionArgs(program.entry, programData);
        args.push(operatorData.iterateCount);

        if(!program._inlineLoop){
            program._inlineLoop = createOperatorInlineLoop(program.operator, operatorData);
        }
        program._inlineLoop.apply(operatorData, args);
    }

    var c_VarPattern = /var\s+(.)+[;\n]/;
    var c_InnerVarPattern = /[^=,\s]+\s*(=[^,]+)?(,)?/;
    function createOperatorInlineLoop(operator, operatorData){

        var code = "function (";
        var funcData = parseFunction(operator.evaluate_core);
        code += funcData.args.join(",") + ",__xflowMax) {\n";
        code += "    var __xflowI = __xflowMax\n" +
            "    while(__xflowI--){\n";

        var body = funcData.body;
        body = replaceArrayAccess(body, funcData.args, operator, operatorData);
        code += body + "\n  }\n}";

        var inlineFunc = eval("(" + code + ")");
        return inlineFunc;
    }

    var c_FunctionPattern = /function\s+([^(]*)\(([^)]*)\)\s*\{([\s\S]*)\}/;

    function parseFunction(func){
        var result = {};
        var matches = func.toString().match(c_FunctionPattern);
        if(!matches){
            Xflow.notifyError("Xflow Internal: Could not parse function: " + func);
            return null;
        }
        result.args = matches[2].split(",");
        for(var i in result.args) result.args[i] = result.args[i].trim();
        result.body = matches[3];
        return result;
    }

    var c_bracketPattern = /([a-zA-Z_$][\w$]*)(\[)/;

    function replaceArrayAccess(code, args, operator, operatorData){
        var result = "";
        var index = 0, bracketIndex = code.indexOf("[", index);
        while(bracketIndex != -1){
            var key = code.substr(index).match(c_bracketPattern)[1];

            var argIdx = args.indexOf(key);
            var addIndex = false, tupleCnt = 0;
            if(argIdx != -1){
                if(argIdx < operator.outputs.length){
                    addIndex = true;
                    tupleCnt = Xflow.DATA_TYPE_TUPLE_SIZE[[operator.outputs[argIdx].type]];
                }
                else{
                    var i = argIdx - operator.outputs.length;
                    addIndex = operatorData.iterFlag[i];
                    tupleCnt = Xflow.DATA_TYPE_TUPLE_SIZE[operator.mapping[i].internalType];
                }
            }

            result += code.substring(index, bracketIndex) + "["
            if(addIndex){
                result += tupleCnt + "*__xflowI + ";
            }
            index = bracketIndex + 1;
            bracketIndex = code.indexOf("[", index);
        }
        result +=  code.substring(index);
        return result;
    }


    function prepareOperatorData(list, idx, programData){
        var data = programData.operatorData[0];
        var entry = list.entries[idx];
        var mapping = entry.operator.mapping;
        data.iterFlag = {};
        for(var i = 0; i < mapping.length; ++i){
            var doIterate = (entry.isTransferInput(i) || list.isInputIterate(entry.getDirectInputIndex(i)));
            data.iterFlag[i] = doIterate;
        }
        data.iterateCount = list.getIterateCount(programData);
        return data;
    }

    function assembleFunctionArgs(entry, programData){
        var args = [];
        var outputs = entry.operator.outputs;
        for(var i = 0; i < outputs.length; ++i){
            var d = outputs[i];
            var dataEntry = programData.outputs[entry.getOutputIndex(i)].dataEntry;
            args.push(dataEntry ? dataEntry.getValue() : null);
        }
        addInputToArgs(args, entry, programData);
        return args;
    }

    function addInputToArgs(args, entry, programData){
        var mapping = entry.operator.mapping;
        for(var i = 0; i < mapping.length; ++i){
            var mapEntry = mapping[i];
            var dataEntry = programData.getDataEntry(entry.getDirectInputIndex(i));
            args.push(dataEntry ? dataEntry.getValue() : null);
        }
    }


}());