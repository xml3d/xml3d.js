var Base = require("../base.js");
var C = require("../interface/constants");

/**
 * A DataSlot wraps a dataEntry and adds a key value for sequences.
 * This structure is used internally within channels and process nodes
 * @constructor
 * @param {DataEntry} dataEntry
 * @param {number=} key
 */
var DataSlot = function(dataEntry, key){
    this.key = key || 0;            // sequence key
    this.dataEntry = dataEntry;     // dataEntry of the slot
    /**
     * alternative dataEntry for asynchronous processing
     * only used for output DataSlots of asynchronous operators
     * @type {DataEntry}
     */
    this.asyncDataEntry = null;
    /**
     * list of all channels that contain this DataSlot
     * @type {Array.<Channel>}
     */
    this.parentChannels = [];

};
DataSlot.prototype.addChannel = function(channel){
    this.parentChannels.push(channel);
};
DataSlot.prototype.removeChannel = function(channel){
    var idx = this.parentChannels.indexOf(channel);
    if(idx != -1) this.parentChannels.splice(idx, 1);
};
DataSlot.prototype.swapAsync = function(){
    var tmp = this.dataEntry;
    this.dataEntry = this.asyncDataEntry;
    this.asyncDataEntry = tmp;
};

DataSlot.prototype.setDataEntry = function(dataEntry, changeType){
    this.dataEntry = dataEntry;
    var state = changeType == C.RESULT_STATE.CHANGED_DATA_VALUE ? C.DATA_ENTRY_STATE.CHANGED_VALUE :
        C.DATA_ENTRY_STATE.CHANGED_SIZE;
    this.notifyOnChange(state);
};

DataSlot.prototype.notifyOnChange = function(state){
    for(var i = 0; i < this.parentChannels.length; ++i){
        this.parentChannels[i].notifyOnChange(state);
    }
};

module.exports = DataSlot;
