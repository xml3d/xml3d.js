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
    Xflow.OperatorEntry.prototype.isTransferInput = function(paramIndex){
        return !!this.inputInfo[paramIndex].operatorIndex;
    }
    Xflow.OperatorEntry.prototype.getTransferInputOperatorIndex = function(paramIndex){
        return this.inputInfo[paramIndex].operatorIndex;
    }
    Xflow.OperatorEntry.prototype.getTransferInputOutputIndex = function(paramIndex){
        return this.inputInfo[paramIndex].outputIndex;
    }

    Xflow.OperatorEntry.prototype.getTransferInputId = function(paramIdx){
        var info = this.inputInfo[paramIdx];
        return info.operatorIndex + "_" + info.outputIndex;
    }

    Xflow.OperatorEntry.prototype.getInputMappingName = function(paramIdx){
        return this.inputInfo[paramIdx].mappedName;
    }
    Xflow.OperatorEntry.prototype.getDirectInputIndex = function(paramIdx){
        return this.inputInfo[paramIdx].inputIndex;
    }


    Xflow.OperatorEntry.prototype.isFinalOutput = function(outputIndex){
        return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].final != undefined;
    }
    Xflow.OperatorEntry.prototype.isTransferOutput = function(outputIndex){
        return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].transfer;
    }
    Xflow.OperatorEntry.prototype.isLostOutput = function(outputIndex){
        return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].lost !== undefined;
    }


    Xflow.OperatorEntry.prototype.setTransferInput = function(paramIndex, operatorIndex, outputIndex){
        this.inputInfo[paramIndex] = { operatorIndex: operatorIndex, outputIndex: outputIndex};
    }

    Xflow.OperatorEntry.prototype.setDirectInput = function(paramIndex, inputIndex, mappedName){
        this.inputInfo[paramIndex] = { inputIndex: inputIndex, mappedName: mappedName };
    }

    Xflow.OperatorEntry.prototype.setFinalOutput = function(operatorOutputIndex, globalOutputIndex){
        this.outputInfo[operatorOutputIndex] = { final : globalOutputIndex };
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
            key += "*" + ( info.transfer ? "_" : info.final || (info.lost + "?"));
        }
        key += + "*I";
        for(var i = 0; i <this.inputInfo.length; ++i){
            var info = this.inputInfo[i];
            key += "*" + (info.inputIndex ? info.inputInfo : info.operatorIndex + ">" + info.outputIndex);
        }
        return key;
    }

    Xflow.OperatorList = function(){
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
        var result = keys.join("!") + "|";
        for(var i in this.inputInfo){
            result += i + ">" + (this.inputInfo[i].iterate || false) + "x" + (this.inputInfo[i].size || 0);
        }
        return result;
    }

    Xflow.OperatorList.prototype.setInputIterate = function(inputIndex, value){
        if(this.inputInfo[inputIndex]) this.inputInfo[inputIndex] = {};
        this.inputInfo[inputIndex].iterate = value;
    }
    Xflow.OperatorList.prototype.setInputSize = function(inputIndex, size){
        if(this.inputInfo[inputIndex]) this.inputInfo[inputIndex] = {};
        this.inputInfo[inputIndex].size = size;
    }


    Xflow.OperatorList.prototype.isInputIterate = function(inputIndex){
        return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].iterate;
    }
    Xflow.OperatorList.prototype.getInputSize = function(inputIndex){
        return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].size || 0;
    }

    Xflow.OperatorList.prototype.getExecutionCount = function(programData){
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

    Xflow.OperatorList.prototype.checkInput = function(programData){
        for(var i = 0; i < this.entries.length; ++i){
            var entry = this.entries[i];
            var params = entry.operator.params;
            for(var j = 0; j < params.length; ++j){
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




    Xflow.ProgramData = function(){
        this.inputs = [];
        this.outputs = [];
    }

    Xflow.ProgramData.prototype.getChannel = function(index){
        return this.inputs[index].channel;
    }

    Xflow.ProgramInputConnection = function(){
        this.channel = null;
        this.arrayAccess = false;
        this.sequenceAccessType = Xflow.SEQUENCE.NO_ACCESS;
        this.sequenceKeySourceChannel = null;
    }

    Xflow.ProgramInputConnection.prototype.getKey = function(){
        return this.channel.id + ";" + this.arrayAccess + ";" + this.sequenceAccessType + ";" +
        ( this.sequenceKeySourceChannel ? this.sequenceKeySourceChannel.id : "");
    }

}());