var Base = require("../base.js");
var C = require("../interface/constants");

/**
 *
 * @param  {OperatorList} operatorList
 * @constructor
 */
    var JSMergeProgram = function(operatorList){
        this.list = operatorList;
        this.entry = operatorList.entries[0];
        this.operator = this.entry.operator;
        this._inlineLoop = null;
    };

    JSMergeProgram.prototype.run = function(programData){
        var operatorData = prepareOperatorData(this.list, 0, programData);

        if(this.operator.evaluate_core){
            applyCoreOperation(this, programData, operatorData);
        }
        else{
            applyDefaultOperation(this.entry, programData, operatorData);
        }
    };

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
            Base.notifyError("Xflow Internal: Could not parse function: " + func);
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
                    tupleCnt = C.DATA_TYPE_TUPLE_SIZE[[operator.outputs[argIdx].type]];
                }
                else{
                    var i = argIdx - operator.outputs.length;
                    addIndex = operatorData.iterFlag[i];
                    tupleCnt = C.DATA_TYPE_TUPLE_SIZE[operator.mapping[i].internalType];
                }
            }

            result += code.substring(index, bracketIndex) + "[";
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
            var doIterate = entry.isTransferInput(i) || list.isInputIterate(entry.getDirectInputIndex(i));
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


module.exports = JSMergeProgram;
