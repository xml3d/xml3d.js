// adapter/factory.js

(function() {
    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     * @extends XML3D.base.AdapterFactory
     */
    var RenderAdapterFactory = function(handler, renderer) {
        XML3D.base.AdapterFactory.call(this);
        this.handler = handler;
        this.renderer = renderer;
        this.type = "RenderAdapterFactory";
    };
    XML3D.createClass(RenderAdapterFactory, XML3D.base.AdapterFactory);

    var gl = XML3D.webgl,
        reg = {
            xml3d:          gl.XML3DRenderAdapter,
            view:           gl.ViewRenderAdapter,
            defs:           gl.DefsRenderAdapter,
            mesh:           gl.MeshRenderAdapter,
            transform:      gl.TransformRenderAdapter,
            shader:         gl.ShaderRenderAdapter,
            texture:        gl.TextureRenderAdapter,
            group:          gl.GroupRenderAdapter,
            img:            gl.ImgRenderAdapter,
            light:          gl.LightRenderAdapter,
            lightshader:    gl.LightShaderRenderAdapter

    };

    RenderAdapterFactory.prototype.isFactoryFor = function(obj) {
        return obj == XML3D.webgl;
    };

    RenderAdapterFactory.prototype.createAdapter = function(node) {
        var adapterContructor = reg[node.localName];
        if(adapterContructor !== undefined) {
            return new adapterContructor(this, node);
        }
        return null;
    };

    // Export
    XML3D.webgl.RenderAdapterFactory = RenderAdapterFactory;
}());