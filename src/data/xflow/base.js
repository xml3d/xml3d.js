// data/xflow/base.js
(function() {
    "use strict";
     var xflow = {};
     var scripts = {};
     
     xflow.register = function(name, script) {
         scripts[name] = script;
         script.name = name;
     };
    
     xflow.getScript = function(script) {
         return scripts[script];
     };
     
     XML3D.xflow = xflow;
})();

