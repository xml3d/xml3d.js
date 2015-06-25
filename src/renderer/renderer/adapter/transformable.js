var RenderAdapter = require("./base.js");
var DOMTransformFetcher = require("../../../data/transform-fetcher.js");
var Events = require("../../../interface/notification.js");
var AdapterHandle = require("../../../base/adapterhandle.js");

var TransformableAdapter = function (factory, node, handleMaterial, handleTransform) {
    RenderAdapter.call(this, factory, node);
    this.renderNode = null;
    this.materialHandler = null;
    this.handleMaterial = handleMaterial || false;
    if (handleTransform) {
        this.transformFetcher = new DOMTransformFetcher(this, "transform", "transform");
    }

};

XML3D.createClass(TransformableAdapter, RenderAdapter, {

    updateMaterialHandler: function () {
        var materialURI = getMaterialURI(this.node);
        if (!materialURI) {
            this.disconnectAdapterHandle("material");
            this.materialHandler = null;
        } else {
            this.materialHandler = this.getAdapterHandle(materialURI);
            this.connectAdapterHandle("material", this.materialHandler);
        }
        this.referencedMaterialChanged();
    },

    referencedMaterialChanged: function () {
        if (!this.materialHandler) {
            this.getRenderNode().setMaterial(null);
            return;
        }
        var status = this.materialHandler.status;
        if (status === AdapterHandle.STATUS.NOT_FOUND) {
            XML3D.debug.logError("Could not find element of url '" + this.materialHandler.url + "' for material", this.node);
            this.getRenderNode().setMaterial(null);
            return;
        }
        var adapter = this.materialHandler.getAdapter();
        if (adapter && adapter.getMaterialConfiguration) {
            this.getRenderNode().setMaterial(adapter.getMaterialConfiguration());
        } else {
            this.getRenderNode().setMaterial(null);
        }
    },

    onDispose: function () {
        this.transformFetcher && this.transformFetcher.clear();
    },

    onConfigured: function () {
    },

    getRenderNode: function () {
        if (!this.renderNode) {
            this.renderNode = this.createRenderNode ? this.createRenderNode() : null;
            this.updateLocalMatrix();
        }
        return this.renderNode;
    },

    updateLocalMatrix: function () {
        this.transformFetcher && this.transformFetcher.update();
    },

    onTransformChange: function (attrName, matrix) {
        if (attrName == "transform") {
            this.renderNode.setLocalMatrix(matrix);
        }

    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        RenderAdapter.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);

        if (name == "transform") {
            this.transformFetcher && this.transformFetcher.update();
        } else if (name == "style") {
            this.transformFetcher && this.transformFetcher.updateMatrix();
        } else if (name == "visible") {
            this.renderNode.setLocalVisible(newValue && (newValue.toLowerCase() !== "false"));
            this.factory.renderer.requestRedraw("Transformable visibility changed.");
        } else if (name == "material" && this.handleMaterial) {
            this.updateMaterialHandler();
            this.factory.renderer.requestRedraw("Transformable material changed.");
        }
    },

    notifyChanged: function (evt) {
     if (evt.type == Events.ADAPTER_HANDLE_CHANGED) {
            var key = evt.key;
            if (key == "material") {
                this.updateMaterialHandler();
                this.factory.renderer.requestRedraw("Material reference changed.");
            }
        }
    }
});

function getMaterialURI(node) {
    var materialURI = node.getAttribute("material");
    if (!materialURI) {
        var styleValue = node.getAttribute('style');
        if (styleValue) {
            var pattern = /material\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
            var result = pattern.exec(styleValue);
            if (result)
                materialURI = result[1];
        }
    }
    return materialURI;
}

module.exports = TransformableAdapter;
