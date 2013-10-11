// data/adapter/json/factory.js
(function() {

    var XML3DJSONFormatHandler = function() {
        XML3D.base.JSONFormatHandler.call(this);
    }
    XML3D.createClass(XML3DJSONFormatHandler, XML3D.base.JSONFormatHandler);

    XML3DJSONFormatHandler.prototype.isFormatSupported = function(response, responseType, mimetype) {
        return mimetype === "application/json" && response.format == "xml3d-json" && response.version == "0.4.0";
    }

    var xml3dJsonFormatHandler = new XML3DJSONFormatHandler();
    XML3D.base.registerFormat(xml3dJsonFormatHandler);


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
        "ubyte" : Uint8Array
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
        var type = XML3D.data.BUFFER_TYPE_TABLE[dataType];
        var buffer = new Xflow.BufferEntry(type, v);

        var inputNode = XML3D.data.xflowGraph.createInputNode();
        inputNode.data = buffer;
        inputNode.name = name;
        inputNode.key = key;
        dataNode.appendChild(inputNode);
    }

    function createXflowValueFromBuffer(dataNode, dataType, name, key, arrayBuffer, byteOffset, byteLength) {
        var ArrayType = TYPED_ARRAY_MAP[dataType];
        var v = new (ArrayType)(arrayBuffer, byteOffset, byteLength/ArrayType.BYTES_PER_ELEMENT);
        var type = XML3D.data.BUFFER_TYPE_TABLE[dataType];
        var buffer = new Xflow.BufferEntry(type, v);

        var inputNode = XML3D.data.xflowGraph.createInputNode();
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
                XML3D.base.resourceManager.loadData(value.url, function (arrayBuffer) {
                    createXflowValueFromBuffer(dataNode, jsonData.type, name, key, arrayBuffer, value.byteOffset, value.byteLength);
                }, null);
            } else {
                createXflowValue(dataNode, jsonData.type, name, key, value);
            }
        }
    }

    function createXflowNode(jsonData){
        if (jsonData.format != "xml3d-json")
            throw new Error("Unknown JSON format: " + jsonData.format);
        if (jsonData.version != "0.4.0")
            throw new Error("Unknown JSON version: " + jsonData.version);

        var node = XML3D.data.xflowGraph.createDataNode();
        node.userData = "External Json"; // TODO: Try to add document URL here (how to get it?)

        var entries = jsonData.data;
        for(var name in entries) {
            createXflowInputs(node, name, entries[name]);
        }
        return node;
    }

    /**
     * @implements IDataAdapter
     */
    var JSONDataAdapter = function(jsonData) {
        this.json = jsonData;
        try{
            this.xflowDataNode = createXflowNode(jsonData);
        } catch (e) {
            XML3D.debug.logException(e, "Failed to process XML3D json file");
        }

    };

    JSONDataAdapter.prototype.getXflowNode = function(){
        return this.xflowDataNode;
    }

    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     */
    var JSONFactory = function()
    {
        XML3D.base.AdapterFactory.call(this, XML3D.data);
    };
    XML3D.createClass(JSONFactory, XML3D.base.AdapterFactory);


    JSONFactory.prototype.aspect = XML3D.data;

    JSONFactory.prototype.createAdapter = function(data) {
        return new JSONDataAdapter(data);
    }

    xml3dJsonFormatHandler.registerFactoryClass(JSONFactory);
}());
