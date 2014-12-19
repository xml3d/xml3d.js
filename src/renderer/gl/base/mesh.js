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
                throw new Error("Unknown primitive type: " + typeName);
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
        this.uniformOverride = {};
        this.minIndex = 0;
        this.maxIndex = 0;
        this.isIndexed = false;
        this.vertexCount = null;
        this.minAttributeCount = -1;
        this.context.getStatistics().meshes++;
        this.multiDraw = this.glType == WebGLRenderingContext.LINE_STRIP;
    };

    XML3D.extend(GLMesh.prototype, {
        setIndexRange: function(minIndex, maxIndex){
            this.minIndex = minIndex;
            this.maxIndex = maxIndex;
        },

        checkBufferCompatible: function(name, xflowDataBuffer){
            var cnt = xflowDataBuffer.getIterateCount();
            this.minAttributeCount = (this.minAttributeCount == -1 ? cnt : Math.min(this.minAttributeCount, cnt));

            if(this.isIndexed){
                if(cnt <= this.maxIndex){
                    throw new Error("Index range of [" + this.minIndex + ", " + this.maxIndex + "] " +
                        " goes beyond element count " + cnt + " of attribute '" + name + "'");
                }
            }
            else if(this.vertexCount !== null){
                if(cnt < this.vertexCount[0])
                    throw new Error("VertexCount " + this.vertexCount[0] +
                        " is larger than element count " + cnt + " of attribute '" + name + "'");
            }
        },
        removeBuffer: function(name){
            delete this.buffers[name];
        },

        setBuffer: function (name, buffer) {
            this.buffers[name] = buffer;
            this.isIndexed = this.isIndexed || name == "index";
        },
        clear: function(){
            this.buffers = {};
            this.uniformOverride = {};
            this.minIndex = this.maxIndex = 0;
            this.isIndexed = false;
            this.minAttributeCount = -1;
        },
        setUniformOverride: function (name, value) {
            if(value === undefined)
                delete this.uniformOverride[name];
            this.uniformOverride[name] = value;
        },
        setVertexCount: function (vertexCount) {
            this.vertexCount = vertexCount;
        },
        isReadyToRender: function(){
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
        },
        /**
         * @returns {number}
         */
        getVertexCount: function () {
            try {
                return (this.vertexCount != null ? this.vertexCount[0] : this.minAttributeCount );
            } catch (e) {
                //XML3D.debug.logError("Could not calculate vertex count.", e);
                return 0;
            }
        },
        /**
         * @param {XML3D.webgl.AbstractShaderClosure} program
         * @returns {number}
         */
        draw: function (program) {
            var gl = this.context.gl,
                sAttributes = program.attributes,
                buffers = this.buffers,
                triCount = 0, j = 0, offset = 0;

            var vertexAttributeNames = Object.keys(program.attributes);
            var enabledLocations = [];

            //Bind vertex buffers
            for (var i = 0; i < vertexAttributeNames.length; i++) {
                var shaderAttribute = sAttributes[vertexAttributeNames[i]];
                var buffer = buffers[vertexAttributeNames[i]];
                if (!buffer) {
                    continue;
                }
                var location = shaderAttribute.location;
                gl.enableVertexAttribArray(location);
                enabledLocations.push(location);

                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.vertexAttribPointer(shaderAttribute.location, buffer.tupleSize, buffer.glType, false, 0, 0);
            }




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
            for (i = 0; i < enabledLocations.length; i++) {
                gl.disableVertexAttribArray(enabledLocations[i]);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            if(program.undoUniformVariableOverride)
                program.undoUniformVariableOverride(this.uniformOverride);

            return triCount;
        }


    });

    webgl.GLMesh = GLMesh;


}(XML3D.webgl));
