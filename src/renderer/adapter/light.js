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

    LightRenderAdapter.prototype.createRenderNode = function() {
        var parent = this.factory.getAdapter(this.node.parentElement, XML3D.webgl.RenderAdapter);
        var parentNode = parent.getRenderNode ? parent.getRenderNode() : this.factory.renderer.scene.createRootNode();
        var lightShader = this.getLightShader();
        if (lightShader !== undefined) {
            var lightType = this.getLightType();
            this.renderNode = this.factory.renderer.scene.createRenderLight({lightType : lightType, parent : parentNode, shader : this.getLightShader(),
                visible : !this.node.visible ? false : undefined, localIntensity : this.node.intensity});
        } else {
            XML3D.debug.logWarning("Encountered a light node with no lightshader, this light will be ignored.");
        }

    };

    LightRenderAdapter.prototype.notifyChanged = function(evt) {
        if (evt.type == XML3D.events.NODE_REMOVED) {
            this.destroy();
            return;
        } else if (evt.type == XML3D.events.THIS_REMOVED) {
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
            this.visible = (evt.wrapped.newValue == "true") && this.node.parentNode.visible;
            this.renderNode.updateLightData("visibility", this.visible ? [1,1,1] : [0,0,0]);
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
        this.factory.handler.redraw("Light attribute changed.");
    };

    LightRenderAdapter.prototype.updateLightShader = function(){
       // this.disconnectAdapterHandle("shader");
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

    LightRenderAdapter.prototype.getLightType = function() {
        var shader = this.getLightShader();
        var script = shader.node.script;
        if (script.indexOf("urn:xml3d:lightshader:") === 0) {
            return script.substring(22, script.length);
        } else {
            XML3D.debug.logError("Unsupported light type "+script);
        }
    };

    /**
     *
     */
    LightRenderAdapter.prototype.getLightShader = function() {
        return this.getConnectedAdapter("shader");
    };

    LightRenderAdapter.prototype.destroy = function() {
        this.renderNode.remove();
        this.clearAdapterHandles();
    };

    /**
     * @return {XML3DMatrix}
     */
    LightRenderAdapter.prototype.getWorldMatrix = function() {
        var m = new XML3DMatrix();
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