var Base = require("../base.js");
var C = require("./constants.js");
require("../../utils/array.js");

/**
 * Content of this file:
 * All Code for handling data entries connected to Xflow including:
 *  - BufferEntries: Typed value buffers (e.g float3 buffer, without name)
 *  - TextureEntries: e.g. images
 *
 *  This file also includes the DataChangeNotifier used to react to changes on Xflow data structures
 */

//----------------------------------------------------------------------------------------------------------------------
// SamplerConfig
//----------------------------------------------------------------------------------------------------------------------


/**
 * SamplerConfig is used to define sampler properties of a TextureEntry or ImageDataTextureEntry
 * @constructor
 */
var SamplerConfig = function(){
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
    this.anisotropy = 0; // number of max samples for anisotropic filtering
    this.generateMipMap = 0;
};

SamplerConfig.prototype.setDefaults = function() {
    this.minFilter = C.TEX_FILTER_TYPE.LINEAR;
    this.magFilter = C.TEX_FILTER_TYPE.LINEAR;
    this.mipFilter = C.TEX_FILTER_TYPE.NEAREST;
    this.wrapS = C.TEX_WRAP_TYPE.CLAMP;
    this.wrapT = C.TEX_WRAP_TYPE.CLAMP;
    this.wrapU = C.TEX_WRAP_TYPE.CLAMP;
    this.textureType = C.TEX_TYPE.TEXTURE_2D;
    this.colorR = 0;
    this.colorG = 0;
    this.colorB = 0;
    this.anisotropy = 1; // number of max samples for anisotropic filtering
    this.generateMipMap = 0;
};

SamplerConfig.prototype.set = function(other) {
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


//----------------------------------------------------------------------------------------------------------------------
// DataEntry
//----------------------------------------------------------------------------------------------------------------------


/**
 * The abstract base class for all DataEntries connected to an xflow graph.
 * @abstract
 * @param {C.DATA_TYPE} type Type of DataEntry
 */
var DataEntry = function(type){
    this._type = type;
    /** @type {Array.<Function(DataEntry, C.DATA_ENTRY_STATE)>} **/
    this._listeners = [];
    /** Add related custom data (e.g. WebGL buffers) **/
    this.userData = {};
};

Object.defineProperty(DataEntry.prototype, "type", {
    set: function(){
        throw new Error("type is read-only");
    },
    /** @return {C.DATA_TYPE} */
    get: function(){ return this._type; }
});

/**
 * @param {function(DataEntry, C.DATA_ENTRY_STATE)} callback
 */
DataEntry.prototype.addListener = function(callback){
    this._listeners.push(callback);
};

/**
 * @param {function(DataEntry, C.DATA_ENTRY_STATE)} callback
 */
DataEntry.prototype.removeListener = function(callback){
    Array.erase(this._listeners, callback);
};

/**
 */
DataEntry.prototype._notifyChanged = function(){
    notifyListeners(this, C.DATA_ENTRY_STATE.CHANGED_VALUE);
};

//----------------------------------------------------------------------------------------------------------------------
// BufferEntry
//----------------------------------------------------------------------------------------------------------------------

/**
 * A typed value buffer basically linking to a typed array.
 * @constructor
 * @extends {DataEntry}
 * @param {C.DATA_TYPE} type
 * @param {Object} value A typed array
 */
var BufferEntry = function(type, value){
    DataEntry.call(this, type);
    this._value = value;
    notifyListeners(this, C.DATA_ENTRY_STATE.CHANGED_NEW);
};
Base.createClass(BufferEntry, DataEntry);


/**
 *  Set value of entry. Triggers notification chain
 *  @param {Object} v Value to set (has to be a TypedArray)
 */
BufferEntry.prototype.setValue = function(v){
    this._setValue(v);
    Base._flushResultCallbacks();
};

/**
 * Are there no, one or many values?
 * @param size
 * @param tupleSize
 * @returns {number}
 */
function getSizeType(size, tupleSize){
    if(size >= tupleSize*2)
        return 2;
    else if(size >= tupleSize)
        return 1;
    else
        return 0;
}

BufferEntry.prototype._setValue = function(v){
    var oldSize = (this._value ? this._value.length : 0), newSize = (v ? v.length : 0), tupleSize = this.getTupleSize();
    var notification;
    if(getSizeType(oldSize, tupleSize) != getSizeType(newSize, tupleSize))
        notification = C.DATA_ENTRY_STATE.CHANGED_SIZE_TYPE;
    else if(oldSize != newSize){
        notification = C.DATA_ENTRY_STATE.CHANGED_SIZE;
    }
    else{
        notification = C.DATA_ENTRY_STATE.CHANGED_VALUE;
    }
    this._value = v;
    notifyListeners(this, notification);
};

/** @return {Object} */
BufferEntry.prototype.getValue = function(){
    return this._value;
};

/**
 * Returns the buffer length
 * @return {Object}
 */
BufferEntry.prototype.getLength = function(){
    return this._value ? this._value.length : 0;
};

/**
 * Returns tuple size (e.g 1, 2, 3, 4, 16)
 * @returns {number}
 */
BufferEntry.prototype.getTupleSize = function() {
    return C.DATA_TYPE_TUPLE_SIZE[this._type];
};

/**
 * Return tuple count
 * @return {number}
 */
BufferEntry.prototype.getIterateCount = function(){
    return this.getLength() / this.getTupleSize();
};

/**
 * Is value not set or the length of the buffer 0
 * @returns {boolean}
 */
BufferEntry.prototype.isEmpty = function(){
    return !this._value || !this.getLength();
};


//----------------------------------------------------------------------------------------------------------------------
// TextureEntry
//----------------------------------------------------------------------------------------------------------------------

function TexelSource(sourceOrWidth, height, format, type) {
    if (typeof sourceOrWidth === "object") {
        if (sourceOrWidth.nodeName) {
            var nodeName = sourceOrWidth.nodeName.toLowerCase();
            if (nodeName === "video" && (typeof sourceOrWidth.complete === "undefined")) {
                Object.defineProperties(sourceOrWidth, {
                    width: {
                        get: function () {
                            return this.videoWidth;
                        }
                    },
                    height: {
                        get: function () {
                            return this.videoHeight;
                        }
                    },
                    complete: {
                        get: function () {
                            return !(this.readyState == 0 || this.videoWidth <= 0 || this.videoHeight <= 0);
                        }
                    }
                });
            }
            sourceOrWidth.texelFormat = C.TEXTURE_FORMAT.RGBA;
            sourceOrWidth.texelType = C.TEXTURE_TYPE.UBYTE;
        }
        //assume source is a image data like object
        this._source = sourceOrWidth;
    } else {
        format = format || C.TEXTURE_FORMAT.RGBA;
        type =  type || C.TEXTURE_TYPE.UBYTE;
        //create a new texel source backed by type array
        this._source = {
            width: sourceOrWidth,
            height: height,
            texelFormat: format,
            texelType: type,
            data: new C.TYPED_ARRAY_MAP[type](sourceOrWidth * height * C.TEXTURE_FORMAT_TUPLE_SIZE[format])
        }
    }
}

Object.defineProperties(TexelSource.prototype, {
    imageData: {
        get: function () {
            if (this._source instanceof HTMLElement) {
                var canvas = document.createElement("canvas");
                canvas.width = this._source.width;
                canvas.height = this._source.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(this._source, 0, 0);
                var source = ctx.getImageData(0, 0, this._source.width, this._source.height);
                source.texelFormat = this._source.texelFormat;
                source.texelType = this._source.texelType;
                this._source = source;
            }
            return this._source;
        }
    },
    // TODO this is very confusing. asGLTextureData is texelsource.source
    glTextureData: {
        get: function () {
            return this._source;
        }
    },
    complete: {
        get: function () {
            return typeof this._source.complete === "undefined" ? true : this._source.complete;
        }
    },
    width: {
        get: function () {
            return this._source ? this._source.width : -1;
        }
    },
    height: {
        get: function () {
            return this._source ? this._source.height : -1;
        }
    },
    texelFormat: {
        get: function () {
            return this._source ? this._source.texelFormat: C.TEXTURE_FORMAT.UNKNOWN;
        }
    },
    texelType: {
        get: function () {
            return this._source ? this._source.texelType: C.TEXTURE_TYPE.UNKNOWN;
        }
    }
});

/**
 * A data entry for a texture.
 * Note: each TextureEntry includes a samplerConfig.
 * @constructor
 * @extends {DataEntry}
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} source //TODO: Which kinds are supported?
 */
TextureEntry = function(source){
    DataEntry.call(this, C.DATA_TYPE.TEXTURE);
    this._samplerConfig = new SamplerConfig();
    this._loading = false;
    this.setImage(source);

    notifyListeners(this, C.DATA_ENTRY_STATE.CHANGED_NEW);
};

Base.createClass(TextureEntry, DataEntry);

Object.defineProperties(TextureEntry.prototype, {
    width: {
        get: function () {
            return this._source ? this._source.width : -1;
        }
    },
    height: {
        get: function () {
            return this._source ? this._source.height : -1;
        }
    },
    texelFormat: {
        get: function () {
            return this._source ? this._source.texelFormat: C.TEXTURE_FORMAT.UNKNOWN;
        }
    },
    texelType: {
        get: function () {
            return this._source ? this._source.texelType: C.TEXTURE_TYPE.UNKNOWN;
        }
    }
});

TextureEntry.prototype.isLoading = function() {
    if (!this._source)
        return false;

    return !this._source.complete;
};

/**
 * @private
 */
TextureEntry.prototype._createImage = function(width, height, format, type, samplerConfig) {
    if (!this._source || this.width != width || this.height != height || this.format != format || this.type != type) {
        var source = new TexelSource(width, height, format, type);

        if (!samplerConfig) {
            samplerConfig = new SamplerConfig();
            samplerConfig.setDefaults();
        }

        this._samplerConfig.set(samplerConfig);
        this._setImage(source);
    } else {
        this._notifyChanged();
    }

    return this._source;
};

/**
 * Set image source of a Texture Entry
 * TODO: This is called even if image is just loaded (on XML3D side). Add a notifyImageLoaded method could
 * be helpful
 *
 * @param {HTMLImageElement|HTMLVideoElement|TexelSource|null} element
 * @param {boolean?} forceLoadCallback trigger load callback if data changes
 */
TextureEntry.prototype.setImage = function (element, forceLoadCallback) {
    this._setImage(element, forceLoadCallback);
    Base._flushResultCallbacks();
};

TextureEntry.prototype._setImage = function (element, forceLoadCallback) {
    if (!element)
        this._setSource(null, forceLoadCallback);
    else if (element instanceof TexelSource)
        this._setSource(element, forceLoadCallback);
    else
        this._setSource(new TexelSource(element), forceLoadCallback);
};

TextureEntry.prototype._setSource = function(s, forceLoadCallback) {
    var prevLoading = this.isLoading();
    this._source = s;
    var loading = this.isLoading();
    if(forceLoadCallback && !loading && !prevLoading){
        notifyListeners(this, C.DATA_ENTRY_STATE.LOAD_START);
        notifyListeners(this, C.DATA_ENTRY_STATE.LOAD_END);
    }
    else if(loading){
        this._loading = true;
        notifyListeners(this, C.DATA_ENTRY_STATE.LOAD_START);
    }
    else if(this._loading){
        this._loading = false;
        notifyListeners(this, C.DATA_ENTRY_STATE.LOAD_END);
    }
    else
        notifyListeners(this, C.DATA_ENTRY_STATE.CHANGED_VALUE);
};

TextureEntry.prototype.asGLTextureValue = function () {
    return this._source && this._source.glTextureData;
};

/** @return {ImageData} */
TextureEntry.prototype.getValue = function() {
    if (!this._source)
        return null;
    if (!this.isLoading())
        return this._source.imageData;
    else
        return null;
};

/** @return {SamplerConfig} */
TextureEntry.prototype.getSamplerConfig = function(){
    return this._samplerConfig;
};

/** @return {number} */
TextureEntry.prototype.getLength = function(){
    return 1;
};
TextureEntry.prototype.isEmpty = function(){
    return false;
};

/** @return {number} */
TextureEntry.prototype.getIterateCount = function() {
    return 1;
};

//----------------------------------------------------------------------------------------------------------------------
// ImageDataTextureEntry
//----------------------------------------------------------------------------------------------------------------------

/**
 * Same as TextureEntry, only based on imageData.
 * This class is used for xflow running inside Web Workers (which don't support HTML images)
 * @param imageData
 * @extends{DataEntry}
 * @constructor
 */
var ImageDataTextureEntry = function(imageData){
    DataEntry.call(this, C.DATA_TYPE.TEXTURE);
    this._samplerConfig = new SamplerConfig();
    this._imageData = null;
    this._texelFormat = C.TEXTURE_FORMAT.RGBA;
    this._texelType = C.TEXTURE_TYPE.UBYTE;

    this._updateImageData(imageData);

    notifyListeners(this, C.DATA_ENTRY_STATE.CHANGED_NEW);
};

Base.createClass(ImageDataTextureEntry, DataEntry);

Object.defineProperties(ImageDataTextureEntry.prototype, {
    width: {
        get: function () {
            return this._imageData ? this._imageData.width : -1;
        }
    },
    height: {
        get: function () {
            return this._imageData ? this._imageData.height : -1;
        }
    },
    texelFormat: {
        get: function () {
            return this._texelFormat;
        }
    },
    texelType: {
        get: function () {
            return this._texelType;
        }
    }
});



ImageDataTextureEntry.prototype.isLoading = function() {
    return !this._imageData;
};

ImageDataTextureEntry.prototype._updateImageData = function(imageData) {
    this._texelFormat = C.TEXTURE_FORMAT.RGBA;
    this._texelType = C.TEXTURE_TYPE.UBYTE;
    this._imageData = imageData;
};

/** Create new image
 * TODO: Jan: Write source documentation
 * @param width
 * @param height
 * @param format
 * @param type
 * @param samplerConfig
 * @return {HTMLImageElement|HTMLCanvasElement}
 */
ImageDataTextureEntry.prototype._createImage = function(width, height, format, type, samplerConfig) {
    if (!this._imageData || this.getWidth() != width || this.getHeight() != height || this._format != format || this._type != type) {
        if (!width || !height)
            throw new Error("Width or height is not specified");
        this._texelFormat = format;
        this._texelType = type;
        if (!samplerConfig) {
            samplerConfig = new SamplerConfig();
            samplerConfig.setDefaults();
        }
        this._samplerConfig.set(samplerConfig);

        /**
         * @type {{width: *, height: *, data: null|ArrayBufferView}}
         */
        var imageData = {
            width: width,
            height: height,
            data: null
        };
        if(type == C.TEXTURE_TYPE.FLOAT){
            imageData.data = new Float32Array(width*height*4);
        }
        else {
            // FIXME: We should allocate Uint8ClampedArray here instead
            // But Uint8ClampedArray can't be allocated in Chrome inside a Web Worker
            // See bug: http://code.google.com/p/chromium/issues/detail?id=176479
            // As a work around, we allocate Int16Array which results in correct clamping outside of web worker
            if(Uint8Array == Uint8ClampedArray)
                imageData.data = new Int16Array(width*height*4);
            else
                imageData.data = new Uint8ClampedArray(width*height*4);
        }
        this._imageData = imageData;
    }
    this._notifyChanged();
};

/** @param {Object} v */
ImageDataTextureEntry.prototype.setImageData = function(v) {
    this._updateImageData(v);
    notifyListeners(this, C.DATA_ENTRY_STATE.CHANGED_VALUE);
    Base._flushResultCallbacks();
};

ImageDataTextureEntry.prototype.getWidth = function() {
    return this._imageData && this._imageData.width || 0;
};

ImageDataTextureEntry.prototype.getHeight = function() {
    return this._imageData && this._imageData.height || 0;
};

/** @return {ImageData} */
ImageDataTextureEntry.prototype.getValue = function() {
    return this._imageData;
};

/** @return {SamplerConfig} */
ImageDataTextureEntry.prototype.getSamplerConfig = function(){
    return this._samplerConfig;
};

/** @return {number} */
ImageDataTextureEntry.prototype.getLength = function(){
    return 1;
};
ImageDataTextureEntry.prototype.isEmpty = function(){
    return false;
};


/** @return {number} */
ImageDataTextureEntry.prototype.getIterateCount = function() {
    return 1;
};

//----------------------------------------------------------------------------------------------------------------------
// DataChangeNotifier
//----------------------------------------------------------------------------------------------------------------------


/**
 * Used to listen to modifications of any DataEntry connected to an Xflow graph.
 * @constructor
 */
var DataChangeNotifier = {
    _listeners: []
};

/**
 * @param {function(DataEntry, C.DATA_ENTRY_STATE)} callback
 */
DataChangeNotifier.addListener = function(callback){
    this._listeners.push(callback);
};

/**
 * @param {function(DataEntry, C.DATA_ENTRY_STATE)} callback
 */
DataChangeNotifier.removeListener = function(callback){
    Array.erase(this._listeners, callback);
};

/**
 * @param {DataEntry} dataEntry
 * @param {C.DATA_ENTRY_STATE} notification
 */
function notifyListeners(dataEntry, notification){
    var i;
    // Global notifications
    for(i = 0; i < DataChangeNotifier._listeners.length; ++i){
        DataChangeNotifier._listeners[i](dataEntry, notification);
    }
    // Internal and external listeners
    for(i = 0; i < dataEntry._listeners.length; ++i){
        dataEntry._listeners[i](dataEntry, notification);
    }
}

module.exports = {
    DataEntry: DataEntry,
    BufferEntry: BufferEntry,
    TextureEntry: TextureEntry,
    ImageDataTextureEntry: ImageDataTextureEntry,
    SamplerConfig: SamplerConfig,
    DataChangeNotifier: DataChangeNotifier
};
