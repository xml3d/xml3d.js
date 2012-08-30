// data/values.js
(function() {
    "use strict";

    var bufferTypeTable = {};
    bufferTypeTable['float']    = Xflow.DataEntry.TYPE.FLOAT;
    bufferTypeTable['int']      = Xflow.DataEntry.TYPE.INT;
    bufferTypeTable['bool']     = Xflow.DataEntry.TYPE.BOOL;
    bufferTypeTable['float2']   = Xflow.DataEntry.TYPE.FLOAT2;
    bufferTypeTable['float3']   = Xflow.DataEntry.TYPE.FLOAT3;
    bufferTypeTable['float4']   = Xflow.DataEntry.TYPE.FLOAT4;
    bufferTypeTable['int4']     = Xflow.DataEntry.TYPE.INT4;
    bufferTypeTable['float4x4'] = Xflow.DataEntry.TYPE.FLOAT4X4;

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
        var type = bufferTypeTable[this.node.localName];
        var buffer = new Xflow.BufferEntry(type, this.node.value);

        this.xflowInputNode = XML3D.data.xflowGraph.createInputNode();
        this.xflowInputNode.name = this.node.name;
        this.xflowInputNode.value = buffer;
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
                this.xflowInputNode.value.setValue(this.node.value);
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