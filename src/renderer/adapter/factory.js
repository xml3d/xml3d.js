// adapter/factory.js

(function() {
    /**
     * @constructor
     * @implements {XML3D.base.IFactory}
     * @extends XML3D.base.AdapterFactory
     */
    var XML3DRenderAdapterFactory = function(handler, renderer) {
        XML3D.base.AdapterFactory.call(this);
        this.handler = handler;
        this.renderer = renderer;
        this.type = "XML3DRenderAdapterFactory";
    };
    XML3D.createClass(XML3DRenderAdapterFactory, XML3D.base.AdapterFactory);

    var gl = XML3D.webgl,
        reg = {
            xml3d:          gl.XML3DCanvasRenderAdapter,
            view:           gl.XML3DViewRenderAdapter,
            defs:           gl.XML3DDefsRenderAdapter,
            mesh:           gl.XML3DMeshRenderAdapter,
            transform:      gl.XML3DTransformRenderAdapter,
            shader:         gl.XML3DShaderRenderAdapter,
            texture:        gl.XML3DTextureRenderAdapter,
            group:          gl.XML3DGroupRenderAdapter,
            img:            gl.XML3DImgRenderAdapter,
            light:          gl.XML3DLightRenderAdapter,
            lightshader:    gl.XML3DLightShaderRenderAdapter

    };

    XML3DRenderAdapterFactory.prototype.isFactoryFor = function(obj) {
        return obj === XML3D.webgl;
    };

    XML3DRenderAdapterFactory.prototype.createAdapter = function(node) {
        var adapterContructor = reg[node.localName];
        if(adapterContructor !== undefined) {
            return new adapterContructor(this, node);
        }
        return null;
    };


    // Export
    XML3D.webgl.XML3DRenderAdapterFactory = XML3DRenderAdapterFactory;
}());