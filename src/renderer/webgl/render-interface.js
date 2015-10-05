// Note: This context should only be used to access GL constants
var GL = require("./constants.js");
var ForwardRenderTree = require("./render-trees/forward.js");

/**
 *
 * @param {GLContext} context
 * @param {Scene} scene
 * @constructor
 */
var GLRenderInterface = function (context, scene) {
    this.context = context;
    this.scene = scene;
    this.options = {
        pickingEnabled: true,
        mouseMovePickingEnabled: true,
        glBlendFuncSeparate: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA]
    };
    this.renderPipeline = null;
};

XML3D.extend(GLRenderInterface.prototype, {
    getRenderPipeline: function () {
        return (this.renderPipeline = this.renderPipeline || new ForwardRenderTree(this.context));
    },

    setRenderPipeline: function (pipeline) {
        //TODO cleanup old pipeline
        this.renderPipeline = pipeline;
        this.context.requestRedraw("Pipeline changed");
    },

    getRenderOptions: function () {
        return this.options;
    }
});

module.exports = GLRenderInterface;

