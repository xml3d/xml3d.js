// renderer/renderer.js
(function (webgl) {

    webgl.renderers = [];

    var RendererFactory = function () {
        this.createRenderer = function (context, scene, canvas) {
            return new webgl.GLRenderer(context, scene, canvas);
        }
    };
    webgl.rendererFactory = new RendererFactory();

})(XML3D.webgl);






