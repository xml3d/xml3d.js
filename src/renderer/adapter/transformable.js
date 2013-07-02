
(function() {

    var TransformableAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.renderNode = null;
    };
    XML3D.createClass(TransformableAdapter, XML3D.webgl.RenderAdapter);

    TransformableAdapter.prototype.onConfigured = function() {
        this.renderNode = this.createRenderNode();

    };

    TransformableAdapter.prototype.getModelMatrix = function() {
        return this.renderNode.getModelMatrix();
    };

    TransformableAdapter.prototype.getObjectSpaceBoundingBox = function() {

    };

    TransformableAdapter.prototype.getModelViewMatrix = function() {

    };

    TransformableAdapter.prototype.updateModelViewMatrix = function(view) {
        this.renderNode.updateModelViewMatrix(view);
    };

    TransformableAdapter.prototype.updateObjectSpaceBoundingBox = function(view) {

    };


    XML3D.webgl.TransformableAdapter = TransformableAdapter;
})();