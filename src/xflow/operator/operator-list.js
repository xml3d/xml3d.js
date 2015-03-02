var C = require("../interface/constants");
var Base = require("../base.js");


/**
 * List of platform-specific operators, ordered by execution (last entry is last operator
 * executed).
 *
 * @param {C.PLATFORM} platform
 * @constructor
 */
var OperatorList = function (platform) {
    this.platform = platform;
    /**
     * @type {Array.<OperatorEntry>}
     */
    this.entries = [];

    /**
     * Map from position of input parameter to size and iterator type of parameters.
     * Size is only specified for uniform array input, required for programs that
     * have the array size specified.
     * @type {Object.<number,{size: number, iterate: C.ITERATION_TYPE}>}
     */
    this.inputInfo = {};
};

OperatorList.prototype.addEntry = function (entry) {
    entry.index = this.entries.length;
    this.entries.push(entry);
};

/**
 * Hashable key for whole list
 * @returns {string}
 */
OperatorList.prototype.getKey = function () {
    var keys = [];
    for (var i = 0; i < this.entries.length; ++i) {
        keys.push(this.entries[i].getKey());
    }
    var result = this.platform + ">" + keys.join("!") + "|";
    for (var i in this.inputInfo) {
        result += i + ">" + (this.inputInfo[i].iterate || 0) + "x" + (this.inputInfo[i].size || 0);
    }
    return result;
};

OperatorList.prototype.setInputIterateType = function (inputIndex, type) {
    if (!this.inputInfo[inputIndex]) this.inputInfo[inputIndex] = {};
    this.inputInfo[inputIndex].iterate = type;
};
OperatorList.prototype.setInputSize = function (inputIndex, size) {
    if (!this.inputInfo[inputIndex]) this.inputInfo[inputIndex] = {};
    this.inputInfo[inputIndex].size = size;
};


OperatorList.prototype.isInputIterate = function (inputIndex) {
    return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].iterate == C.ITERATION_TYPE.MANY;
};
OperatorList.prototype.isInputUniform = function (inputIndex) {
    return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].iterate == C.ITERATION_TYPE.ONE;
};
OperatorList.prototype.isInputNull = function (inputIndex) {
    return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].iterate == C.ITERATION_TYPE.NULL;
};
OperatorList.prototype.getInputIterateType = function (inputIndex) {
    return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].iterate;
};

OperatorList.prototype.getInputSize = function (inputIndex) {
    return this.inputInfo[inputIndex] && this.inputInfo[inputIndex].size || 0;
};

OperatorList.prototype.getIterateCount = function (programData) {
    var count = -1;
    for (var i = 0; i < programData.inputs.length; ++i) {
        if (this.isInputIterate(i)) {
            var dataEntry = programData.getDataEntry(i);
            if (dataEntry && dataEntry.getIterateCount) {
                var size = dataEntry.getIterateCount();
                count = count < 0 ? size : Math.min(size, count);
            }
        }
    }
    return count < 0 ? 1 : count;
};

var c_sizes = {};

OperatorList.prototype.allocateOutput = function (programData, async) {
    for (var i = 0; i < this.entries.length; ++i) {
        var entry = this.entries[i];
        var operator = entry.operator;
        var operatorData = programData.operatorData[i];
        var iterateCount = this.getIterateCount(programData);
        if (operator.alloc) {
            var args = [c_sizes];
            addInputToArgs(args, entry, programData);
            args.push(iterateCount);
            operator.alloc.apply(operatorData, args);
        }
        for (var j = 0; j < operator.outputs.length; ++j) {
            var d = operator.outputs[j];
            var dataSlot = programData.outputs[entry.getOutputIndex(j)], dataEntry;
            dataEntry = async ? dataSlot.asyncDataEntry : dataSlot.dataEntry;

            if (d.noAlloc)
                continue;

            if (dataEntry.type == C.DATA_TYPE.TEXTURE) {
                // texture entry
                if (d.customAlloc) {
                    var texParams = c_sizes[d.name];
                    var newWidth = texParams.imageFormat.width;
                    var newHeight = texParams.imageFormat.height;
                    var newType = texParams.imageFormat.texelType;
                    var newFormat = texParams.imageFormat.texelFormat;
                    var newSamplerConfig = texParams.samplerConfig;
                    dataEntry._createImage(newWidth, newHeight, newFormat, newType, newSamplerConfig);
                } else if (d.sizeof) {
                    var srcEntry = null;
                    for (var k = 0; k < operator.mapping.length; ++k) {
                        if (operator.mapping[k].source == d.sizeof) {
                            srcEntry = programData.getDataEntry(entry.getDirectInputIndex(k));
                            break;
                        }
                    }
                    if (srcEntry) {
                        var newWidth = Math.max(srcEntry.width, 1);
                        var newHeight = Math.max(srcEntry.height, 1);
                        var newFormat = d.texelFormat || srcEntry.texelFormat;
                        var newType = d.texelType || srcEntry.texelType;
                        var newSamplerConfig = d.samplerConfig || srcEntry.getSamplerConfig();
                        dataEntry._createImage(newWidth, newHeight, newFormat, newType, newSamplerConfig);
                    } else
                        throw new Error("Unknown texture input parameter '" + d.sizeof + "' in operator '" + operator.name + "'");
                } else
                    throw new Error("Cannot create texture. Use customAlloc or sizeof parameter attribute");
            } else {

                var size = (d.customAlloc ? c_sizes[d.name] : iterateCount) * dataEntry.getTupleSize();

                if (!dataEntry._value || dataEntry._value.length != size) {
                    switch (dataEntry.type) {
                        case C.DATA_TYPE.FLOAT:
                        case C.DATA_TYPE.FLOAT2:
                        case C.DATA_TYPE.FLOAT3:
                        case C.DATA_TYPE.FLOAT4:
                        case C.DATA_TYPE.FLOAT4X4:
                            dataEntry._setValue(new Float32Array(size));
                            break;
                        case C.DATA_TYPE.INT:
                        case C.DATA_TYPE.INT4:
                        case C.DATA_TYPE.BOOL:
                            dataEntry._setValue(new Int32Array(size));
                            break;
                        default:
                            XML3D.debug.logWarning("Could not allocate output buffer of TYPE: " + dataEntry.type);
                    }
                } else {
                    dataEntry._notifyChanged();
                }
            }
        }
    }
};

/*
 OperatorList.prototype.checkInput = function(programData){
 for(var i = 0; i < this.entries.length; ++i){
 var entry = this.entries[i];
 var mapping = entry.operator.mapping;
 for(var j = 0; j < mapping.length; ++j){
 if(entry.isTransferInput(j)){
 var outputType = this.entries[entry.getTransferInputOperatorIndex(j)].operator.outputs[
 entry.getTransferInputOutputIndex(j)].type;

 if(outputType != entry.type){
 XML3D.debug.logError("Xflow: operator " + entry.operator.name + ": Input for " + entry.source +
 " has wrong type. Expected: " + C.getTypeName(entry.type)
 + ", but got: " +  C.getTypeName(outputType) );
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
 " has wrong type. Expected: " + C.getTypeName(entry.type)
 + ", but got: " +  C.getTypeName(dataEntry.type) );
 return false;
 }
 }
 }
 }
 }
 }
 */

    // TODO: This function appears in multiple units
    function addInputToArgs(args, entry, programData){
        var mapping = entry.operator.mapping;
        for(var i = 0; i < mapping.length; ++i){
            var mapEntry = mapping[i];
            var dataEntry = programData.getDataEntry(entry.getDirectInputIndex(i));
            args.push(dataEntry ? dataEntry.getValue() : null);
        }
    };

module.exports = OperatorList;
