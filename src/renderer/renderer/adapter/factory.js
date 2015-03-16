var NodeAdapterFactory = require("../../../base/adapter.js").NodeAdapterFactory;
var DataAdapterFactory = require("../../../data/adapter/factory.js");
require("../../../base/formathandler.js").xml3dFormatHandler.registerFactoryClass(DataAdapterFactory);

/**
 * @constructor
 * @implements {XML3D.base.IFactory}
 * @extends XML3D.base.NodeAdapterFactory
 * @param {number} canvasId
 */
var RenderAdapterFactory = function (canvasId) {
    NodeAdapterFactory.call(this, "webgl", canvasId);
    this.type = "RenderAdapterFactory";
};
XML3D.createClass(RenderAdapterFactory, NodeAdapterFactory);
RenderAdapterFactory.prototype.aspect = "webgl";


var registry = {
        xml3d: require("./xml3d.js"),
        view: require("./view.js"),
        defs: require("./defs.js"),
        mesh: require("./mesh.js"),
        model: require("./model.js"),
        shader: require("./shader.js"),
        group: require("./group.js"),
        light: require("./light.js"),
        lightshader: require("./lightshader.js")
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
