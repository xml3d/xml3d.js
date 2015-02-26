
require("./utils/math")(XML3D.math);
window.Xflow = require("./interface/");
XML3D.extend(Xflow, require("./base.js").Xflow);

window.Xflow.registerErrorCallback = require("./base.js").registerErrorCallback;

// Load all default operators
require("./operator/default/")
