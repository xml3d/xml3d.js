var GLRenderer = require("../webgl/renderer.js");

var RendererFactory = function () {
    this.createRenderer = function (context, scene, canvas) {
        return new GLRenderer(context, scene, canvas);
    }
};
module.exports = new RendererFactory();







