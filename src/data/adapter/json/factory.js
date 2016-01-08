var XC = require("../../../xflow/interface/constants.js");
var InputNode = require("../../../xflow/interface/graph.js").InputNode;
var DataNode = require("../../../xflow/interface/graph.js").DataNode;
var BufferEntry = require("../../../xflow/interface/data.js").BufferEntry;
var AdapterFactory = require("../../../base/adapter.js").AdapterFactory;

var XML3DJSONFormatHandler = function() {
    XML3D.resource.FormatHandler.call(this);
};
XML3D.createClass(XML3DJSONFormatHandler, XML3D.resource.FormatHandler);

XML3DJSONFormatHandler.prototype.isFormatSupported = function(response) {
    if (response.headers.has("Content-Type")) {
        var contentType = response.headers.get("Content-Type");
        return contentType.match(/\/json/);
    }
    if (response.url.match(/\.json/)) {
        return true;
    }
};


XML3DJSONFormatHandler.prototype.getFormatData = function(response) {
    return response.json().then(function(json) {
        if (json.format != "xml3d-json")
            throw new Error("Unknown JSON format: " + json.format);
        if (json.version != "0.4.0")
          throw new Error("Unknown JSON version: " + json.version);

        return json;
    });
};

XML3DJSONFormatHandler.prototype.getAdapter = function(data, aspect, canvasId) {
    if (aspect === "data" || aspect === "scene") {
        return new JSONDataAdapter(createXflowNode(data, aspect));
    }
    throw new Error("Unsupported aspect '"+aspect+"' encountered in JSON format handler.");
};

XML3D.resource.registerFormatHandler(new XML3DJSONFormatHandler());


var empty = function() {};

var TYPED_ARRAY_MAP = {
    "int" : Int32Array,
    "int4" : Int32Array,
    "float" : Float32Array,
    "float2" : Float32Array,
    "float3" : Float32Array,
    "float4" : Float32Array,
    "float4x4" : Float32Array,
    "bool" : Uint8Array,
    "byte" : Int8Array,
    "ubyte" : Uint8Array,
    "string": Array
};

var isLittleEndian = (function () {
    var buf = new ArrayBuffer(4);
    var dv = new DataView(buf);
    var view = new Int32Array(buf);
    view[0] = 0x01020304;
    var littleEndian = (dv.getInt32(0, true) === 0x01020304);
    return function () { return littleEndian; }
})();

function realTypeOf(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}

function createXflowValue(dataNode, dataType, name, key, value) {
    var v = new (TYPED_ARRAY_MAP[dataType])(value);
    var type = XC.DATA_TYPE.fromString(dataType);
    var buffer = new BufferEntry(type, v);

    var inputNode = new InputNode();
    inputNode.data = buffer;
    inputNode.name = name;
    inputNode.key = key;
    dataNode.appendChild(inputNode);
}

function createXflowValueFromBuffer(dataNode, dataType, name, key, arrayBuffer, byteOffset, byteLength) {
    var ArrayType = TYPED_ARRAY_MAP[dataType];
    var v = new (ArrayType)(arrayBuffer, byteOffset, byteLength/ArrayType.BYTES_PER_ELEMENT);
    var type = XC.DATA_TYPE.fromString(dataType);
    var buffer = new BufferEntry(type, v);

    var inputNode = new InputNode();
    inputNode.data = buffer;
    inputNode.name = name;
    inputNode.key = key;
    dataNode.appendChild(inputNode);
}

function createXflowInputs(dataNode, name, jsonData){
    var v = null;

    if (!TYPED_ARRAY_MAP[jsonData.type])
        return;

    for(var i = 0; i < jsonData.seq.length; ++i) {
        var entry = jsonData.seq[i];
        var value = entry.value;
        var key = entry.key;

        if (realTypeOf(value) === 'Object' && value.url) {
            if (!isLittleEndian()) {
                // FIXME add big-endian -> little-endian conversion
                throw new Error("Big-endian binary data are not supported yet");
            }
            XML3D.resource.fetch(value.url)
                .then(function (response) {
                    return response.arrayBuffer();
                }).then(function(arrayBuffer) {
                    createXflowValueFromBuffer(dataNode, jsonData.type, name, key, arrayBuffer, value.byteOffset, value.byteLength);
                });
        } else {
            createXflowValue(dataNode, jsonData.type, name, key, value);
        }
    }
}

function createXflowNode(jsonData, aspect){

    var node = new DataNode(false);
    node.userData = "External Json"; // TODO: Try to add document URL here (how to get it?)

    var entries;
    if (aspect === "scene")
        entries = jsonData.material;
    else
        entries = jsonData.data;

    for(var name in entries) {
        createXflowInputs(node, name, entries[name]);
    }
    return node;
}

/**
 * @implements IDataAdapter
 */
var JSONDataAdapter = function(xflowNode) {
    this.xflowDataNode = xflowNode;
};

JSONDataAdapter.prototype.getXflowNode = function(){
    return this.xflowDataNode;
};
