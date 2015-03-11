var RenderAdapter = require("./base.js");
var Events = require("../../../interface/notification.js");

/**
 * @param factory
 * @param {Element} node
 * @extends RenderAdapter
 * @constructor
 */
var ShaderRenderAdapter = function (factory, node) {
    RenderAdapter.call(this, factory, node);
    this._dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, "data");
    /** @type MaterialConfiguration | null **/
    this._materialConfiguration = null;
    this._materialModel = null;

    this.updateMaterialConfiguration();
};

XML3D.createClass(ShaderRenderAdapter, RenderAdapter);
XML3D.extend(ShaderRenderAdapter.prototype, {

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

        var uri = this.getShaderScriptURI();
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

    getShaderScriptURI: function () {
        return new XML3D.URI(this.node.getAttribute("script"));
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
                        XML3D.debug.logWarning("Unhandled mutation event in shader adapter for parameter '" + target + "'");
                        break;

                }
                break;
            case Events.ADAPTER_HANDLE_CHANGED:
                if (evt.handleStatus == XML3D.base.AdapterHandle.STATUS.NOT_FOUND) {
                    XML3D.debug.logError("Could not find material for url '" + evt.url + "'");

                }
                this.updateMaterialConfiguration();
                break;
        }


    }
});

// Export
module.exports = ShaderRenderAdapter;

