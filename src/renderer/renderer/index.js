var RenderAdapterFactory = require("./adapter/factory.js");
XML3D.base.xml3dFormatHandler.registerFactoryClass(RenderAdapterFactory);

var factory = require("./renderer-factory.js");

/**
 *
 * @param {Element|Array.<Element>} xml3ds
 */
var configure = function(xml3ds) {
    if (!(xml3ds instanceof Array))
        xml3ds = [xml3ds];

    xml3ds.forEach(function(xml3dElement) {
        XML3D.debug.logDebug("Configuring Renderer for", xml3dElement.id);
        var renderer = factory.createRenderer(xml3dElement)

    });
};

module.exports = {
    toString: function () {
        return "renderer";
    },
    configure: configure

};
