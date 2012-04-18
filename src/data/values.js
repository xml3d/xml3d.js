// data/values.js
(function() {
    "use strict";

    var tupleTable = {};
    tupleTable['float']    = 1;
    tupleTable['int']      = 1;
    tupleTable['bool']     = 1;
    tupleTable['float2']   = 2;
    tupleTable['float3']   = 3;
    tupleTable['float4']   = 4;
    tupleTable['int4']     = 4;
    tupleTable['float4x4'] = 16;

    /**
     * Constructor of XML3D.data.ValueDataAdapter
     *
     * @extends XML3D.data.DataAdapter
     * @extends XML3D.data.ProviderEntry
     * @constructor
     *
     * @param factory
     * @param {Element} node
     */
    var ValueDataAdapter = function(factory, node)
    {
        XML3D.data.DataAdapter.call(this, factory, node);
        XML3D.data.ProviderEntry.call(this);
        this.init = function()
        {
            this.value = this.node.value;
            this.key = this.node.seqnr;
            this.tupleSize = tupleTable[this.node.localName];
        };
        this.provider = new XML3D.data.ProviderEntry();
        this.data = {};

    };
    XML3D.createClass(ValueDataAdapter, XML3D.data.DataAdapter);
    XML3D.extend(ValueDataAdapter.prototype, XML3D.data.ProviderEntry.prototype);

    ValueDataAdapter.prototype.getValue = function() {
        return this.node.value;
    };

    ValueDataAdapter.prototype.getTupleSize = function() {
        return this.tupleSize;
    };

    ValueDataAdapter.prototype.getOutputs = function() {
        var result = {};
        result[this.node.name] = this;
        return result;
    };

    ValueDataAdapter.prototype.populateProcessTable = function(table) {
        var fields = table.fieldNames;
        for(var i = 0; i < fields.length; i++){
            if(fields[i] == this.node.name) {
                table.providers[fields[i]] = this;
                return;
            }
        }
    };

    /**
     * No data is cached, thus just need to inform all the
     * consumers.
     */
    ValueDataAdapter.prototype.notifyChanged = function(e)
    {
        this.notifyDataChanged(this);
    };

    /**
     * Returns String representation of this DataAdapter
     */
    ValueDataAdapter.prototype.toString = function()
    {
        return "XML3D.data.ValueDataAdapter";
    };

    // Export
    XML3D.data.ValueDataAdapter = ValueDataAdapter;

}());