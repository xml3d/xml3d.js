(function() {
    //Adapter for <img>
    XML3D.webgl.ImgRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.textureAdapter = factory.getAdapter(node.parentNode);
    };
    XML3D.createClass(XML3D.webgl.ImgRenderAdapter, XML3D.webgl.RenderAdapter);

    XML3D.webgl.ImgRenderAdapter.prototype.notifyChanged = function(evt) {
        this.textureAdapter.notifyChanged(evt);
    };
})();
