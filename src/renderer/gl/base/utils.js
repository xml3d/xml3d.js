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
     * @param {GLContext} context
     * @param {Uint32Array} data
     * @param {number} maxIndex
     */
    var createElementBuffer = function(context, data, maxIndex) {
        var gl = context.gl;
        var bufferData = data;
        var glType = gl.UNSIGNED_INT;

        if(maxIndex < (1 << 8)) {
            glType = gl.UNSIGNED_BYTE;
            bufferData = new Uint8Array(data);
        } else if (maxIndex < (1 << 16)) {
            glType = gl.UNSIGNED_SHORT;
            bufferData = new Uint16Array(data);
        } else if (!context.extensions[webgl.GLContext.EXTENSIONS.UINT32_INDICES]) {
            XML3D.debug.logError("Trying to use index data with indices larger than 65535, but this is not supported on your platform. Indexing errors will occur.");
            glType = gl.UNSIGNED_SHORT;
            bufferData = new Uint16Array(data);
        }

        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
        buffer.length = data.length;
        buffer.glType = glType;
        return buffer;
    };

    /**
     * @param {GLContext} context
     * @param {Object} data
     */
    var createArrayBuffer = function(context, data) {
        var gl = context.gl;

        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        buffer.length = data.length;
        buffer.glType = getGLTypeFromArray(data);
        return buffer;
    };

    webgl.getGLBufferFromXflowDataEntry = function(xflowDataEntry, context, elementBuffer){
        var webglData = context.getXflowEntryWebGlData(xflowDataEntry);
        var buffer = webglData.buffer;
        var gl = context.gl;

        // Also write min and max values for elementBuffers
        if (webglData.changed && elementBuffer) {
            var indexValue = xflowDataEntry.getValue();
            var minIndex = 100000000, maxIndex = 0;
            var i = indexValue.length;
            while (i--) {
                minIndex = Math.min(minIndex, indexValue[i]);
                maxIndex = Math.max(maxIndex, indexValue[i]);
            }
            webglData.maxIndex = maxIndex;
            webglData.minIndex = minIndex;
        }

        //noinspection FallthroughInSwitchStatementJS
        switch (webglData.changed) {
            case Xflow.DATA_ENTRY_STATE.CHANGED_VALUE:
                if (elementBuffer) {
                    var bufferData = xflowDataEntry.getValue();
                    switch (buffer.glType) {
                        case gl.UNSIGNED_BYTE:
                            bufferData = new Uint8Array(bufferData);
                            break;
                        case gl.UNSIGNED_SHORT:
                            bufferData = new Uint16Array(bufferData);
                            break;
                        case gl.UNSIGNED_INT:
                            // This is what we expect anyway
                            break;
                        default:
                            XML3D.debug.logError("Uknown GL type for element buffer: ", buffer.glType);
                            return null;
                    }
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
                    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, bufferData);
                } else {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, xflowDataEntry.getValue());
                }
                break;
            case Xflow.DATA_ENTRY_STATE.CHANGED_NEW:
            case Xflow.DATA_ENTRY_STATE.CHANGED_SIZE:
            case Xflow.DATA_ENTRY_STATE.CHANGED_SIZE_TYPE:
                if (elementBuffer) {
                    buffer = createElementBuffer(context, xflowDataEntry.getValue(), webglData.maxIndex);
                } else {
                    buffer = createArrayBuffer(context, xflowDataEntry.getValue());
                }
                buffer.tupleSize = xflowDataEntry.getTupleSize();
                webglData.buffer = buffer;
                break;
        }

        webglData.changed = 0;
        return buffer;
    };

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


})(XML3D.webgl);
