var XC = require("../../../xflow/interface/constants.js");
var GL = require("../constants.js");

function convertToJSArray(value) {
    var jsArray = [value.length];
    for (var i = 0; i < value.length; i++) {
        jsArray[i] = value[i];
    }
    return jsArray;
}

/**
 * @param {GLContext} context
 * @param {Uint32Array} data
 * @param {number} maxIndex
 */
var createElementBuffer = function (context, data, maxIndex) {
    var gl = context.gl;
    var bufferData = data;
    var glType = GL.UNSIGNED_INT;

    if (maxIndex < (1 << 8)) {
        glType = GL.UNSIGNED_BYTE;
        bufferData = new Uint8Array(data);
    } else if (maxIndex < (1 << 16)) {
        glType = GL.UNSIGNED_SHORT;
        bufferData = new Uint16Array(data);
    } else if (!context.extensions["OES_element_index_uint"]) {
        XML3D.debug.logError("Trying to use index data with indices larger than 65535, but this is not supported on your platform. Indexing errors will occur.");
        glType = GL.UNSIGNED_SHORT;
        bufferData = new Uint16Array(data);
    }

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
    buffer.bytesPerElement = bufferData.BYTES_PER_ELEMENT;
    buffer.length = data.length;
    buffer.glType = glType;
    return buffer;
};

/**
 * @param {GLContext} context
 * @param {Object} data
 */
var createArrayBuffer = function (context, data) {
    var gl = context.gl;

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    buffer.length = data.length;
    buffer.glType = getGLTypeFromArray(data);
    return buffer;
};

var getGLTypeFromArray = function (array) {
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


module.exports = {
    getGLUniformValueFromXflowDataEntry: function (xflowDataEntry, context) {
        var value;
        if (!xflowDataEntry)
            return null;
        if (xflowDataEntry.type == XC.DATA_TYPE.TEXTURE) {
            var webglData = context.getXflowEntryWebGlData(xflowDataEntry);
            var texture = webglData.texture || context.createTexture();
            if (webglData.changed)
                texture.updateFromTextureEntry(xflowDataEntry);

            webglData.texture = texture;
            webglData.changed = 0;
            value = [texture];
        } else if (xflowDataEntry.type == XC.DATA_TYPE.BOOL) {
            //TODO Can we get Xflow to return boolean arrays as normal JS arrays? WebGL doesn't accept Uint8Arrays here...
            //TODO Alternatively we could set boolean uniforms using uniform1fv together with Float32Arrays, which apparently works too
            value = convertToJSArray(xflowDataEntry.getValue());
        } else {
            value = xflowDataEntry.getValue();
        }

        return value;
    },

    getGLBufferFromXflowDataEntry: function (xflowDataEntry, context, elementBuffer) {
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
            case XC.DATA_ENTRY_STATE.CHANGED_VALUE:
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
                            XML3D.debug.logError("Unknown GL type for element buffer: ", buffer.glType);
                            return null;
                    }
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
                    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, bufferData);
                } else {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, xflowDataEntry.getValue());
                }
                break;
            case XC.DATA_ENTRY_STATE.CHANGED_NEW:
            case XC.DATA_ENTRY_STATE.CHANGED_SIZE:
            case XC.DATA_ENTRY_STATE.CHANGED_SIZE_TYPE:
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
    },

    /**
     * Calculate bounding box from positions and optional indices
     * TODO: Remove FloatArray creation
     * @param {Float32Array} positions
     * @param {Int16Array|null} index
     * @returns {Float32Array}
     */
    calculateBoundingBox: function (positions, index) {
        var bbox = new XML3D.math.bbox.create(), i;

        if (!positions || positions.length < 3)
            return bbox;

        if (index) {
            var i0 = index[0] * 3;
            bbox[0] = positions[i0];
            bbox[1] = positions[i0 + 1];
            bbox[2] = positions[i0 + 2];
            bbox[3] = positions[i0];
            bbox[4] = positions[i0 + 1];
            bbox[5] = positions[i0 + 2];

            for (i = 1; i < index.length; i++) {
                var i1 = index[i] * 3;
                var p1 = positions[i1];
                var p2 = positions[i1 + 1];
                var p3 = positions[i1 + 2];

                if (p1 < bbox[0])
                    bbox[0] = p1;
                if (p2 < bbox[1])
                    bbox[1] = p2;
                if (p3 < bbox[2])
                    bbox[2] = p3;
                if (p1 > bbox[3])
                    bbox[3] = p1;
                if (p2 > bbox[4])
                    bbox[4] = p2;
                if (p3 > bbox[5])
                    bbox[5] = p3;
            }
        } else {
            bbox[0] = positions[0];
            bbox[1] = positions[1];
            bbox[2] = positions[2];
            bbox[3] = positions[0];
            bbox[4] = positions[1];
            bbox[5] = positions[2];

            for (i = 3; i < positions.length; i += 3) {
                if (positions[i] < bbox[0])
                    bbox[0] = positions[i];
                if (positions[i + 1] < bbox[1])
                    bbox[1] = positions[i + 1];
                if (positions[i + 2] < bbox[2])
                    bbox[2] = positions[i + 2];
                if (positions[i] > bbox[3])
                    bbox[3] = positions[i];
                if (positions[i + 1] > bbox[4])
                    bbox[4] = positions[i + 1];
                if (positions[i + 2] > bbox[5])
                    bbox[5] = positions[i + 2];
            }
        }
        return bbox;
    }
};
