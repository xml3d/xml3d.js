(function (webgl) {

    /**
     * @contructor
     */
    var BaseRenderPass = function(context, opt) {
        opt = opt || {};
        this.context = context;
        this.target = opt.target || context.canvasTarget;
    };

    XML3D.extend(BaseRenderPass.prototype, {
        /**
         * Reads pixels from the pass's target
         *
         * @param {number} glX OpenGL Coordinate in the target
         * @param {number} glY OpenGL Coordinate in the target
         * @returns {Uint8Array} pixel data
         */
        readPixelDataFromBuffer : (function() {
            var c_data = new Uint8Array(8);

            return function (glX, glY) {
                var gl = this.context.gl;
                var scale = this.target.getScale();
                var x = glX * scale;
                var y = glY * scale;

                this.target.bind();
                try {
                    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, c_data);
                    this.target.unbind();
                    return c_data;
                } catch (e) {
                    XML3D.debug.logException(e);
                    this.target.unbind();
                    return null;
                }
            }
        }())
    });

    webgl.BaseRenderPass = BaseRenderPass;

}(XML3D.webgl));