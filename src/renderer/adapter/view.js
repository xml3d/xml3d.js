// Adapter for <view>
(function() {
    var ViewRenderAdapter = function(factory, node) {
        XML3D.webgl.TransformableAdapter.call(this, factory, node);
        connectProjectionAdapter(this);
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
            parent : parentNode,
            projectionAdapter : this.getConnectedAdapter("perspective")
        });
    };

    /* Interface method */
    p.getViewMatrix = function() {
        var m = new window.XML3DMatrix();
        this.renderNode.getViewMatrix(m._data);
        return m;
    };

    /**
     * returns the inverse of the view matrix, since now we
     * want to go world2view and not view2world
     * @return {window.XML3DMatrix}
     */
    p.getWorldMatrix = function() {
        var m = new window.XML3DMatrix();
        this.renderNode.getViewMatrix(m._data);
        XML3D.math.mat4.invert(m._data, m._data);
        return m;
    };

    p.notifyChanged = function(evt) {
        if(evt.type == XML3D.events.ADAPTER_HANDLE_CHANGED) {
            connectProjectionAdapter(this);
            this.renderNode.setProjectionAdapter(this.getConnectedAdapter("perspective"));
        }  if (evt.type == XML3D.events.THIS_REMOVED) {
            this.dispose();
        } else
        {
            var target = evt.attrName || evt.wrapped.attrName;

            switch (target) {
                case "orientation":
                    this.renderNode.updateOrientation(this.node.orientation.toMatrix()._data);
                    break;
                case "position":
                    this.renderNode.updatePosition(this.node.position._data);
                    break;
                case "perspective":
                    connectProjectionAdapter(this);
                    this.renderNode.setProjectionAdapter(this.getConnectedAdapter("perspective"));
                    break;
                case "fieldOfView":
                    this.renderNode.updateFieldOfView(this.node.fieldOfView);
                    break;

                default:
                    XML3D.debug.logWarning("Unhandled event in view adapter for parameter " + target);
                    break;
            }
        }

        this.factory.handler.redraw("View changed");
    };

    function connectProjectionAdapter(adapter){
        var href = adapter.node.getAttribute("perspective");
        if(href) {
            adapter.connectAdapterHandle("perspective", adapter.getAdapterHandle(href));
        } else {
            adapter.disconnectAdapterHandle("perspective");
        }
    }

    p.dispose = function() {
        this.getRenderNode().remove();
        this.clearAdapterHandles();
    }

    // Export to XML3D.webgl namespace
    XML3D.webgl.ViewRenderAdapter = ViewRenderAdapter;

}());
