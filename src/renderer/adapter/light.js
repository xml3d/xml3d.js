(function() {

    /**
     * Adapter for <light>
     * @constructor
     * @param {RenderAdapterFactory} factory
     * @param {Element} node
     */
    var LightRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);

        this.visible = true;
        this.transform = null;
        this.lightShader = null;
        this.renderer = factory.renderer;

        this.offset = 0;
        this.lightType = "point";
        this.updateLightShader();
        this.listenerID = -1;

    };
    XML3D.createClass(LightRenderAdapter, XML3D.webgl.RenderAdapter);

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
                var lights = this.renderer.lights;
                this.removeLight(lights);
                return;
            }
        }

        var target = evt.internalType || evt.wrapped.attrName;

        switch(target) {
        case "visible":
            this.visible = (evt.wrapped.newValue == "true") && this.node.parentNode.visible;
            this.renderer.changeLightData(this.lightType, "visibility", this.offset, this.visible ? [1,1,1] : [0,0,0]);
            break;
        case "parentvisible":
            this.visible = evt.newValue && this.node.visible;
            this.renderer.changeLightData(this.lightType, "visibility", this.offset, this.visible ? [1,1,1] : [0,0,0]);
            break;
        case "intensity":
            var i = this.intensity = evt.wrapped.newValue;
            var lsIntensity = this.lightShader.requestParameter("intensity");
            if (lsIntensity)
                lsIntensity = lsIntensity.getValue();
            else
                return;

            this.renderer.changeLightData(this.lightType, "intensity", this.offset, [lsIntensity[0]*i, lsIntensity[1]*i, lsIntensity[2]*i]);

            break;
        case "parenttransform":
            this.transform = evt.newValue;
            if (this.lightType == "directional") {
                this.renderer.changeLightData(this.lightType, "direction", this.offset, this.applyTransformDir(XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION));
            } else if (this.lightType == "spot") {
                this.renderer.changeLightData(this.lightType, "direction", this.offset, this.applyTransformDir(XML3D_SPOTLIGHT_DEFAULT_DIRECTION));
                this.renderer.changeLightData(this.lightType, "position", this.offset, this.applyTransform([0,0,0]));
            } else {
                this.renderer.changeLightData(this.lightType, "position", this.offset, this.applyTransform([0,0,0]));
            }

            break;
        case "shader":
            var lights = this.renderer.lights;
            this.removeLight(lights);
            //this.disconnectAdapterHandle("shader");
            this.updateLightShader();
            this.addLight(lights);
            break;
        }

        this.factory.handler.redraw("Light attribute changed.");
    };

    /** @const */
    var XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION = XML3D.math.vec3.fromValues(0,0,-1), tmpDirection = XML3D.math.vec3.create();
    /** @const */
    var XML3D_SPOTLIGHT_DEFAULT_DIRECTION = XML3D.math.vec3.fromValues(0,0,1);


	LightRenderAdapter.prototype.applyTransform = function(vec) {
	    if (this.transform) {
            var t = this.transform;
            var newVec = XML3D.math.vec4.transformMat4(XML3D.math.vec4.create(), [vec[0], vec[1], vec[2], 1], t);
            return [newVec[0]/newVec[3], newVec[1]/newVec[3], newVec[2]/newVec[3]];
	    }
	    return vec;
	};

	LightRenderAdapter.prototype.applyTransformDir = function(vec) {
	    if (this.transform) {
            var t = this.transform;
            var newVec = XML3D.math.vec4.transformMat4(XML3D.math.vec4.create(), [vec[0], vec[1], vec[2], 0], t);
            return [newVec[0], newVec[1], newVec[2]];
	    }
	    return vec;
	};

	/**
	 *
	 * @param {Object} lights
	 */
	LightRenderAdapter.prototype.addLight = function(lights) {
	    this.callback = lights.dataChanged;
	    var shader = this.getLightShader();
        if (!shader)
            return;

        var lo;
        this.listenerID = shader.registerLightListener(this.dataChanged.bind(this));
        var script = shader.node.script;
        var pos = script.indexOf("urn:xml3d:lightshader:");
        if(pos === 0) {
            var urnfrag = script.substring(22, script.length);
            switch(urnfrag) {
                case "point":
                    lo = lights.point;
                    this.offset = lo.length * 3;
                    this.lightType = "point";

                    Array.set(lo.position, this.offset, this.applyTransform([0,0,0]));
                    Array.set(lo.visibility, this.offset, this.visible ? [1,1,1] : [0,0,0]);
                    shader.fillPointLight(lo, this.node.intensity, this.offset);
                    lo.length++;
                    break;
                case "directional":
                    lo = lights.directional;
                    this.offset = lo.length * 3;
                    this.lightType = "directional";

                    Array.set(lo.direction, this.offset, this.applyTransformDir(XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION));
                    Array.set(lo.visibility, this.offset, this.visible ? [1,1,1] : [0,0,0]);
                    shader.fillDirectionalLight(lo, this.node.intensity, this.offset);
                    lo.length++;
                    break;
                case "spot":
                    lo = lights.spot;
                    this.offset = lo.length * 3;
                    this.lightType = "spot";

                    Array.set(lo.position, this.offset, this.applyTransform([0,0,0]));
                    Array.set(lo.direction, this.offset, this.applyTransformDir(XML3D_SPOTLIGHT_DEFAULT_DIRECTION));
                    Array.set(lo.visibility, this.offset, this.visible ? [1,1,1] : [0,0,0]);
                    shader.fillSpotLight(lo, this.node.intensity, this.offset);
                    lo.length++;
                    break;
                default:
                    XML3D.debug.logWarning("Unsupported lightshader type: " + script);
            }
        }

        lights.changed = true;
        lights.structureChanged = true;
	};

	LightRenderAdapter.prototype.removeLight = function(lights) {
	    var lo = lights[this.lightType];
	    var shader = this.getLightShader();

	    if (shader) {
    	    switch(this.lightType) {
    	    case "point":
    	        lo.position.splice(this.offset, 3);
    	        break;

    	    case "directional":
    	        lo.direction.splice(this.offset, 3);
    	        break;

    	    case "spot":
    	        lo.position.splice(this.offset, 3);
    	        lo.direction.splice(this.offset, 3);
    	        break;
    	    }

    	    lo.visibility.splice(this.offset, 3);

            shader.removeLight(this.lightType, lights, this.offset);
            shader.removeLightListener(this.listenerID);

    	    lo.length--;
    	    lights.changed = true;
    	    lights.structureChanged = true;
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
    	this.clearAdapterHandles();
    };

    LightRenderAdapter.prototype.destroy = function() {
        var lights = this.renderer.lights;
        this.removeLight(lights);

        //TODO: uncomment this once branches are merged
        //this.clearAdapterHandles();
    };


    /**
     * @return {XML3DMatrix}
     */
    LightRenderAdapter.prototype.getWorldMatrix = function() {

        var m = new window.XML3DMatrix();
        m._data.set(this.transform);
        return m;
    };

    /**
     *
     * @param {string} field
     * @param {Array.<number>} newValue
     * @return
     */
    LightRenderAdapter.prototype.dataChanged = function(field, newValue) {
        this.renderer.changeLightData(this.lightType, field, this.offset, newValue);
    };

    // Export to XML3D.webgl namespace
    XML3D.webgl.LightRenderAdapter = LightRenderAdapter;

}());