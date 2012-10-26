// adapter/factory.js

(function() {
    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     * @extends XML3D.base.AdapterFactory
     * @param {XML3D.webgl.CanvasHandler} handler
     * @param {XML3D.webgl.Renderer} renderer
     */
    var RenderAdapterFactory = function(handler, renderer) {
        XML3D.base.NodeAdapterFactory.call(this, XML3D.webgl, handler.id);
        this.handler = handler;
        this.renderer = renderer;
        this.type = "RenderAdapterFactory";
    };
    XML3D.createClass(RenderAdapterFactory, XML3D.base.NodeAdapterFactory);

    var ns = XML3D.webgl,
        registry = {
            xml3d:          ns.XML3DRenderAdapter,
            view:           ns.ViewRenderAdapter,
            defs:           ns.DefsRenderAdapter,
            mesh:           ns.MeshRenderAdapter,
            transform:      ns.TransformRenderAdapter,
            shader:         ns.ShaderRenderAdapter,
            texture:        ns.TextureRenderAdapter,
            group:          ns.GroupRenderAdapter,
            img:            ns.ImgRenderAdapter,
            light:          ns.LightRenderAdapter,
            lightshader:    ns.LightShaderRenderAdapter

    };

    /**
     * @param node
     * @return {XML3D.base.Adapter|null}
     */
    RenderAdapterFactory.prototype.createAdapter = function(node) {
        var adapterConstructor = registry[node.localName];
        if(adapterConstructor !== undefined) {
            return new adapterConstructor(this, node);
        }
        return null;
    };

    // Export
    XML3D.webgl.RenderAdapterFactory = RenderAdapterFactory;
}());