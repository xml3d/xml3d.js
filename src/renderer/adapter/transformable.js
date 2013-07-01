
(function() {

    var TransformableAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.renderNode = null;
    };
    XML3D.createClass(TransformableAdapter, XML3D.webgl.RenderAdapter);

    TransformableAdapter.onConfigured = function() {
        // Create renderNode
    };


    XML3D.webgl.TransformableAdapter = TransformableAdapter;
})();