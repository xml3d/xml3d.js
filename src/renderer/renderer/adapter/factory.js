var NodeAdapterFactory = require("../../../base/adapter.js").NodeAdapterFactory;
var ConfigInfo = require("../../../interface/configuration.js").classInfo;

/**
 * @constructor
 * @implements {XML3D.base.IFactory}
 * @extends XML3D.base.NodeAdapterFactory
 * @param {number} canvasId
 */
var RenderAdapterFactory = function (canvasId) {
    NodeAdapterFactory.call(this, "scene", canvasId);
    this.type = "RenderAdapterFactory";
};
XML3D.createClass(RenderAdapterFactory, NodeAdapterFactory);

var registry = {
        xml3d: require("./xml3d.js"),
        view: require("./view.js"),
        defs: require("./defs.js"),
        mesh: require("./mesh.js"),
        model: require("./model.js"),
        material: require("./material.js"),
        group: require("./group.js"),
        light: require("./light.js"),
        "web-component": require("./web-component.js")
    };

/**
 * @param node
 * @return {XML3D.base.Adapter|null}
 */
RenderAdapterFactory.prototype.createAdapter = function (node) {
    var adapterConstructor = registry[node.localName];
    if (adapterConstructor !== undefined) {
        return new adapterConstructor(this, node);
    }
    if (node.nodeType !== 1) {
        // This is a non-element node (ie. text node) so ignore it
        return null;
    }
    if (ConfigInfo[node.nodeName.toLowerCase()] !== undefined) {
        // This is an XML3D related element that doesn't need a render adapter (ie. value elements like float3)
        return null;
    }
    if (node.nodeName.indexOf("-") !== -1) {
        // This node follows the web component naming scheme, so treat it as a web component
        return new registry["web-component"](this, node);
    }

    // This is some other element like a div or a p, in this case treat it as a group node
    return new registry["group"](this, node);
};

RenderAdapterFactory.prototype.setScene = function (scene) {
    this.scene = scene;
};

RenderAdapterFactory.prototype.getScene = function () {
    return this.scene;
};

RenderAdapterFactory.prototype.setRenderer = function (renderer) {
    this.renderer = renderer;
};

RenderAdapterFactory.prototype.getRenderer = function () {
    return this.renderer;
};

// Export
module.exports = RenderAdapterFactory;
