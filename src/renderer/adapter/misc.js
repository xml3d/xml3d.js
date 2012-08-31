// Misc adapters
(function() {
    XML3D.webgl.RenderAdapter = function(factory, node) {
        XML3D.base.Adapter.call(this, factory, node);
    };
    XML3D.webgl.RenderAdapter.prototype = new XML3D.base.Adapter();
    XML3D.webgl.RenderAdapter.prototype.constructor = XML3D.webgl.RenderAdapter;

    XML3D.webgl.RenderAdapter.prototype.isAdapterFor = function(protoType) {
        return protoType == XML3D.webgl.Renderer.prototype;
    };

    XML3D.webgl.RenderAdapter.prototype.getShader = function() {
        return null;
    };

    XML3D.webgl.RenderAdapter.prototype.applyTransformMatrix = function(
            transform) {
        return transform;
    };


    //Adapter for <defs>
    XML3D.webgl.XML3DDefsRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
    };
    XML3D.webgl.XML3DDefsRenderAdapter.prototype = new XML3D.webgl.RenderAdapter();
    XML3D.webgl.XML3DDefsRenderAdapter.prototype.constructor = XML3D.webgl.XML3DDefsRenderAdapter;
    XML3D.webgl.XML3DDefsRenderAdapter.prototype.notifyChanged = function(evt) {

    };

    //Adapter for <img>
    XML3D.webgl.XML3DImgRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.textureAdapter = factory.getAdapter(node.parentNode);
    };
    XML3D.webgl.XML3DImgRenderAdapter.prototype = new XML3D.webgl.RenderAdapter();
    XML3D.webgl.XML3DImgRenderAdapter.prototype.constructor = XML3D.webgl.XML3DImgRenderAdapter;
    XML3D.webgl.XML3DImgRenderAdapter.prototype.notifyChanged = function(evt) {
        this.textureAdapter.notifyChanged(evt);
    };

    // Adapter for <lightshader>
    XML3D.webgl.XML3DLightShaderRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
        this.dataAdapter = factory.renderer.dataFactory.getAdapter(this.node);
    };
    XML3D.webgl.XML3DLightShaderRenderAdapter.prototype = new XML3D.webgl.RenderAdapter();
    XML3D.webgl.XML3DLightShaderRenderAdapter.prototype.constructor = XML3D.webgl.XML3DLightShaderRenderAdapter;

    var LIGHT_DEFAULT_INTENSITY = vec3.create([1,1,1]);
    var LIGHT_DEFAULT_ATTENUATION = vec3.create([0,0,1]);

    XML3D.webgl.XML3DLightShaderRenderAdapter.prototype.fillPointLight = function(point, pos, i) {
        var dataTable = this.dataAdapter.getComputeRequest().getResult();
        var dpos = pos*3;
        var tmp;
        var intensity = (tmp = dataTable.getOutputData("intensity")) ? tmp.getValue() : LIGHT_DEFAULT_INTENSITY;
        var attenuation = (tmp = dataTable.getOutputData("attenuation")) ? tmp.getValue() : LIGHT_DEFAULT_ATTENUATION;

        point.intensity[dpos] = intensity[0]*i;
        point.intensity[dpos+1] = intensity[1]*i;
        point.intensity[dpos+2] = intensity[2]*i;

        point.attenuation[dpos] = attenuation[0];
        point.attenuation[dpos+1] = attenuation[1];
        point.attenuation[dpos+2] = attenuation[2];
    };

    XML3D.webgl.XML3DLightShaderRenderAdapter.prototype.fillDirectionalLight = function(directional, pos, i) {
        var dataTable = this.dataAdapter.getComputeRequest().getResult();
        var dpos = pos*3;
        var tmp;
        var intensity = (tmp = dataTable.getOutputData("intensity")) ? tmp.getValue() : LIGHT_DEFAULT_INTENSITY;

        directional.intensity[dpos] = intensity[0]*i;
        directional.intensity[dpos+1] = intensity[1]*i;
        directional.intensity[dpos+2] = intensity[2]*i;
    };


}());
