var DataAdapterFactory = require("./adapter/factory.js");
XML3D.base.xml3dFormatHandler.registerFactoryClass(DataAdapterFactory);

// Register JSON Handler
require("./adapter/json/factory");
// Register JavaScript Handler (required for external shade.js Javascript resources)
require("./adapter/javascript/factory");



