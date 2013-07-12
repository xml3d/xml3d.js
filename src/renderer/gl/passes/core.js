(function (webgl) {

    webgl.CoreRenderer = {
        /**
         * @param {XML3D.webgl.GLContext} context
         * @param {XML3D.webgl.GLProgramObject} shader
         * @param {MeshInfo} meshInfo
         * @return {*}
         */
        drawObject: function (gl, shader, meshInfo) {
            var sAttributes = shader.attributes,
                triCount = 0,
                vbos = meshInfo.vbos;

            if (!meshInfo.complete)
                return;

            var numBins = meshInfo.isIndexed ? vbos.index.length : (vbos.position ? vbos.position.length : 1);

            for (var i = 0; i < numBins; i++) {
                //Bind vertex buffers
                for (var name in sAttributes) {
                    var shaderAttribute = sAttributes[name];

                    if (!vbos[name]) {
                        //XML3D.debug.logWarning("Missing required mesh data [ "+name+" ], the object may not render correctly.");
                        continue;
                    }

                    var vbo;
                    if (vbos[name].length > 1)
                        vbo = vbos[name][i];
                    else
                        vbo = vbos[name][0];

                    //console.log("bindBuffer: ", name , vbo);
                    gl.enableVertexAttribArray(shaderAttribute.location);
                    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
                    gl.vertexAttribPointer(shaderAttribute.location, vbo.tupleSize, vbo.glType, false, 0, 0);
                }

                //Draw the object
                if (meshInfo.isIndexed) {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbos.index[i]);

                    if (meshInfo.segments) {
                        //This is a segmented mesh (eg. a collection of disjunct line strips)
                        var offset = 0;
                        var sd = meshInfo.segments.value;
                        for (var j = 0; j < sd.length; j++) {
                            gl.drawElements(meshInfo.glType, sd[j], gl.UNSIGNED_SHORT, offset);
                            offset += sd[j] * 2; //GL size for UNSIGNED_SHORT is 2 bytes
                        }
                    } else {
                        gl.drawElements(meshInfo.glType, meshInfo.getElementCount(), gl.UNSIGNED_SHORT, 0);
                    }

                    triCount = meshInfo.getElementCount() / 3;
                } else {
                    if (meshInfo.size) {
                        var offset = 0;
                        var sd = meshInfo.size.data;
                        for (var j = 0; j < sd.length; j++) {
                            gl.drawArrays(meshInfo.glType, offset, sd[j]);
                            offset += sd[j] * 2; //GL size for UNSIGNED_SHORT is 2 bytes
                        }
                    } else {
                        // console.log("drawArrays: " + meshInfo.getVertexCount());
                        gl.drawArrays(meshInfo.glType, 0, meshInfo.getVertexCount());
                    }
                    triCount = vbos.position ? vbos.position[i].length / 3 : 0;
                }

                //Unbind vertex buffers
                for (var name in sAttributes) {
                    var shaderAttribute = sAttributes[name];

                    gl.disableVertexAttribArray(shaderAttribute.location);
                }
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            return triCount;
        }
    };


}(XML3D.webgl));