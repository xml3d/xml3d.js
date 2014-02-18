// adapter/factory.js

(function() {
    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     * @extends XML3D.base.AdapterFactory
     * @param {XML3D.webgl.CanvasHandler} handler
     * @param {XML3D.webgl.Renderer} renderer
     */
    var RenderAdapterFactory = function(canvasId) {
        XML3D.base.NodeAdapterFactory.call(this, XML3D.webgl, canvasId);
        this.type = "RenderAdapterFactory";
    };
    XML3D.createClass(RenderAdapterFactory, XML3D.base.NodeAdapterFactory);
    RenderAdapterFactory.prototype.aspect = XML3D.webgl;
    XML3D.base.xml3dFormatHandler.registerFactoryClass(RenderAdapterFactory);

    var ns = XML3D.webgl,
        registry = {
            xml3d:          ns.XML3DRenderAdapter,
            view:           ns.ViewRenderAdapter,
            defs:           ns.DefsRenderAdapter,
            mesh:           ns.MeshRenderAdapter,
            multimesh:      ns.MultiMeshRenderAdapter,
            data:           ns.DataRenderAdapter,
            shader:         ns.ShaderRenderAdapter,
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

    RenderAdapterFactory.prototype.setScene = function(scene) {
        this.scene = scene;
    }

    RenderAdapterFactory.prototype.getScene = function() {
        return this.scene;
    }

    RenderAdapterFactory.prototype.setRenderer = function(renderer) {
        this.renderer = renderer;
    }

    RenderAdapterFactory.prototype.getRenderer = function() {
        return this.renderer;
    }

    // Export
    XML3D.webgl.RenderAdapterFactory = RenderAdapterFactory;
}());
