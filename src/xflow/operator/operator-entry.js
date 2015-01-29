var OperatorEntry = function (operator) {
    this.index = 0;
    this.operator = operator;
    this.inputInfo = [];
    this.outputInfo = [];
}
OperatorEntry.prototype.isTransferInput = function (mappingIndex) {
    return this.inputInfo[mappingIndex].operatorIndex !== undefined;
}
OperatorEntry.prototype.getTransferInputOperatorIndex = function (mappingIndex) {
    return this.inputInfo[mappingIndex].operatorIndex;
}
OperatorEntry.prototype.getTransferInputOutputIndex = function (mappingIndex) {
    return this.inputInfo[mappingIndex].outputIndex;
}

OperatorEntry.prototype.getTransferInputId = function (mappingIdx) {
    var info = this.inputInfo[mappingIdx];
    return info.operatorIndex + "_" + info.outputIndex;
}
OperatorEntry.prototype.getTransferOutputId = function (outputIndex) {
    return this.index + "_" + outputIndex;
}

OperatorEntry.prototype.getInputMappingName = function (mappingIdx) {
    return this.inputInfo[mappingIdx].mappedName;
}
OperatorEntry.prototype.getDirectInputIndex = function (mappingIdx) {
    return this.inputInfo[mappingIdx].inputIndex;
}

OperatorEntry.prototype.getOutputIndex = function (operatorOutputIdx) {
    return this.outputInfo[operatorOutputIdx].finalOut || this.outputInfo[operatorOutputIdx].lost || 0;
}


OperatorEntry.prototype.isFinalOutput = function (outputIndex) {
    return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].finalOut !== undefined;
}
OperatorEntry.prototype.isTransferOutput = function (outputIndex) {
    return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].transfer;
}
OperatorEntry.prototype.isLostOutput = function (outputIndex) {
    return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].lost !== undefined;
}


OperatorEntry.prototype.setTransferInput = function (mappingIndex, operatorIndex, outputIndex) {
    this.inputInfo[mappingIndex] = {operatorIndex: operatorIndex, outputIndex: outputIndex};
}

OperatorEntry.prototype.setDirectInput = function (mappingIndex, inputIndex, mappedName) {
    this.inputInfo[mappingIndex] = {inputIndex: inputIndex, mappedName: mappedName};
}

OperatorEntry.prototype.setFinalOutput = function (operatorOutputIndex, globalOutputIndex) {
    this.outputInfo[operatorOutputIndex] = {finalOut: globalOutputIndex};
}
OperatorEntry.prototype.setTransferOutput = function (operatorOutputIndex) {
    this.outputInfo[operatorOutputIndex] = {transfer: true};
}
OperatorEntry.prototype.setLostOutput = function (operatorOutputIndex, globalOutputIndex) {
    this.outputInfo[operatorOutputIndex] = {lost: globalOutputIndex};
}

OperatorEntry.prototype.getKey = function () {
    var key = this.operator.name + "*O";
    for (var i = 0; i < this.outputInfo.length; ++i) {
        var info = this.outputInfo[i];
        key += "*" + ( info.transfer ? "_" : info.finalOut || (info.lost + "?"));
    }
    key += +"*I";
    for (var i = 0; i < this.inputInfo.length; ++i) {
        var info = this.inputInfo[i];
        key += "*" + (info.inputIndex ? info.inputInfo : info.operatorIndex + ">" + info.outputIndex);
    }
    return key;
}

module.exports = OperatorEntry;
