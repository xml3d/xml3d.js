// Adapter for <xml3d>
(function() {
    var XML3DRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.initializeEventAttributes(["load"]);
    };
    XML3D.createClass(XML3DRenderAdapter, XML3D.webgl.RenderAdapter);

    XML3D.extend(XML3DRenderAdapter.prototype, {
        updateActiveViewAdapter: function () {
            var href = this.node.getAttribute("activeView");
            if(href) {
                this.connectAdapterHandle("activeView", this.getAdapterHandle(href));
            } else {
                this.disconnectAdapterHandle("activeView");
            }
        },
        setViewAdapter: function(adapter) {
            adapter = adapter || this.getConnectedAdapter("activeView");
            if(!(adapter && adapter.getRenderNode)) {
                var viewElement = XML3D.util.getOrCreateActiveView(this.node);
                adapter = this.factory.getAdapter(viewElement);
            }
            this.factory.getScene().setActiveView(adapter.getRenderNode());
        },
        dispose: function() {
            this.clearAdapterHandles();
        }
    })

    XML3DRenderAdapter.prototype.notifyChanged = function(evt) {

        switch(evt.type) {
            case XML3D.events.ADAPTER_HANDLE_CHANGED:
                this.setViewAdapter(evt.adapter);
                return;
            case XML3D.events.NODE_INSERTED:
                this.initElement(evt.wrapped.target);
                return;
            case XML3D.events.NODE_REMOVED:
                // Handled in removed node
                return;
        }

        var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

        if (target == "activeView") {
            this.updateActiveViewAdapter();
            this.setViewAdapter();
        }
    };

    /* Interface methods */

    /*
     * This function is called when scene DOM is loaded and all adapters are attached
     */
    XML3DRenderAdapter.prototype.onConfigured = function() {
        this.updateActiveViewAdapter();
        this.setViewAdapter();

        // emit load event when all resources currently loading are completed
        var callback = (function (node, nodeCanvasId) {
            var counter = 2; // we fire load event when callback is called twice

            function handler(canvasId) {
                counter--;
                if (counter == 0) {
                    XML3D.util.dispatchEvent(node, 'load');
                }
            }

            return handler;
        })(this.node, this.factory.canvasId);

        // register callback for canvasId == 0 i.e. global resources
        XML3D.base.resourceManager.addLoadCompleteListener(0, callback);
        // register callback for canvasId of this node
        XML3D.base.resourceManager.addLoadCompleteListener(this.factory.canvasId, callback);
    }

    XML3DRenderAdapter.prototype.getBoundingBox = function() {
        var bbox = new window.XML3DBox();
        Array.prototype.forEach.call(this.node.childNodes, function(c) {
            if(c.getBoundingBox)
                bbox.extend(c.getBoundingBox());
        });
        return bbox;
    };

    XML3DRenderAdapter.prototype.getElementByPoint = function(x, y, hitPoint, hitNormal) {
        var relativeMousePos = XML3D.webgl.convertPageCoords(this.node, x, y);

        var relX = relativeMousePos.x;
        var relY = relativeMousePos.y;

        var renderer = this.factory.getRenderer();
        var object = renderer.getRenderObjectFromPickingBuffer(relX, relY);
        if(object){
            if(hitPoint){
                var vec = renderer.getWorldSpacePositionByPoint(object, relX, relY);
                hitPoint.set(vec[0],vec[1],vec[2]);
            }
            if(hitNormal){
                var vec = renderer.getWorldSpaceNormalByPoint(object, relX, relY);
                hitNormal.set(vec[0],vec[1],vec[2]);
            }
        }
        else{
            if(hitPoint) hitPoint.set(NaN, NaN, NaN);
            if(hitNormal) hitNormal.set(NaN, NaN, NaN);
        }
        return object ? object.node : null;
    };

    XML3DRenderAdapter.prototype.generateRay = function(x, y) {
        var relativeMousePos = XML3D.webgl.convertPageCoords(this.node, x, y);
        return this.factory.getRenderer().generateRay(relativeMousePos.x, relativeMousePos.y);
    };
    XML3D.webgl.XML3DRenderAdapter = XML3DRenderAdapter;

}());