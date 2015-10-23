// Note: This context should only be used to access GL constants
var GL = require("./constants.js");
var Targets = require("./base/rendertarget.js");
var FullScreenQuad = require("./base/fullscreenquad.js");
var ForwardRenderTree = require("./render-trees/forward.js");
var ForwardRenderPass = require("./render-passes/forward.js");

/**
 *
 * @param {GLContext} context
 * @param {Scene} scene
 * @constructor
 */
var GLRenderInterface = function (context, scene) {
    this.context = context;
    this.scene = scene;
    this.shaders = {};
    this.options = {
        pickingEnabled: true,
        mouseMovePickingEnabled: true,
        glBlendFuncSeparate: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA]
    };
    this.renderTree = null;
};

XML3D.extend(GLRenderInterface.prototype, {
    getRenderTree: function () {
        return (this.renderTree = this.renderTree || new ForwardRenderTree(this.context));
    },

    setRenderTree: function (tree) {
        //TODO cleanup old pipeline
        this.renderTree = tree;
        this.context.requestRedraw("Pipeline changed");
    },

    createRenderTarget: function(opt) {
        return new Targets.GLRenderTarget(this.context, opt);
    },

    createScaledRenderTarget: function(maxDimension, opt) {
        return new Targets.GLScaledRenderTarget(this.context, maxDimension, opt);
    },

    getShaderProgram: function(name) {
        if (!this.shaders[name] || !this.shaders[name].isValid()) {
            this.shaders[name] = this.context.programFactory.getProgramByName(name);
        }

        return this.shaders[name];
    },

    createFullscreenQuad: function() {
        return new FullScreenQuad(this.context);
    },

    createSceneRenderPass: function(target) {
        return new ForwardRenderPass(this, target || this.context.canvasTarget);
    }
});

module.exports = GLRenderInterface;

