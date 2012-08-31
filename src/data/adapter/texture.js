// data/texture.js
(function() {
    "use strict";

    var clampToGL = function(modeStr) {
        if (modeStr == "clamp")
            return WebGLRenderingContext.CLAMP_TO_EDGE;
        if (modeStr == "repeat")
            return WebGLRenderingContext.REPEAT;
        return WebGLRenderingContext.CLAMP_TO_EDGE;
    };

    var filterToGL = function(modeStr) {
        if (modeStr == "nearest")
            return WebGLRenderingContext.NEAREST;
        if (modeStr == "linear")
            return WebGLRenderingContext.LINEAR;
        if (modeStr == "mipmap_linear")
            return WebGLRenderingContext.LINEAR_MIPMAP_NEAREST;
        if (modeStr == "mipmap_nearest")
            return WebGLRenderingContext.NEAREST_MIPMAP_NEAREST;
        return WebGLRenderingContext.LINEAR;
    };

    var TextureDataAdapter = function(factory, node)
    {
        XML3D.data.DataAdapter.call(this, factory, node);
        this.table = new XML3D.data.ProcessTable(this, ["image"]);
    };
    XML3D.createClass(TextureDataAdapter, XML3D.base.Adapter);


    TextureDataAdapter.prototype.init = function() {
        var node = this.node;

        var imageAdapter = this.factory.getAdapter(node.firstElementChild, XML3D.data.XML3DDataAdapterFactory.prototype);
        var buffer = new Xflow.TextureEntry(imageAdapter.node);

        this.xflowInputNode = XML3D.data.xflowGraph.createInputNode();
        this.xflowInputNode.name = node.name;
        this.xflowInputNode.data = buffer;
        var options = buffer.getSamplerConfig();

        options.wrapS = clampToGL(node.wrapS);
        options.wrapT = clampToGL(node.wrapT);
        options.minFilter = filterToGL(node.filterMin);
        options.magFilter = filterToGL(node.filterMin);

        // TODO: automatically set generateMipmap to true when mipmap dependent filters are used
        if (node.getAttribute("mipmap") == "true")
            options.filterMip = true;

        if (imageAdapter.requestOutputData) {
            var dt = imageAdapter.requestOutputData(this.table);
            buffer.userData.imageAdapter = dt.image;
        }
        else
            buffer.userData.imageAdapter = imageAdapter;

};

    TextureDataAdapter.prototype.getOutputs = function() {
        var result = {};
        result[this.node.name] = this;
        return result;
    };

    TextureDataAdapter.prototype.getValue = function() {
        return this.value;
    };

    /**
     * @return {Element}
     */
    TextureDataAdapter.prototype.getXflowNode = function() {
        return this.xflowInputNode;
    };

    /**
     * Returns String representation of this TextureDataAdapter
     */
    TextureDataAdapter.prototype.toString = function()
    {
        return "XML3D.data.TextureDataAdapter";
    };

    // Export
    XML3D.data.TextureDataAdapter = TextureDataAdapter;

}());