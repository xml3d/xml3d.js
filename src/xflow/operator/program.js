/**
 *
 * @constructor
 */
var ProgramData = function(){
    this.inputs = [];
    this.outputs = [];
    this.operatorData = [];
}

ProgramData.prototype.getChannel = function(index){
    return this.inputs[index].channel;
}

ProgramData.prototype.getDataEntry = function(index){
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

var ProgramInputConnection = function(){
    this.channel = null;
    this.arrayAccess = false;
    this.sequenceAccessType = Xflow.SEQUENCE.NO_ACCESS;
    this.sequenceKeySourceChannel = null;
}

ProgramInputConnection.prototype.getKey = function(){
    return (this.channel ? this.channel.id : "NULL") + ";" + this.arrayAccess + ";" + this.sequenceAccessType + ";" +
    ( this.sequenceKeySourceChannel ? this.sequenceKeySourceChannel.id : "");
}


var c_program_cache = {};

var createProgram = function(operatorList){
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



var SingleProgram = function(operatorList){
    this.list = operatorList;
    this.entry = operatorList.entries[0];
    this.operator = this.entry.operator;
    this._inlineLoop = null;
}

SingleProgram.prototype.run = function(programData, asyncCallback){
    var operatorData = prepareOperatorData(this.list, 0, programData);

    if(asyncCallback)
        applyAsyncOperator(this.entry, programData, operatorData, asyncCallback);
    else if(this.operator.evaluate_core){
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
    handlePostProcessOutput(entry, programData, args, false);
}

function applyAsyncOperator(entry, programData, operatorData, asyncCallback){
    var args = assembleFunctionArgs(entry, programData, true);
    args.push(operatorData);
    args.push(function(){
        handlePostProcessOutput(entry, programData, args, true);
        asyncCallback();
    });
    entry.operator.evaluate_async.apply(operatorData, args);
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

    var c_FunctionPattern = /function\s*([^(]*)\(([^)]*)\)\s*\{([\s\S]*)\}/;

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
    if(!data.customData)
        data.customData = {};
    return data;
}

function assembleFunctionArgs(entry, programData, async){
    var args = [];
    var outputs = entry.operator.outputs;
    for(var i = 0; i < outputs.length; ++i){
        if(outputs[i].noAlloc){
            args.push({assign: null});
        }
        else{
            var dataSlot = programData.outputs[entry.getOutputIndex(i)];
            var dataEntry = async ? dataSlot.asyncDataEntry : dataSlot.dataEntry;
            args.push(dataEntry ? dataEntry.getValue() : null);
        }
    }
    addInputToArgs(args, entry, programData);
    return args;
}
function handlePostProcessOutput(entry, programData, parameters, async){
    var outputs = entry.operator.outputs;
    for(var i = 0; i < outputs.length; ++i){
        var dataSlot = programData.outputs[entry.getOutputIndex(i)];
        if(outputs[i].noAlloc){
            var dataEntry = async ? dataSlot.asyncDataEntry : dataSlot.dataEntry;
            if(dataEntry.type == Xflow.DATA_TYPE.TEXTURE ){
                dataEntry._setImage(parameters[i].assign);
            }
            else{
                dataEntry._setValue(parameters[i].assign);
            }
        }
        if(async){
            dataSlot.swapAsync();
        }
    }
}


function addInputToArgs(args, entry, programData){
    var mapping = entry.operator.mapping;
    for(var i = 0; i < mapping.length; ++i){
        var mapEntry = mapping[i];
        var dataEntry = programData.getDataEntry(entry.getDirectInputIndex(i));
        args.push(dataEntry ? dataEntry.getValue() : null);
    }
}


