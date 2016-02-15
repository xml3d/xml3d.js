var GroupRenderAdapter = require("./group.js");
var Events = require("../../../interface/notification.js");
var mat4 = require("gl-matrix").mat4;

var WebComponentRenderAdapter = function (factory, node) {
    GroupRenderAdapter.call(this, factory, node);
};

XML3D.createClass(WebComponentRenderAdapter, GroupRenderAdapter, {

    notifyChanged: function (evt) {
        switch (evt.type) {
            case Events.ADAPTER_HANDLE_CHANGED:
                var key = evt.key;
                if (key == "material") {
                    this.updateMaterialHandler();
                    this.factory.renderer.requestRedraw("Material reference changed.");
                }
                break;
            case Events.THIS_REMOVED:
                removeRecursive(this.renderNode);
                this.dispose();
                this.factory.renderer.requestRedraw("Web component removed");
                break;
            case Events.NODE_INSERTED:
                if (evt.affectedNode.getDestinationInsertionPoints) {
                    var endpoints = evt.affectedNode.getDestinationInsertionPoints();
                    for (var i=0; i<endpoints.length; i++) {
                        var adapters = endpoints[i]._configured ? endpoints[i]._configured.adapters : {};
                        for (var name in adapters) {
                            adapters[name].notifyChanged(evt);
                        }
                    }
                } else {
                    this.initElement(evt.affectedNode);
                }
                break;
            default:
                XML3D.debug.logDebug("Unhandled event in WebComponentRenderAdapter:", evt);
        }
    }

});

function removeRecursive(renderNode) {
    for (var i=0; i < renderNode.children.length; i++) {
        removeRecursive(renderNode.children[i]);
    }
    renderNode.dispose && renderNode.dispose();
}

module.exports = WebComponentRenderAdapter;
