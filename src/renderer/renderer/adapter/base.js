var NodeAdapter = require("../../../base/adapter.js").NodeAdapter;

var RenderAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
};
XML3D.createClass(RenderAdapter, NodeAdapter);


RenderAdapter.prototype.getParentRenderAdapter = function () {
    return this.factory.getAdapter(this.node.parentNode, RenderAdapter);
};

/**
 * @param element
 */
RenderAdapter.prototype.initElement = function (element) {
    this.factory.getAdapter(element);
    this.initChildElements(element);
};

/**
 * @param {Element} element
 */
RenderAdapter.prototype.initChildElements = function (element) {
    var child = element.firstElementChild;
    while (child) {
        this.initElement(child);
        child = child.nextElementSibling;
    }
};

RenderAdapter.prototype.attributeChangedCallback = function(name, oldValue, newValue) {
     if (name == "style" || name == "class" || name == "id") {
         this.styleChangedCallback();
     }
};

RenderAdapter.prototype.styleChangedCallback = function() {};

RenderAdapter.prototype.applyTransformMatrix = function (transform) {
    return transform;
};

RenderAdapter.prototype.getScene = function () {
    return this.factory.renderer.scene;
};

module.exports = RenderAdapter;
