// box.js
(function() {

    var c_configValues = {},
        c_configListeners = [];

    var XML3DFlags = {
        setValue : function(key, value){
            if(!c_configValues.hasOwnProperty(key))
                throw new Error("Invalid configuration key '" + key + "'");
            c_configValues[key] = value;
            notifyObservers(key, value);
        },
        getValue: function(key){
            if(!c_configValues.hasOwnProperty(key))
                throw new Error("Invalid configuration key '" + key + "'");
            return c_configValues[key];
        },
        getKeys: function(){
            return Object.keys(c_configValues);
        }
    }
    window.XML3DFlags = XML3DFlags;

    function notifyObservers(key, value){
        for(var i = 0; i < c_configListeners.length; ++i){
            c_configListeners[i](key, value);
        }
    }

    XML3D.flags = {};

    XML3D.flags.register = function(key, defaultValue){
        c_configValues[key] = defaultValue;
    };

    XML3D.flags.addObserver = function(observer){
        c_configListeners.push(observer);
    }
    XML3D.flags.removeObserver = function(observer){
        var idx = c_configListeners.indexOf(observer);
        if(idx != -1)
            c_configListeners.splice(idx, 1);
    }




}());
