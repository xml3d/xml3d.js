(function() {
    var listenerID = 0;
    var staticAttributes = ["position", "direction", "intensity", "attenuation", "softness", "falloffAngle"];

    /**
     * Adapter for <lightshader>
     * @constructor
     * @param {RenderAdapterFactory} factory
     * @param {Element} node
     */
    XML3D.webgl.LightShaderRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.dataAdapter = XML3D.base.resourceManager.getAdapter(this.node, XML3D.data);
        this.computeRequest = this.dataAdapter.getComputeRequest(staticAttributes, this.dataChanged.bind(this));
        this.offsets = [];
        this.listeners = [];
    };
    XML3D.createClass(XML3D.webgl.LightShaderRenderAdapter, XML3D.webgl.RenderAdapter);

    /** @const */
    var LIGHT_DEFAULT_INTENSITY = XML3D.math.vec3.fromValues(1,1,1);
    /** @const */
    var LIGHT_DEFAULT_ATTENUATION = XML3D.math.vec3.fromValues(0,0,1);
    /** @const */
    var SPOTLIGHT_DEFAULT_FALLOFFANGLE = Math.PI / 4.0;
    /** @const */
    var SPOTLIGHT_DEFAULT_SOFTNESS = 0.0;

    /**
     *
     * @param {Object} point
     * @param {number} i
     * @param {number} offset
     */
    XML3D.webgl.LightShaderRenderAdapter.prototype.fillPointLight = function(point, i, offset) {
        this.callback = point.dataChanged;
        this.offsets.push(offset);
        var dataTable = this.computeRequest.getResult().getOutputMap();

        var intensity = dataTable["intensity"] ? dataTable["intensity"].getValue() : LIGHT_DEFAULT_INTENSITY;
        var attenuation = dataTable["attenuation"] ? dataTable["attenuation"].getValue() : LIGHT_DEFAULT_ATTENUATION;

        Array.set(point.intensity, offset, [intensity[0]*i, intensity[1]*i, intensity[2]*i]);
        Array.set(point.attenuation, offset, attenuation);
    };

    /**
     *
     * @param {Object} directional
     * @param {number} i
     * @param {number} offset
     */
    XML3D.webgl.LightShaderRenderAdapter.prototype.fillDirectionalLight = function(directional, i, offset) {
        this.callback = directional.dataChanged;
        this.offsets.push(offset);
        var dataTable = this.computeRequest.getResult().getOutputMap();
        var intensity = dataTable["intensity"] ? dataTable["intensity"].getValue() : LIGHT_DEFAULT_INTENSITY;

        Array.set(directional.intensity, offset, [intensity[0]*i, intensity[1]*i, intensity[2]*i]);
    };

    /**
     *
     * @param {Object} directional
     * @param {number} i
     * @param {number} offset
     */
    XML3D.webgl.LightShaderRenderAdapter.prototype.fillSpotLight = function(spot, i, offset) {
        this.callback = spot.dataChanged;
        this.offsets.push(offset);
        var dataTable = this.computeRequest.getResult().getOutputMap();
        var intensity = dataTable["intensity"] ? dataTable["intensity"].getValue() : LIGHT_DEFAULT_INTENSITY;
        var attenuation = dataTable["attenuation"] ? dataTable["attenuation"].getValue() : LIGHT_DEFAULT_ATTENUATION;
        var falloffAngle = dataTable["falloffAngle"] ? dataTable["falloffAngle"].getValue() : [SPOTLIGHT_DEFAULT_FALLOFFANGLE];
        var softness = dataTable["softness"] ? dataTable["softness"].getValue() : [SPOTLIGHT_DEFAULT_SOFTNESS];

        Array.set(spot.intensity, offset, [intensity[0]*i, intensity[1]*i, intensity[2]*i]);
        Array.set(spot.attenuation, offset, attenuation);
        Array.set(spot.falloffAngle, offset/3, falloffAngle);
        Array.set(spot.softness, offset/3, softness);
    };

    XML3D.webgl.LightShaderRenderAdapter.prototype.removeLight = function(type, lights, offset) {
        var lo = lights[type];
        if (!lo)
            return;

        switch (type) {
            case "point":
                lo.intensity.splice(offset, 3);
                lo.attenuation.splice(offset, 3);
                break;

            case "directional":
                lo.intensity.splice(offset, 3);
                break;

            case "spot":
                lo.intensity.splice(offset, 3);
                lo.attenuation.splice(offset, 3);
                lo.beamWidth.splice(offset/3, 1);
                lo.cutOffAngle.splice(offset/3, 1);
                break;
        }

        lights.changed = true;
    }

    /**
     *
     * @param {Xflow.data.Request} request
     * @param {Xflow.RESULT_STATE} notification
     */
    XML3D.webgl.LightShaderRenderAdapter.prototype.dataChanged = function(request, notification) {
        var dataTable = request.getResult();

        for (var i=0; i<staticAttributes.length; i++) {
            var attr = dataTable.getOutputData(staticAttributes[i]);
            var webglData = XML3D.webgl.getXflowEntryWebGlData(attr, this.factory.canvasId);

            if (attr && webglData && webglData.changed) {
                var value = attr.getValue();
                for(var j=0; j<this.listeners.length; j++)
                    this.listeners[j].func(staticAttributes[i], value);
                webglData.changed = 0;
            }
        }
    };

    XML3D.webgl.LightShaderRenderAdapter.prototype.notifyChanged = function(evt) {
        if (evt.type == XML3D.events.NODE_REMOVED) {
            return;
        } else if (evt.type == XML3D.events.THIS_REMOVED) {
            this.notifyOppositeAdapters();
            return;
        }

    };

    /**
     *
     * @param {Function} func
     */
    XML3D.webgl.LightShaderRenderAdapter.prototype.registerLightListener = function(func) {
        listenerID++;
        this.listeners.push({id : listenerID, func : func});
        return listenerID;
    };
    XML3D.webgl.LightShaderRenderAdapter.prototype.removeLightListener = function(idToRemove) {
        for (var i=0; i<this.listeners.length; i++) {
            if (this.listeners[i].id == idToRemove) {
                this.listeners.splice(i, 1);
                return;
            }
        }
    };

    XML3D.webgl.LightShaderRenderAdapter.prototype.destroy = function() {
        this.notifyOppositeAdapters();
    };

    /**
     *
     * @param {string} name
     */
    XML3D.webgl.LightShaderRenderAdapter.prototype.requestParameter = function(name) {
        return this.computeRequest.getResult().getOutputData(name);
    };

})();
