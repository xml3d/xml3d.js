// data/adapter/json/factory.js
(function() {

    var empty = function() {};

    var StaticProviderEntry = function(data) {
        var v = null, ts = null;
        var first = data.seq[0];
        var value = first.value;
        switch(data.type) {
            case "int":
                ts = 1;
                v = new Int32Array(value);
                break;
            case "int4":
                ts = 4;
                v = new Int32Array(value);
                break;
            case "float":
                ts = 1;
                v = new Float32Array(value);
                break;
            case "float2":
                ts = 2;
                v = new Float32Array(value);
                break;
            case "float3":
                ts = 3;
                v = new Float32Array(value);
                break;
            case "float4":
                ts = 4;
                v = new Float32Array(value);
                break;
            case "float4x4":
                ts = 16;
                v = new Float32Array(value);
                break;
            case "bool":
                ts = 1;
                v = new Uint8Array(value);
                break;
            default:
                throw "StaticProviderEntry: " + data.type + " not supported.";
        }
        delete first.value;

        this.value = v;
        this.tupleSize = ts;

        this.registerConsumer = empty;
        this.data = {};
        this.getValue = function() {
            return this.value;
        };
        this.getTupleSize = function() {
            return this.tupleSize;
        };
    };

    /**
     * @implements IDataAdapter
     */
    var JSONDataAdapter = function(data) {
        this.json = data;
        this.parents = [];
    };

    JSONDataAdapter.prototype.addParentAdapter = function(adapter) {
        this.parents.push(adapter);
    };

    JSONDataAdapter.prototype.getOutputs = function() {
        var result = {};
        if (!this.json)
            return;
        try {
            if (this.json.format != "xml3d-json")
                throw "Unknown JSON format: " + this.json.format;
            if (this.json.version != "0.4.0")
                throw "Unknown JSON version: " + this.json.version;
            var entries = this.json.data;
            for(var e in entries) {
                result[e] = new StaticProviderEntry(entries[e]);
            }
        } catch (e) {
            XML3D.debug.logError("Failed to process XML3D json file ("+this.uri+"): " + e);
        }
        return result;
    };

    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     */
    var JSONFactory = {
        isFactoryFor : function(obj) {
            return typeof obj == "string" ? (obj == XML3D.data.toString()) : (obj == XML3D.data);
        },
        createAdapter : function(data) {
            return new JSONDataAdapter(data);
        }
    };

    XML3D.base.registerFactory("application/json", JSONFactory);
}());
