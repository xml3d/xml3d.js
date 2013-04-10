XML3D = {};
XML3D.math = {};
XML3D.debug = {};
XML3D.debug.logError = function(msg){
    self.postMessage({type: "error", msg: msg})
};
XML3D.debug.logWarning = function(msg){
    self.postMessage({type: "warning", msg: msg})
};
var exports = XML3D.math;
window = this;
