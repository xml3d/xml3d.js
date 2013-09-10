// Utility functions
(function(webgl) {

    webgl.checkError = function(gl, text)
    {
        var error = gl.getError();
        if (error !== gl.NO_ERROR) {
            var textErr = ""+error;
            switch (error) {
            case 1280: textErr = "1280 ( GL_INVALID_ENUM )"; break;
            case 1281: textErr = "1281 ( GL_INVALID_VALUE )"; break;
            case 1282: textErr = "1282 ( GL_INVALID_OPERATION )"; break;
            case 1283: textErr = "1283 ( GL_STACK_OVERFLOW )"; break;
            case 1284: textErr = "1284 ( GL_STACK_UNDERFLOW )"; break;
            case 1285: textErr = "1285 ( GL_OUT_OF_MEMORY )"; break;
            }
            var msg = "GL error " + textErr + " occured.";
            if (text !== undefined)
                msg += " " + text;
            XML3D.debug.trace(msg);
        }
    };

    /**
     * @param {WebGLRenderingContext} gl
     * @param {number} type
     * @param {Object} data
     */
    var createBuffer = function(gl, type, data) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
        buffer.length = data.length;
        buffer.glType = getGLTypeFromArray(data);
        return buffer;
    };

    webgl.getGLBufferFromXflowDataEntry = function(xflowDataEntry, context, elementBuffer){
        var webglData = context.getXflowEntryWebGlData(xflowDataEntry);
        var buffer = webglData.buffer;
        var gl = context.gl;
        switch (webglData.changed) {
            case Xflow.DATA_ENTRY_STATE.CHANGED_VALUE:
                var bufferType = elementBuffer ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;

                gl.bindBuffer(bufferType, buffer);
                gl.bufferSubData(bufferType, 0, xflowDataEntry.getValue());
                break;
            case Xflow.DATA_ENTRY_STATE.CHANGED_NEW:
            case Xflow.DATA_ENTRY_STATE.CHANGED_SIZE:
                if (elementBuffer) {
                    buffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(xflowDataEntry.getValue()));
                } else {
                    buffer = createBuffer(gl, gl.ARRAY_BUFFER, xflowDataEntry.getValue());
                }
                buffer.tupleSize = xflowDataEntry.getTupleSize();
                webglData.buffer = buffer;
                break;
        }
        // Also write min and max values for elementBuffers
        if(webglData.changed && elementBuffer){
            var indexValue = xflowDataEntry.getValue();
            var minIndex = 100000000, maxIndex = 0;
            var i = indexValue.length;
            while(i--){
                minIndex = Math.min(minIndex, indexValue[i]);
                maxIndex = Math.max(maxIndex, indexValue[i]);
            }
            webglData.maxIndex = maxIndex;
            webglData.minIndex = minIndex;
        }

        webglData.changed = 0;
        return buffer;
    }

    var getGLTypeFromArray = function(array) {
        var GL = window.WebGLRenderingContext;
        if (array instanceof Int8Array)
            return GL.BYTE;
        if (array instanceof Uint8Array)
            return GL.UNSIGNED_BYTE;
        if (array instanceof Int16Array)
            return GL.SHORT;
        if (array instanceof Uint16Array)
            return GL.UNSIGNED_SHORT;
        if (array instanceof Int32Array)
            return GL.INT;
        if (array instanceof Uint32Array)
            return GL.UNSIGNED_INT;
        if (array instanceof Float32Array)
            return GL.FLOAT;
        return GL.FLOAT;
    };

    function convertToJSArray(value) {
        var jsArray = [value.length];
        for (var i=0; i<value.length; i++) {
            jsArray[i] = value[i];
        }
        return jsArray;
    }

    webgl.getGLUniformValueFromXflowDataEntry = function(xflowDataEntry, context){
        var value;
        if(xflowDataEntry.type == Xflow.DATA_TYPE.TEXTURE){
            var gl = context.gl;
            var webglData = context.getXflowEntryWebGlData(xflowDataEntry);
            var texture = webglData.texture || new XML3D.webgl.GLTexture(gl);
            if(webglData.changed)
                texture.updateFromTextureEntry(xflowDataEntry);

            webglData.texture = texture;
            webglData.changed = 0;
            value = texture;
        }
        else if(xflowDataEntry.type == Xflow.DATA_TYPE.BOOL)
            //TODO Can we get Xflow to return boolean arrays as normal JS arrays? WebGL doesn't accept Uint8Arrays here...
            //TODO Alternatively we could set boolean uniforms using uniform1fv together with Float32Arrays, which apparently works too
            value = convertToJSArray(xflowDataEntry.getValue());
        else
            value = xflowDataEntry.getValue();

        return value;
    };


    /**
     * Convert the given y-coordinate on the canvas to a y-coordinate appropriate in
     * the GL context. The y-coordinate gets turned upside-down. The lowest possible
     * canvas coordinate is 0, so we need to subtract 1 from the height, too.
     *
     * @param {HTMLCanvasElement} canvas
     * @param {number} y
     * @return {number} the converted y-coordinate
     */
    webgl.canvasToGlY = function(canvas, y) {
        return canvas.height - y - 1;
    }

    webgl.FRAGMENT_HEADER = [
        "#ifdef GL_FRAGMENT_PRECISION_HIGH",
        "precision highp float;",
        "#else",
        "precision mediump float;",
        "#endif // GL_FRAGMENT_PRECISION_HIGH",
        "\n"
    ].join("\n");

    webgl.addFragmentShaderHeader = function(fragmentShaderSource) {
        return webgl.FRAGMENT_HEADER + fragmentShaderSource;
    };

    /**
     * Set uniforms for active program
     * @param gl
     * @param u
     * @param value
     * @param {boolean=} transposed
     */
    webgl.setUniform = function(gl, u, value, transposed) {

        switch (u.glType) {
            case 35670: //gl.BOOL
            case 5124:  //gl.INT
            case 35678: //gl.SAMPLER_2D
                if (value.length !== undefined) {
                    gl.uniform1iv(u.location, value);
                } else {
                    gl.uniform1i(u.location, value);
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
                    gl.uniform1fv(u.location, value);
                else
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
    };

})(XML3D.webgl);
