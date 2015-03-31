var RenderAdapterFactory = require("./adapter/factory.js");
var xml3dFormatHandler = require("../../base/formathandler.js").xml3dFormatHandler;

xml3dFormatHandler.registerFactoryClass(RenderAdapterFactory);

var factory = require("./renderer-factory.js");

var configure = function(xml3ds) {
    if (!(xml3ds instanceof Array))
        xml3ds = [xml3ds];

    xml3ds.forEach(function(xml3dElement) {
        XML3D.debug.logDebug("Configuring Renderer for", xml3dElement.id);
        var renderer = factory.createRenderer(xml3dElement)

    });
};

module.exports = configure;