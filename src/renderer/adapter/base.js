(function() {

    XML3D.webgl.RenderAdapter = function(factory, node) {
        XML3D.base.NodeAdapter.call(this, factory, node);
    };
    XML3D.createClass(XML3D.webgl.RenderAdapter, XML3D.base.NodeAdapter);

    XML3D.webgl.RenderAdapter.prototype.getShader = function() {
        return null;
    };

    XML3D.webgl.RenderAdapter.prototype.getAdapterHandle = function(uri) {
        return XML3D.base.resourceManager.getAdapterHandle(this.node.ownerDocument, uri,
            XML3D.webgl, this.factory.canvasId);
    };

    XML3D.webgl.RenderAdapter.prototype.getParentRenderAdapter = function() {
        return this.factory.getAdapter(this.node.parentElement, XML3D.webgl.RenderAdapter);
    };

    /**
     * @param element
     */
    XML3D.webgl.RenderAdapter.prototype.initElement = function(element) {
        this.factory.getAdapter(element);
    };


    XML3D.webgl.RenderAdapter.prototype.applyTransformMatrix = function(transform) {
        return transform;
    };

    XML3D.webgl.RenderAdapter.prototype.getScene = function() {
        return this.factory.renderer.scene;
    };

    /**
     * @param {Array.<string>} customAttributes
     */
    XML3D.webgl.RenderAdapter.prototype.initializeEventAttributes = function(customAttributes) {
        var attributes = this.node.attributes;
        customAttributes = customAttributes || [];

        for (var index in attributes) {
            var att = attributes[index];
            if (!att.name)
                continue;

            var type = att.name;
            if (type.substring(2,0) == "on")  {
                var eventType = type.substring(2);
                if (XML3D.webgl.events.available.indexOf(eventType) != -1 || customAttributes.indexOf(eventType) != -1) {
                    this.node.addEventListener(eventType, new Function("event", att.value), false);
                }
            }
        }
    };
})();
