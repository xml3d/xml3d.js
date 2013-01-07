(function(){


//----------------------------------------------------------------------------------------------------------------------
// Xflow.SamplerConfig
//----------------------------------------------------------------------------------------------------------------------


/**
 * @constructor
 */
Xflow.SamplerConfig = function(){
    this.minFilter = 0;
    this.magFilter = 0;
    this.mipFilter = 0;
    this.wrapS = 0;
    this.wrapT = 0;
    this.wrapU = 0;
    this.textureType = 0;
    this.colorR = 0;
    this.colorG = 0;
    this.colorB = 0;
    this.generateMipMap = 0;
};
Xflow.SamplerConfig.prototype.setDefaults = function() {
    // FIXME Generate this from the spec ?
    this.minFilter = WebGLRenderingContext.LINEAR;
    this.magFilter = WebGLRenderingContext.LINEAR;
    this.mipFilter = WebGLRenderingContext.NEAREST;
    this.wrapS = WebGLRenderingContext.CLAMP_TO_EDGE;
    this.wrapT = WebGLRenderingContext.CLAMP_TO_EDGE;
    this.wrapU = WebGLRenderingContext.CLAMP_TO_EDGE;
    this.textureType = WebGLRenderingContext.TEXTURE_2D;
    this.colorR = 0;
    this.colorG = 0;
    this.colorB = 0;
    this.generateMipMap = 0;
};
Xflow.SamplerConfig.prototype.set = function(other) {
    this.minFilter = other.minFilter;
    this.magFilter = other.magFilter;
    this.mipFilter = other.mipFilter;
    this.wrapS = other.wrapS;
    this.wrapT = other.wrapT;
    this.wrapU = other.wrapU;
    this.textureType = other.textureType;
    this.colorR = other.colorR;
    this.colorG = other.colorG;
    this.colorB = other.colorB;
    this.generateMipMap = other.generateMipMap;
};
var SamplerConfig = Xflow.SamplerConfig;


//----------------------------------------------------------------------------------------------------------------------
// Xflow.DataEntry
//----------------------------------------------------------------------------------------------------------------------


/**
 * @constructor
 * @param {Xflow.DATA_TYPE} type Type of DataEntry
 */
Xflow.DataEntry = function(type){
    this._type = type;
    this._listeners = [];
    this.userData = {};
};
var DataEntry = Xflow.DataEntry;

Object.defineProperty(DataEntry.prototype, "type", {
    /** @param {Xflow.DATA_TYPE} v */
    set: function(v){
        throw new Error("type is read-only");
    },
    /** @return {Xflow.DATA_TYPE} */
    get: function(){ return this._type; }
});

/**
 * @param {function(Xflow.DataEntry, Xflow.DATA_ENTRY_STATE)} callback
 */
DataEntry.prototype.addListener = function(callback){
    this._listeners.push(callback);
};

/**
 * @param {function(Xflow.DataEntry, Xflow.DATA_ENTRY_STATE)} callback
 */
DataEntry.prototype.removeListener = function(callback){
    Array.erase(this._listeners, callback);
};

DataEntry.prototype.notifyChanged = function(){
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_VALUE);
}

//----------------------------------------------------------------------------------------------------------------------
// Xflow.BufferEntry
//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @extends {Xflow.DataEntry}
 * @param {Xflow.DATA_TYPE} type
 * @param {Object} value
 */
Xflow.BufferEntry = function(type, value){
    Xflow.DataEntry.call(this, type);
    this._value = value;
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_NEW);
};
XML3D.createClass(Xflow.BufferEntry, Xflow.DataEntry);
var BufferEntry = Xflow.BufferEntry;


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

/**
 * @return {number}
 */
BufferEntry.prototype.getIterateCount = function(){
    return this.getLength() / this.getTupleSize();
};

BufferEntry.prototype.isEmpty = function(){
    return !this._value;
};


//----------------------------------------------------------------------------------------------------------------------
// Xflow.TextureEntry
//----------------------------------------------------------------------------------------------------------------------

function isLoading(image) {
    if (!image)
        return false;
    var nodeName = image.nodeName.toLowerCase();
    if (nodeName == 'img')
        return !image.complete;
    if (nodeName == 'canvas')
        return false;
    if (nodeName == 'video')
        // readyState == 0 is HAVE_NOTHING
        return image.readyState == 0;
    return false;
}

/**
 * @constructor
 * @param {Xflow.TextureEntry} textureEntry
 */
Xflow.ImageManipulator = function(textureEntry) {
    this._textureEntry = textureEntry;
    this.update();
};
Xflow.ImageManipulator.prototype.update = function() {
    this._image = this._textureEntry.getImage();
    if (this._image) {
        var nodeName = this._image.nodeName.toLowerCase();
        if (nodeName == 'video') {
            this.width = this._image.videoWidth;
            this.height = this._image.videoHeight;
        } else {
            this.width = this._image.width;
            this.height = this._image.height;
        }
        if (nodeName == 'canvas') {
            this._canvas = this._image;
            this._copyImageToCtx = false;
        } else {
            this._canvas = null;
            this._copyImageToCtx = true;
        }
    } else {
        this.width = 0;
        this.height = 0;
        this._canvas = null;
    }
    this._context = null;
};
Xflow.ImageManipulator.prototype.isLoading = function() {
    return isLoading(this._image);
};
Xflow.ImageManipulator.prototype.detach = function() {
    this._textureEntry = null;
    // FIXME if _canvas is shared between _textureEntry and this object, it must to be cloned
};
Xflow.ImageManipulator.prototype.getCanvas = function() {
    if (!this._canvas) {
        this._canvas = document.createElement('canvas');
        this._canvas.width = this.width;
        this._canvas.height = this.height;
        this._canvas.complete = false; // for compatibility with img element
    }
    return this._canvas;
};
Xflow.ImageManipulator.prototype.getContext2D = function() {
    if (!this._context) {
        var canvas = this.getCanvas();
        this._context = canvas.getContext("2d");
        if (!this._context)
            throw new Error("Could not create 2D context.");
        if (this._copyImageToCtx) {
            // FIXME What to do with video element ?
            this._context.drawImage(this._image, 0, 0);
        }
    }
    return this._context;
};

function createPlaceholder(w, h) {
    var img = document.createElement('img');
    img.setAttribute('style', 'width:'+w+'px;height:'+h+'px;border:none;display:block');
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
    return img;
}

/** Call this function when image editing is finished.
 *
 */
Xflow.ImageManipulator.prototype.finish = function() {
    if (this._textureEntry && this._canvas) {
        if (this._canvas) {
            this._canvas.complete = true; // for compatibility with img element
            this._textureEntry._image = this._canvas;
            // FIXME Do we need to call notifyChanged here ? Arrays in DataEntry are not calling callbacks.
            this._textureEntry.notifyChanged();
        } else if (!this._image) {

            // FIXME Do we need to call notifyChanged here ? Arrays in DataEntry are not calling callbacks.
            this._textureEntry.notifyChanged();
        }
    }
}

/**
 * @constructor
 * @extends {Xflow.DataEntry}
 * @param {Object} image
 */
Xflow.TextureEntry = function(image){
    Xflow.DataEntry.call(this, Xflow.DATA_TYPE.TEXTURE);
    this._image = image;
    this._samplerConfig = new SamplerConfig();
    this._imageManipulator = null;
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_NEW);
};
XML3D.createClass(Xflow.TextureEntry, Xflow.DataEntry);
var TextureEntry = Xflow.TextureEntry;

TextureEntry.prototype.isEmpty = function(){
    return !this._image;
};

TextureEntry.prototype.isLoading = function() {
    return isLoading(this._image);
};

/** @param {Object} v */
TextureEntry.prototype.setImage = function(v){
    this._image = v;
    if (this._imageManipulator) {
        if (this._image === this._imageManipulator._image) {
            this._imageManipulator.update();
        } else {
            this._imageManipulator.detach();
            this._imageManipulator = null;
        }
    }
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_VALUE);
}

/** @return {Object} */
TextureEntry.prototype.getImage = function(){
    return this._image;
}

/** @return {Object} */
TextureEntry.prototype.getImageManipulator = function() {
    if (!this._imageManipulator) {
        this._imageManipulator = new Xflow.ImageManipulator(this);
    }
    return this._imageManipulator;
}

    /** @return {Object} */
TextureEntry.prototype.getSamplerConfig = function(){
    return this._samplerConfig;
};

/** @return {number} */
TextureEntry.prototype.getLength = function(){
    return 1;
};

/** @return {number} */
TextureEntry.prototype.getIterateCount = function() {
    return 1;
};



//----------------------------------------------------------------------------------------------------------------------
// Xflow.DataChangeNotifier
//----------------------------------------------------------------------------------------------------------------------



Xflow.DataChangeNotifier = {
    _listeners: []
}
var DataChangeNotifier = Xflow.DataChangeNotifier;

/**
 * @param {function(Xflow.DataEntry, Xflow.DATA_ENTRY_STATE)} callback
 */
DataChangeNotifier.addListener = function(callback){
    this._listeners.push(callback);
};

/**
 * @param {function(Xflow.DataEntry, Xflow.DATA_ENTRY_STATE)} callback
 */
DataChangeNotifier.removeListener = function(callback){
    Array.erase(this._listeners, callback);
};

/**
 * @param {Xflow.DataEntry} dataEntry
 * @param {Xflow.DATA_ENTRY_STATE} notification
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
