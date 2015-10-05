var GL = require("../constants.js");

/**
 *
 * @param context
 * @constructor
 */
var GLMesh = function (context) {
    this.context = context;
    this.buffers = {};
    this.uniformOverride = {};
    this.minIndex = 0;
    this.maxIndex = 0;
    this.isIndexed = false;
    this.vertexCount = null;
    this.minAttributeCount = -1;
    this.context.getStatistics().meshes++;
    this.glType = null;
    this.multiDraw = false;
};

XML3D.extend(GLMesh.prototype, {
    setIndexRange: function (minIndex, maxIndex) {
        this.minIndex = minIndex;
        this.maxIndex = maxIndex;
    },

    setPrimitiveType: function(type) {
        this.glType = type;
        this.multiDraw = (this.glType == GL.LINE_STRIP || this.glType == GL.TRIANGLE_STRIP);
    },

    checkBufferCompatible: function (name, xflowDataBuffer) {
        var cnt = xflowDataBuffer.getIterateCount();
        this.minAttributeCount = (this.minAttributeCount == -1 ? cnt : Math.min(this.minAttributeCount, cnt));

        if (this.isIndexed) {
            if (cnt <= this.maxIndex) {
                throw new Error("Index range of [" + this.minIndex + ", " + this.maxIndex + "] " + " goes beyond element count " + cnt + " of attribute '" + name + "'");
            }
        } else if (this.vertexCount !== null) {
            if (cnt < this.vertexCount)
                throw new Error("VertexCount " + this.vertexCount + " is larger than element count " + cnt + " of attribute '" + name + "'");
        }
    },

    removeBuffer: function (name) {
        delete this.buffers[name];
    },

    setBuffer: function (name, buffer) {
        this.buffers[name] = buffer;
        this.isIndexed = this.isIndexed || name == "index";
    },

    clear: function () {
        this.buffers = {};
        this.uniformOverride = {};
        this.minIndex = this.maxIndex = 0;
        this.isIndexed = false;
        this.minAttributeCount = -1;
    },

    setUniformOverride: function (name, value) {
        if (value === undefined)
            delete this.uniformOverride[name];
        this.uniformOverride[name] = value;
    },

    setVertexCount: function (vertexCount) {
        this.vertexCount = vertexCount;
    },

    isReadyToRender: function () {
        return this.minAttributeCount > 0;
    },

    /**
     * @returns {number}
     */
    getElementCount: function () {
        try {
            return this.buffers.index.length;
        } catch (e) {
            //XML3D.debug.logError("Could not calculate element count.", e);
            return 0;
        }
    }, /**
     * @returns {number}
     */
    getVertexCount: function () {
        try {
            return (this.vertexCount != null ? this.vertexCount : this.minAttributeCount );
        } catch (e) {
            //XML3D.debug.logError("Could not calculate vertex count.", e);
            return 0;
        }
    },

    /**
     * @param {AbstractShaderClosure} program
     * @private
     */
    _bindVertexBuffers: function(program) {
        var gl = this.context.gl, sAttributes = program.attributes, buffers = this.buffers, i, name;

        var keys = Object.keys(sAttributes);
        var keyLength = keys.length;

        for (i = 0; i < keyLength; i++) {
            name = keys[i];
            var buffer = buffers[name];
            var location = sAttributes[name].location;

            if (!buffer) {
                continue;
            }
            gl.enableVertexAttribArray(location);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(location, buffer.tupleSize, buffer.glType, false, 0, 0);
        }
    },

    _unbindVertexBuffers: function (program) {
        var gl = this.context.gl, sAttributes = program.attributes;
        for (var name in sAttributes) {
            var shaderAttribute = sAttributes[name];
            gl.disableVertexAttribArray(shaderAttribute.location);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    },

    /**
     * @param {AbstractShaderClosure} program
     * @returns {number}
     */
    draw: function (program) {
        var gl = this.context.gl, sAttributes = program.attributes, buffers = this.buffers, triCount = 0, offset, j;

        //Bind vertex buffers
        this._bindVertexBuffers(program);

        //Draw the object
        if (this.isIndexed) {
            var indexBuffer = buffers.index;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);

            if (this.multiDraw && this.vertexCount) {
                offset = 0;
                for (j = 0; j < this.vertexCount.length; j++) {
                    var count = this.vertexCount[j];
                    gl.drawElements(this.glType, count, indexBuffer.glType, offset * indexBuffer.bytesPerElement);
                    offset += count;
                }
            } else {
                gl.drawElements(this.glType, this.getElementCount(), indexBuffer.glType, 0);
            }
            triCount = this.getElementCount() / 3;
        } else { // not indexed
            if (this.multiDraw && this.vertexCount) {
                offset = 0;
                for (j = 0; j < this.vertexCount.length; j++) {
                    var count = this.vertexCount[j];
                    gl.drawArrays(this.glType, offset, count);
                    offset += count;
                }
            } else {
                gl.drawArrays(this.glType, 0, this.getVertexCount());
                triCount = this.getVertexCount();
            }
        }

        //Unbind vertex buffers
        this._unbindVertexBuffers(program);


        if (program.undoUniformVariableOverride)
            program.undoUniformVariableOverride(this.uniformOverride);

        return triCount;
    }


});

module.exports = GLMesh;
