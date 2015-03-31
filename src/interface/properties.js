var properties = {};

properties.XML3DNestedDataContainerTypeComplete = {
    get: function(){
        XML3D.flushDOMChanges();
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
        XML3D.flushDOMChanges();
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
        XML3D.flushDOMChanges();
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getAssetComplete) {
                return adapters[adapter].getAssetComplete();
            }
        }
        return false;
    },
    set: function(){}
};


properties.AssetProgressLevel = {
    get: function(){
        XML3D.flushDOMChanges();
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getAssetProgressLevel) {
                return adapters[adapter].getAssetProgressLevel();
            }
        }
        return false;
    },
    set: function(){}
};

properties.xml3dComplete = {
    get: function(){
        XML3D.flushDOMChanges();
        var adapters = this._configured.adapters || {};
        for (var adapter in adapters) {
            if (adapters[adapter].getComplete) {
                return adapters[adapter].getComplete();
            }
        }
        return false;
    },
    set: function(){}
};

module.exports = properties;
