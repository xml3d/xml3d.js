var RenderTarget = require("./base/rendertarget");
var XflowUtils = require("./xflow/utils.js");
var ShaderUtils = require("./shader/shader-utils.js");

module.exports = {
    toString: function () {
        return "webgl";
    },
    supported: (function () {
        var canvas = document.createElement("canvas");

        return function () {
            try {
                return !!(window.WebGLRenderingContext && (canvas.getContext('experimental-webgl')));
            } catch (e) {
                return false;
            }
        };
    }()),
    MAX_PICK_BUFFER_DIMENSION: 512,
    GLProgramObject: require("./base/program.js"),
    GLContext: require("./base/context.js"),
    GLRenderTarget: RenderTarget.GLRenderTarget,
    GLScaledRenderTarget: RenderTarget.GLScaledRenderTarget,
    getGLUniformValueFromXflowDataEntry: XflowUtils.getGLUniformValueFromXflowDataEntry,
    getGLBufferFromXflowDataEntry: XflowUtils.getGLBufferFromXflowDataEntry,
    addFragmentShaderHeader: ShaderUtils.addFragmentShaderHeader,
    SystemNotifier: require("./system/system-notifier.js"),
    checkError: require("./base/utils.js").checkError,
    GLScene: require("./scene/glscene.js"),
    GLMesh: require("./base/mesh.js")
};

// These material models register themselves
require("./materials/diffuse.js");
require("./materials/phong.js");
require("./materials/matte.js");
require("./materials/point.js");
require("./materials/utility.js");
