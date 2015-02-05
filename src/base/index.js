(function (ns) {

    XML3D.base = require("./adapter.js");
    XML3D.extend(XML3D.base, require("./formathandler.js"));
    XML3D.extend(XML3D.base, require("./resourcemanager.js"));
    XML3D.base.AdapterHandle = require("./adapterhandle.js");

    XML3D.base.toString = function() {
        return "base";
    };
    XML3D.base.resourceManager = new XML3D.base.ResourceManager();
    XML3D.base.xml3dFormatHandler = new XML3D.base.XML3DFormatHandler();
    XML3D.base.registerFormat(XML3D.base.xml3dFormatHandler);
}(module));