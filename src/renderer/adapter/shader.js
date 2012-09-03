// Adapter for <shader>
(function() {

    var XML3DShaderRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.renderer = this.factory.renderer;

        this.dataAdapter = this.renderer.dataFactory.getAdapter(this.node);
        this.table = new XML3D.data.ProcessTable(this, [], this.dataChanged);
        this.computeRequest;
    };

    XML3D.createClass(XML3DShaderRenderAdapter, XML3D.webgl.RenderAdapter);
    var p = XML3DShaderRenderAdapter.prototype;

    p.notifyChanged = function(evt) {
        if (evt.type == 0) {
            this.factory.renderer.sceneTreeAddition(evt);
            return;
        } else if (evt.type == 2) {
            this.factory.renderer.sceneTreeRemoval(evt);
            return;
        } else if (evt.type == 5) {
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
            this.computeRequest = this.dataAdapter.getComputeRequest(null, function(request, changeType) {
                that.notifyDataChanged.call(that, request, changeType);
            });
        }
        return this.computeRequest.getResult();
    };

    p.notifyDataChanged = function(request, changeType) {
        console.log("Shader data changed: ", request, changeType);
        this.renderer.shaderManager.shaderDataChanged(this, request, changeType);
    };

    p.destroy = function() {
        Array.forEach(this.textures, function(t) {
            t.adapter.destroy();
        });
    };

    // Export to XML3D.webgl namespace
    XML3D.webgl.XML3DShaderRenderAdapter = XML3DShaderRenderAdapter;

}());
