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
    this.renderTree = null;
    initGLStates(this, context);
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
    },

    setGLState: function(state) {
        for (var key in state) {
            var vals = state[key];
            this.glStateMap[key].set(state[key]);
        }
    },

    resetGLState: function(state) {
        for (var key in state) {
            this.glStateMap[key].set(this.glStateMap[key].default);
        }
    }
});

function initGLStates(ri, context) {
    var gl = context.gl;

    ri.glStateMap = {
        depthMask: {
            default: [true],
            set: function(vals) {
                gl.depthMask.apply(gl, vals);
            }
        },
        depthTest: {
            default: [true],
            set: function(val) {
                if (val[0])
                    gl.enable(gl.DEPTH_TEST);
                else
                    gl.disable(gl.DEPTH_TEST)
            }
        },
        depthFunc: {
            default: [gl.LESS],
            set: function(vals) {
                gl.depthFunc.apply(gl, vals);
            }
        },
        blendEquationSeparate:  {
            default: [gl.FUNC_ADD, gl.FUNC_ADD],
            set: function(vals) {
                if (vals.length == 1) {
                    gl.blendEquation(vals[0]);
                } else {
                    gl.blendEquationSeparate.apply(gl, vals);
                }
            }
        },
        blendFuncSeparate: {
            default: [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA],
            set: function (vals) {
                if (vals.length == 2) {
                    gl.blendFunc(vals[0], vals[1]);
                } else if (vals.length == 4) {
                    gl.blendFuncSeparate.apply(gl, vals);
                }
            }
        },
        blend: {
            default: [false],
            set: function(val) {
                if (val[0])
                    gl.enable(gl.BLEND);
                else
                    gl.disable(gl.BLEND)
            }
        },
        cullFace: {
            default: [true],
            set: function(val) {
                if (val[0])
                    gl.enable(gl.CULL_FACE);
                else
                    gl.disable(gl.CULL_FACE)
            }
        },
        cullFaceMode: {
            default: [gl.BACK],
            set: function(vals) {
                gl.cullFace.apply(gl, vals);
            }
        }
    }
}

module.exports = GLRenderInterface;

