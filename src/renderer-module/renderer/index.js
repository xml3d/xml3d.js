var Constants = require("./scene/constants.js");

var RenderAdapterFactory = require("./adapter/factory.js");
XML3D.base.xml3dFormatHandler.registerFactoryClass(RenderAdapterFactory);

module.exports = {
    toString: function () {
        return "renderer";
    },
    EVENT_TYPE: Constants.EVENT_TYPE,
    NODE_TYPE: Constants.NODE_TYPE,
    factory : require("./renderer-factory.js")

};
