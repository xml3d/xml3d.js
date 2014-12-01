var GLRenderer = require("../webgl/renderer.js");
//webgl.renderers = [];

var RendererFactory = function () {
    this.createRenderer = function (context, scene, canvas) {
        return new GLRenderer(context, scene, canvas);
    }
};
module.exports = new RendererFactory();







