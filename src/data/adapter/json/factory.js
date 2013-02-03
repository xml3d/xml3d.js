// data/adapter/json/factory.js
(function() {

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

    function createXflowInputs(dataNode, name, jsonData){
        var v = null;

        if(!TYPED_ARRAY_MAP[jsonData.type])
            return;

        for(var i = 0; i < jsonData.seq.length; ++i){
            var entry = jsonData.seq[i];
            var value = entry.value;
            var key = entry.key;

            var v = new (TYPED_ARRAY_MAP[jsonData.type])(value);
            var type = XML3D.data.BUFFER_TYPE_TABLE[jsonData.type];
            var buffer = new Xflow.BufferEntry(type, v);

            var inputNode = XML3D.data.xflowGraph.createInputNode();
            inputNode.data = buffer;
            inputNode.name = name;
            inputNode.key = key;
            dataNode.appendChild(inputNode);

        }
    }

    function createXflowNode(jsonData){
        if (jsonData.format != "xml3d-json")
            throw new Error("Unknown JSON format: " + jsonData.format);
        if (jsonData.version != "0.4.0")
            throw new Error("Unknown JSON version: " + jsonData.version);

        var node = XML3D.data.xflowGraph.createDataNode();

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
        XML3D.base.AdapterFactory.call(this, XML3D.data, "application/json");
    };

    XML3D.createClass(JSONFactory, XML3D.base.AdapterFactory);

    JSONFactory.prototype.createAdapter = function(data) {
        return new JSONDataAdapter(data);
    }

    var jsonFactoryInstance = new JSONFactory();
}());
