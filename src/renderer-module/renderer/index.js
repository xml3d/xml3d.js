var RenderAdapterFactory = require("./adapter/factory.js");
XML3D.base.xml3dFormatHandler.registerFactoryClass(RenderAdapterFactory);

module.exports = {
    toString: function () {
        return "renderer";
    },
    factory : require("./renderer-factory.js")
};
