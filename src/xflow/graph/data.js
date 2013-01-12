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

// TextureEntry data conversion order
// image -> canvas -> context -> -> imageData
// Note: don't use TextureEntry's width and height properties, they are deprecated and cause issues with video loading
// Instead use getWidth and getHeight methods

/**
 * @constructor
 * @extends {Xflow.DataEntry}
 * @param {Object} image
 */
Xflow.TextureEntry = function(image){
    Xflow.DataEntry.call(this, Xflow.DATA_TYPE.TEXTURE);
    this._samplerConfig = new SamplerConfig();
    this._formatType = null; // null | 'ImageData' | 'number' | 'float32' | 'float64'
    this._updateImage(image);

    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_NEW);
};
XML3D.createClass(Xflow.TextureEntry, Xflow.DataEntry);
var TextureEntry = Xflow.TextureEntry;

TextureEntry.prototype.isEmpty = function(){
    return !this._image;
};

TextureEntry.prototype.isLoading = function() {
    var image = this._image;
    if (!image)
        return false;
    var nodeName = image.nodeName.toLowerCase();
    if (nodeName == 'img')
        return !image.complete;
    if (nodeName == 'canvas')
        return this._image.width <= 0 || this._image.height <= 0;
    if (nodeName == 'video')
        // readyState == 0 is HAVE_NOTHING
        return image.readyState == 0 || this._image.videoWidth <= 0 || this._image.videoHeight <= 0;
    return false;
};

TextureEntry.prototype._updateImage = function(image) {
    this._image = image;
    this._context = null;
    this._imageData = null;
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
};

/** Create new image
 *
 * @param width
 * @param height
 * @param formatType
 * @param samplerConfig
 * @return {Image|Canvas}
 */
TextureEntry.prototype.createImage = function(width, height, formatType, samplerConfig) {
    if (!this._image || this.getWidth() != width || this.getHeight() != height || this._formatType != formatType) {
        if (!width || !height)
            throw new Error("Width or height is not specified");
        // create dummy image
        var img = document.createElement('canvas');
        img.width = width;
        img.height = height;
        img.complete = true;

        this._formatType = formatType;
        if (!samplerConfig) {
            samplerConfig = new Xflow.SamplerConfig();
            samplerConfig.setDefaults();
        }
        this._samplerConfig.set(samplerConfig);
        this.setImage(img);
    } else {
        this.notifyChanged();
    }
    return this._image;
};

/** @param {Object} v */
TextureEntry.prototype.setImage = function(v) {
    this._updateImage(v);
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_VALUE);
};

TextureEntry.prototype.setFormatType = function(t) {
    this._formatType = t;
};

TextureEntry.prototype.getFormatType = function() {
    return this._formatType;
};

TextureEntry.prototype.getWidth = function() {
    return this._image.videoWidth || this._image.width || 0;
};

TextureEntry.prototype.getHeight = function() {
    return this._image.videoHeight || this._image.height || 0;
};

TextureEntry.prototype._flush = function() {
    if (this._imageData) {
        if (this._imageData instanceof ImageData) {
            this._context.putImageData(this._imageData, 0, 0);
            this._imageData = null;
        } else {
            // FIXME What to do here ?
            throw new Error("conversion of Arrays to ImageData not implemented yet");
        }
    }
    if (this._canvas) {
        this._canvas.complete = true; // for compatibility with img element
        this._image = this._canvas;
    }
};

/** @return {Object} */
TextureEntry.prototype.getImage = function() {
    this._flush();
    return this._image;
};

TextureEntry.prototype.getCanvas = function() {
    if (!this._canvas) {
        this._canvas = document.createElement('canvas');
        this._canvas.width = this.getWidth();
        this._canvas.height = this.getHeight();
        this._canvas.complete = false; // for compatibility with img element
    } else
        this._flush();
    return this._canvas;
};

TextureEntry.prototype.getContext2D = function() {
    if (!this._context) {
        var canvas = this.getCanvas();
        this._context = canvas.getContext("2d");
        if (!this._context)
            throw new Error("Could not create 2D context.");
        if (this._copyImageToCtx) {
            this._context.drawImage(this._image, 0, 0);
            this._copyImageToCtx = false;
        }
    } else
        this._flush();
    return this._context;
};


/** @return {ImageData} */
TextureEntry.prototype.getValue = function() {
    if (!this._imageData && !this.isLoading()) {
        var ctx = this.getContext2D();
        this._imageData = ctx.getImageData(0, 0, this.getWidth(), this.getHeight())
        if (this._formatType == 'float32') {
            this._imageData = {
                data : new Float32Array(this._imageData.data),
                width : this._imageData.width,
                height : this._imageData.height
            };
        } else if (this._formatType == 'float64') {
            this._imageData = {
                data : new Float64Array(this._imageData.data),
                width : this._imageData.width,
                height : this._imageData.height
            };
        }
    }
    return this._imageData;
};

/** @return {SamplerConfig} */
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

//TextureEntry.prototype.finish = function() {
//    if (this._imageData && this._context) {
//        if (this._imageData instanceof ImageData) {
//            // Do we need to do this always ?
//            // Better mark canvas dirty !
//            this._context.putImageData(this._imageData, 0, 0);
//            this._imageData = null;
//        } else {
//            // FIXME What to do here ?
//        }
//    }
//    if (this._canvas) {
//        this._canvas.complete = true; // for compatibility with img element
//        this._image = this._canvas;
//    }
//};

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
