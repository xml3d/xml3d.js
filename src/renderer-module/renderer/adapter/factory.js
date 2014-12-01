/**
 * @constructor
 * @implements {XML3D.base.IFactory}
 * @extends XML3D.base.NodeAdapterFactory
 * @param {number} canvasId
 */
var RenderAdapterFactory = function (canvasId) {
    XML3D.base.NodeAdapterFactory.call(this, XML3D.webgl, canvasId);
    this.type = "RenderAdapterFactory";
};
XML3D.createClass(RenderAdapterFactory, XML3D.base.NodeAdapterFactory);
RenderAdapterFactory.prototype.aspect = XML3D.webgl;


var registry = {
        xml3d: require("./xml3d.js"),
        view: require("./view.js"),
        defs: require("./defs.js"),
        mesh: require("./mesh.js"),
        model: require("./model.js"),
        shader: require("./shader.js"),
        group: require("./group.js"),
        img: require("./img.js"),
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
