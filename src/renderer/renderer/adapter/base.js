var RenderAdapter = function (factory, node) {
    XML3D.base.NodeAdapter.call(this, factory, node);
};
XML3D.createClass(RenderAdapter, XML3D.base.NodeAdapter);

RenderAdapter.prototype.getShader = function () {
    return null;
};

RenderAdapter.prototype.getParentRenderAdapter = function () {
    return this.factory.getAdapter(this.node.parentElement, RenderAdapter);
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


RenderAdapter.prototype.applyTransformMatrix = function (transform) {
    return transform;
};

RenderAdapter.prototype.getScene = function () {
    return this.factory.renderer.scene;
};

module.exports = RenderAdapter;
