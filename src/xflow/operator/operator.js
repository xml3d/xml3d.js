(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.registerOperator && Xflow.getOperator
//----------------------------------------------------------------------------------------------------------------------

var operators = {};

Xflow.registerOperator = function(name, data){
    var actualName = "xflow." + name;
    initOperator(data);
    operators[actualName] = data;
    data.name = actualName;
};

Xflow.getOperator = function(name){
    if (!operators[name])
    {
        XML3D.debug.logError("Unknown operator: '" + name+"'");
        return null;
    }
    return operators[name];
};

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


//----------------------------------------------------------------------------------------------------------------------
// Xflow.DataNode Extension
//----------------------------------------------------------------------------------------------------------------------

var DataNode = Xflow.DataNode;

function prepareInputs(operator, inputChannels, operatorInput){
    for(var i in operator.mapping){
        var mapping = operator.mapping[i];
        var sourceName = mapping.source;
        var channel = inputChannels[sourceName];
        var keyValue = 0;
        if(mapping.sequence){
            var keyName = mapping.keySource;
            var keyChannel = inputChannels[keyName];
            var keyEntry =  keyChannel ? keyChannel.getDataEntry() : null;
            keyValue = keyEntry && keyEntry._value ? keyEntry._value[0] : 0;
        }
        operatorInput.push(channel ? channel.getDataEntry(mapping.sequence, keyValue) : null);
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

var c_sizes = {};

function allocateOutput(operator, inputData, output, operatorData){
    if(operator.alloc){
        var args = [c_sizes];
        addInputToArgs(args, inputData);
        operator.alloc.apply(operatorData, args);
    }

    for(var i in operator.outputs){
        var d = operator.outputs[i];
        var entry = output[d.name].dataEntry;

        if (entry.type == Xflow.DATA_TYPE.TEXTURE) {
            // texture entry
            // FIXME What to do when d.customAlloc == false ?
            var texParams = (d.customAlloc ? c_sizes[d.name] : operatorData.iterateCount /* WRONG */);
            var newWidth = texParams.imageFormat.width;
            var newHeight = texParams.imageFormat.height;

            var entryImage = entry.getImage();
            if (!entryImage || entryImage.width != newWidth || entryImage.height != newHeight) {
                // create dummy image
                var img = new Image();
                img.setAttribute('style', 'width:'+newWidth+'px;height:'+newHeight+'px;border:none;display:block');
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
                img.width = newWidth;
                img.height = newHeight;
                entry.setImage(img);
                // FIXME What to do with texParams.samplerConfig ? There is no function entry.setSamplerConfig.
                entry._samplerConfig.set(texParams.samplerConfig);
            } else {
                entry.notifyChanged();
            }
        } else {
            // buffer entry
            var size = (d.customAlloc ? c_sizes[d.name] : operatorData.iterateCount) * entry.getTupleSize();

            if( !entry._value || entry._value.length != size){
                switch(entry.type){
                    case Xflow.DATA_TYPE.FLOAT:
                    case Xflow.DATA_TYPE.FLOAT2:
                    case Xflow.DATA_TYPE.FLOAT3:
                    case Xflow.DATA_TYPE.FLOAT4:
                    case Xflow.DATA_TYPE.FLOAT4X4: entry.setValue(new Float32Array(size)); break;
                    case Xflow.DATA_TYPE.INT:
                    case Xflow.DATA_TYPE.INT4:
                    case Xflow.DATA_TYPE.BOOL: entry.setValue(new Int32Array(size)); break;
                    default: XML3D.debug.logWarning("Could not allocate output buffer of TYPE: " + entry.type);
                }
            }
            else{
                entry.notifyChanged();
            }
        }
    }
}

function assembleFunctionArgs(operator, inputData, outputData){
    var args = [];
    for(var i in operator.outputs){
        var d = operator.outputs[i];
        var entry = outputData[d.name].dataEntry;
        var value = entry ?
            (entry.type == Xflow.DATA_TYPE.TEXTURE ? entry.getImageManipulator() : entry._value) :
            null;
        args.push(value);
    }
    addInputToArgs(args, inputData);
    return args;
}

function addInputToArgs(args, inputData){
    for(var i = 0; i < inputData.length; ++i){
        var entry = inputData[i];
        var value = entry ?
            (entry.type == Xflow.DATA_TYPE.TEXTURE ? entry.getImageManipulator() : entry._value) :
            null;
        args.push(value);
    }
}

function applyDefaultOperation(operator, inputData, outputData, operatorData){
    var args = assembleFunctionArgs(operator, inputData, outputData);
    args.push(operatorData);
    operator.evaluate.apply(operatorData, args);
}

function applyCoreOperation(operator, inputData, outputData, operatorData){
    var args = assembleFunctionArgs(operator, inputData, outputData);
    args.push(operatorData.iterateCount);

    var key = operatorData.iterateKey;
    if(!operator._inlineLoop) operator._inlineLoop = {};
    if(!operator._inlineLoop[key]){
        operator._inlineLoop[key] = createOperatorInlineLoop(operator, operatorData);
    }
    operator._inlineLoop[key].apply(operatorData, args);
}

Xflow.ProcessNode.prototype.applyOperator = function(){
    if(!this._operatorData)
        this._operatorData = {
            iterateKey: null,
            iterFlag: {},
            iterateCount: 0
        }
    var inputData = [];
    prepareInputs(this.operator, this.inputChannels, inputData);
    var count = getIterateCount(this.operator, inputData, this._operatorData);
    allocateOutput(this.operator, inputData, this.outputDataSlots, this._operatorData);

    if(this.operator.evaluate_core){
        applyCoreOperation(this.operator, inputData, this.outputDataSlots, this._operatorData);
    }
    else{
        applyDefaultOperation(this.operator, inputData, this.outputDataSlots, this._operatorData);
    }
    for (var i in this.outputDataSlots) {
        var entry = this.outputDataSlots[i].dataEntry;
        if (entry.finish)
            entry.finish();
    }
}

})();
