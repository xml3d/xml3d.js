//Adapter for <texture>
(function() {

    var TextureRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.gl = factory.renderer.handler.gl;
        this.dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, XML3D.data);
    };

    XML3D.createClass(TextureRenderAdapter, XML3D.webgl.RenderAdapter);

    TextureRenderAdapter.prototype.notifyChanged = function(evt) {
        var shaderAdapter = this.factory.getAdapter(this.node.parentElement);
        if (shaderAdapter)
            shaderAdapter.notifyChanged(evt);
    };

    TextureRenderAdapter.prototype.getDataTable = function() {
        return this.dataAdapter.createDataTable();
    };

    TextureRenderAdapter.prototype.destroy = function() {

    };

    TextureRenderAdapter.prototype.dispose = function(evt) {
        //TODO: tell renderer to dispose
    };

    XML3D.webgl.TextureRenderAdapter = TextureRenderAdapter;
}());
