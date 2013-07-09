// Utility functions
(function() {

    XML3D.webgl.checkError = function(gl, text)
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

    XML3D.webgl.BoundingBox = function() {
        this.min = new Float32Array(3);
        this.max = new Float32Array(3);
        this.getAsXML3DBox = function() {
            return new window.XML3DBox(this.min, this.max);
        };
        this.extend = function(that) {
            if(that.min[0] < this.min[0])
                this.min[0] = that.min[0];
            if(that.min[1] < this.min[1])
                this.min[1] = that.min[1];
            if(that.min[2] < this.min[2])
                this.min[2] = that.min[2];

            if(that.max[0] > this.max[0])
                this.max[0] = that.max[0];
            if(that.max[1] > this.max[1])
                this.max[1] = that.max[1];
            if(that.max[2] > this.max[2])
                this.max[2] = that.max[2];
        };
        this.makeAxisAligned = (function() {
            var absMat = XML3D.math.mat4.create();
            return function(mat) {
                if (this.isEmpty())
                    return;

                var center = XML3D.math.vec3.scale(XML3D.math.vec3.create(), XML3D.math.vec3.add(XML3D.math.vec3.create(), this.min, this.max), 0.5);
                var extend = XML3D.math.vec3.scale(XML3D.math.vec3.create(), XML3D.math.vec3.subtract(XML3D.math.vec3.create(), this.max, this.min), 0.5);

                XML3D.math.mat4.copy(absMat, mat);
                absMat.set([0, 0, 0, 1], 12);
                for ( var i = 0; i < 16; i++) {
                    absMat[i] = Math.abs(absMat[i]);
                }

                XML3D.math.vec3.transformMat4(extend, extend, absMat);
                XML3D.math.vec3.transformMat4(center, center, mat);

                XML3D.math.vec3.add(this.max, center, extend);
                XML3D.math.vec3.subtract(this.min, center, extend);
            }
        })();

        this.reset = function() {
            this.min[0] = Number.MAX_VALUE; this.min[1] = Number.MAX_VALUE; this.min[2] = Number.MAX_VALUE;
            this.max[0] = -Number.MAX_VALUE; this.max[1] = -Number.MAX_VALUE; this.max[2] = -Number.MAX_VALUE;
        };

        this.isEmpty = function() {
            return (this.min[0] > this.max[0] || this.min[1] > this.max[1] || this.min[2] > this.max[2]);
        };

        this.reset();
    };

    XML3D.webgl.calculateBoundingBox = function(positions, index) {
        var bbox = new XML3D.webgl.BoundingBox();
        var min = bbox.min;
        var max = bbox.max;

        if (!positions || positions.length < 3)
            return bbox;

        if (index) {
            var i0 = index[0]*3;
            min[0] = positions[i0];
            min[1] = positions[i0 + 1];
            min[2] = positions[i0 + 2];
            max[0] = positions[i0];
            max[1] = positions[i0 + 1];
            max[2] = positions[i0 + 2];

            for ( var i = 1; i < index.length; i++) {
                var i1 = index[i] * 3;
                var p1 = positions[i1];
                var p2 = positions[i1 + 1];
                var p3 = positions[i1 + 2];

                if (p1 < min[0])
                    min[0] = p1;
                if (p2 < min[1])
                    min[1] = p2;
                if (p3 < min[2])
                    min[2] = p3;
                if (p1 > max[0])
                    max[0] = p1;
                if (p2 > max[1])
                    max[1] = p2;
                if (p3 > max[2])
                    max[2] = p3;
            }
        } else {
            min[0] = positions[0];
            min[1] = positions[1];
            min[2] = positions[2];
            max[0] = positions[0];
            max[1] = positions[1];
            max[2] = positions[2];

            for ( var i = 3; i < positions.length; i += 3) {
                if (positions[i] < min[0])
                    min[0] = positions[i];
                if (positions[i + 1] < min[1])
                    min[1] = positions[i + 1];
                if (positions[i + 2] < min[2])
                    min[2] = positions[i + 2];
                if (positions[i] > max[0])
                    max[0] = positions[i];
                if (positions[i + 1] > max[1])
                    max[1] = positions[i + 1];
                if (positions[i + 2] > max[2])
                    max[2] = positions[i + 2];
            }
        }
        return bbox;
    };

    var absMat = XML3D.math.mat4.create();

    XML3D.webgl.transformAABB = function(bbox, gmatrix) {
        if (bbox.isEmpty())
            return;

        var min = bbox.min._data;
        var max = bbox.max._data;

        var center = XML3D.math.vec3.scale(XML3D.math.vec3.create(), XML3D.math.vec3.add(XML3D.math.vec3.create(), min, max), 0.5);
        var extend = XML3D.math.vec3.scale(XML3D.math.vec3.create(), XML3D.math.vec3.subtract(XML3D.math.vec3.create(), max, min), 0.5);

        XML3D.math.mat4.copy(absMat, gmatrix);
        absMat.set([0, 0, 0, 1], 12)
        for ( var i = 0; i < 16; i++) {
            absMat[i] = Math.abs(absMat[i]);
        }

        XML3D.math.vec3.transformMat4(extend, extend, absMat);
        XML3D.math.vec3.transformMat4(center, center, gmatrix);

        XML3D.math.vec3.add(bbox.max._data, center, extend);
        XML3D.math.vec3.subtract(bbox.min._data, center, extend);
    };

    /**
     * Splits mesh data into smaller chunks. WebGL only supports 65,535 indices, meshes of greater size are
     * automatically split by this function. Supports splitting indices, positions, texcoords and colors.
     * NOTE: The dataTable parameter is modified to hold the newly split mesh data.
     *
     * @param dataTable the source data table to be split
     * @param maxIndexCount the desired chunk size
     * @return
     */
    XML3D.webgl.splitMesh = function(dataTable, maxIndexCount) {
        var verticesPerPolygon = 3;
        var colorStride = 3;
        maxIndexCount = Math.floor(maxIndexCount / 3) * 3;

        //See which data is in the supplied dataTable
        var positionSource = dataTable.position.data;
        var indexSource = dataTable.index ? dataTable.index.data : undefined;
        var normalSource = dataTable.normal ? dataTable.normal.data : undefined;
        var texcoordSource = dataTable.texcoord ? dataTable.texcoord.data : undefined;
        var colorSource = dataTable.color ? dataTable.color.data : undefined;

        var vertexStride = dataTable.position.tupleSize;
        var texcoordStride = dataTable.texcoord ? dataTable.texcoord.tupleSize : undefined;
        var currentIndexSize = indexSource.length;

        if (indexSource) {
            var boundaryList = [];

            var lastBinSize = currentIndexSize % maxIndexCount;
            var numBins = Math.ceil(currentIndexSize / maxIndexCount);
            var bins = new Array();

            //Create the bins
            for (var i = 0; i < numBins; i++) {
                bins[i] = {};
                bins[i].index = new Uint16Array(maxIndexCount);
                bins[i].index.nextFreeSlot = 0;
                bins[i].position = new Float32Array(maxIndexCount*vertexStride);

                if (normalSource)
                    bins[i].normal = new Float32Array(maxIndexCount*vertexStride);
                if (texcoordSource)
                    bins[i].texcoord = new Float32Array(maxIndexCount*texcoordStride);
                if (colorSource)
                    bins[i].color = new Float32Array(maxIndexCount*colorStride);
            }

            //Iterate over the index buffer and sort the polygons into bins
            for (var i = 0; i < indexSource.length; i += verticesPerPolygon) {
                var consistentBin = true;
                var targetBin = Math.floor(indexSource[i] / maxIndexCount);

                if (bins[targetBin].index.nextFreeSlot + verticesPerPolygon > maxIndexCount)
                    consistentBin = false;

                //See if this polygon spans more than one bin
                for (j = 1; j < verticesPerPolygon; j++) {
                    if (Math.floor(indexSource[i + j] / maxIndexCount) != targetBin) {
                        consistentBin = false;
                        break;
                    }
                }

                //We need to place this polygon in a separate pass
                if (!consistentBin) {
                    boundaryList.push(i);
                    continue;
                }

                var indexTransform = maxIndexCount * targetBin;

                //Distribute the indices and vertex data into the appropriate bin
                for (var j = 0; j < verticesPerPolygon; j++) {
                    var oldIndex = indexSource[i+j];
                    var newIndex = oldIndex - indexTransform;

                    var bin = bins[targetBin];
                    bin.index[bin.index.nextFreeSlot] = newIndex;
                    bin.index.nextFreeSlot++;

                    var vertIndex = oldIndex * vertexStride;
                    var position = [];
                    for (var k = 0; k < vertexStride; k++) {
                        position[k] = positionSource[vertIndex+k];
                    }
                    bin.position.set(position, newIndex*vertexStride);

                    if(normalSource) {
                        var normal = [];
                        for (var k = 0; k < vertexStride; k++) {
                            normal[k] = normalSource[vertIndex+k];
                        }
                        bin.normal.set(normal, newIndex*vertexStride);
                    }

                    var texIndex = oldIndex * texcoordStride;
                    if (texcoordSource) {
                        var texcoord = [];
                        for (var k = 0; k < texcoordStride; k++) {
                            texcoord[k] = texcoordSource[texIndex+k];
                        }
                        bin.texcoord.set(texcoord, newIndex*texcoordStride);
                    }

                    if(colorSource) {
                        var color = [];
                        for (var k = 0; k < colorStride; k++) {
                            color[k] = colorSource[vertIndex+k];
                        }
                        bin.color.set(color, newIndex*colorStride);
                    }

                }
            }

            //Insert boundary items into bins
            var targetBin = 0;
            for (var i = 0; i < boundaryList.length; i++) {
                while(bins[targetBin].index.nextFreeSlot + verticesPerPolygon > maxIndexCount) {
                    targetBin++;
                    if (targetBin >= bins.length) {
                        //We need to create a new bin
                        bins[targetBin] = {};
                        bins[targetBin].index = new Uint16Array(maxIndexCount);
                        bins[targetBin].index.nextFreeSlot = 0;
                        bins[targetBin].position = new Float32Array(maxIndexCount*vertexStride);

                        if (normalSource)
                            bins[targetBin].normal = new Float32Array(maxIndexCount*vertexStride);
                        if (texcoordSource)
                            bins[targetBin].texcoord = new Float32Array(maxIndexCount*texcoordStride);
                        if (colorSource)
                            bins[targetBin].color = new Float32Array(maxIndexCount*colorStride);
                        break;
                    }
                }

                //Distribute polygon into the appropriate bin
                for (var j = 0; j < verticesPerPolygon; j++) {
                    var bin = bins[targetBin];

                    var oldIndex = indexSource[boundaryList[i] + j];
                    var newIndex = bin.index.nextFreeSlot;

                    bin.index[newIndex] = newIndex;
                    bin.index.nextFreeSlot++;

                    var position = [];
                    for (var k = 0; k < vertexStride; k++) {
                        position[k] = positionSource[oldIndex*vertexStride+k];
                    }
                    bin.position.set(position, newIndex*vertexStride);

                    if(normalSource) {
                        var normal = [];
                        for (var k = 0; k < vertexStride; k++) {
                            normal[k] = normalSource[oldIndex*vertexStride+k];
                        }
                        bin.normal.set(normal, newIndex*vertexStride);
                    }

                    if (texcoordSource) {
                        var texcoord = [];
                        for (var k = 0; k < texcoordStride; k++) {
                            texcoord[k] = texcoordSource[oldIndex*texcoordStride+k];
                        }
                        bin.texcoord.set(texcoord, newIndex*texcoordStride);
                    }

                    if(colorSource) {
                        var color = [];
                        for (var k = 0; k < vertexStride; k++) {
                            color[k] = colorSource[oldIndex*colorStride+k];
                        }
                        bin.color.set(color, newIndex*colorStride);
                    }

                }
            }

            //Prepare dataTable for the split mesh data
            dataTable.index = [];
            dataTable.position = [];
            if (normalSource)
                dataTable.normal = [];
            if (texcoordSource)
                dataTable.texcoord = [];
            if (colorSource)
                dataTable.color = [];

            //Populate the dataTable with the bins
            for (var i = 0; i < bins.length; i++) {
                if (bins[i].index.nextFreeSlot > 0) {
                    dataTable.index[i] = { data : bins[i].index, tupleSize : vertexStride };
                    dataTable.position[i] = { data : bins[i].position, tupleSize : vertexStride };
                    if (normalSource)
                        dataTable.normal[i] = { data : bins[i].normal, tupleSize : vertexStride };
                    if (texcoordSource)
                        dataTable.texcoord[i] = { data : bins[i].texcoord, tupleSize : texcoordStride };
                    if (colorSource)
                        dataTable.color[i] = { data : bins[i].color, tupleSize : colorStride };
                }
            }

        }


    };

    /** for every component of v1 and v2 applies f, i.e. f(v1[.],v2[.]),
     *  and returns it.
     *
     *  @param {vec3} v1
     *  @param {vec3} v2
     *  @param {function(number, number):number} f
     *  @return {vec3} the mapped vector
     */
    function mapVec(v1, v2, f)
    {
        var vec = XML3D.math.vec3.create();
        vec[0] = f(v1[0], v2[0]);
        vec[1] = f(v1[1], v2[1]);
        vec[2] = f(v1[2], v2[2]);

        return vec;
    };

    /**
     * @param {XML3D.webgl.BoundingBox} bbox
     * @param {vec3} min
     * @param {vec3} max
     * @param {mat4} trafo
     */
    XML3D.webgl.adjustMinMax = function(bbox, min, max, trafo) {
        var xfmmin = XML3D.math.vec3.create();
        var xfmmax = XML3D.math.vec3.create();
        XML3D.math.vec3.transformMat4(xfmmin, bbox.min, trafo);
        XML3D.math.vec3.transformMat4(xfmmax, bbox.max, trafo);

        /* bounding box is axis-aligned, but through transformation
         * min and max values might be shuffled (image e.g. a rotation (0, 1, 0, 1.57),
         * here min's and max' x and z values are swapped). So we
         * order them now.
         */
        var bbmin = mapVec(xfmmin, xfmmax, Math.min);
        var bbmax = mapVec(xfmmin, xfmmax, Math.max);

        if (bbmin[0] < min[0])
            min[0] = bbmin[0];
        if (bbmin[1] < min[1])
            min[1] = bbmin[1];
        if (bbmin[2] < min[2])
            min[2] = bbmin[2];
        if (bbmax[0] > max[0])
            max[0] = bbmax[0];
        if (bbmax[1] > max[1])
            max[1] = bbmax[1];
        if (bbmax[2] > max[2])
            max[2] = bbmax[2];
    };

    /** Calculate the offset of the given element and return it.
     *
     *  @param {Object} element
     *  @return {{top:number, left:number}} the offset
     *
     *  This code is taken from http://javascript.info/tutorial/coordinates .
     *  We don't want to do it with the offsetParent way, because the xml3d
     *  element is actually invisible and thus offsetParent will return null
     *  at least in WebKit. Also it's slow. So we use getBoundingClientRect().
     *  However it returns the box relative to the window, not the document.
     *  Thus, we need to incorporate the scroll factor. And because IE is so
     *  awesome some workarounds have to be done and the code gets complicated.
     */
    function calculateOffset(element)
    {
        var box = element.getBoundingClientRect();
        var body = document.body;
        var docElem = document.documentElement;

        // get scroll factor (every browser except IE supports page offsets)
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

        // the document (`html` or `body`) can be shifted from left-upper corner in IE. Get the shift.
        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;

        var top  = box.top +  scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;

        // for Firefox an additional rounding is sometimes required
        return {top: Math.round(top), left: Math.round(left)};
    }

    /** Convert a given mouse page position to be relative to the given target element.
     *  Most probably the page position are the MouseEvent's pageX and pageY attributes.
     *
     *  @param {!Object} xml3dEl the xml3d element to which the coords need to be translated
     *  @param {!number} pageX the x-coordinate relative to the page
     *  @param {!number} pageY the y-coordinate relative to the page
     *  @return {{x: number, y: number}} the converted coordinates
     */
    XML3D.webgl.convertPageCoords = function(xml3dEl, pageX, pageY)
    {
        var off = calculateOffset(xml3dEl);

        return {x: pageX - off.left, y: pageY - off.top};
    };

})();
