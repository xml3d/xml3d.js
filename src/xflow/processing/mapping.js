var Base = require("../base.js");
var C = require("./../interface/constants.js");


var orderMappingParser = /^([^:,{}]+)(,[^:{},]+)*$/;
var nameMappingParser = /^\{(([^:,{}]+:[^:{},]+)(,[^:{},]+:[^:},]+)*)}$/;

/**
 * A mapping used for a filter or a compute properties of a DataNode
 * @abstract
 */
var Mapping = function(){
    /**
     * @type {Array<DataNode>}
     */
    this._owners = [];
};

/**
 * Parse a Mapping (both C.OrderMapping or C.ComputeMapping) from a syntax string.
 * @param {string} string The syntax string.
 * @param {C.DataNode} dataNode DataNode of the Mapping
 * @returns {?C.Mapping}
 */
Mapping.parse = function(string, dataNode){
	if (!string)
		return null;
    string = string.trim();
    var results = string.trim().match(orderMappingParser);
    if(results)
        return OrderMapping.parse(string, dataNode);
    results = string.trim().match(nameMappingParser);
    if(results)
        return NameMapping.parse(results[1], dataNode);
    Base.notifyError("Cannot parse name mapping '" + string + "'", dataNode);
    return null;
};

/**
 *
 * @param {DataNode} owner
 * @private
 */
Mapping.prototype._addOwner = function(owner){
    var idx = this._owners.indexOf(owner);
    if(idx == -1)
        this._owners.push(owner);
};

/**
 *
 * @param {DataNode} owner
 * @private
 */
Mapping.prototype._removeOwner = function(owner){
    var idx = this._owners.indexOf(owner);
    if(idx != -1)
        this._owners.splice(idx, -1);
};


//----------------------------------------------------------------------------------------------------------------------
// OrderMapping
//----------------------------------------------------------------------------------------------------------------------

/**
 * An OrderMapping used for a filter or compute properties of a DataNode
 * It describes a mapping of names referring to the order of arguments / output values.
 * OrderMapping syntax examples in compute:
 * position = C.morph(position, posAdd, weight)
 * @constructor
 * @extends {Mapping}
 */
var OrderMapping = function(){
    Mapping.call(this);
    this._names = [];
};
Base.createClass(OrderMapping, Mapping);

OrderMapping.parse = function(string, dataNode){
    var mapping = new OrderMapping(dataNode);
    var token = string.split(",");
    for(var i = 0; i < token.length; i++){
        mapping._names.push(token[i].trim());
    }
    return mapping;
};


Object.defineProperty(OrderMapping.prototype, "length", {
    set: function(){ throw new Error("length is read-only");
    },
    get: function(){ return this._names.length; }
});

OrderMapping.prototype.getName = function(idx){
    return this._names[idx];
};

OrderMapping.prototype.clear = function(){
    this._names = [];
    mappingNotifyOwner(this);
};

OrderMapping.prototype.setName = function(index, name){
    this._names[index] = name;
    mappingNotifyOwner(this);
};


//noinspection JSUnusedGlobalSymbols
OrderMapping.prototype.removeName = function(index){
    this._names.splice(index,1);
    mappingNotifyOwner(this);
};

OrderMapping.prototype.isEmpty = function(){
    return this._names.length == 0;
};

/**
 *
 * @param {ChannelMap} destMap
 * @param {ChannelMap} sourceMap
 * @param {exports.C.DATA_FILTER_TYPE} filterType
 * @param {function(ChannelMap, string, ChannelMap, string)} callback
 */
OrderMapping.prototype.applyFilterOnChannelMap = function(destMap, sourceMap, filterType, callback){
    var i;
    if(filterType == C.DATA_FILTER_TYPE.KEEP){
        for(i = 0; i < this._names.length; ++i){
            var name = this._names[i];
            if(sourceMap.map[name]) {
                callback(destMap, name, sourceMap, name);
            }
        }
    }
    else{
        for(i in sourceMap.map){
            var idx = this._names.indexOf(i);
            if(filterType == C.DATA_FILTER_TYPE.RENAME ||
                (filterType == C.DATA_FILTER_TYPE.REMOVE && idx == -1))
                callback(destMap, i, sourceMap, i);
        }
    }
};

/**
 * Return the name of the input value assigned to operator argument.
 * Returns null, if no mapping is defined.
 * @param {number} index Position of the operator argument
 * @returns {string|null}
 */
OrderMapping.prototype.getScriptInputName = function(index /*, destName */){
    if(this._names[index])
        return this._names[index];
    else
        return null;
};

/**
 * Returns the name of the output parameter as it should be used for the
 * following dataflow. Returns null, if no mapping is defined.
 * @param index
 * @returns {string|null}
 */
OrderMapping.prototype.getScriptOutputName = function(index /*, srcName */){
    if(this._names[index])
        return this._names[index];
    else
        return null;
};

/**
 * Returns the inverse name of the output parameter as it should be used for the
 * following dataflow. Returns null, if no mapping is defined.
 * @param {string} destName
 * @param {array<object>} operatorOutputs
 * @returns {string|null}
 */
OrderMapping.prototype.getScriptOutputNameInv = function(destName, operatorOutputs){
    var index = this._names.indexOf(destName);
    if(index == -1)
        return null;
    return operatorOutputs[index].name;
};

/**
 * Identity function. Used to implement interface. Usually you don't rename with order
 * mapping.
 * @param name
 * @returns {string}
 */
OrderMapping.prototype.getRenameSrcName = function(name){
    return name;
};

//----------------------------------------------------------------------------------------------------------------------
// NameMapping
//----------------------------------------------------------------------------------------------------------------------

/**
 * An NameMapping used for a filter or compute properties of a DataNode
 * It describes a mapping of names referring to the original names of the arguments / output values.
 * NameMapping syntax examples in compute:
 * {position: result} = C.morph({value: position, valueAdd: posAdd, weight: weight})
 * @constructor
 * @extends {Mapping}
 */
var NameMapping = function(){
    Mapping.call(this);
    this._destNames = [];
    this._srcNames = [];

};
Base.createClass(NameMapping, Mapping);

NameMapping.parse = function(string, dataNode)  {
    var mapping = new NameMapping(dataNode);
    var token = string.split(",");
    for(var i = 0; i < token.length; i++){
        var pair = token[i].split(":");
        var dest = pair[0].trim(); var src = pair[1].trim();
        mapping.setNamePair(dest, src);
    }
    return mapping;
};

Object.defineProperty(NameMapping.prototype, "length", {
    set: function(){ throw new Error("length is read-only");
    },
    get: function(){ return this._srcNames.length; }
});

NameMapping.prototype.getDestName = function(idx){
    return this._destNames[idx];
};
NameMapping.prototype.getSrcName = function(idx){
    return this._srcNames[idx];
};

NameMapping.prototype.getSrcNameFromDestName = function(destName){
    var idx = this._destNames.indexOf(destName);
    return idx == -1 ? null : this._srcNames[idx];
};
NameMapping.prototype.getDestNameFromSrcName = function(srcName){
    var idx = this._srcNames.indexOf(srcName);
    return idx == -1 ? null : this._destNames[idx];
};

NameMapping.prototype.clear = function(){
    this._srcNames = [];
    this._destNames = [];
    mappingNotifyOwner(this);
};

NameMapping.prototype.setNamePair = function(destName, srcName){
    var idx = this._destNames.indexOf(destName);
    if(idx != -1){
        this._destNames.splice(idx,1);
        this._srcNames.splice(idx,1);
    }
    this._destNames.push(destName);
    this._srcNames.push(srcName);
    mappingNotifyOwner(this);
};

//noinspection JSUnusedGlobalSymbols
NameMapping.prototype.removeNamePair = function(destName){
    var idx = this._destNames.indexOf(destName);
    if(idx != -1){
        this._destNames.splice(idx,1);
        this._srcNames.splice(idx,1);
    }
    mappingNotifyOwner(this);
};

NameMapping.prototype.isEmpty = function(){
    return this._destNames.length == 0;
};

/**
 * @see OrderMapping.applyFilterOnChannelMap
 * @param {ChannelMap} destMap
 * @param {ChannelMap} sourceMap
 * @param {C.DATA_FILTER_TYPE} filterType
 * @param {function} callback
 */
NameMapping.prototype.applyFilterOnChannelMap = function(destMap, sourceMap, filterType, callback) {
    var i;
    if(filterType == C.DATA_FILTER_TYPE.REMOVE){
        for(i in sourceMap.map)
            if(this._srcNames.indexOf(i) == -1)
                callback(destMap, i, sourceMap, i);
    }
    else{
        if(filterType == C.DATA_FILTER_TYPE.RENAME){
            for(i in sourceMap.map)
                if(this._srcNames.indexOf(i) == -1)
                    callback(destMap, i, sourceMap, i);
        }
        for(i in this._destNames){
            callback(destMap, this._destNames[i], sourceMap, this._srcNames[i]);
        }
    }
};

/**
 * Renames: Look-up the destination name and return the source name
 * @param {string} name
 * @returns {string}
 */
NameMapping.prototype.getRenameSrcName = function(name){
    return this.getSrcNameFromDestName(name) || name;
};

/**
 * Return the name of the input value assigned to operator argument
 * @param {number} index Position of the operator argument
 * @param {string} destinationName Name of the operator argument
 * @returns {string|null}
 */
NameMapping.prototype.getScriptInputName= function(index, destinationName){
    return this.getSrcNameFromDestName(destinationName);
};

/**
 * @see OrderMapping.getScriptOutputName
 */
NameMapping.prototype.getScriptOutputName = function(index, srcName){
    return this.getDestNameFromSrcName(srcName);
};

/**
 * @see OrderMapping.getScriptOutputNameInv
 */
NameMapping.prototype.getScriptOutputNameInv = function(destName /*, operatorOutputs */){
    var index = this._destNames.indexOf(destName);
    if(index == -1)
        return null;
    return this._srcNames[index];
};

/**
 * Notify all DataNodes that use the mapping passed to the function
 * @param {Mapping} mapping
 */
function mappingNotifyOwner(mapping){
    for(var i = 0; i < mapping._owners.length; ++i) {
        mapping._owners[i].notify(C.RESULT_STATE.CHANGED_STRUCTURE);
    }
    Base._flushResultCallbacks();
}
module.exports = {
    NameMapping: NameMapping,
    OrderMapping: OrderMapping,
    Mapping: Mapping
};
