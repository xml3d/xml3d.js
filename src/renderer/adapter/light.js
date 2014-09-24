(function(webgl) {

    /**
     * Adapter for <light>
     * @constructor
     * @param {RenderAdapterFactory} factory
     * @param {Element} node
     */
    var LightRenderAdapter = function(factory, node) {
        webgl.TransformableAdapter.call(this, factory, node, false, true);
        this.updateLightShader();
        this.createRenderNode();
    };
    XML3D.createClass(LightRenderAdapter, webgl.TransformableAdapter);

    LightRenderAdapter.prototype.createRenderNode = function () {
        var parentAdapter = this.getParentRenderAdapter();
        var parentNode = parentAdapter.getRenderNode && parentAdapter.getRenderNode();
        var lightShader = this.getLightShader();
        this.renderNode = this.factory.getScene().createRenderLight({
            light: {
                type: lightShader ? lightShader.getLightType() : null,
                data: lightShader ? lightShader.getDataNode() : null
            },
            parent: parentNode,
            shader: lightShader,
            visible: !this.node.visible ? false : undefined,
            localIntensity: this.node.intensity
        });
    };

    LightRenderAdapter.prototype.notifyChanged = function(evt) {
        switch (evt.type) {
            case XML3D.events.NODE_REMOVED:
                return;
            case XML3D.events.THIS_REMOVED:
                this.dispose();
                return;
            case XML3D.events.ADAPTER_HANDLE_CHANGED:
            if (evt.key == "shader") {
                //The lightshader was destroyed, so this light is now invalid
                this.renderNode.remove();
                return;
            }
                break;
            case XML3D.events.VALUE_MODIFIED:
                this.valueModified(evt.wrapped.attrName, evt.wrapped.newValue);
                break;
            case XML3D.events.ADAPTER_VALUE_CHANGED:
                this.renderNode.setLightType(evt.adapter.getLightType());
        }
    };

    LightRenderAdapter.prototype.valueModified = function(name, newValue) {
        switch(name) {
        case "visible":
            this.renderNode.setLocalVisible(newValue === "true");
            break;
        case "intensity":
            this.renderNode.setLocalIntensity(newValue);
            break;
        case "shader":
            this.renderNode.remove();
            this.updateLightShader();
            this.createRenderNode();
            break;
        }
    };

    LightRenderAdapter.prototype.updateLightShader = function(){
        var shaderHref = this.node.shader;
        if(!shaderHref)
        {
            var styleValue = this.node.getAttribute('style');
            if(styleValue){
                var pattern    = /shader\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
                var result = pattern.exec(styleValue);
                if (result)
                    shaderHref = result[1];
            }
        }
        this.connectAdapterHandle("shader", this.getAdapterHandle(shaderHref));
    };

    /**
     *
     */
    LightRenderAdapter.prototype.getLightShader = function() {
        return this.getConnectedAdapter("shader");
    };

    LightRenderAdapter.prototype.dispose = function() {
        this.getRenderNode().remove();
        this.clearAdapterHandles();
    };

    /**
     * @return {XML3DMatrix}
     */
    LightRenderAdapter.prototype.getWorldMatrix = function() {
        var m = new window.XML3DMatrix();
        this.renderNode.getWorldMatrix(m._data);
        return m;
    };

    // Export to XML3D.webgl namespace
    webgl.LightRenderAdapter = LightRenderAdapter;

}(XML3D.webgl));