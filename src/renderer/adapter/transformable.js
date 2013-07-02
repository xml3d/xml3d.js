
(function() {

    var TransformableAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.renderNode = null;
        this.createRenderNode();
    };
    XML3D.createClass(TransformableAdapter, XML3D.webgl.RenderAdapter);

    TransformableAdapter.prototype.onConfigured = function() {
        //this.renderNode = this.createRenderNode();
    };

    TransformableAdapter.prototype.getRenderNode = function() {
        if (!this.renderNode) {
           this.renderNode = this.createRenderNode ? this.createRenderNode() : null;
        }
        return this.renderNode;
    };

    XML3D.webgl.TransformableAdapter = TransformableAdapter;
})();