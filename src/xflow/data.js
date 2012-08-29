(function(){


/**
 * @enum {number}
 */
Xflow.DataNotifications = {
    CHANGED_CONTENT: 0,
    CHANGE_SIZE: 1,
    CHANGE_REMOVED: 2
};

/**
 * @constructor
 */
var SamplerConfig = function(){
    this.filterMin = 0;
    this.filterMag = 0;
    this.filterMip = 0;
    this.wrapS = 0;
    this.wrapT = 0;
    this.wrapU = 0;
    this.textureType = 0;
    this.colorR = 0;
    this.colorG = 0;
    this.colorB = 0;
};
Xflow.SamplerConfig = SamplerConfig;

/**
 * @enum {number}
 */
SamplerConfig.FILTER_TYPE = {
    NONE: 0,
    REPEAT: 1,
    LINEAR: 2
};
/**
 * @enum {Number}
 */
SamplerConfig.WRAP_TYPE = {
    CLAMP: 0,
    REPEAT: 1,
    BORDER: 2
};
/**
 * @enum {Number}
 */
SamplerConfig.WRAP_TYPE = {
    TEXTURE_1D: 0,
    TEXTURE_2D: 1,
    TEXTURE_3D: 2
};



/**
 * @constructor
 */
var DataEntry = function(){
    /** @private */
    this.listener = [];
};
Xflow.DataEntry = DataEntry;



/**
 * @param {function(Xflow.DataEntry, Xflow.DataEntry.NOTIFICATION)} callback
 */
DataEntry.prototype.addListener = function(callback){
    this.listeners.push(callback);
};
/**
 * @param {function(Xflow.DataEntry, Xflow.DataEntry.NOTIFICATION)} callback
 */
DataEntry.prototype.removeListener = function(callback){
    Array.erase(this.listeners, callback);
};

/**
 *
 * @param {XML3D.xflow.DataEntry} dataEntry
 * @param {} notification
 */
function notifyListeners(dataEntry, notification){
    for(var i = 0; i < dataEntry.listeners.length; ++i){
        dataEntry.listeners[i](dataEntry, notification);
    }
};

/**
 * @constructor
 * @extends {Xflow.DataEntry}
 * @param {Xflow.BufferEntry.TYPE} type
 * @param {Object} value
 */
var BufferEntry = function(type, value){
    this._type = type;
    this._value = value;
};
XML3D.createClass(BufferEntry, Xflow.DataEntry);
Xflow.BufferEntry = BufferEntry;

Object.defineProperty(BufferEntry.prototype, "type", {
    set: function(v){
        throw "type is read-only";
    },
    get: function(){ return this._type; }
});
Object.defineProperty(BufferEntry.prototype, "value", {
    set: function(v){
        // TODO: Check for correct type
        var newSize = this._value.length != v.length;
        this._value = v;
        notifyListeners(this, newSize ? Xflow.DataNotifications.CHANGE_SIZE : Xflow.DataNotifications.CHANGED_CONTENT);
    },
    get: function(){ return this._value; }
});



})();