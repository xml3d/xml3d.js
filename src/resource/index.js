var Resource = {};
XML3D.extend(Resource, require("./coordinator.js"));
XML3D.extend(Resource, require("./fetcher.js"));
Resource.FormatHandler = require("./formathandler.js");

module.exports = Resource;
