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
        XML3D.data.ProviderEntry.call(this);
    };
    XML3D.createClass(TextureDataAdapter, XML3D.data.DataAdapter);
    XML3D.extend(TextureDataAdapter.prototype, XML3D.data.ProviderEntry.prototype);


    TextureDataAdapter.prototype.init = function() {
        var node = this.node;

        var options = ({
            //isDepth          : false,
            //depthMode        : gl.LUMINANCE,
            //depthCompareMode : gl.COMPARE_R_TO_TEXTURE,
            //depthCompareFunc : gl.LEQUAL,
            //flipY            : true,
            //premultiplyAlpha : false,
            //onload           : null
            wrapS            : clampToGL(node.wrapS),
            wrapT            : clampToGL(node.wrapT),
            minFilter        : filterToGL(node.filterMin),
            magFilter        : filterToGL(node.filterMag),
            generateMipmap   : false
        });

        // TODO: automatically set generateMipmap to true when mipmap dependent filters are used
        if (node.getAttribute("mipmap") == "true")
            options.generateMipmap = true;

        /*if (node.hasAttribute("textype") && node.getAttribute("textype") == "cube") {
            for (var i=0; i<node.childNodes.length; i++) {
                var child = node.childNodes[i];
                if (child.localName != "img")
                    continue;
                imgSrc.push(child.src);
            }

            if (imgSrc.length != 6) {
                XML3D.debug.logError("A cube map requires 6 textures, but only "+imgSrc.length+" were found!");
                return null;
            }
            options["flipY"] = false;

        } else {*/
            var textureChild = node.firstElementChild;
            if(!textureChild || textureChild.localName != "img")
            {
                XML3D.debug.logWarning("child of texture element is not an img element");
                return;
            }
            options.src = textureChild.src;
        //}

        this.value = options;
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
     * Returns String representation of this TextureDataAdapter
     */
    TextureDataAdapter.prototype.toString = function()
    {
        return "XML3D.data.TextureDataAdapter";
    };

    // Export
    XML3D.data.TextureDataAdapter = TextureDataAdapter;

}());