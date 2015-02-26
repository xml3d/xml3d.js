/**
 * One operator execution within the @see{OperatorList}.
 * @param operator
 * @constructor
 */
var OperatorEntry = function (operator) {
    /**
     * Position in OperatorList
     * @type {number}
     */
    this.index = 0;

    /**
     * Operator object
     * @type {{}}
     */
    this.operator = operator;

    /**
     * operatorIndex: Position of the input's operator in the OperatorList if the input comes from
     * previously executed operator otherwise undefined
     * outputIndex: References the outputs of the operator object defined by the operatorIndex
     * mappedName: Original name as defined in operator invocation in DataNode (currently not used)
     * inputIndex: Only set if this is direct input and references into the inputs defined in @see{ProgramData}
     * @type {Array.<{operatorIndex: number?, outputIndex: number?, mappedName: string?, inputIndex: number?}>}
     */
    this.inputInfo = [];
    /**
     * finalOut: {number} Is set, if this output a final output (e.g. a varying in a vertex shader). References the outputs of the ProgramData.
     * transfer: {boolean} Is true if this is a transfer output i.e. this output is used as input by another operator,
     * lost: Data that is lost, i.e. not used in next executor. Reference to ProgramData's outputs
     * @type {Array.<{finalOut: number?, transfer: boolean?, lost: number?}>}
     */
    this.outputInfo = [];
};

/**
 * Is the input the result of a previously executed operator
 * @param mappingIndex Input index of the operator (can be mapped using a mapping declaration)
 * @returns {boolean}
 */
OperatorEntry.prototype.isTransferInput = function (mappingIndex) {
    return this.inputInfo[mappingIndex].operatorIndex !== undefined;
};

OperatorEntry.prototype.getTransferInputOperatorIndex = function (mappingIndex) {
    return this.inputInfo[mappingIndex].operatorIndex;
};
OperatorEntry.prototype.getTransferInputOutputIndex = function (mappingIndex) {
    return this.inputInfo[mappingIndex].outputIndex;
};

/**
 * Generate unique name for a specified transfer input
 * @param mappingIdx
 * @returns {string}
 */
OperatorEntry.prototype.getTransferInputId = function (mappingIdx) {
    var info = this.inputInfo[mappingIdx];
    return info.operatorIndex + "_" + info.outputIndex;
};

/**
 * Generate unique name for transfer output
 * @param outputIndex
 * @returns {string}
 */
OperatorEntry.prototype.getTransferOutputId = function (outputIndex) {
    return this.index + "_" + outputIndex;
};

/**
 * TODO: remove or integrate for debugging purposes
 * @unused
 * @param mappingIdx
 * @returns {string|*}
 */
OperatorEntry.prototype.getInputMappingName = function (mappingIdx) {
    return this.inputInfo[mappingIdx].mappedName;
};
OperatorEntry.prototype.getDirectInputIndex = function (mappingIdx) {
    return this.inputInfo[mappingIdx].inputIndex;
};

OperatorEntry.prototype.getOutputIndex = function (operatorOutputIdx) {
    return this.outputInfo[operatorOutputIdx].finalOut || this.outputInfo[operatorOutputIdx].lost || 0;
};


OperatorEntry.prototype.isFinalOutput = function (outputIndex) {
    return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].finalOut !== undefined;
};
OperatorEntry.prototype.isTransferOutput = function (outputIndex) {
    return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].transfer;
};
OperatorEntry.prototype.isLostOutput = function (outputIndex) {
    return this.outputInfo[outputIndex] && this.outputInfo[outputIndex].lost !== undefined;
};


OperatorEntry.prototype.setTransferInput = function (mappingIndex, operatorIndex, outputIndex) {
    this.inputInfo[mappingIndex] = {operatorIndex: operatorIndex, outputIndex: outputIndex};
};

OperatorEntry.prototype.setDirectInput = function (mappingIndex, inputIndex, mappedName) {
    this.inputInfo[mappingIndex] = {inputIndex: inputIndex, mappedName: mappedName};
};

OperatorEntry.prototype.setFinalOutput = function (operatorOutputIndex, globalOutputIndex) {
    this.outputInfo[operatorOutputIndex] = {finalOut: globalOutputIndex};
};
OperatorEntry.prototype.setTransferOutput = function (operatorOutputIndex) {
    this.outputInfo[operatorOutputIndex] = {transfer: true};
};
OperatorEntry.prototype.setLostOutput = function (operatorOutputIndex, globalOutputIndex) {
    this.outputInfo[operatorOutputIndex] = {lost: globalOutputIndex};
};

/**
 * Generate hash-able key for the entry
 * @returns {string}
 */
OperatorEntry.prototype.getKey = function () {
    var key = this.operator.name + "*O";
    for (var i = 0; i < this.outputInfo.length; ++i) {
        var info = this.outputInfo[i];
        key += "*" + ( info.transfer ? "_" : info.finalOut || (info.lost + "?"));
    }
    key += +"*I";
    for (i = 0; i < this.inputInfo.length; ++i) {
        info = this.inputInfo[i];
        key += "*" + (info.inputIndex ? info.inputInfo : info.operatorIndex + ">" + info.outputIndex);
    }
    return key;
};

module.exports = OperatorEntry;
