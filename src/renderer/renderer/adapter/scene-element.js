var RenderAdapter = require("./base.js");
var DOMTransformFetcher = require("../../../data/transform-fetcher.js");
var Events = require("../../../interface/notification.js");
var AdapterHandle = require("../../../base/adapterhandle.js");

/**
 * The SceneElementAdapter adapter is the base adapter for all scene elements,
 * i.e. <group>, <view>, <mesh>, <light> and <model>. These are also
 * those element that create an object inside the {@link Scene} data structure
 *
 * @param {RenderAdapterFactory} factory
 * @param {HTMLElement} node
 * @param handleMaterial
 * @constructor
 * @extends RenderAdapter
 * @see @link http://xml3d.org/xml3d/specification/5.0/#scene-elements
 */
var SceneElementAdapter = function (factory, node, handleMaterial) {
    RenderAdapter.call(this, factory, node);
    this.renderNode = null;

    /**
     * Living object: Holds the style of the associated node
     * @type {CSSStyleDeclaration}
     */
    this.style = window.getComputedStyle(node);

    this.materialHandler = null;
    this.handleMaterial = handleMaterial || false;
    this.transformFetcher = new DOMTransformFetcher(this, "transform", "transform");
};

XML3D.createClass(SceneElementAdapter, RenderAdapter, {

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

    onConfigured: function () {
    },

    getRenderNode: function () {
        if (!this.renderNode) {
            this.renderNode = this.createRenderNode ? this.createRenderNode() : null;
        }
        return this.renderNode;
    },

    updateVisibility: function () {
        var none = this.style.getPropertyValue("display").trim() == "none";
        var hidden = this.style.getPropertyValue("visibility").trim() == "hidden";
        this.renderNode.setLocalVisible(!(none || hidden));
    },


    updateZIndex: function() {
        //This function is overridden by the leaf nodes (mesh, model), otherwise it should do nothing
    },

    dispose: function() {
        this.getRenderNode().remove();
        this.transformFetcher && this.transformFetcher.dispose();
        this.clearAdapterHandles();
    },

    styleChangedCallback: function() {
        this.updateZIndex();
        this.updateVisibility();
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
        } else if (name == "material" && this.handleMaterial) {
            this.updateMaterialHandler();
            this.factory.renderer.requestRedraw("Transformable material changed.");
        }
    },

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
                this.dispose();
                break;
            case Events.NODE_INSERTED:
                this.initElement(evt.mutation.target);
                break;
            default:
                XML3D.debug.logDebug("Unhandled event in SceneElementAdapter:", evt);
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

module.exports = SceneElementAdapter;
