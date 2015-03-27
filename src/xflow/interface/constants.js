var C = {};

C.EPSILON = 0.000001;

/**
 * Type of DataEntry
 * @enum
 */
C.DATA_TYPE = {
    UNKNOWN: 0,
    FLOAT: 1,
    FLOAT2: 2,
    FLOAT3: 3,
    FLOAT4: 4,
    FLOAT3X3: 5,
    FLOAT4X4: 10,
    INT: 20,
    INT4: 21,
    BOOL: 30,
    TEXTURE: 40,
    BYTE: 50,
    UBYTE: 60,
    fromString: function(str) {
        if (!str || !str.toUpperCase) {
            return;
        }
        return this[str.toUpperCase()];
    }
};

C.DATA_TYPE_MAP = {
    'float': C.DATA_TYPE.FLOAT,
    'float2': C.DATA_TYPE.FLOAT2,
    'float3': C.DATA_TYPE.FLOAT3,
    'float4': C.DATA_TYPE.FLOAT4,
    'float3x3': C.DATA_TYPE.FLOAT3X3,
    'float4x4': C.DATA_TYPE.FLOAT4X4,
    'int': C.DATA_TYPE.INT,
    'int4': C.DATA_TYPE.INT4,
    'bool': C.DATA_TYPE.BOOL,
    'texture': C.DATA_TYPE.TEXTURE,
    'byte': C.DATA_TYPE.BYTE,
    'ubyte': C.DATA_TYPE.UBYTE
};

// Values are chosen to be in line with DATA_TYPE
C.TEXTURE_TYPE = {
    UNKNOWN: 0, FLOAT: 1, UBYTE: 60, USHORT_5_6_5: 70, USHORT_4_4_4_4: 71, USHORT_5_5_5_1: 72
};

C.TEXTURE_FORMAT = {
    UNKNOWN: 0, ALPHA: 100, RGB: 101, RGBA: 102, LUMINANCE: 103, LUMINANCE_ALPHA: 104
};

C.DATA_TYPE_TUPLE_SIZE = {};
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.FLOAT] = 1;
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.FLOAT2] = 2;
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.FLOAT3] = 3;
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.FLOAT4] = 4;
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.FLOAT3X3] = 9;
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.FLOAT4X4] = 16;
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.INT] = 1;
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.INT4] = 4;
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.BOOL] = 1;
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.TEXTURE] = 1;
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.BYTE] = 1;
C.DATA_TYPE_TUPLE_SIZE[C.DATA_TYPE.UBYTE] = 1;

C.TYPED_ARRAY_MAP = {};
C.TYPED_ARRAY_MAP[C.DATA_TYPE.FLOAT] = Float32Array;
C.TYPED_ARRAY_MAP[C.DATA_TYPE.FLOAT2] = Float32Array;
C.TYPED_ARRAY_MAP[C.DATA_TYPE.FLOAT3] = Float32Array;
C.TYPED_ARRAY_MAP[C.DATA_TYPE.FLOAT4] = Float32Array;
C.TYPED_ARRAY_MAP[C.DATA_TYPE.FLOAT4X4] = Float32Array;
C.TYPED_ARRAY_MAP[C.DATA_TYPE.INT] = Int32Array;
C.TYPED_ARRAY_MAP[C.DATA_TYPE.INT4] = Int32Array;
C.TYPED_ARRAY_MAP[C.DATA_TYPE.BOOL] = Int8Array;
C.TYPED_ARRAY_MAP[C.DATA_TYPE.BYTE] = Int8Array;
C.TYPED_ARRAY_MAP[C.DATA_TYPE.UBYTE] = Uint8Array;

// texture formats
// float and ubyte are mapped to DATA_TYPE values above
C.TYPED_ARRAY_MAP[C.TEXTURE_TYPE.USHORT_4_4_4_4] = Uint16Array;
C.TYPED_ARRAY_MAP[C.TEXTURE_TYPE.USHORT_5_6_5] = Uint16Array;
C.TYPED_ARRAY_MAP[C.TEXTURE_TYPE.USHORT_5_5_5_1] = Uint16Array;

C.TEXTURE_FORMAT_TUPLE_SIZE = {};
C.TEXTURE_FORMAT_TUPLE_SIZE[C.TEXTURE_FORMAT.ALPHA] = 1;
C.TEXTURE_FORMAT_TUPLE_SIZE[C.TEXTURE_FORMAT.RGB] = 3;
C.TEXTURE_FORMAT_TUPLE_SIZE[C.TEXTURE_FORMAT.RGBA] = 4;
C.TEXTURE_FORMAT_TUPLE_SIZE[C.TEXTURE_FORMAT.LUMINANCE] = 1;
C.TEXTURE_FORMAT_TUPLE_SIZE[C.TEXTURE_FORMAT.LUMINANCE_ALPHA] = 2;

C.getTypeName = function (type) {
    var i;
    for (i in C.DATA_TYPE_MAP) {
        if (C.DATA_TYPE_MAP[i] === type) {
            return i;
        }
    }
};

/**
 * @enum {number}
 */
C.TEX_FILTER_TYPE = {
    NEAREST: 0x2600, LINEAR: 0x2601, MIPMAP_NEAREST: 0x2700, MIPMAP_LINEAR: 0x2701

};
/**
 * @enum {number}
 */
C.TEX_WRAP_TYPE = {
    CLAMP: 0x812F, REPEAT: 0x2901
};
/**
 * @enum {number}
 */
C.TEX_TYPE = {
    TEXTURE_2D: 0x0DE1
};

C.SHADER_CONSTANT_KEY = {
    WORLD_TRANSFORM: 1,
    VIEW_TRANSFORM: 2,
    SCREEN_TRANSFORM: 3,
    WORLD_TRANSFORM_NORMAL: 4,
    VIEW_TRANSFORM_NORMAL: 5,
    SCREEN_TRANSFORM_NORMAL: 6,
    OBJECT_ID: 7
};

C.VS_ATTRIB_TRANSFORM = {
    NONE: 0, VIEW_POINT: 1, WORLD_POINT: 2, VIEW_NORMAL: 3, WORLD_NORMAL: 4
};


/**
 * Filter Type of DataNode
 * KEEP - Keep only the provided names
 * REMOVE - Remove provided names (ignores name mapping)
 * RENAME - Only apply name mapping
 * @enum
 */
C.DATA_FILTER_TYPE = {
    NONE: 0, RENAME: 1, KEEP: 2, REMOVE: 3
};


/**
 * TODO: Maybe merge this structure with RESULT_STATE to avoid back and forth conversion within notification chain
 * @enum {number}
 */
C.DATA_ENTRY_STATE = {
    CHANGED_VALUE: 1,
    CHANGED_NEW: 2,
    LOAD_START: 3,
    LOAD_END: 4,
    CHANGED_SIZE: 5,
    CHANGED_REMOVED: 6, // Not just the size changed, but also qualifier
    // if we have 0, 1 or many tuples in value
    CHANGED_SIZE_TYPE: 7
};

/** TODO: Merge with C.PLATFORM? **/
C.RESULT_TYPE = {
    COMPUTE: 0, VS: 1
};


/**
 * Type of Modification, used internally only
 * Ordered by importance.
 * @enum
 */
C.RESULT_STATE = {
    NONE: 0, CHANGED_DATA_VALUE: 1, CHANGED_DATA_SIZE: 2, CHANGED_STRUCTURE: 3, // TODO: Felix: Still required?
    IMAGE_LOAD_START: 4, IMAGE_LOAD_END: 5
};


/**
 * Type of Sequence access - used by operators
 * @enum
 */
C.SEQUENCE = {
    NO_ACCESS: 0, PREV_BUFFER: 1, NEXT_BUFFER: 2, LINEAR_WEIGHT: 3, ARRAY: 4  /** TODO(ksons): Array required (and supported?) **/
};


C.ITERATION_TYPE = {
    NULL: 0, ONE: 1, MANY: 2
};

/**
 * Type of Information Extraction - used by operators
 * @private
 * @enum
 */
//TODO: This seems to be unused, is it still needed?
C.EXTRACT = {
    NO_EXTRAC: 0, TEX_WIDTH: 1, TEX_HEIGHT: 2
};

C.ORIGIN = {
    CHILD: 1, COMPUTE: 2, PROTO: 3
};

/**
 * Types of platforms to perform computation on
 * @type {enum}
 */
C.PLATFORM = {
    JAVASCRIPT: 0, GLSL: 1, CL: 2, ASYNC: 3
};

/**
 * Possible states of a ProcessNode
 * @type {enum}
 */
C.PROCESS_STATE = {
    MODIFIED: 0, // We don't know (TODO Felix: Find out!)
    LOADING: 1, // Something still loading (blocked)
    INVALID: 3, // Input is invalid (might happen even after operator selection - e.g. because of empty array output etc.)
    UNPROCESSED: 4, // Process node is dirty
    PROCESSED: 5 // All data is up-to-date
};

//window.Xflow.PLATFORM = C.PLATFORM;

module.exports = C;
