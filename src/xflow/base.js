window = this;
var Xflow = {};

(function () {
    Xflow.EPSILON = 0.000001;

    /**
     * Type of DataEntry
     * @enum
     */
    Xflow.DATA_TYPE = {
        UNKNOWN: 0,
        FLOAT: 1,
        FLOAT2: 2,
        FLOAT3: 3,
        FLOAT4: 4,
        FLOAT3X3 : 5,
        FLOAT4X4: 10,
        INT: 20,
        INT4: 21,
        BOOL: 30,
        TEXTURE: 40,
        BYTE: 50,
        UBYTE: 60
    };

    Xflow.DATA_TYPE_MAP = {
        'float': Xflow.DATA_TYPE.FLOAT,
        'float2': Xflow.DATA_TYPE.FLOAT2,
        'float3': Xflow.DATA_TYPE.FLOAT3,
        'float4': Xflow.DATA_TYPE.FLOAT4,
        'float3x3' : Xflow.DATA_TYPE.FLOAT3X3,
        'float4x4': Xflow.DATA_TYPE.FLOAT4X4,
        'int': Xflow.DATA_TYPE.INT,
        'int4': Xflow.DATA_TYPE.INT4,
        'bool': Xflow.DATA_TYPE.BOOL,
        'texture': Xflow.DATA_TYPE.TEXTURE,
        'byte': Xflow.DATA_TYPE.BYTE,
        'ubyte': Xflow.DATA_TYPE.UBYTE
    };

    // Values are chosen to be in line with DATA_TYPE
    Xflow.TEXTURE_TYPE = {
        UNKNOWN: 0,
        FLOAT: 1,
        UBYTE: 60,
        USHORT_5_6_5: 70,
        USHORT_4_4_4_4: 71,
        USHORT_5_5_5_1: 72
    };

    Xflow.TEXTURE_FORMAT = {
        UNKNOWN: 0,
        ALPHA: 100,
        RGB: 101,
        RGBA: 102,
        LUMINANCE: 103,
        LUMINANCE_ALPHA: 104
    };

    Xflow.DATA_TYPE_TUPLE_SIZE = {};
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.FLOAT] = 1;
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.FLOAT2] = 2;
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.FLOAT3] = 3;
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.FLOAT4] = 4;
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.FLOAT3X3] = 9;
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.FLOAT4X4] = 16;
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.INT] = 1;
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.INT4] = 4;
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.BOOL] = 1;
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.TEXTURE] = 1;
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.BYTE] = 1;
    Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.UBYTE] = 1;

    Xflow.TYPED_ARRAY_MAP = {};
    Xflow.TYPED_ARRAY_MAP[Xflow.DATA_TYPE.FLOAT] = Float32Array;
    Xflow.TYPED_ARRAY_MAP[Xflow.DATA_TYPE.FLOAT2] = Float32Array;
    Xflow.TYPED_ARRAY_MAP[Xflow.DATA_TYPE.FLOAT3] = Float32Array;
    Xflow.TYPED_ARRAY_MAP[Xflow.DATA_TYPE.FLOAT4] = Float32Array;
    Xflow.TYPED_ARRAY_MAP[Xflow.DATA_TYPE.FLOAT4X4] = Float32Array;
    Xflow.TYPED_ARRAY_MAP[Xflow.DATA_TYPE.INT] = Int32Array;
    Xflow.TYPED_ARRAY_MAP[Xflow.DATA_TYPE.INT4] = Int32Array;
    Xflow.TYPED_ARRAY_MAP[Xflow.DATA_TYPE.BOOL] = Int8Array;
    Xflow.TYPED_ARRAY_MAP[Xflow.DATA_TYPE.BYTE] = Int8Array;
    Xflow.TYPED_ARRAY_MAP[Xflow.DATA_TYPE.UBYTE] = Uint8Array;

    // texture formats
    // float and ubyte are mapped to DATA_TYPE values above
    Xflow.TYPED_ARRAY_MAP[Xflow.TEXTURE_TYPE.USHORT_4_4_4_4] = Uint16Array;
    Xflow.TYPED_ARRAY_MAP[Xflow.TEXTURE_TYPE.USHORT_5_6_5] = Uint16Array;
    Xflow.TYPED_ARRAY_MAP[Xflow.TEXTURE_TYPE.USHORT_5_5_5_1] = Uint16Array;

    Xflow.TEXTURE_FORMAT_TUPLE_SIZE = {};
    Xflow.TEXTURE_FORMAT_TUPLE_SIZE[Xflow.TEXTURE_FORMAT.ALPHA] = 1;
    Xflow.TEXTURE_FORMAT_TUPLE_SIZE[Xflow.TEXTURE_FORMAT.RGB] = 3;
    Xflow.TEXTURE_FORMAT_TUPLE_SIZE[Xflow.TEXTURE_FORMAT.RGBA] = 4;
    Xflow.TEXTURE_FORMAT_TUPLE_SIZE[Xflow.TEXTURE_FORMAT.LUMINANCE] = 1;
    Xflow.TEXTURE_FORMAT_TUPLE_SIZE[Xflow.TEXTURE_FORMAT.LUMINANCE_ALPHA] = 2;

    Xflow.getTypeName = function (type) {
        var i;
        for (i in Xflow.DATA_TYPE_MAP) {
            if (Xflow.DATA_TYPE_MAP[i] === type) {
                return i;
            }
        }
    };

    /**
     * @enum {number}
     */
    Xflow.TEX_FILTER_TYPE = {
        NEAREST: 0x2600,
        LINEAR: 0x2601,
        MIPMAP_NEAREST: 0x2700,
        MIPMAP_LINEAR: 0x2701

    };
    /**
     * @enum {number}
     */
    Xflow.TEX_WRAP_TYPE = {
        CLAMP: 0x812F,
        REPEAT: 0x2901
    };
    /**
     * @enum {number}
     */
    Xflow.TEX_TYPE = {
        TEXTURE_2D: 0x0DE1
    };

    Xflow.SHADER_CONSTANT_KEY = {
        WORLD_TRANSFORM: 1,
        VIEW_TRANSFORM: 2,
        SCREEN_TRANSFORM: 3,
        WORLD_TRANSFORM_NORMAL: 4,
        VIEW_TRANSFORM_NORMAL: 5,
        SCREEN_TRANSFORM_NORMAL: 6,
        OBJECT_ID: 7
    };

    Xflow.VS_ATTRIB_TRANSFORM = {
        NONE: 0,
        VIEW_POINT: 1,
        WORLD_POINT: 2,
        VIEW_NORMAL: 3,
        WORLD_NORMAL: 4
    };


    /**
     * Filter Type of DataNode
     * KEEP - Keep only the provided names
     * REMOVE - Remove provided names (ignores name mapping)
     * RENAME - Only apply name mapping
     * @enum
     */
    Xflow.DATA_FILTER_TYPE = {
        NONE: 0,
        RENAME: 1,
        KEEP: 2,
        REMOVE: 3
    };


    /**
     * @enum {number}
     */
    Xflow.DATA_ENTRY_STATE = {
        CHANGED_VALUE: 1,
        CHANGED_NEW: 2,
        LOAD_START: 3,
        LOAD_END: 4,
        CHANGED_SIZE: 5,
        CHANGED_REMOVED: 6,
        // Not just the size changed, but also qualifier
        // if we have 0, 1 or many tuples in value
        CHANGED_SIZE_TYPE: 7
    };

    Xflow.RESULT_TYPE = {
        COMPUTE: 0,
        VS: 1
    };


    /**
     * Type of Modification, used internally only
     * Ordered by importance.
     * @enum
     */
    Xflow.RESULT_STATE = {
        NONE: 0,
        CHANGED_DATA_VALUE: 1,
        CHANGED_DATA_SIZE: 2,
        CHANGED_STRUCTURE: 3,
        // TODO: Felix: Still required?
        IMAGE_LOAD_START: 4,
        IMAGE_LOAD_END: 5
    };


    /**
     * Type of Sequence access - used by operators
     * @private
     * @enum
     */
    Xflow.SEQUENCE = {
        NO_ACCESS: 0,
        PREV_BUFFER: 1,
        NEXT_BUFFER: 2,
        LINEAR_WEIGHT: 3
    };


    Xflow.ITERATION_TYPE = {
        NULL: 0,
        ONE: 1,
        MANY: 2
    };

    /**
     * Type of Information Extraction - used by operators
     * @private
     * @enum
     */
    Xflow.EXTRACT = {
        NO_EXTRAC: 0,
        TEX_WIDTH: 1,
        TEX_HEIGHT: 2
    };

    Xflow.ORIGIN = {
        CHILD: 1,
        COMPUTE: 2,
        PROTO: 3
    };

    /**
     * Types of platforms to perform computation on
     * @type {Object}
     */
    Xflow.PLATFORM = {
        JAVASCRIPT: 0,
        GLSL: 1,
        CL: 2,
        ASYNC: 3
    };

    Xflow.PROCESS_STATE = {
        MODIFIED: 0,
        LOADING: 1,
        NEEDS_VALIDATION: 2,
        INVALID: 3,
        UNPROCESSED: 4,
        PROCESSED: 5
    };

    // Error Callbacks:
    var c_errorCallbacks = [];
    Xflow.registerErrorCallback = function (callback) {
        c_errorCallbacks.push(callback);
    };

    Xflow.notifyError = function (message, node) {
        if (c_errorCallbacks.length > 0) {
            var i;
            for (i = 0; i < c_errorCallbacks.length; ++i) {
                c_errorCallbacks[i](message, node);
            }
        } else {
            // TODO: Do Default error printing
        }
    };


    /* Tools */

    /**
     *
     * @param {Object} ctor Constructor
     * @param {Object} parent Parent class
     * @param {Object=} methods Methods to add to the class
     * @returns {Object}
     */
    Xflow.createClass = function (ctor, parent, methods) {
        methods = methods || {};
        if (parent) {
            /** @constructor */
            var F = function () {
            };
            F.prototype = parent.prototype;
            ctor.prototype = new F();
            ctor.prototype.constructor = ctor;
            ctor.superclass = parent.prototype;
        }
        for (var m in methods) {
            ctor.prototype[m] = methods[m];
        }
        return ctor;
    };


    var c_listedCallbacks = [];
    var c_listedCallbacksData = [];

    /**
     * Cluster internal notifications to avoid multiple notifications
     * of same type. Mainly for Requests and Results
     *
     * @param requestOrResult Request or Result
     * @param {Xflow.RESULT_STATE} Custom callback resultState
     * @private
     */
    Xflow._queueResultCallback = function (requestOrResult, resultState) {
        var index;
        if (( index = c_listedCallbacks.indexOf(requestOrResult)) == -1) {
            index = c_listedCallbacks.length;
            c_listedCallbacks.push(requestOrResult);
        }
        var prevData = c_listedCallbacksData[index];

        if (!prevData || prevData < resultState) {
            c_listedCallbacksData[index] = resultState;
        }
    };

    Xflow._flushResultCallbacks = function () {
        if (c_listedCallbacks.length) {
            var i;
            for (i = 0; i < c_listedCallbacks.length; ++i) {
                c_listedCallbacks[i]._onListedCallback(c_listedCallbacksData[i]);
            }
            c_listedCallbacks = [];
            c_listedCallbacksData = [];
        }
    };
}());





