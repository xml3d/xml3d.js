var NodeAdapter = require("../../../base/adapter.js").NodeAdapter;

var RenderAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
};

XML3D.createClass(RenderAdapter, NodeAdapter, {

    getParentRenderAdapter: function () {
        return this.factory.getAdapter(this.node.parentNode, RenderAdapter);
    },

    /**
     * @param element
     */
    initElement: function (element) {
        this.factory.getAdapter(element);
        this.initChildElements(element);
    },

    /**
     * @param {Element} element
     */
    initChildElements: function (element) {
        var child = element.firstElementChild;
        while (child) {
            this.initElement(child);
            child = child.nextElementSibling;
        }
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
    },

    styleChangedCallback: function () {
    },

    applyTransformMatrix: function (transform) {
        return transform;
    },

    getScene: function () {
        return this.factory.renderer.scene;
    }
});

module.exports = RenderAdapter;
