var RenderTarget = require("./base/rendertarget");
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
    GLContext: require("./base/context.js"),
    GLRenderTarget: RenderTarget.GLRenderTarget,
    GLScaledRenderTarget: RenderTarget.GLScaledRenderTarget,
    addFragmentShaderHeader: ShaderUtils.addFragmentShaderHeader,
    SystemNotifier: require("./system/system-notifier.js"),
    checkError: require("./base/utils.js").checkError,
    GLScene: require("./scene/glscene.js"),
    GLMesh: require("./base/mesh.js"),
    configure: require("./canvas-handler").configure
};

// These material models register themselves
require("./materials/urn/diffuse.js");
require("./materials/urn/phong.js");
require("./materials/urn/matte.js");
require("./materials/urn/point.js");
require("./materials/urn/utility.js");
