(function(){

//----------------------------------------------------------------------------------------------------------------------
// Xflow.OperatorList
//----------------------------------------------------------------------------------------------------------------------

    Xflow.OperatorEntry = function(operator){
        this.index = 0;
        this.operator = operator;
        this.inputInfo = {};
        this.outputInfo = {};
    }
    Xflow.OperatorEntry.prototype.isTransferInput = function(name){
        return !!this.inputInfo[name].operatorIndex;
    }

    Xflow.OperatorEntry.prototype.getTransferInputId = function(name){
        var info = this.inputInfo[name];
        return info.operatorIndex + "_" + info.outputName;
    }

    Xflow.OperatorEntry.prototype.setTransferInput = function(name, operatorIndex, outputName){
        this.inputInfo[name] = { operatorIndex: operatorIndex, outputName: outputName};
    }

    Xflow.OperatorEntry.prototype.setDirectInput = function(name, inputIndex){
        this.inputInfo[name] = { inputIndex: inputIndex };
    }

    Xflow.OperatorEntry.prototype.setFinalOutput = function(name, outputIndex){
        this.outputInfo[name] = { final : outputIndex };
    }
    Xflow.OperatorEntry.prototype.setTransferOutput = function(name){
        this.outputInfo[name] = { transfer: true };
    }
    Xflow.OperatorEntry.prototype.setLostOutput = function(name, outputIndex){
        this.outputInfo[name] = { lost: outputIndex};
    }

    Xflow.OperatorEntry.prototype.getKey = function(){
        var key = this.operator.name + "*O";
        for(var name in this.outputInfo){
            var info = this.outputInfo[name];
            key += "*" + ( info.transfer ? "_" : info.final || (info.lost + "?"));
        }
        key += + "*I";
        for(var name in this.inputInfo){
            var info = this.inputInfo[name];
            key += "*" + (info.inputIndex ? info.inputInfo : info.operatorIndex + ">" + info.outputName);
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

    Xflow.OperatorList.prototype.isInputIterate = function(inputIndex){
        return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].iterate;
    }
    Xflow.OperatorList.prototype.getInputSize = function(inputIndex){
        return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].size || 0;
    }

    Xflow.OperatorList.prototype.getExecutionCount = function(programData){
        //TODO: Implement
    }

    Xflow.OperatorList.prototype.checkInput = function(programData){
        //TODO: Implement
    }

}());