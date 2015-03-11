var RenderAdapter = require("./base.js");
var DOMTransformFetcher = require("../../../data/transform-fetcher.js");
var Events = require("../../../interface/notification.js");
var AdapterHandle = XML3D.base.AdapterHandle;

var TransformableAdapter = function (factory, node, handleShader, handleTransform) {
    RenderAdapter.call(this, factory, node);
    this.renderNode = null;
    this.shaderHandler = null;
    this.handleShader = handleShader || false;
    if (handleTransform) {
        this.transformFetcher = new DOMTransformFetcher(this, "transform", "transform");
    }

};
XML3D.createClass(TransformableAdapter, RenderAdapter);

XML3D.extend(TransformableAdapter.prototype, {
    updateShaderHandler: function () {
        var shaderURI = getShaderURI(this.node);
        if (!shaderURI) {
            this.disconnectAdapterHandle("shader");
            this.shaderHandler = null;
        } else {
            this.shaderHandler = this.getAdapterHandle(shaderURI);
            this.connectAdapterHandle("shader", this.shaderHandler);
        }
        this.referencedShaderChanged();
    },

    referencedShaderChanged: function () {
        if (!this.shaderHandler) {
            this.getRenderNode().setMaterial(null);
            return;
        }
        var status = this.shaderHandler.status;
        if (status === AdapterHandle.STATUS.NOT_FOUND) {
            XML3D.debug.logError("Could not find element of url '" + this.shaderHandler.url + "' for shader", this.node);
            this.getRenderNode().setMaterial(null);
            return;
        }
        var adapter = this.shaderHandler.getAdapter();
        if (adapter && adapter.getMaterialConfiguration) {
            this.getRenderNode().setMaterial(adapter.getMaterialConfiguration());
        } else {
            this.getRenderNode().setMaterial(null);
        }
    },

    onDispose: function () {
        this.transformFetcher && this.transformFetcher.clear();
    }, onConfigured: function () {
    }, getRenderNode: function () {
        if (!this.renderNode) {
            this.renderNode = this.createRenderNode ? this.createRenderNode() : null;
            this.updateLocalMatrix();
        }
        return this.renderNode;
    }, updateLocalMatrix: function () {
        this.transformFetcher && this.transformFetcher.update();
    }, onTransformChange: function (attrName, matrix) {
        if (attrName == "transform") {
            this.renderNode.setLocalMatrix(matrix);
        }

    },


    notifyChanged: function (evt) {
        if (evt.type == Events.VALUE_MODIFIED) {
            var target = evt.mutation.attributeName;
            if (target == "transform") {
                this.transformFetcher && this.transformFetcher.update();
            } else if (target == "style") {
                this.transformFetcher && this.transformFetcher.updateMatrix();
            } else if (target == "visible") {
                var newValue = evt.mutation.target.getAttribute("visible");
                this.renderNode.setLocalVisible(newValue && (newValue.toLowerCase() !== "false"));
                this.factory.renderer.requestRedraw("Transformable visibility changed.");
            } else if (target == "shader" && this.handleShader) {
                this.updateShaderHandler();
                this.factory.renderer.requestRedraw("Transformable shader changed.");
            }
        } else if (evt.type == Events.ADAPTER_HANDLE_CHANGED) {
            var key = evt.key;
            if (key == "shader") {
                this.updateShaderHandler();
                this.factory.renderer.requestRedraw("Shader reference changed.");
            }
        }
    }
});

function getShaderURI(node) {
    var shaderHref = node.shader;
    if (shaderHref == "") {
        var styleValue = node.getAttribute('style');
        if (styleValue) {
            var pattern = /shader\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
            var result = pattern.exec(styleValue);
            if (result)
                shaderHref = result[1];
        }
    }
    return shaderHref;
}

module.exports = TransformableAdapter;
