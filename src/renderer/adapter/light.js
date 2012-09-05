(function() {

    /**
     * Adapter for <light>
     * @constructor
     * @param {RenderAdapterFactory} factory
     * @param {Element} node
     */
    var XML3DLightRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);

        this.visible = true;
        this.transform = null;
        this.lightShader = null;
        this.renderer = factory.renderer;

        this.offset = 0;
        this.lightType = "point";
    };
    XML3D.createClass(XML3DLightRenderAdapter, XML3D.webgl.RenderAdapter);

    XML3DLightRenderAdapter.prototype.notifyChanged = function(evt) {
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
            if (this.lightType != "directional")
                this.renderer.changeLightData(this.lightType, "position", this.offset, this.getPosition());

            break;
        }

        this.factory.handler.redraw("Light attribute changed.");
    };

    /** @const */
	var XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION = vec3.create([0,0,-1]), tmpDirection = vec3.create();


	XML3DLightRenderAdapter.prototype.getPosition = function() {
	    if (this.transform) {
            var t = this.transform;
            var pos = mat4.multiplyVec4(t, quat4.create([0,0,0,1]));
            return [pos[0]/pos[3], pos[1]/pos[3], pos[2]/pos[3]];
	    }
	    return [0,0,0];
	};

	/**
	 *
	 * @param {Object} lights
	 */
	XML3DLightRenderAdapter.prototype.addLight = function(lights) {
	    this.callback = lights.dataChanged;
	    var shader = this.getLightShader();
        if (!shader)
            return;

        var lo;

        var script = shader.node.script;
        var pos = script.indexOf("urn:xml3d:lightshader:");
        if(pos === 0) {
            var urnfrag = script.substring(22, script.length);
            switch(urnfrag) {
                case "point":
                    lo = lights.point;
                    this.offset = lo.length * 3;
                    this.lightType = "point";

                    Array.set(lo.position, this.offset, this.getPosition());

                    Array.set(lo.visibility, this.offset, this.visible ? [1,1,1] : [0,0,0]);
                    shader.fillPointLight(lo, this.node.intensity, this.offset);
                    lo.length++;
                    break;
                case "directional":
                    lo = lights.directional;
                    this.offset = lo.length * 3;
                    this.lightType = "directional";

                    if (this.transform) {
                        var t = this.transform;
                        mat4.multiplyVec3(t, XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION, tmpDirection);
                        Array.set(lo.direction, this.offset, [tmpDirection[0], tmpDirection[1], tmpDirection[2]]);
                    } else {
                        Array.set(lo.direction, this.offset, XML3D_DIRECTIONALLIGHT_DEFAULT_DIRECTION);
                    }

                    Array.set(lo.visibility, this.offset, this.visible ? [1,1,1] : [0,0,0]);
                    shader.fillDirectionalLight(lo, this.node.intensity, this.offset);
                    lo.length++;
                    break;
                default:
                    XML3D.debug.logWarning("Unsupported lightshader type: " + script);
            }
        }
	};

	/**
	 *
	 */
    XML3DLightRenderAdapter.prototype.getLightShader = function() {
        if (!this.lightShader) {
            var shaderLink = this.node.shader;
            var shader = null;
            if (shaderLink != "")
                shader = XML3D.URIResolver.resolve(shaderLink);
            // if no shader attribute is specified, try to get a shader from the style attribute
            if(shader == null)
            {
                var styleValue = this.node.getAttribute('style');
                if(!styleValue)
                    return null;
                var pattern    = /shader\s*:\s*url\s*\(\s*(\S+)\s*\)/i;
                var result = pattern.exec(styleValue);
                if (result)
                    shader = this.node.xml3ddocument.resolve(result[1]);
            }
            this.lightShader = this.factory.getAdapter(shader);
        }
        return this.lightShader;
    };
    XML3DLightRenderAdapter.prototype.dispose = function() {
        this.isValid = false;
    };

    /**
     *
     * @param {string} field
     * @param {Array.<number>} newValue
     * @return
     */
    XML3DLightRenderAdapter.prototype.dataChanged = function(field, newValue) {
        this.renderer.changeLightData(this.lightType, field, this.offset, newValue);
    };

    // Export to XML3D.webgl namespace
    XML3D.webgl.XML3DLightRenderAdapter = XML3DLightRenderAdapter;

}());