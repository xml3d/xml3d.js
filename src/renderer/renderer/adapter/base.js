var NodeAdapter = require("../../../base/adapter.js").NodeAdapter;

var RenderAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
};

XML3D.createClass(RenderAdapter, NodeAdapter, {

    getParentRenderAdapter: function () {
        var node = this.node;
        do {
            node = node.parentNode;
            if (node.host) {
                return this.factory.getAdapter(node.host, RenderAdapter);
            }
            var adapter = this.factory.getAdapter(node, RenderAdapter);
            if (adapter) {
                return adapter;
            }
        } while(node.parentNode);

        return null;
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
        var children = element.childNodes;
        if (element.shadowRoot) {
            children = element.shadowRoot.childNodes;
        } else if (element.getDistributedNodes) {
            children = element.getDistributedNodes();
        }

		for (var i=0; i < children.length; i++) {
            this.initElement(children[i]);
        }
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
    },

    styleChangedCallback: function () {
    },

    getScene: function () {
        return this.factory.renderer.scene;
    },

    dispose: function() {
        this.node = null;
    }
});

module.exports = RenderAdapter;
