(function(webgl) {

    var TransformableAdapter = function(factory, node) {
        webgl.RenderAdapter.call(this, factory, node);
        this.renderNode = null;
    };
    XML3D.createClass(TransformableAdapter, webgl.RenderAdapter);

    XML3D.extend(TransformableAdapter.prototype, {
        onConfigured : function() {},
        getRenderNode : function() {
            if (!this.renderNode) {
                this.renderNode = this.createRenderNode ? this.createRenderNode() : null;
            }
            return this.renderNode;
        }
    })
    webgl.TransformableAdapter = TransformableAdapter;
})(XML3D.webgl);