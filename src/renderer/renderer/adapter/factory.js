var NodeAdapterFactory = require("../../../base/adapter.js").NodeAdapterFactory;

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
        light: require("./light.js")
    };

/**
 * @param node
 * @return {XML3D.base.Adapter|null}
 */
RenderAdapterFactory.prototype.createAdapter = function (node) {
    var adapterConstructor = registry[node.localName];
    if (adapterConstructor !== undefined) {
        return new adapterConstructor(this, node);
    } else {
        if (node.nodeName.indexOf("-") !== -1) {
            // This is likely a web component instance, so treat it as a group
            return new registry["group"](this, node);
        }
    }
    return null;
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
