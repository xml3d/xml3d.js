(function(){




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
    this.generateMipMap = 0;
};
Xflow.SamplerConfig = SamplerConfig;




/**
 * @constructor
 */
var DataEntry = function(type){
    this._type = type;
    this._listeners = [];
    this.userData = {};
};
Xflow.DataEntry = DataEntry;

Object.defineProperty(DataEntry.prototype, "type", {
    /** @param {Xflow.BufferEntry.TYPE} v */
    set: function(v){
        throw "type is read-only";
    },
    /** @return {Xflow.BufferEntry.TYPE} */
    get: function(){ return this._type; }
});

/**
 * @param {function(Xflow.DataEntry, Xflow.DataEntry.NOTIFICATION)} callback
 */
DataEntry.prototype.addListener = function(callback){
    this._listeners.push(callback);
};

/**
 * @param {function(Xflow.DataEntry, Xflow.DataEntry.NOTIFICATION)} callback
 */
DataEntry.prototype.removeListener = function(callback){
    Array.erase(this._listeners, callback);
};

DataEntry.prototype.notifyChanged = function(){
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_VALUE);
}



/**
 * @constructor
 * @extends {Xflow.DataEntry}
 * @param {Xflow.BufferEntry.TYPE} type
 * @param {Object} value
 */
var BufferEntry = function(type, value){
    Xflow.DataEntry.call(this, type);
    this._value = value;
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_NEW);
};
XML3D.createClass(BufferEntry, Xflow.DataEntry);
Xflow.BufferEntry = BufferEntry;


/** @param {Object} v */
BufferEntry.prototype.setValue = function(v){
    var newSize = (this._value ? this._value.length : 0) != (v ? v.length : 0);
    this._value = v;
    notifyListeners(this, newSize ? Xflow.DATA_ENTRY_STATE.CHANGE_SIZE : Xflow.DATA_ENTRY_STATE.CHANGED_VALUE);
}

/** @return {Object} */
BufferEntry.prototype.getValue = function(){
    return this._value;
};

/** @return {Object} */
BufferEntry.prototype.getLength = function(){
    return this._value ? this._value.length : 0;
};


BufferEntry.prototype.getTupleSize = function() {
    if (!this._tupleSize) {
        this._tupleSize = Xflow.DATA_TYPE_TUPLE_SIZE[this._type];
    }
    return this._tupleSize;
};

/** @return {Object} */
BufferEntry.prototype.getIterateCount = function(){
    return this.getLength() / this.getTupleSize();
};

/**
 * @constructor
 * @extends {Xflow.DataEntry}
 * @param {Object} value
 */
var TextureEntry = function(image){
    Xflow.DataEntry.call(this, Xflow.DATA_TYPE.TEXTURE);
    this._image = image;
    this._samplerConfig = new SamplerConfig();
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_NEW);
};
XML3D.createClass(TextureEntry, Xflow.DataEntry);
Xflow.TextureEntry = TextureEntry;

/** @param {Object} v */
TextureEntry.prototype.setImage = function(v){
    this._image = v;
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_VALUE);
}

/** @return {Object} */
TextureEntry.prototype.getImage = function(){
    return this._image;
}

/** @return {Object} */
TextureEntry.prototype.getSamplerConfig = function(){
    return this._samplerConfig;
};

/** @return {Object} */
TextureEntry.prototype.getLength = function(){
    return 1;
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
 * @param {Xflow.DataEntry} dataEntry
 * @param {number, Xflow.DATA_ENTRY_STATE} notification
 */
function notifyListeners(dataEntry, notification){
    for(var i = 0; i < DataChangeNotifier._listeners.length; ++i){
        DataChangeNotifier._listeners[i](dataEntry, notification);
    }
    for(var i = 0; i < dataEntry._listeners.length; ++i){
        dataEntry._listeners[i].notify(dataEntry, notification);
    }
};
})();