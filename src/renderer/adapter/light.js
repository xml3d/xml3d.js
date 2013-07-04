(function() {

    /**
     * Adapter for <light>
     * @constructor
     * @param {RenderAdapterFactory} factory
     * @param {Element} node
     */
    var LightRenderAdapter = function(factory, node) {
        XML3D.webgl.TransformableAdapter.call(this, factory, node);
        this.transform = null;
        this.lightShader = null;
        this.renderer = factory.renderer;
        this.offset = 0;
        this.lightType = "point";
        this.listenerID = -1;
        this.updateLightShader();
        this.createRenderNode();
    };
    XML3D.createClass(LightRenderAdapter, XML3D.webgl.TransformableAdapter);

    LightRenderAdapter.prototype.createRenderNode = function() {
        var parent = this.factory.getAdapter(this.node.parentElement, XML3D.webgl.RenderAdapter);
        var parentNode = parent.getRenderNode ? parent.getRenderNode() : this.factory.renderer.scene.createRootNode();
        var lightShader = this.getLightShader();
        if (lightShader !== undefined) {
            this.renderNode = this.factory.renderer.scene.createRenderLight({lightType : this.lightType, parent : parentNode, shader : this.getLightShader(),
                visible : !this.node.visible ? false : undefined, localIntensity : this.node.intensity, adapter : this});
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
        }
        else if( evt.type == XML3D.events.ADAPTER_HANDLE_CHANGED){
            // The connected transform node changed;
            if (evt.key == "shader") {
                this.renderNode.remove();
                return;
            }
        }

        var target = evt.internalType || evt.wrapped.attrName;

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

    LightRenderAdapter.prototype.removeLight = function(lightEntry, offset) {
        var lo = lightEntry;
        var shader = this.getLightShader();
        var off3 = offset*3;
        if (shader) {
            switch(this.lightType) {
            case "point":
                lo.position.splice(off3, 3);
                break;

            case "directional":
                lo.direction.splice(off3, 3);
                break;

            case "spot":
                lo.position.splice(off3, 3);
                lo.direction.splice(off3, 3);
                break;
            }

            lo.visibility.splice(off3, 3);

            shader.removeLight(this.lightType, lightEntry, off3);
            shader.removeLightListener(this.listenerID);
        }
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
        var shader = this.getLightShader();
        if (shader) {
            this.listenerID = shader.registerLightListener(this.dataChanged.bind(this));
            this.updateLightType();
        }
    };

    LightRenderAdapter.prototype.updateLightType = function() {
        var shader = this.getLightShader();
        var script = shader.node.script;
        if (script.indexOf("urn:xml3d:lightshader:") === 0) {
            this.lightType = script.substring(22, script.length);
        }
    };

    /**
     *
     */
    LightRenderAdapter.prototype.getLightShader = function() {
        return this.getConnectedAdapter("shader");
    };
    LightRenderAdapter.prototype.dispose = function() {
        this.isValid = false;
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