(function() {
    //Adapter for <defs>
    XML3D.webgl.DefsRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);
    };
    XML3D.createClass(XML3D.webgl.DefsRenderAdapter, XML3D.webgl.RenderAdapter);
})();
