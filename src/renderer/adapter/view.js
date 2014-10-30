// Adapter for <view>
(function() {
    var ViewRenderAdapter = function(factory, node) {
        XML3D.webgl.TransformableAdapter.call(this, factory, node, false, false);
        this.perspectiveFetcher = new XML3D.data.DOMTransformFetcher(this, "perspective", "perspective", true);
        this.createRenderNode();
    };
    XML3D.createClass(ViewRenderAdapter, XML3D.webgl.TransformableAdapter);
    var p = ViewRenderAdapter.prototype;

    p.createRenderNode = function() {
        var parent = this.factory.getAdapter(this.node.parentElement, XML3D.webgl.RenderAdapter);
        var parentNode = parent.getRenderNode ? parent.getRenderNode() : this.factory.renderer.scene.createRootNode();

        this.renderNode = this.factory.renderer.scene.createRenderView({
            position : this.node.position._data,
            orientation : this.node.orientation.toMatrix()._data,
            fieldOfView : this.node.fieldOfView,
            parent : parentNode
        });
        this.perspectiveFetcher.update();
    };

    /* Interface method */
    p.getViewMatrix = function() {
        var m = new window.XML3DMatrix();
        this.renderNode.getWorldToViewMatrix(m._data);
        return m;
    };

    /**
     * returns view2world matrix
     * @return {window.XML3DMatrix}
     */
    p.getWorldMatrix = function() {
        var m = new window.XML3DMatrix();
        this.renderNode.getViewToWorldMatrix(m._data);
        return m;
    };

    p.notifyChanged = function (evt) {
        switch (evt.type) {
            case XML3D.events.THIS_REMOVED:
                this.dispose();
                break;
            case XML3D.events.VALUE_MODIFIED:
                var target = evt.wrapped.attrName;

                switch (target) {
                    case "orientation":
                        this.renderNode.updateOrientation(this.node.orientation.toMatrix()._data);
                        break;
                    case "position":
                        this.renderNode.updatePosition(this.node.position._data);
                        break;
                    case "perspective":
                        this.perspectiveFetcher.update();
                        break;
                    case "fieldOfView":
                        this.renderNode.updateFieldOfView(this.node.fieldOfView);
                        break;
                    default:
                        XML3D.debug.logWarning("Unhandled value changed event in view adapter for attribute:" + target);
                }
                break;
        }
        this.factory.getRenderer().requestRedraw("View changed");
    };

    p.onTransformChange = function(attrName, matrix){
        XML3D.webgl.TransformableAdapter.prototype.onTransformChange.call(this, attrName, matrix);
        if(attrName == "perspective"){
            this.renderNode.setProjectionOverride(matrix);
        }
    }

    p.dispose = function() {
        this.perspectiveFetcher.clear();
        this.getRenderNode().remove();
        this.clearAdapterHandles();
    }

    // Export to XML3D.webgl namespace
    XML3D.webgl.ViewRenderAdapter = ViewRenderAdapter;

}());
