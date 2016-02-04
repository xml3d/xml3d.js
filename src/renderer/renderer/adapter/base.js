var NodeAdapter = require("../../../base/adapter.js").NodeAdapter;

var RenderAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
};

XML3D.createClass(RenderAdapter, NodeAdapter, {

    getParentRenderAdapter: function () {
        if(this.node.parentNode.host) {
            return this.factory.getAdapter(this.node.parentNode.host, RenderAdapter);
        } else {
            return this.factory.getAdapter(this.node.parentNode, RenderAdapter);
        }
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
        var child = element.shadowRoot ? element.shadowRoot.firstElementChild : element.firstElementChild;
        while (child) {
            this.initElement(child);
            child = child.nextElementSibling;
        }
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
    },

    styleChangedCallback: function () {
    },

    getScene: function () {
        return this.factory.renderer.scene;
    }
});

module.exports = RenderAdapter;
