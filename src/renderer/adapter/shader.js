// Adapter for <shader>
(function() {

    var ShaderRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.renderer = this.factory.renderer;

        this.dataAdapter = XML3D.data.factory.getAdapter(this.node);
        this.computeRequest;
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
            if (target && target.nodeName == "texture") {
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

        default:
            XML3D.debug.logWarning("Unhandled mutation event in shader adapter for parameter '" + target + "'");
            break;

        }

    };

    p.requestData = function(parameters) {
        if (!this.computeRequest) {
            var that = this;
            this.computeRequest = this.dataAdapter.getComputeRequest(parameters, function(request, changeType) {
                that.notifyDataChanged(request, changeType);
            });
        }
        return this.computeRequest.getResult();
    };

    p.notifyDataChanged = function(request, changeType) {
        this.renderer.shaderManager.shaderDataChanged(this, request, changeType);
    };

    p.destroy = function() {
        Array.forEach(this.textures, function(t) {
            t.adapter.destroy();
        });
    };

    // Export to XML3D.webgl namespace
    XML3D.webgl.ShaderRenderAdapter = ShaderRenderAdapter;

}());
