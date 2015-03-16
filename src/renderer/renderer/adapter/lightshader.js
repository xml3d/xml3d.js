var RenderAdapter = require("./base.js");
var Events = require("../../../interface/notification.js");
var Resource = require("../../../base/resourcemanager.js").Resource;

/**
 * Adapter for <lightshader>
 * @constructor
 * @param {RenderAdapterFactory} factory
 * @param {Element} node
 * @extends RenderAdapter
 */
var LightShaderRenderAdapter = function (factory, node) {
    RenderAdapter.call(this, factory, node);
    this.dataAdapter = Resource.getAdapter(this.node, "data");
};
XML3D.createClass(LightShaderRenderAdapter, RenderAdapter, {
    getDataNode: function () {
        return this.dataAdapter.getXflowNode();
    }, getLightType: function () {
        var script = this.node.getAttribute("script");
        if (script.indexOf("urn:xml3d:lightshader:") === 0) {
            return script.substring(22, script.length);
        } else {
            XML3D.debug.logError("Unsupported light type " + script);
            return null;
        }
    }, notifyChanged: function (evt) {
        switch (evt.type) {
            case Events.THIS_REMOVED:
                this.notifyOppositeAdapters();
                break;
            case Events.VALUE_MODIFIED:
                this.notifyOppositeAdapters(Events.ADAPTER_VALUE_CHANGED);
                break;
        }
    }
});

// Export
module.exports = LightShaderRenderAdapter;

