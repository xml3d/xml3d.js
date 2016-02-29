var NodeAdapter = require("../../../base/adapter.js").NodeAdapter;

var RenderAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
};

XML3D.createClass(RenderAdapter, NodeAdapter, {

    getParentRenderAdapter: function () {
        var node = this.node;
        if (node.getDestinationInsertionPoints) {
            var points = node.getDestinationInsertionPoints();
            if (points.length) {
                return this.factory.getAdapter(points[0], RenderAdapter);
            }
        }
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
        this.traverse(function() {}); //Can be empty function as traverse already creates adapters, which is all we need here
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
