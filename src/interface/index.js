(function (ns) {
    XML3D.extend(XML3D, require("./attributes.js"));
    XML3D.extend(XML3D, require("./configuration.js"));
    XML3D.methods = require("./methods.js");
    XML3D.extend(XML3D, require("./elements.js"));
    XML3D.events = require("./notification.js");
    XML3D.properties = require("./properties.js");
    XML3D.extend(XML3D, require("./dom.js"));
}(module));