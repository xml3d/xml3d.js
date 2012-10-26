// Misc adapters
(function() {
    XML3D.webgl.RenderAdapter = function(factory, node) {
        XML3D.base.NodeAdapter.call(this, factory, node);
    };
    XML3D.createClass(XML3D.webgl.RenderAdapter, XML3D.base.NodeAdapter);

    XML3D.webgl.RenderAdapter.prototype.getShader = function() {
        return null;
    };

    XML3D.webgl.RenderAdapter.prototype.getAdapterHandle = function(uri) {
        return XML3D.base.resourceManager.getAdapterHandle(this.node.ownerDocument, uri,
            XML3D.webgl, this.factory.handler.id);
    };

    XML3D.webgl.RenderAdapter.prototype.applyTransformMatrix = function(
            transform) {
        return transform;
    };


    //Adapter for <defs>
    XML3D.webgl.DefsRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
    };
    XML3D.createClass(XML3D.webgl.DefsRenderAdapter, XML3D.webgl.RenderAdapter);

    //Adapter for <img>
    XML3D.webgl.ImgRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.textureAdapter = factory.getAdapter(node.parentNode);
    };
    XML3D.createClass(XML3D.webgl.ImgRenderAdapter, XML3D.webgl.RenderAdapter);

    XML3D.webgl.ImgRenderAdapter.prototype.notifyChanged = function(evt) {
        this.textureAdapter.notifyChanged(evt);
    };

    var staticAttributes = ["position", "direction", "intensity", "attenuation"];

    /**
     * Adapter for <lightshader>
     * @constructor
     * @param {RenderAdapterFactory} factory
     * @param {Element} node
     */
    XML3D.webgl.LightShaderRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.dataAdapter = XML3D.data.factory.getAdapter(this.node);
        this.computeRequest = this.dataAdapter.getComputeRequest(staticAttributes, this.dataChanged.bind(this));
        this.offsets = [];
        this.listeners = [];
    };
    XML3D.createClass(XML3D.webgl.LightShaderRenderAdapter, XML3D.webgl.RenderAdapter);

    /** @const */
    var LIGHT_DEFAULT_INTENSITY = vec3.create([1,1,1]);
    /** @const */
    var LIGHT_DEFAULT_ATTENUATION = vec3.create([0,0,1]);

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
     * @param {Xflow.data.Request} request
     * @param {Xflow.RequestNotification} notification
     */
    XML3D.webgl.LightShaderRenderAdapter.prototype.dataChanged = function(request, notification) {
        var dataTable = request.getResult();

        for (var i=0; i<staticAttributes.length; i++) {
            var attr = dataTable.getOutputData(staticAttributes[i]);
            if (attr && attr.userData.webglDataChanged) {
                var value = attr.getValue();
                for(var j=0; j<this.listeners.length; j++)
                    this.listeners[j](staticAttributes[i], value);
            }
        }
    };

    /**
     *
     * @param {Function} func
     */
    XML3D.webgl.LightShaderRenderAdapter.prototype.registerLightListener = function(func) {
        this.listeners.push(func);
    };
    XML3D.webgl.LightShaderRenderAdapter.prototype.removeLightListener = function(func) {
        //this.listeners.splice(func);
        //TODO: remove light node listeners
    };

    /**
     *
     * @param {string} name
     */
    XML3D.webgl.LightShaderRenderAdapter.prototype.requestParameter = function(name) {
        return this.computeRequest.getResult().getOutputData(name);
    };

}());
