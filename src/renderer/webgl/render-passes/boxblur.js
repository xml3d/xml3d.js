var BaseRenderPass = require("./base.js");
var FullscreenQuad = require("../base/fullscreenquad.js");

var BoxBlurPass = function (renderInterface, output, opt) {
    BaseRenderPass.call(this, renderInterface, output, opt);
    this._program = this.renderInterface.context.programFactory.getProgramByName("boxblur");
    this._screenQuad = new FullscreenQuad(this.renderInterface.context);
    this._uniformsDirty = true;
};

XML3D.createClass(BoxBlurPass, BaseRenderPass);

XML3D.extend(BoxBlurPass.prototype, {
    render: (function () {
        return function () {
            var gl = this.renderInterface.context.gl;
            var target = this.output;

            target.bind();
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.disable(gl.DEPTH_TEST);

            this._program.bind();
            this._setNonVolatileShaderUniforms();

            this._screenQuad.draw(this._program);

            this._program.unbind();
            target.unbind();
        }
    }()),

    _setNonVolatileShaderUniforms: (function () {
        var uniforms = {};

        return function () {
            if (!this._uniformsDirty)
                return;

            var program = this._program;
            var target = this.output;

            uniforms["canvasSize"] = [target.width, target.height];
            uniforms["sInTexture"] = [this.inputs.buffer.colorTarget.handle];
            uniforms["blurOffset"] = [1.0, 1.0];
            program.setPerFrameUniforms(uniforms);

//                this._uniformsDirty = false;
        }
    })()
});

module.exports = BoxBlurPass;

