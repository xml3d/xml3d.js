(function(){
/**
 * Content of this file:
 * All Code for handling data structures connected to Xflow including:
 *  - Typed value buffers (e.g float3 buffer)
 *  - Images
 *
 * This file also includes the Xflow.DataChangeNotifier used to react to changes on Xflow data structures
 */

//----------------------------------------------------------------------------------------------------------------------
// Xflow.SamplerConfig
//----------------------------------------------------------------------------------------------------------------------


/**
 * SamplerConfig is used to define sampler properties of an Xflow.TextureEntry or Xflow.ImageDataTextureEntry
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
    this.minFilter = Xflow.TEX_FILTER_TYPE.LINEAR;
    this.magFilter = Xflow.TEX_FILTER_TYPE.LINEAR;
    this.mipFilter = Xflow.TEX_FILTER_TYPE.NEAREST;
    this.wrapS = Xflow.TEX_WRAP_TYPE.CLAMP;
    this.wrapT = Xflow.TEX_WRAP_TYPE.CLAMP;
    this.wrapU = Xflow.TEX_WRAP_TYPE.CLAMP;
    this.textureType = Xflow.TEX_TYPE.TEXTURE_2D;
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
 * The abstract base class for all DataEntries connected to an xflow graph.
 * @abstract
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

DataEntry.prototype._notifyChanged = function(){
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_VALUE);
}

//----------------------------------------------------------------------------------------------------------------------
// Xflow.BufferEntry
//----------------------------------------------------------------------------------------------------------------------

/**
 * A typed value buffer basically linking to a typed array.
 * @constructor
 * @extends {Xflow.DataEntry}
 * @param {Xflow.DATA_TYPE} type
 * @param {Object} value A typed array
 */
Xflow.BufferEntry = function(type, value){
    Xflow.DataEntry.call(this, type);
    this._value = value;
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_NEW);
};
Xflow.createClass(Xflow.BufferEntry, Xflow.DataEntry);
var BufferEntry = Xflow.BufferEntry;


/** @param {Object} v */
BufferEntry.prototype.setValue = function(v){
    this._setValue(v);
    Xflow._callListedCallback();
}

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
        notification = Xflow.DATA_ENTRY_STATE.CHANGED_SIZE_TYPE;
    else if(oldSize != newSize){
        notification = Xflow.DATA_ENTRY_STATE.CHANGED_SIZE;
    }
    else{
        notification = Xflow.DATA_ENTRY_STATE.CHANGED_VALUE;
    }
    this._value = v;
    notifyListeners(this, notification);
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
    return !this._value || !this.getLength();
};


//----------------------------------------------------------------------------------------------------------------------
// Xflow.TextureEntry
//----------------------------------------------------------------------------------------------------------------------

var tmpCanvas, tmpContext;

Xflow.toImageData = function(imageData) {
    if(imageData instanceof ImageData)
        return imageData;
    if(!imageData.data)
        throw new Error("no data property");
    if(!imageData.width)
        throw new Error("no width property");
    if(!imageData.height)
        throw new Error("no height property");
    if(!tmpContext) {
        tmpCanvas = document.createElement('canvas');
        tmpContext = tmpCanvas.getContext('2d');
    }
    var newImageData = tmpContext.createImageData(imageData.width, imageData.height);
    for(var i = 0; i < imageData.data.length; ++i) {
        var v = imageData.data[i];
        if(v > 255)
            v = 255;
        if(v < 0)
            v = 0;
        newImageData.data[i] = v;
    }
    return newImageData;
}

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
            sourceOrWidth.texelFormat = Xflow.TEXTURE_FORMAT.RGBA;
            sourceOrWidth.texelType = Xflow.TEXTURE_TYPE.UBYTE;
        }
        //assume source is a image data like object
        this._source = sourceOrWidth;
    } else {
        format = format || Xflow.TEXTURE_FORMAT.RGBA;
        type =  type || Xflow.TEXTURE_TYPE.UBYTE;
        //create a new texel source backed by type array
        this._source = {
            width: sourceOrWidth,
            height: height,
            texelFormat: format,
            texelType: type,
            data: new Xflow.TYPED_ARRAY_MAP[type](sourceOrWidth * height * Xflow.TEXTURE_FORMAT_TUPLE_SIZE[format])
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
            return this._source ? this._source.texelFormat: Xflow.TEXTURE_FORMAT.UNKNOWN;
        }
    },
    texelType: {
        get: function () {
            return this._source ? this._source.texelType: Xflow.TEXTURE_TYPE.UNKNOWN;
        }
    }
});

/**
 * A data entry for a texture.
 * Note: each TextureEntry includes a samplerConfig.
 * @constructor
 * @extends {Xflow.DataEntry}
 * @param {Object} image
 */
Xflow.TextureEntry = function(source){
    Xflow.DataEntry.call(this, Xflow.DATA_TYPE.TEXTURE);
    this._samplerConfig = new SamplerConfig();
    this._loading = false;
    this.setImage(source);

    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_NEW);
};

Xflow.createClass(Xflow.TextureEntry, Xflow.DataEntry);
var TextureEntry = Xflow.TextureEntry;

Object.defineProperties(Xflow.TextureEntry.prototype, {
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
            return this._source ? this._source.texelFormat: Xflow.TEXTURE_FORMAT.UNKNOWN;
        }
    },
    texelType: {
        get: function () {
            return this._source ? this._source.texelType: Xflow.TEXTURE_TYPE.UNKNOWN;
        }
    }
});

TextureEntry.prototype.isLoading = function() {
    if (!this._source)
        return false;

    return !this._source.complete;
};

TextureEntry.prototype._createImage = function(width, height, format, type, samplerConfig) {
    if (!this._source || this.width != width || this.height != height || this.format != format || this.type != type) {
        var source = new TexelSource(width, height, format, type);

        if (!samplerConfig) {
            samplerConfig = new Xflow.SamplerConfig();
            samplerConfig.setDefaults();
        }

        this._samplerConfig.set(samplerConfig);
        this._setImage(source);
    } else {
        this._notifyChanged();
    }

    return this._source;
};

TextureEntry.prototype.setImage = function (s) {
    this._setImage(s);
    Xflow._callListedCallback();
};

TextureEntry.prototype._setImage = function (s) {
    if (!s)
        this._setSource(null);
    else if (s instanceof TexelSource)
        this._setSource(s);
    else
        this._setSource(new TexelSource(s));
};

TextureEntry.prototype._setSource = function(s) {
    this._source = s;
    var loading = this.isLoading();
    if(loading){
        this._loading = true;
        notifyListeners(this, Xflow.DATA_ENTRY_STATE.LOAD_START);
    }
    else if(this._loading){
        this._loading = false;
        notifyListeners(this, Xflow.DATA_ENTRY_STATE.LOAD_END);
    }
    else
        notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_VALUE);
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
// Xflow.ImageDataTextureEntry
//----------------------------------------------------------------------------------------------------------------------

/**
 * Same as Xflow.TextureEntry, only based on imageData.
 * This class is used for xflow running inside Web Workers (which don't support HTML images)
 * @param imageData
 * @constructor
 */
Xflow.ImageDataTextureEntry = function(imageData){
    Xflow.DataEntry.call(this, Xflow.DATA_TYPE.TEXTURE);
    this._samplerConfig = new SamplerConfig();
    this._imageData = null;
    this._texelFormat = Xflow.TEXTURE_FORMAT.RGBA;
    this._texelType = Xflow.TEXTURE_TYPE.UBYTE;

    this._updateImageData(imageData);

    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_NEW);
};

Xflow.createClass(Xflow.ImageDataTextureEntry, Xflow.DataEntry);
var ImageDataTextureEntry = Xflow.ImageDataTextureEntry;


Object.defineProperties(Xflow.ImageDataTextureEntry.prototype, {
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
    this._texelFormat = Xflow.TEXTURE_FORMAT.RGBA;
    this._texelType = Xflow.TEXTURE_TYPE.UBYTE;
    this._imageData = imageData;
};

/** Create new image
 *
 * @param width
 * @param height
 * @param formatType
 * @param samplerConfig
 * @return {Image|Canvas}
 */
ImageDataTextureEntry.prototype._createImage = function(width, height, format, type, samplerConfig) {
    if (!this._image || this.getWidth() != width || this.getHeight() != height || this._format != format || this._type != type) {
        if (!width || !height)
            throw new Error("Width or height is not specified");
        this._texelFormat = format;
        this._texelType = type;
        if (!samplerConfig) {
            samplerConfig = new Xflow.SamplerConfig();
            samplerConfig.setDefaults();
        }
        this._samplerConfig.set(samplerConfig);

        var imageData = {
            width: width,
            height: height,
            data: null
        };
        if(type == Xflow.TEXTURE_TYPE.FLOAT){
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
    notifyListeners(this, Xflow.DATA_ENTRY_STATE.CHANGED_VALUE);
    Xflow._callListedCallback();
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
// Xflow.DataChangeNotifier
//----------------------------------------------------------------------------------------------------------------------


/**
 * Used to listen to modifications of any DataEntry connected to an Xflow graph.
 * @global
 */
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
        dataEntry._listeners[i](dataEntry, notification);
    }
}

}());
