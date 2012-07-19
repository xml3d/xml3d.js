// renderer/shaders/base.js
(function() {
    "use strict";
     var shaders = {};
     var scripts = {};
     
     shaders.register = function(name, script) {
         scripts[name] = script;
         script.name = name;
     };
    
     shaders.getScript = function(script) {
         return scripts[script];
     };
     
     XML3D.shaders = shaders;
})();

