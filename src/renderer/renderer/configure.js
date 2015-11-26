var factory = require("./renderer-factory.js");

var configure = function(xml3ds) {
    if (!(xml3ds instanceof Array))
        xml3ds = [xml3ds];

    xml3ds.forEach(function(xml3dElement) {
        if (xml3dElement._configured.canvasHandler.renderer) {
            // This element has already been configured
            return;
        }
        XML3D.debug.logDebug("Configuring Renderer for", xml3dElement.id);
        var renderer = factory.createRenderer(xml3dElement)

    });
};

module.exports = configure;