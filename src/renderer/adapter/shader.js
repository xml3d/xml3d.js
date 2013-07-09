// Adapter for <shader>
(function() {

    /**
     * @param factory
     * @param {Element} node
     * @extends RenderAdapter
     * @constructor
     */
    var ShaderRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.renderer = this.factory.renderer;
        this.dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, XML3D.data);
        this.templateId = -1;
    };

    XML3D.createClass(ShaderRenderAdapter, XML3D.webgl.RenderAdapter);
    var p = ShaderRenderAdapter.prototype;

    p.notifyChanged = function(evt) {
        if (evt.type == XML3D.events.NODE_INSERTED) {
            this.factory.renderer.sceneTreeAddition(evt);
            return;
        } else if (evt.type == XML3D.events.NODE_REMOVED) {
            this.factory.renderer.sceneTreeRemoval(evt);
            return;
        } else if (evt.type == XML3D.events.THIS_REMOVED) {
            var target = evt.wrapped.target;
            if (target && target.nodeName.toLowerCase() == "texture") {
                // A texture was removed completely, so this shader has to be
                // recompiled
                this.renderer.recompileShader(this);
            }
            return;
        }

        var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

        switch (target) {
        case "script":
            this.renderer.recompileShader(this);
            break;
        case "id":
            this.renderer.recompileShader(this);
            this.notifyOppositeAdapters();
            break;

        default:
            XML3D.debug.logWarning("Unhandled mutation event in shader adapter for parameter '" + target + "'");
            break;

        }

    };

    p.getShaderScriptURI = function() {
        return new XML3D.URI(this.node.getAttribute("script"));
    }

    p.getDataAdapter = function() {
        return this.dataAdapter;
    }

    p.destroy = function() {
    };

    // Export to XML3D.webgl namespace
    XML3D.webgl.ShaderRenderAdapter = ShaderRenderAdapter;

}());
