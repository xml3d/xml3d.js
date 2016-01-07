var RenderAdapter = require("./base.js");
var Events = require("../../../interface/notification.js");
var URI = require("../../../utils/uri.js").URI;
var AdapterHandle = require("../../../base/adapterhandle.js");
var Resource = require("../../../resource");

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

XML3D.createClass(MaterialRenderAdapter, RenderAdapter,  {

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

        var uri = this.getMaterialModel();
        if (uri.scheme == "urn") {
            this.disconnectAdapterHandle("model");
            this._materialModel = { "type": "urn", "urn": uri };
            return;
        }

        this.connectAdapterHandle("model", this.getAdapterHandle(uri, "data", 0));
        var adapter = this.getConnectedAdapter("model");
        if (adapter && adapter.getScriptType) {
            this._materialModel = { type: adapter.getScriptType(), script: adapter.getScript() };
        }
    },

    getMaterialModel: function () {
        return new URI(this.node.getAttribute("model"));
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        if (name == "model") {
            this.updateMaterialConfiguration();
        }
    },

    notifyChanged: function (evt) {
        switch (evt.type) {
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

