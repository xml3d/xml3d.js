(function (webgl) {

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
                return GL.TRIANGLES;
        }
    };

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
        this.isIndexed = false;
        this.vertexCount = null;
    };

    XML3D.extend(GLMesh.prototype, {
        setBuffer: function (name, buffer) {
            this.buffers[name] = buffer;
            this.isIndexed = this.isIndexed || name == "index";
        },
        setComplete: function (complete) {
            this.complete = complete;
        },
        setVertexCount: function (vertexCount) {
            this.vertexCount = vertexCount;
        },
        /**
         * @returns {number}
         */
        getElementCount: function () {
            try {
                return this.buffers.index.length;
            } catch (e) {
                XML3D.debug.logError("Could not calculate element count.", e);
                return 0;
            }
        },
        /**
         * @returns {number}
         */
        getVertexCount: function () {
            try {
                return (this.vertexCount != null ? this.vertexCount : this.buffers.position.length / 3);
            } catch (e) {
                XML3D.debug.logError("Could not calculate vertex count.", e);
                return 0;
            }
        },
        /**
         * @param {XML3D.webgl.GLProgram} program
         * @returns {number}
         */
        draw: function (program) {
            var gl = this.context.gl,
                sAttributes = program.attributes,
                buffers = this.buffers,
                triCount = 0;

            if (!this.complete)
                return 0;

            //Bind vertex buffers
            for (var name in sAttributes) {
                var shaderAttribute = sAttributes[name];
                var buffer = buffers[name];
                if (!buffer) {
                    continue;
                }
                gl.enableVertexAttribArray(shaderAttribute.location);
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.vertexAttribPointer(shaderAttribute.location, buffer.tupleSize, buffer.glType, false, 0, 0);
            }

            //Draw the object
            if (this.isIndexed) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

                if (this.segments) {
                    //This is a segmented mesh (eg. a collection of disjunct line strips)
                    var offset = 0;
                    var sd = this.segments.value;
                    for (var j = 0; j < sd.length; j++) {
                        gl.drawElements(this.glType, sd[j], gl.UNSIGNED_SHORT, offset);
                        offset += sd[j] * 2; //GL size for UNSIGNED_SHORT is 2 bytes
                    }
                } else {
                    gl.drawElements(this.glType, this.getElementCount(), gl.UNSIGNED_SHORT, 0);
                }
                triCount = this.getElementCount() / 3;
            } else {
                if (this.size) {
                    var offset = 0;
                    var sd = this.size.data;
                    for (var j = 0; j < sd.length; j++) {
                        gl.drawArrays(this.glType, offset, sd[j]);
                        offset += sd[j] * 2; //GL size for UNSIGNED_SHORT is 2 bytes
                    }
                } else {
                    // console.log("drawArrays: " + mesh.getVertexCount());
                    gl.drawArrays(this.glType, 0, this.getVertexCount());
                }
                triCount = buffers.position ? buffers.position.length / 3 : 0;
            }

            //Unbind vertex buffers
            for (var name in sAttributes) {
                var shaderAttribute = sAttributes[name];
                gl.disableVertexAttribArray(shaderAttribute.location);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            return triCount;
        }


    });

    webgl.GLMesh = GLMesh;


}(XML3D.webgl));