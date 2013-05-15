// Adapter for <xml3d>
(function() {
    var XML3DRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.factory = factory;
        this.initializeEventAttributes(["load"]);
    };
    XML3D.createClass(XML3DRenderAdapter, XML3D.webgl.RenderAdapter);

    XML3DRenderAdapter.prototype.notifyChanged = function(evt) {
        if (evt.type == XML3D.events.NODE_INSERTED) {
            this.factory.renderer.sceneTreeAddition(evt);
        } else if (evt.type == XML3D.events.NODE_REMOVED) {
            this.factory.renderer.sceneTreeRemoval(evt);
        }

        var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

        if (target == "activeView") {
            this.factory.renderer.activeViewChanged();
        }
    };

    /* Interface methods */

    /*
     * This function is called when scene DOM is loaded and all adapters are attached
     */
    XML3DRenderAdapter.prototype.onConfigured = function() {
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
        })(this.node, this.factory.handler.id);

        // register callback for canvasId == 0 i.e. global resources
        XML3D.base.resourceManager.addLoadCompleteListener(0, callback);
        // register callback for canvasId of this node
        XML3D.base.resourceManager.addLoadCompleteListener(this.factory.handler.id, callback);
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

        var handler = this.factory.handler;
        var object = handler.updatePickObjectByPoint(relX, relY);
        if(object){
            if(hitPoint){
                var vec = handler.getWorldSpacePositionByPoint(object, relX, relY);
                hitPoint.set(vec[0],vec[1],vec[2]);
            }
            if(hitNormal){
                var vec = handler.getWorldSpaceNormalByPoint(object, relX, relY);
                hitNormal.set(vec[0],vec[1],vec[2]);
            }
        }
        else{
            if(hitPoint) hitPoint.set(NaN, NaN, NaN);
            if(hitNormal) hitNormal.set(NaN, NaN, NaN);
        }
        return object ? object.meshAdapter.node : null;
    };

    XML3DRenderAdapter.prototype.generateRay = function(x, y) {
        var relativeMousePos = XML3D.webgl.convertPageCoords(this.node, x, y);

        return this.factory.handler.generateRay(relativeMousePos.x, relativeMousePos.y);
    };
    XML3D.webgl.XML3DRenderAdapter = XML3DRenderAdapter;

}());