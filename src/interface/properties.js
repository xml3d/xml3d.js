// methods.js
XML3D.properties = XML3D.properties || {};

new (function() {

    var properties = {};

    properties.XML3DNestedDataContainerTypeComplete = {
        get: function(){
            XML3D._flushDOMChanges();
            var adapters = this._configured.adapters || {};
            for (var adapter in adapters) {
                if (adapters[adapter].getDataComplete) {
                    return adapters[adapter].getDataComplete();
                }
            }
            return false;
        },
        set: function(){}
    };

    properties.XML3DNestedDataContainerTypeProgressLevel = {
        get: function(){
            XML3D._flushDOMChanges();
            var adapters = this._configured.adapters || {};
            for (var adapter in adapters) {
                if (adapters[adapter].getDataProgressLevel) {
                    return adapters[adapter].getDataProgressLevel();
                }
            }
            return false;
        },
        set: function(){}
    };

    properties.AssetComplete = {
        get: function(){
            XML3D._flushDOMChanges();
            var adapters = this._configured.adapters || {};
            for (var adapter in adapters) {
                if (adapters[adapter].getDataComplete) {
                    return adapters[adapter].getDataComplete();
                }
            }
            return false;
        },
        set: function(){}
    };


    properties.AssetProgressLevel = {
        get: function(){
            XML3D._flushDOMChanges();
            var adapters = this._configured.adapters || {};
            for (var adapter in adapters) {
                if (adapters[adapter].getDataProgressLevel) {
                    return adapters[adapter].getDataProgressLevel();
                }
            }
            return false;
        },
        set: function(){}
    };

    // Export to xml3d namespace
    XML3D.extend(XML3D.properties, properties);
});
