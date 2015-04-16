var RenderAdapter = require("./base.js");

/**
 * Adapter for <lightshader>
 * TODO(ksons): Remove in 5.1
 * @constructor
 * @param {RenderAdapterFactory} factory
 * @param {Element} node
 * @extends RenderAdapter
 */
var LightShaderRenderAdapter = function (factory, node) {
    RenderAdapter.call(this, factory, node);
    XML3D.debug.logWarning("The <lightshader> element is deprecated in XML3D 5.0.", node);
};

// Export
module.exports = LightShaderRenderAdapter;

