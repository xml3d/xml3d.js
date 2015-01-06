module.exports = {
    /**
     * Set uniforms for active program
     * @param {WebGLRenderingContext} gl
     * @param u
     * @param value
     * @param {boolean=} transposed
     */
    setUniform: function (gl, u, value, transposed) {

        //noinspection FallthroughInSwitchStatementJS
        switch (u.glType) {
            case 35670: //gl.BOOL
            case 5124:  //gl.INT
            case 35678: //gl.SAMPLER_2D
            case 35680: //gl.SAMPLER_CUBE
                if (value && value.length !== undefined) {
                    gl.uniform1iv(u.location, value);
                } else {
                    gl.uniform1i(u.location, value || 0);
                }
                break;

            case 35671: // gl.BOOL_VEC2
            case 35667:
                gl.uniform2iv(u.location, value);
                break; // gl.INT_VEC2

            case 35672: // gl.BOOL_VEC3
            case 35668:
                gl.uniform3iv(u.location, value);
                break; // gl.INT_VEC3

            case 35673: // gl.BOOL_VEC4
            case 35669:
                gl.uniform4iv(u.location, value);
                break; // gl.INT_VEC4

            case 5126:
                if (value.length != null)
                    gl.uniform1fv(u.location, value); else
                    gl.uniform1f(u.location, value);
                break; // gl.FLOAT
            case 35664:
                gl.uniform2fv(u.location, value);
                break; // gl.FLOAT_VEC2
            case 35665:
                gl.uniform3fv(u.location, value);
                break; // gl.FLOAT_VEC3
            case 35666:
                gl.uniform4fv(u.location, value);
                break; // gl.FLOAT_VEC4

            case 35674:
                gl.uniformMatrix2fv(u.location, transposed || false, value);
                break;// gl.FLOAT_MAT2
            case 35675:
                gl.uniformMatrix3fv(u.location, transposed || false, value);
                break;// gl.FLOAT_MAT3
            case 35676:
                gl.uniformMatrix4fv(u.location, transposed || false, value);
                break;// gl.FLOAT_MAT4

            default:
                XML3D.debug.logError("Unknown uniform type " + u.glType);
                break;
        }
    },

    setUniformSampler: function (gl, sampler, value) {
        if (!value || !sampler) {
            return;
        }
        if (!Array.isArray(value)) {
            // Textures are always an array value
            XML3D.debug.logError("Unexpected value in setUniformSampler");
            return;
        }

        sampler.texture = value;

        var textureUnitsChanged = false;
        for (var i = 0; i < sampler.texture.length; i++) {
            var texture = sampler.texture[i];
            if (texture) {
                var unit = texture.getTextureUnit();
                if (unit != sampler.unit[i]) {
                    sampler.unit[i] = unit;
                    textureUnitsChanged = true;
                }
            }
        }
        if (textureUnitsChanged) {
            this.setUniform(gl, sampler, sampler.unit);
        }
    },

    getUniqueCounter: function () {
        var c_counter = 0;
        return function () {
            return c_counter++;
        }
    },

    checkError: function (gl, text) {
        var error = gl.getError();
        if (error !== gl.NO_ERROR) {
            var textErr = "" + error;
            switch (error) {
                case 1280:
                    textErr = "1280 ( GL_INVALID_ENUM )";
                    break;
                case 1281:
                    textErr = "1281 ( GL_INVALID_VALUE )";
                    break;
                case 1282:
                    textErr = "1282 ( GL_INVALID_OPERATION )";
                    break;
                case 1283:
                    textErr = "1283 ( GL_STACK_OVERFLOW )";
                    break;
                case 1284:
                    textErr = "1284 ( GL_STACK_UNDERFLOW )";
                    break;
                case 1285:
                    textErr = "1285 ( GL_OUT_OF_MEMORY )";
                    break;
            }
            var msg = "GL error " + textErr + " occured.";
            if (text !== undefined)
                msg += " " + text;
            XML3D.debug.trace(msg);
        }
    }

};

