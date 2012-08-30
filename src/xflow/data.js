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
};
Xflow.DataEntry = DataEntry;


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

/**
 * Type of Buffer
 * @enum
 */
BufferEntry.TYPE = {
    FLOAT: 0,
    FLOAT2 : 1,
    FLOAT3 : 2,
    FLOAT4 : 3,
    FLOAT4X4 : 10,
    INT : 20,
    INT4 : 21,
    BOOL: 30
}

Object.defineProperty(BufferEntry.prototype, "type", {
    /** @param {Xflow.BufferEntry.TYPE} v */
    set: function(v){
        throw "type is read-only";
    },
    /** @return {Xflow.BufferEntry.TYPE} */
    get: function(){ return this._type; }
});
Object.defineProperty(BufferEntry.prototype, "value", {
    /** @param {Object} v */
    set: function(v){
        // TODO: Check for correct type
        var newSize = this._value.length != v.length;
        this._value = v;
        notifyListeners(this, newSize ? Xflow.DataNotifications.CHANGE_SIZE : Xflow.DataNotifications.CHANGED_CONTENT);
    },
    /** @return {Object} */
    get: function(){ return this._value; }
});

BufferEntry.prototype.getTupleSize = function() {
   if (!this._tupleSize) {
       var t = DataEntry.TYPE;
       switch (this._type) {
       case t.FLOAT:
       case t.INT:
       case t.BOOL:
           this._tupleSize = 1;
           break;
       case t.FLOAT2:
           this._tupleSize = 2;
           break;
       case t.FLOAT3:
           this._tupleSize = 3;
           break;
       case t.FLOAT4:
       case t.INT4:
           this._tupleSize = 4;
           break;
       case t.FLOAT4x4:
           this._tupleSize = 16;
           break;
       default:
           XML3D.debug.logError("Encountered invalid type: "+this._type);
           this._tupleSize = 1;
       }
   }
   return this._tupleSize;
};

var DataChangeNotifier = {
    _listeners: []
}
Xflow.DataChangeNotifier = DataChangeNotifier;

/**
 * @param {function(Xflow.DataEntry, Xflow.DataEntry.NOTIFICATION)} callback
 */
DataChangeNotifier.addListener = function(callback){
this._listeners.push(callback);
};

/**
 * @param {function(Xflow.DataEntry, Xflow.DataEntry.NOTIFICATION)} callback
 */
DataChangeNotifier.removeListener = function(callback){
    Array.erase(this._listeners, callback);
};

/**
 *
 * @param {XML3D.xflow.DataEntry} dataEntry
 * @param {Xflow.DataNotifications} notification
 */
function notifyListeners(dataEntry, notification){
    for(var i = 0; i < dataEntry.listeners.length; ++i){
        DataChangeNotifier._listeners[i](dataEntry, notification);
    }
};
})();