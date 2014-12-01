var RenderAdapter = require("./base.js");

var ImgRenderAdapter = function (factory, node) {
    RenderAdapter.call(this, factory, node);
    this.textureAdapter = factory.getAdapter(node.parentNode);
};
XML3D.createClass(ImgRenderAdapter, RenderAdapter);

ImgRenderAdapter.prototype.notifyChanged = function (evt) {
    // Delegates all changes to its child
    this.textureAdapter.notifyChanged(evt);
};

module.export = ImgRenderAdapter;
