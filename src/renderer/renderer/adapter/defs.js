var RenderAdapter = require("./base.js");

//Adapter for <defs>
var DefsRenderAdapter = function (factory, node) {
    RenderAdapter.call(this, factory, node);
};
XML3D.createClass(DefsRenderAdapter, RenderAdapter);

module.exports = DefsRenderAdapter;
