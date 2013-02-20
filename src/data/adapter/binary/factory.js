// data/adapter/binary/factory.js
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

    function createXflowInput(dataNode, name, type, data) {
        var v = null;

        if (!TYPED_ARRAY_MAP[type])
            return;

        var v = new (TYPED_ARRAY_MAP[type])(data);
        var type = XML3D.data.BUFFER_TYPE_TABLE[type];
        var buffer = new Xflow.BufferEntry(type, v);

        var inputNode = XML3D.data.xflowGraph.createInputNode();
        inputNode.data = buffer;
        inputNode.name = name;
        dataNode.appendChild(inputNode);
    }

    function createXflowNode(data) {
        if (!data instanceof ArrayBuffer && !data instanceof ArrayBufferView)
            throw new Error("Unknown binary type: " + typeof data);

        var node = XML3D.data.xflowGraph.createDataNode();
        createXflowInput(node, "data", "ubyte", data);
        return node;
    }

    /**
     * @implements IDataAdapter
     */
    var BinaryDataAdapter = function(data) {
        this.data = data;
        try {
            this.xflowDataNode = createXflowNode(data);
        } catch (e) {
            XML3D.debug.logException(e, "Failed to process binary file");
        }
    };

    BinaryDataAdapter.prototype.getXflowNode = function(){
        return this.xflowDataNode;
    }

    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     */
    var BinaryFactory = function()
    {
        XML3D.base.AdapterFactory.call(this, XML3D.data,
            ["application/octet-stream", "text/plain; charset=x-user-defined"]);
    };

    XML3D.createClass(BinaryFactory, XML3D.base.AdapterFactory);

    BinaryFactory.prototype.createAdapter = function(data) {
        return new BinaryDataAdapter(data);
    }

    var binaryFactoryInstance = new BinaryFactory();
}());
