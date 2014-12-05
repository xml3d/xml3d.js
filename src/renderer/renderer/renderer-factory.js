var GLRenderer = require("../webgl/renderer.js");
var GLCanvasHandler = require("../webgl/canvas-handler.js");

var RendererFactory = function () {
    this.createRenderer = function (xml3dElement) {
        var canvas = xml3dElement._configured.canvas;
        var canvasHandler = new GLCanvasHandler(xml3dElement, canvas);
        var renderer = new GLRenderer(xml3dElement, canvasHandler);
        canvasHandler.setRenderer(renderer);
        window.requestAnimationFrame(canvasHandler.tick);
        return renderer;
    }
};
module.exports = new RendererFactory();







