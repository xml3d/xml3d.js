var RenderAdapter = require("./base.js");
var Events = require("../../../interface/notification.js");
var URI = require("../../../utils/uri.js").URI;
var Resource = require("../../../base/resourcemanager.js").Resource;
var AdapterHandle = require("../../../base/adapterhandle.js");

/**
 * @param factory
 * @param {Element} node
 * @extends RenderAdapter
 * @constructor
 */
var MaterialRenderAdapter = function (factory, node) {
    RenderAdapter.call(this, factory, node);
    this._dataAdapter = Resource.getAdapter(node, "data");
    /** @type MaterialConfiguration | null **/
    this._materialConfiguration = null;
    this._materialModel = null;

    this.updateMaterialConfiguration();
};

XML3D.createClass(MaterialRenderAdapter, RenderAdapter);
XML3D.extend(MaterialRenderAdapter.prototype, {

    getMaterialConfiguration: function() {
        return this._materialConfiguration;
    },

    updateMaterialConfiguration: function () {
        // First find the model
        this.updateMaterialModel();
        if (!this._materialModel) {
            this._materialConfiguration = null;
        } else {
            this._materialConfiguration = this.getScene().createMaterialConfiguration(this._materialModel, this._dataAdapter.getXflowNode(), {name: this.node.id});
        }
        this.notifyOppositeAdapters();
    },

    updateMaterialModel: function () {
        this._materialModel = null;

        var uri = this.getMaterialScript();
        if (uri.scheme == "urn") {
            this.disconnectAdapterHandle("script");
            this._materialModel = { "type": "urn", "urn": uri };
            return;
        }

        this.connectAdapterHandle("script", this.getAdapterHandle(uri, "data", 0));
        var adapter = this.getConnectedAdapter('script');
        if (adapter && adapter.getScriptType) {
            this._materialModel = { type: adapter.getScriptType(), script: adapter.getScript() };
        }
    },

    getMaterialScript: function () {
        return new URI(this.node.getAttribute("script"));
    },

    notifyChanged: function (evt) {
        switch (evt.type) {
            case Events.VALUE_MODIFIED:
                var target = evt.mutation.attributeName;
                switch (target) {
                    case "script":
                        this.updateMaterialConfiguration();
                        break;
                    default:
                        XML3D.debug.logWarning("Unhandled mutation event in material adapter for parameter '" + target + "'");
                        break;

                }
                break;
            case Events.ADAPTER_HANDLE_CHANGED:
                if (evt.handleStatus == AdapterHandle.STATUS.NOT_FOUND) {
                    XML3D.debug.logError("Could not find material for url '" + evt.url + "'");

                }
                this.updateMaterialConfiguration();
                break;
        }


    }
});

// Export
module.exports = MaterialRenderAdapter;

