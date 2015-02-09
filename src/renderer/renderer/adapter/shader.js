var RenderAdapter = require("./base.js");

/**
 * @param factory
 * @param {Element} node
 * @extends RenderAdapter
 * @constructor
 */
var ShaderRenderAdapter = function (factory, node) {
    RenderAdapter.call(this, factory, node);
    this._dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, XML3D.data);
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
            return;
        }

        this._materialConfiguration = this.getScene().createMaterialConfiguration(this._materialModel, this._dataAdapter.getXflowNode(), {name: this.node.id});
        this.notifyOppositeAdapters();
    },

    updateMaterialModel: function () {
        var uri = this.getShaderScriptURI();
        if (uri.scheme == "urn") {
            this.disconnectAdapterHandle("script");
            this._materialModel = { "type": "urn", "urn": uri };
            return;
        }

        this.connectAdapterHandle("script", this.getAdapterHandle(uri, XML3D.data, 0));
        var adapter = this.getConnectedAdapter('script');
        if (adapter && adapter.getScriptType) {
            this._materialModel = { type: adapter.getScriptType(), script: adapter.getScriptCode() };
        }
    },

    getShaderScriptURI: function () {
        return new XML3D.URI(this.node.getAttribute("script"));
    },

    notifyChanged: function (evt) {
        switch (evt.type) {
            case XML3D.events.VALUE_MODIFIED:
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
            case XML3D.events.ADAPTER_HANDLE_CHANGED:
                if (evt.handleStatus == XML3D.base.AdapterHandle.STATUS.NOT_FOUND) {
                    XML3D.debug.logError("Could not find script of url '" + evt.url + "'");
                }
                this.updateMaterialConfiguration();
                break;
        }


    }
});

// Export
module.exports = ShaderRenderAdapter;

