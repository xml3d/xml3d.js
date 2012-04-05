// data/values.js
(function() {
    "use strict";

    /**
     * Class XML3D.data.ValueDataAdapter
     * extends: XML3D.data.DataAdapter
     *
     * ValueDataAdapter represents a leaf in the DataAdapter hierarchy. A
     * ValueDataAdapter is associated with the XML3D data elements having
     * no children besides a text node such as <bool>, <float>, <float2>,... .
     *
     * @author  Benjamin Friedrich, Kristian Sons
     * @version 10/2010  1.0
     */

    /**
     * Constructor of XML3D.data.ValueDataAdapter
     *
     * @augments XML3D.data.DataAdapter
     * @implements ProviderEntry
     * @constructor
     *
     * @param factory
     * @param node
     */
    var ValueDataAdapter = function(factory, node)
    {
        XML3D.data.DataAdapter.call(this, factory, node);
        this.init = function()
        {
            this.createDataTable(true);
        };
        this.data = {};
    };
    XML3D.createClass(ValueDataAdapter, XML3D.data.DataAdapter);

    var tupleTable = {
            float:      1,
            int:        1,
            bool:       1,
            float2:     2,
            float3:     3,
            float4:     4,
            int4:       4,
            float4x4:   16
    };

    /**
     * Extracts the texture data of a node. For example:
     *
     * <code>
     *  <texture name="...">
     *      <img src="textureData.jpg"/>
     *  </texture
     * </code>
     *
     * In this case, "textureData.jpg" is returned as texture data.
     *
     * @param   node  XML3D texture node
     * @returns texture data or null, if the given node is not a XML3D texture element
     */
    ValueDataAdapter.prototype.extractTextureData = function(node)
    {
        if(node.localName != "texture")
        {
            return null;
        }

        var textureChild = node.firstElementChild;
        if(!textureChild || textureChild.localName != "img")
        {
            XML3D.debug.logWarning("child of texture element is not an img element");
            return null;
        }

        return textureChild.src;
    };

    /**
     * Creates datatable. If the parameter 'forceNewInstance' is specified with 'true',
     * createDataTable() creates a new datatable, caches and returns it. If no
     * parameter is specified or 'forceNewInstance' is specified with 'false', the
     * cashed datatable is returned.<br/>
     * Each datatable has the following format:<br/>
     * <br/>
     * datatable['name']['tupleSize'] : tuple size of the data element with name 'name' <br/>
     * datatable['name']['data']      : typed array (https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/TypedArray-spec.html)
     *                                  associated with the data element with name 'name'
     *
     * @param   forceNewInstance
     *              indicates whether a new instance shall be created or the cached
     *              datatable shall be returned
     * @returns datatable
     */
    ValueDataAdapter.prototype.createDataTable = function(forceNewInstance)
    {
        if(forceNewInstance == undefined ? true : ! forceNewInstance)
        {
           return this.dataTable;
        }

        this.value = this.node.value;
        this.tupleSize = tupleTable[this.node.localName];

        var entry = {};
        entry.name = this.node.name;
        entry.value = this.node.value;
        entry.sequence = [];
        entry.sequence.push({key: +this.node.seqnr, value: this.node.value});
        entry.tupleSize = tupleTable[this.node.localName];
        this.entry = entry;

        this.dataTable  = {};
        this.dataTable[entry.name] = entry;
        return this.dataTable;
    };

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
     * Returns String representation of this DataAdapter
     */
    ValueDataAdapter.prototype.toString = function()
    {
        return "XML3D.data.ValueDataAdapter";
    };

    // Export
    XML3D.data.ValueDataAdapter = ValueDataAdapter;

}());