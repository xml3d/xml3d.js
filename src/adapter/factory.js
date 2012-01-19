// adapter/factory.js

(function() {
    var XML3DRenderAdapterFactory = function(handler, renderer) {
        org.xml3d.data.AdapterFactory.call(this);
        this.handler = handler;
        this.renderer = renderer;
        this.name = "XML3DRenderAdapterFactory";
    };
    org.xml3d.createClass(XML3DRenderAdapterFactory, org.xml3d.data.AdapterFactory);
        
    var gl = org.xml3d.webgl,
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
    
    XML3DRenderAdapterFactory.prototype.createAdapter = function(node) {
        var adapterContructor = reg[node.localName];
        if(adapterContructor !== undefined) {
            return new adapterContructor(this, node);
        }
        return null;
    };

    
    // Export
    org.xml3d.webgl.XML3DRenderAdapterFactory = XML3DRenderAdapterFactory;
}());