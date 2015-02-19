
require("./utils/math")(XML3D.math);
Xflow = require("./interface/");
XML3D.extend(Xflow, require("./base.js").Xflow);
Xflow.registerErrorCallback = require("./base.js").registerErrorCallback;
