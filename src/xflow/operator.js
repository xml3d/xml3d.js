(function(){

    var operators = {};

    function initOperator(operator){
        var indexMap = {};
        // Init types of outputs and params
        for(var i= 0; i < operator.outputs.length; ++i){
            operator.outputs[i].type = Xflow.DATA_TYPE_MAP[operator.outputs[i].type];
        }
        for(var i= 0; i < operator.params.length; ++i){
            operator.params[i].type = Xflow.DATA_TYPE_MAP[operator.params[i].type];
            indexMap[operator.params[i].source] = i;
        }
        if(!operator.mapping)
            operator.mapping = operator.params;

        // Init interTypes of mapping
        for(var i = 0; i < operator.mapping.length; ++i){
            var mapping = operator.mapping[i];
            var paramIdx = indexMap[mapping.source];
            mapping.paramIdx = paramIdx;
            var type = operator.params[paramIdx].type;
            if(mapping.sequence)
                mapping.keyParamIdx = indexMap[mapping.keySource];
            if(operator.mapping[i].sequence == Xflow.SEQUENCE.LINEAR_WEIGHT)
                type = Xflow.DATA_TYPE.FLOAT;
            operator.mapping[i].internalType = type;
        }
    }

    Xflow.registerOperator = function(name, data){
        var actualName = "xflow." + name;
        initOperator(data);
        operators[actualName] = data;
        data.name = actualName;
    };

    Xflow.getOperator = function(name){
        return operators[name];
    };

    var DataNode = Xflow.DataNode;

    function prepareInputs(operator, inputMapping, inputChannels, operatorInput){
        for(var i in operator.mapping){
            var mapping = operator.mapping[i];
            var sourceName = mapping.source;
            var dataName = inputMapping.getScriptInputName(mapping.paramIdx, sourceName);
            if(dataName){
                var channel = inputChannels[dataName];
                var keyValue = 0;
                if(mapping.sequence){
                    var keyName = inputMapping.getScriptInputName(mapping.keyParamIdx, mapping.keySource);
                    var keyChannel = inputChannels[keyName];
                    var keyEntry =  keyChannel ? keyChannel.getDataEntry() : null;
                    keyValue = keyEntry && keyEntry._value ? keyEntry._value[0] : 0;
                }
                operatorInput.push(channel ? channel.getDataEntry(mapping.sequence, keyValue) : null);
            }
            else
                operatorInput.push(null);
        }
    }

    function prepareOutputs(operator, outputs){
        for(var i in operator.outputs){
            var d = operator.outputs[i];
            if(!outputs[d.name])
                outputs[d.name] = new Xflow.Channel(this);
            var entry = outputs[d.name].getDataEntry();
            if(!entry){
                var type = d.type;
                if(type != Xflow.DATA_TYPE.TEXTURE){
                    entry = new Xflow.BufferEntry(type, null);
                }
                else{
                    entry = new Xflow.TextureEntry(null);
                }
                outputs[d.name].addDataEntry(entry, 0);
            }
        }
    }

    function inputIsIterating(inputInfo, dataEntry){
        return !inputInfo.array && dataEntry && dataEntry.getIterateCount() > 1;
    }

    function getIterateCount(operator, inputData, operatorData){
        var minCnt = -1;
        if(operatorData){
            operatorData.iterateKey = "";
            operatorData.iterFlag = {};
        }
        for(var i in operator.mapping){
            var inputInfo = operator.mapping[i];
            var dataEntry = inputData[i];
            if(!inputIsIterating(inputInfo, dataEntry)){
                if(operatorData) operatorData.iterateKey += "a";
                continue;
            }
            if(operatorData){
                operatorData.iterateKey += "i";
                operatorData.iterFlag[i] = true;
            }
            var cnt = dataEntry.getIterateCount();
            minCnt = minCnt == -1 ? cnt : Math.min(cnt, minCnt);
        }
        minCnt = minCnt == -1 ? 1 : minCnt;
        if(operatorData) operatorData.iterateCount = minCnt;
        return minCnt;
    }

    var c_FunctionPattern = /function\s+([^(]*)\(([^)]*)\)\s*\{([\s\S]*)\}/;

    function parseFunction(func){
        var result = {};
        var matches = func.toString().match(c_FunctionPattern);
        if(!matches){
            XML3D.debug.logError("Xflow Internal: Could not parse function: " + func);
            return null;
        }
        result.args = matches[2].split(",");
        for(var i in result.args) result.args[i] = result.args[i].trim();
        result.body = matches[3];
        return result;
    }

    var c_bracketPattern = /([^+\-*/\s\[]+)(\[)/;

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

        var inlineFunc = null;
        eval("inlineFunc = " + code + ";");
        return inlineFunc;
    }

    var c_sizes = {};

    function allocateOuput(operator, inputData, operatorData){
        if(operator.alloc){
            var args = [c_sizes];
            addInputToArgs(args, inputData);
            operator.alloc.apply(operatorData, args);
        }

        for(var i in operator.outputs){
            var d = operator.outputs[i];
            var entry = operatorData.outputs[d.name].getDataEntry();

            var size = (d.customAlloc ? c_sizes[d.name] : operatorData.iterateCount) * entry.getTupleSize();

            if( !entry._value || entry._value.length != size){
                switch(entry.type){
                    case Xflow.DATA_TYPE.FLOAT:
                    case Xflow.DATA_TYPE.FLOAT2:
                    case Xflow.DATA_TYPE.FLOAT3:
                    case Xflow.DATA_TYPE.FLOAT4:
                    case Xflow.DATA_TYPE.FLOAT4X4: entry._value = new Float32Array(size); break;
                    case Xflow.DATA_TYPE.INT:
                    case Xflow.DATA_TYPE.INT4:
                    case Xflow.DATA_TYPE.BOOL: entry._value = new Int32Array(size); break;
                    default: XML3D.debug.logWarning("Could not allocate output buffer of TYPE: " + entry.type);
                }
            }
        }
    }

    function assembleFunctionArgs(operator, inputData, operatorData){
        var args = [];
        for(var i in operator.outputs){
            var d = operator.outputs[i];
            var entry = operatorData.outputs[d.name].getDataEntry();
            args.push(entry ? entry._value : null);
        }
        addInputToArgs(args, inputData);
        return args;
    }

    function addInputToArgs(args, inputData){
        for(var i = 0; i < inputData.length; ++i){
            args.push(inputData[i] ? inputData[i]._value : null);
        }
    }

    function applyDefaultOperation(operator, inputData, operatorData){
        var args = assembleFunctionArgs(operator, inputData, operatorData);
        operator.evaluate.apply(operatorData, args);
    }

    function applyCoreOperation(operator, inputData, operatorData){
        var args = assembleFunctionArgs(operator, inputData, operatorData);
        args.push(operatorData.iterateCount);

        var key = operatorData.iterateKey;
        if(!operator._inlineLoop) operator._inlineLoop = {};
        if(!operator._inlineLoop[key]){
            operator._inlineLoop[key] = createOperatorInlineLoop(operator, operatorData);
        }
        operator._inlineLoop[key].apply(operatorData, args);
    }

    DataNode.prototype._applyOperator = function(inputChannels){
        if(!this._operatorData)
            this._operatorData = {
                outputs: {},
                iterateKey: null,
                iterFlag: {},
                iterateCount: 0
            }
        var operator = Xflow.getOperator(this._computeOperator);
        if(operator){

            var inputData = [];
            prepareInputs(operator, this._computeInputMapping, inputChannels, inputData);
            prepareOutputs(operator, this._operatorData.outputs);
            var count = getIterateCount(operator, inputData, this._operatorData);
            allocateOuput(operator, inputData, this._operatorData);

            if(operator.evaluate_core){
                applyCoreOperation(operator, inputData, this._operatorData);
            }
            else{
                applyDefaultOperation(operator, inputData, this._operatorData);
            }

            this._computeOutputMapping.applyScriptOutputOnMap(inputChannels, this._operatorData.outputs);
        }
    }

})();