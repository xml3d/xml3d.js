(function() {

    /**
     * Adapter for <light>
     * @constructor
     * @param {RenderAdapterFactory} factory
     * @param {Element} node
     */
    var LightRenderAdapter = function(factory, node) {
        XML3D.webgl.TransformableAdapter.call(this, factory, node);
        this.lightShader = null;
        this.updateLightShader();
        this.createRenderNode();
    };
    XML3D.createClass(LightRenderAdapter, XML3D.webgl.TransformableAdapter);

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
        if (evt.type == XML3D.events.NODE_REMOVED) {
            return;
        } else if (evt.type == XML3D.events.THIS_REMOVED) {
            this.dispose();
            return;
        } else if( evt.type == XML3D.events.ADAPTER_HANDLE_CHANGED){
            if (evt.key == "shader") {
                //The lightshader was destroyed, so this light is now invalid
                this.renderNode.remove();
                return;
            }
        }

        var target = evt.wrapped.attrName;

        switch(target) {
        case "visible":
            this.renderNode.setLocalVisible(evt.wrapped.newValue === "true");
            break;
        case "intensity":
            this.renderNode.setLocalIntensity(evt.wrapped.newValue);
            break;
        case "shader":
            this.renderNode.remove();
            this.updateLightShader();
            this.createRenderNode();
            break;
        }
        this.factory.getRenderer().requestRedraw("Light attribute changed.");
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

    /**
     *
     * @param {string} field
     * @param {Array.<number>} newValue
     * @return
     */
    LightRenderAdapter.prototype.dataChanged = function(field, newValue) {
        this.renderNode.updateLightData(field, newValue);
    };

    // Export to XML3D.webgl namespace
    XML3D.webgl.LightRenderAdapter = LightRenderAdapter;

}());