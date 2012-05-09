// data/sink.js
(function() {
    "use strict";

    /**
     * Class    XML3D.data.SinkDataAdapter
     * extends: XML3D.data.DataAdapter
     *
     * SinkDataAdapter represents the sink in the data hierarchy (no parents).
     *
     * @author  Benjamin Friedrich
     * @version 10/2010  1.0
     */

    /**
     * Constructor of XML3D.data.SinkDataAdapter
     *
     * @augments XML3D.data.DataAdapter
     * @constructor
     *
     * @param factory
     * @param node
     *
     */
    var SinkDataAdapter = function(factory, node)
    {
        XML3D.data.DataAdapter.call(this, factory, node);
    };
    XML3D.createClass(SinkDataAdapter, XML3D.data.DataAdapter);

    /**
     * Indicates whether this DataAdapter is a SinkAdapter (has no parent DataAdapter).
     *
     * @returns true if this DataAdapter is a SinkAdapter, otherwise false.
     */
    SinkDataAdapter.prototype.isSinkAdapter = function()
    {
        return true;
    };

    /**
     * Returns String representation of this DataAdapter
     */
    SinkDataAdapter.prototype.toString = function()
    {
        return "XML3D.data.SinkDataAdapter";
    };

    // Export
    XML3D.data.SinkDataAdapter = SinkDataAdapter;

    var ImgDataAdapter = function(factory, node)
    {
        XML3D.data.DataAdapter.call(this, factory, node);
        XML3D.data.ProviderEntry.call(this);
        this.image = null;
    };
    XML3D.createClass(ImgDataAdapter, XML3D.data.DataAdapter);
    XML3D.extend(ImgDataAdapter.prototype, XML3D.data.ProviderEntry.prototype);


    var createImage = function(src, cb) {
        var image = new Image();
        image.onload = cb;
        image.src = src;
        return image;
    };

    ImgDataAdapter.prototype.getValue = function(cb) {
        if(!this.image)
        {
            this.image = createImage(this.node.src, cb);
        }
        return this.image;
    };
    
    ImgDataAdapter.prototype.getOutputs = function() {
        var result = {};
        result['image'] = this;
        return result;
    };

    // Export
    XML3D.data.ImgDataAdapter = ImgDataAdapter;

}());