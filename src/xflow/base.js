var Xflow = {};

Xflow.EPSILON = 0.000001;

/**
 * Type of DataEntry
 * @enum
 */
Xflow.DATA_TYPE = {
    FLOAT: 0,
    FLOAT2 : 1,
    FLOAT3 : 2,
    FLOAT4 : 3,
    FLOAT4X4 : 10,
    INT : 20,
    INT4 : 21,
    BOOL: 30,
    TEXTURE: 40
}

Xflow.DATA_TYPE_TUPLE_SIZE = {};
Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.FLOAT] = 1;
Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.FLOAT2] = 2;
Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.FLOAT3] = 3;
Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.FLOAT4] = 4;
Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.FLOAT4X4] = 16;
Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.INT] = 1;
Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.INT4] = 4;
Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.BOOL] = 1;
Xflow.DATA_TYPE_TUPLE_SIZE[Xflow.DATA_TYPE.TEXTURE] = 1;

Xflow.DATA_TYPE_MAP = {
    'float' : Xflow.DATA_TYPE.FLOAT,
    'float2' : Xflow.DATA_TYPE.FLOAT2,
    'float3' : Xflow.DATA_TYPE.FLOAT3,
    'float4' : Xflow.DATA_TYPE.FLOAT4,
    'float4x4' : Xflow.DATA_TYPE.FLOAT4X4,
    'int' : Xflow.DATA_TYPE.INT,
    'int4' : Xflow.DATA_TYPE.INT4,
    'bool' : Xflow.DATA_TYPE.BOOL,
    'texture' : Xflow.DATA_TYPE.TEXTURE
}

/**
 * @enum {number}
 */
Xflow.TEX_FILTER_TYPE = {
    NONE: 0,
    REPEAT: 1,
    LINEAR: 2
};
/**
 * @enum {Number}
 */
Xflow.TEX_WRAP_TYPE = {
    CLAMP: 0,
    REPEAT: 1,
    BORDER: 2
};
/**
 * @enum {Number}
 */
Xflow.TEX_TYPE = {
    TEXTURE_1D: 0,
    TEXTURE_2D: 1,
    TEXTURE_3D: 2
};


/**
 * Filter Type of DataNode
 * KEEP - Keep only the provided names
 * REMOVE - Remove provided names (ignores name mapping)
 * RENAME - Only apply name mapping
 * @enum
 */
Xflow.DATA_FILTER_TYPE = {
    RENAME: 0,
    KEEP: 1,
    REMOVE: 2
}


/**
 * @enum {number}
 */
Xflow.DATA_ENTRY_STATE = {
    CHANGED_NEW: 0,
    CHANGED_VALUE: 1,
    CHANGE_SIZE: 2,
    CHANGE_REMOVED: 3
};


/**
 * Type of Modification, used internally only
 * @private
 * @enum
 */
Xflow.RESULT_STATE = {
    NONE: 0,
    CHANGED_DATA: 1,
    CHANGED_STRUCTURE: 2
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
}

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
