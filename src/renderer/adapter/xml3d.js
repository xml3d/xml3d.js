// Adapter for <xml3d>
(function() {
    var XML3DCanvasRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.factory = factory;
        this.processListeners();
    };
    XML3D.createClass(XML3DCanvasRenderAdapter, XML3D.webgl.RenderAdapter);

    XML3DCanvasRenderAdapter.prototype.notifyChanged = function(evt) {
        if (evt.type == 0) {
            this.factory.renderer.sceneTreeAddition(evt);
        } else if (evt.type == 2) {
            this.factory.renderer.sceneTreeRemoval(evt);
        }

        var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

        if (target == "activeView") {
            this.factory.renderer.activeViewChanged();
        }
    };

    XML3DCanvasRenderAdapter.prototype.processListeners = function() {
        var attributes = this.node.attributes;
        for ( var index in attributes) {
            var att = attributes[index];
            if (!att.name)
                continue;

            var type = att.name;
            if (type.match(/onmouse/) || type == "onclick" || type == "ondblclick") {
                var eventType = type.substring(2);
                this.node.addEventListener(eventType, new Function("evt", att.value), false);
            }
        }
    };

    /* Interface methods */
    XML3DCanvasRenderAdapter.prototype.getBoundingBox = function() {
        var bbox = new window.XML3DBox();
        Array.prototype.forEach.call(this.node.childNodes, function(c) {
            if(c.getBoundingBox)
                bbox.extend(c.getBoundingBox());
        });
        return bbox;
    };

    XML3DCanvasRenderAdapter.prototype.getElementByPoint = function(x, y, hitPoint, hitNormal) {
        var handler = this.factory.handler;
        var object = handler.updatePickObjectByPoint(x, y);
        if(object){
            if(hitPoint){
                var vec = handler.getWorldSpacePositionByPoint(object, x, y);
                hitPoint.set(vec[0],vec[1],vec[2]);
            }
            if(hitNormal){
                var vec = handler.getWorldSpaceNormalByPoint(object, x, y);
                hitNormal.set(vec[0],vec[1],vec[2]);
            }
        }
        else{
            if(hitPoint) hitPoint.set(NaN, NaN, NaN);
            if(hitNormal) hitNormal.set(NaN, NaN, NaN);
        }
        return object ? object.meshNode : null;
    };

    XML3DCanvasRenderAdapter.prototype.generateRay = function(x, y) {

        var glY = this.factory.handler.getCanvasHeight() - y - 1;
        return this.factory.handler.generateRay(x, glY);
    };
    XML3D.webgl.XML3DCanvasRenderAdapter = XML3DCanvasRenderAdapter;

}());