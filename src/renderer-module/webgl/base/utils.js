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
    }
};

