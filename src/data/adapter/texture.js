var TextureEntry = require("../../xflow/interface/data.js").TextureEntry;
var InputNode = require("../../xflow/interface/graph.js").InputNode;
var XC = require("../../xflow/interface/constants.js");
var Events = require("../../interface/notification.js");
var NodeAdapter = require("../../base/adapter.js").NodeAdapter;
var GL = require("../../renderer/webgl/constants.js");

var defaults = require('lodash.defaults');
var assign = require('lodash.assign');


var TextureDataAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
};

XML3D.createClass(TextureDataAdapter, NodeAdapter, {

    init: function () {
        this.xflowInputNode = this.createXflowNode();
        this.xflowInputNode.data = this.createTextureEntry();
    },

    createTextureEntry: function () {
        var node = this.node;
        var entry = new TextureEntry(null);
        initTextureSamplingParameters(entry.getSamplerConfig(), node.getAttribute("wrap"), node.getAttribute("filter"), node.getAttribute("anisotropy"));

        var imageAdapter = this.factory.getAdapter(this.node.firstElementChild);
        if (imageAdapter) {
            imageAdapter.setTextureEntry(entry);
        }
        return entry;
    },

    shouldGenerateMipMaps: shouldGenerateMipMaps,

    /**
     *
     * @returns {InputNode}
     */
    createXflowNode: function () {
        var xnode = new InputNode();
        xnode.name = this.node.name;
        xnode.paramName = this.node.param ? this.node.name : null;
        xnode.key = this.node.key;
        return xnode;
    },

    setScriptValue: function () {
        XML3D.debug.logError("Texture currently does not support setScriptValue()");
    },

    getOutputs: function () {
        var result = {};
        result[this.node.name] = this;
        return result;
    },

    getValue: function () {
        return this.value;
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        switch (name) {
            case "name":
                this.xflowInputNode.name = newValue;
                break;
            case "param":
                this.xflowInputNode.paramName = newValue ? this.node.name : null;
                break;
            case "key":
                this.xflowInputNode.key = newValue;
                break;
            case "wrap":
            case "filter":
            case "samples":
                this.xflowInputNode.data = this.createTextureEntry();
                break;
        }
    },

    notifyChanged: function () { /* Nothing to do */
    },

    /**
     * @return {Element}
     */
    getXflowNode: function () {
        return this.xflowInputNode;
    }

});

var wrapToGL = {
    "clamp":  GL.CLAMP_TO_EDGE,
    "repeat": GL.REPEAT
};

var filterToGL = {
    "nearest": GL.NEAREST,
    "linear": GL.LINEAR,
    "nearest-mipmap-nearest": GL.NEAREST_MIPMAP_NEAREST,
    "linear-mipmap-nearest": GL.LINEAR_MIPMAP_NEAREST,
    "nearest-mipmap-linear": GL.NEAREST_MIPMAP_LINEAR,
    "linear-mipmap-linear": GL.LINEAR_MIPMAP_LINEAR
};

function shouldGenerateMipMaps(minFilter, magFilter) {
    return (minFilter != GL.NEAREST && minFilter != GL.LINEAR) || (magFilter != GL.NEAREST && magFilter != GL.LINEAR);
}

function parseTextureSamplingParameters(wrap, filter, anisotropy) {
    var result = {}, args;

    if(wrap) {
        args = wrap.split(/(\s+)/);
        result.wrapS = wrapToGL[args[0]];
        result.wrapT = wrapToGL[args[args.length - 1]];
    }

    if(filter) {
        args = filter.split(/(\s+)/);
        result.minFilter = filterToGL[args[0]];
        result.magFilter = filterToGL[args[args.length - 1]];
    }

    if(anisotropy) {
        var number = parseFloat(anisotropy);
        if (isNaN(number)) {
            number = anisotropy == "max" ? Infinity : undefined
        } else {
            number = Math.min(1.0, number)
        }
        result.anisotropy = number;
    }

    return result;
}

function initTextureSamplingParameters(config, wrap, filter, samples) {
    var params = parseTextureSamplingParameters(wrap, filter, samples);
    defaults(params, {
        wrapS: GL.CLAMP_TO_EDGE,
        wrapT: GL.CLAMP_TO_EDGE,
        minFilter: GL.LINEAR_MIPMAP_LINEAR,
        magFilter: GL.LINEAR,
        textureType: XC.TEX_TYPE.TEXTURE_2D,
        anisotropy: 1
    });
    assign(config, params);
    config.generateMipMap = shouldGenerateMipMaps(config.minFilter, config.magFilter);
}

// Export
module.exports = TextureDataAdapter;
