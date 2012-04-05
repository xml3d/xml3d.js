// data/texture.js
(function() {
    "use strict";

    var TextureDataAdapter = function(factory, node)
    {
        XML3D.data.DataAdapter.call(this, factory, node);
    };
    XML3D.createClass(TextureDataAdapter, XML3D.data.DataAdapter);

    TextureDataAdapter.prototype.createDataTable = function(forceNewInstance)
    {
        if(forceNewInstance == undefined ? true : ! forceNewInstance)
        {
           return this.dataTable;
        }
        var gl = this.factory.handler.gl;
        var clampToGL = function(gl, modeStr) {
            if (modeStr == "clamp")
                return gl.CLAMP_TO_EDGE;
            if (modeStr == "repeat")
                return gl.REPEAT;
            return gl.CLAMP_TO_EDGE;
        };

        var filterToGL = function(gl, modeStr) {
            if (modeStr == "nearest")
                return gl.NEAREST;
            if (modeStr == "linear")
                return gl.LINEAR;
            if (modeStr == "mipmap_linear")
                return gl.LINEAR_MIPMAP_NEAREST;
            if (modeStr == "mipmap_nearest")
                return gl.NEAREST_MIPMAP_NEAREST;
            return gl.LINEAR;
        };

        var node = this.node;
        var imgSrc = new Array();

        // TODO: Sampler options
        var options = ({
            /*Custom texture options would go here, SGL's default options are:

            minFilter        : gl.LINEAR,
            magFilter        : gl.LINEAR,
            wrapS            : gl.CLAMP_TO_EDGE,
            wrapT            : gl.CLAMP_TO_EDGE,
            isDepth          : false,
            depthMode        : gl.LUMINANCE,
            depthCompareMode : gl.COMPARE_R_TO_TEXTURE,
            depthCompareFunc : gl.LEQUAL,
            generateMipmap   : false,
            flipY            : true,
            premultiplyAlpha : false,
            onload           : null
             */
            wrapS            : clampToGL(gl, node.wrapS),
            wrapT            : clampToGL(gl, node.wrapT),
            generateMipmap   : false

        });

        // TODO: automatically set generateMipmap to true when mipmap dependent filters are used
        options.minFilter = filterToGL(gl, node.getAttribute("minFilter"));
        options.magFilter = filterToGL(gl, node.getAttribute("magFilter"));
        if (node.getAttribute("mipmap") == "true")
            options.generateMipmap = true;

        if (node.hasAttribute("textype") && node.getAttribute("textype") == "cube") {
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

        } else {
            var textureChild = node.firstElementChild;
            if(!textureChild || textureChild.localName != "img")
            {
                XML3D.debug.logWarning("child of texture element is not an img element");
                return null; // TODO: Should always return a result
            }
            imgSrc.push(textureChild.src);
        }

        // TODO: Is this correct, do we use it as Array?
        var result           = new Array(1);
        //var value = new SglTexture2D(gl, textureSrc, options);
        var name             = this.node.name;
        var content          = new Array();
        content['tupleSize'] = 1;

        content['options'] = options;
        content['src'] = imgSrc;
        content['isTexture'] = true;
        content['node'] = this.node;

        result[name]    = content;
        this.dataTable  = result;
        return result;
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