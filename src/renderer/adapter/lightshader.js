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
        this.listeners = [];
    };
    XML3D.createClass(XML3D.webgl.LightShaderRenderAdapter, XML3D.webgl.RenderAdapter, {
        getDataNode: function() {
            return this.dataAdapter.getXflowNode();
        },
        getLightType: function() {
            var script = this.node.getAttribute("script");
                if (script.indexOf("urn:xml3d:lightshader:") === 0) {
                    return script.substring(22, script.length);
                } else {
                    XML3D.debug.logError("Unsupported light type "+script);
                    return null;
                }
        }
    });

    /** @const */
    var LIGHT_DEFAULT_INTENSITY = XML3D.math.vec3.fromValues(1,1,1);
    /** @const */
    var LIGHT_DEFAULT_ATTENUATION = XML3D.math.vec3.fromValues(0,0,1);
    /** @const */
    var SPOTLIGHT_DEFAULT_FALLOFFANGLE = Math.PI / 4.0;
    /** @const */
    var SPOTLIGHT_DEFAULT_SOFTNESS = 0.0;

    XML3D.webgl.LightShaderRenderAdapter.prototype.fillLightData = function(type, lights, localIntensity, offset) {
        this.callback = lights.dataChanged;
        var dataTable = this.computeRequest.getResult().getOutputMap();
        this.fillCommonLightData(lights, dataTable, offset, localIntensity);

        if (type === "spot") {
            this.fillSpotLightSpecialData(lights, dataTable, offset);
        } else if (type === "point") {
            this.fillPointLightSpecialData(lights, dataTable,offset);
        }
    };

    XML3D.webgl.LightShaderRenderAdapter.prototype.fillCommonLightData = function(lights, dataTable, offset, localIntensity) {
        var intensity = dataTable["intensity"] ? dataTable["intensity"].getValue() : LIGHT_DEFAULT_INTENSITY;
        Array.set(lights.intensity, offset, [intensity[0]*localIntensity, intensity[1]*localIntensity, intensity[2]*localIntensity]);
    }

    /**
     *
     * @param {Object} point
     * @param {Object} dataTable
     * @param {number} offset
     */
    XML3D.webgl.LightShaderRenderAdapter.prototype.fillPointLightSpecialData = function(point, dataTable, offset) {
        var attenuation = dataTable["attenuation"] ? dataTable["attenuation"].getValue() : LIGHT_DEFAULT_ATTENUATION;
        Array.set(point.attenuation, offset, attenuation);
    };

    /**
     *
     * @param {Object} directional
     * @param {Object} dataTable
     * @param {number} offset
     */
    XML3D.webgl.LightShaderRenderAdapter.prototype.fillSpotLightSpecialData = function(spot, dataTable, offset) {
        var attenuation = dataTable["attenuation"] ? dataTable["attenuation"].getValue() : LIGHT_DEFAULT_ATTENUATION;
        var falloffAngle = dataTable["falloffAngle"] ? dataTable["falloffAngle"].getValue() : [SPOTLIGHT_DEFAULT_FALLOFFANGLE];
        var softness = dataTable["softness"] ? dataTable["softness"].getValue() : [SPOTLIGHT_DEFAULT_SOFTNESS];

        Array.set(spot.attenuation, offset, attenuation);
        Array.set(spot.falloffAngle, offset/3, falloffAngle);
        Array.set(spot.softness, offset/3, softness);
    };

    XML3D.webgl.LightShaderRenderAdapter.prototype.removeLight = function(type, lightEntry, offset) {
        var lo = lightEntry;
        if (!lo)
            return;
        if (type === "point") {
            lo.attenuation.splice(offset, 3);
        } else if (type === "spot") {
            lo.attenuation.splice(offset, 3);
            lo.softness.splice(offset/3, 1);
            lo.falloffAngle.splice(offset/3, 1);
        }
        lo.intensity.splice(offset, 3);
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
        if (evt.type == XML3D.events.THIS_REMOVED) {
            this.destroy();
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
