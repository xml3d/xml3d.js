

org.xml3d.webgl.XML3DMeshManager = function(gl, renderer, dataFactory, factory) {
	this.gl = gl;
	this.renderer = renderer;
	this.dataFactory = dataFactory;
	this.factory = factory;
	this.meshes = {}; 
};

org.xml3d.webgl.XML3DMeshManager.prototype.createMesh = function(meshNode) {
	//TODO: cache mesh data to support 'instances' --> better performance/storage
	// For now each mesh gets its own set of vertex buffers and such, even if there are 
	// many meshes in the scene that use the exact same set of data (instances)
	
	var adapter = this.factory.getAdapter(meshNode);
	var dataAdapter = adapter.dataAdapter;
	var dataTable = dataAdapter.createDataTable();
	var gl = this.gl;
	
	var meshInfo = {};
	meshInfo.vbos = {};
	
	var type = meshNode.getAttribute("type");
	meshInfo.glType = this.getGLTypeFromString(gl, type);

	if (dataTable.index) {			
		if (dataTable.position.data.length / 3 > org.xml3d.webgl.MAX_MESH_INDEX_COUNT) {
			this.splitMesh(dataTable, org.xml3d.webgl.MAX_MESH_INDEX_COUNT);
		} 
		
		if (dataTable.index.length > 0) {
			var numIndexBins = dataTable.index.length;
			meshInfo.vbos.index = [];
			for (var i = 0; i < numIndexBins; i++) {
				var mIndices = new Uint16Array(dataTable.index[i].data);
				var indexBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mIndices, gl.STATIC_DRAW);
				
				indexBuffer.length = mIndices.length;
				indexBuffer.tupleSize = dataTable.index[i].tupleSize;
				indexBuffer.glType = this.getGLTypeFromArray(gl, mIndices);
					
				meshInfo.vbos.index[i] = indexBuffer;
				meshInfo.isIndexed = true;	
			}
		} else {
			var mIndices = new Uint16Array(dataTable.index.data);
			var indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mIndices, gl.STATIC_DRAW);
			
			indexBuffer.length = mIndices.length;
			indexBuffer.tupleSize = dataTable.index.tupleSize;
			indexBuffer.glType = this.getGLTypeFromArray(gl, mIndices);
			meshInfo.vbos.index = [];
			meshInfo.vbos.index[0] = indexBuffer;
			meshInfo.isIndexed = true;	
		}
	} else {
		//?
		meshInfo.isIndexed = false;
	}
	
	for (var attr in dataTable) {
		var a = dataTable[attr];
		
		if(a.isXflow || attr == "xflowShader" || attr == "index" || attr == "segments")
			continue;
		
		if (a.length > 0) {
			var numBins = a.length;
			meshInfo.vbos[attr] = [];
			
			for (var i = 0; i < numBins; i++) {
				var attrBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, attrBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, a[i].data, gl.STATIC_DRAW);
				
				attrBuffer.length = a[i].data.length;
				attrBuffer.tupleSize = a[i].tupleSize;
				attrBuffer.glType = this.getGLTypeFromArray(gl, a[i].data);

				meshInfo.vbos[attr][i] = attrBuffer;
			}
		} else {
			var attrBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, attrBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, a.data, gl.STATIC_DRAW);
			
			attrBuffer.length = a.data.length;
			attrBuffer.tupleSize = a.tupleSize;
			attrBuffer.glType = this.getGLTypeFromArray(gl, a.data);
			
			meshInfo.vbos[attr] = [];
			meshInfo.vbos[attr][0] = attrBuffer;
		}
	}

	//if (dataTable["xflowShader"]) {
	//	this.xflowShader = dataTable["xflowShader"];
	//}
	meshInfo.valid = true;
	// TODO: Is dataTable.position defined?
	meshInfo.bbox = org.xml3d.webgl.calculateBoundingBox(dataTable.position.data);

	return meshInfo;
	
	
	// return either a meshInfo or an index to the stored mesh in this.meshes
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
org.xml3d.webgl.XML3DMeshManager.prototype.splitMesh = function(dataTable, maxIndexCount) {
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
					bin.texcoord.set(texcoord, newIndex*vertexStride);
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
			dataTable.index[i] = { data : bins[i].index, tupleSize : vertexStride };
			dataTable.position[i] = { data : bins[i].position, tupleSize : vertexStride };
			if (normalSource)
				dataTable.normal[i] = { data : bins[i].normal, tupleSize : vertexStride };
			if (texcoordSource)
				dataTable.position[i] = { data : bins[i].texcoord, tupleSize : texcoordStride };
			if (colorSource)
				dataTable.color[i] = { data : bins[i].color, tupleSize : colorStride };
		}
		
	}
	
	
};

org.xml3d.webgl.XML3DMeshManager.prototype.getGLTypeFromString = function(gl, typeName) {
	switch (typeName) {
		case "triangles"	: return gl.TRIANGLES;
		case "tristrips" 	: return gl.TRIANGLE_STRIP;
		case "points"		: return gl.POINTS;
		case "lines"		: return gl.LINES;
		case "linestrips"	: return gl.LINE_STRIP;
		default				: return gl.TRIANGLES;
	}
};

org.xml3d.webgl.XML3DMeshManager.prototype.getGLTypeFromArray = function(gl, array) {
	if (array instanceof Int8Array   ) return gl.BYTE;
	if (array instanceof Uint8Array  ) return gl.UNSIGNED_BYTE;
	if (array instanceof Int16Array  ) return gl.SHORT;
	if (array instanceof Uint16Array ) return gl.UNSIGNED_SHORT;
	if (array instanceof Int32Array  ) return gl.INT;
	if (array instanceof Uint32Array ) return gl.UNSIGNED_INT;
	if (array instanceof Float32Array) return gl.FLOAT;
	return gl.FLOAT;
};

org.xml3d.webgl.XML3DMeshManager.prototype.setGLContext = function(gl) {
	this.gl = gl;
};