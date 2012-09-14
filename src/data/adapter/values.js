// data/values.js
(function() {
    "use strict";

    var BUFFER_TYPE_TABLE = {};
    BUFFER_TYPE_TABLE['float']    = Xflow.DataEntry.TYPE.FLOAT;
    BUFFER_TYPE_TABLE['int']      = Xflow.DataEntry.TYPE.INT;
    BUFFER_TYPE_TABLE['bool']     = Xflow.DataEntry.TYPE.BOOL;
    BUFFER_TYPE_TABLE['float2']   = Xflow.DataEntry.TYPE.FLOAT2;
    BUFFER_TYPE_TABLE['float3']   = Xflow.DataEntry.TYPE.FLOAT3;
    BUFFER_TYPE_TABLE['float4']   = Xflow.DataEntry.TYPE.FLOAT4;
    BUFFER_TYPE_TABLE['int4']     = Xflow.DataEntry.TYPE.INT4;
    BUFFER_TYPE_TABLE['float4x4'] = Xflow.DataEntry.TYPE.FLOAT4X4;
    XML3D.data.BUFFER_TYPE_TABLE = BUFFER_TYPE_TABLE;
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
        this.xflowInputNode = null;
    };
    XML3D.createClass(ValueDataAdapter, XML3D.base.Adapter);

    ValueDataAdapter.prototype.init = function()
    {
        var type = BUFFER_TYPE_TABLE[this.node.localName];
        var buffer = new Xflow.BufferEntry(type, this.node.value);

        this.xflowInputNode = XML3D.data.xflowGraph.createInputNode();
        this.xflowInputNode.name = this.node.name;
        this.xflowInputNode.data = buffer;
        this.xflowInputNode.seqnr = this.node.seqnr;
    }

    ValueDataAdapter.prototype.getXflowNode = function(){
        return this.xflowInputNode;
    }

    /**
     *
     */
    ValueDataAdapter.prototype.notifyChanged = function(evt)
    {
        if(evt.type == XML3D.events.VALUE_MODIFIED){
            var attr = evt.wrapped.attrName;
            if(!attr){
                this.xflowInputNode.data.setValue(this.node.value);
            }
            else if(attr == "name"){
                this.xflowInputNode.name = this.node.name;
            }
            else if(attr == "seqnr"){
                this.xflowInputNode.seqnr = this.node.seqnr;
            }
        }
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