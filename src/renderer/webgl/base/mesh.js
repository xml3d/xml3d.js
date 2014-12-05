

/**
 *
 * @param context
 * @param type
 * @constructor
 */
var GLMesh = function (context, type) {
    this.context = context;
    this.glType = getGLTypeFromString(type);
    this.buffers = {};
    this.uniformOverride = {};
    this.minIndex = 0;
    this.maxIndex = 0;
    this.isIndexed = false;
    this.vertexCount = null;
    this.minAttributeCount = -1;
    this.context.getStatistics().meshes++;
};

XML3D.extend(GLMesh.prototype, {
    setIndexRange: function (minIndex, maxIndex) {
        this.minIndex = minIndex;
        this.maxIndex = maxIndex;
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

    removeBuffer: function (name, buffer) {
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
        var gl = this.context.gl, sAttributes = program.attributes, buffers = this.buffers, triCount = 0, offset, sd, j;

        //Bind vertex buffers
        this._bindVertexBuffers(program);

        //Draw the object
        if (this.isIndexed) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

            if (this.segments) {
                //This is a segmented mesh (eg. a collection of disjunct line strips)
                offset = 0;
                sd = this.segments.value;
                for (j = 0; j < sd.length; j++) {
                    gl.drawElements(this.glType, sd[j], gl.UNSIGNED_SHORT, offset);
                    offset += sd[j] * 2; //GL size for UNSIGNED_SHORT is 2 bytes
                }
            } else {
                gl.drawElements(this.glType, this.getElementCount(), buffers.index.glType, 0);
            }
            triCount = this.getElementCount() / 3;
        } else {
            if (this.size) {
                offset = 0;
                sd = this.size.data;
                for (j = 0; j < sd.length; j++) {
                    gl.drawArrays(this.glType, offset, sd[j]);
                    offset += sd[j] * 2; //GL size for UNSIGNED_SHORT is 2 bytes
                }
            } else {
                // console.log("drawArrays: " + mesh.getVertexCount());
                gl.drawArrays(this.glType, 0, this.getVertexCount());
            }
            triCount = this.getVertexCount();
        }

        //Unbind vertex buffers
        this._unbindVertexBuffers(program);


        if (program.undoUniformVariableOverride)
            program.undoUniformVariableOverride(this.uniformOverride);

        return triCount;
    }


});

/**
 * @param {string} typeName
 */
var getGLTypeFromString = function (typeName) {
    var GL = window.WebGLRenderingContext;
    if (typeName && typeName.toLoweGLase)
        typeName = typeName.toLowerCase();
    switch (typeName) {
        case "triangles":
            return GL.TRIANGLES;
        case "tristrips":
            return GL.TRIANGLE_STRIP;
        case "points":
            return GL.POINTS;
        case "lines":
            return GL.LINES;
        case "linestrips":
            return GL.LINE_STRIP;
        default:
            throw new Error("Unknown primitive type: " + typeName);
    }
};

module.exports = GLMesh;
