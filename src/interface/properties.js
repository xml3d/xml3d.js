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

    properties.XML3DNestedDataContainerTypeTexComplete = {
        get: function(){
            XML3D._flushDOMChanges();
            var adapters = this._configured.adapters || {};
            for (var adapter in adapters) {
                if (adapters[adapter].getDataTexComplete) {
                    return adapters[adapter].getDataTexComplete();
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


    properties.AssetTexComplete = {
        get: function(){
            XML3D._flushDOMChanges();
            var adapters = this._configured.adapters || {};
            for (var adapter in adapters) {
                if (adapters[adapter].getDataTexComplete) {
                    return adapters[adapter].getDataTexComplete();
                }
            }
            return false;
        },
        set: function(){}
    };

    // Export to xml3d namespace
    XML3D.extend(XML3D.properties, properties);
});
