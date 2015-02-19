var DataAdapterFactory = require("./adapter/factory.js");
XML3D.base.xml3dFormatHandler.registerFactoryClass(DataAdapterFactory);

// Register JSON Handler
require("./adapter/json/factory");
// Register JavaScript Handler (required for external shade.js Javascript resources)
require("./adapter/javascript/factory");


XML3D.data = {
    toString : function() {
        return "data";
    },
    xflowGraph : new Xflow.Graph(),
    DOMTransformFetcher: require("./transform-fetcher")
};

var BUFFER_TYPE_TABLE = {};
BUFFER_TYPE_TABLE['float'] = Xflow.DATA_TYPE.FLOAT;
BUFFER_TYPE_TABLE['int'] = Xflow.DATA_TYPE.INT;
BUFFER_TYPE_TABLE['byte'] = Xflow.DATA_TYPE.BYTE;
BUFFER_TYPE_TABLE['ubyte'] = Xflow.DATA_TYPE.UBYTE;
BUFFER_TYPE_TABLE['bool'] = Xflow.DATA_TYPE.BOOL;
BUFFER_TYPE_TABLE['float2'] = Xflow.DATA_TYPE.FLOAT2;
BUFFER_TYPE_TABLE['float3'] = Xflow.DATA_TYPE.FLOAT3;
BUFFER_TYPE_TABLE['float4'] = Xflow.DATA_TYPE.FLOAT4;
BUFFER_TYPE_TABLE['int4'] = Xflow.DATA_TYPE.INT4;
BUFFER_TYPE_TABLE['float4x4'] = Xflow.DATA_TYPE.FLOAT4X4;

XML3D.data.BUFFER_TYPE_TABLE = BUFFER_TYPE_TABLE;

