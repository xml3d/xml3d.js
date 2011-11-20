org.xml3d.webgl.MAX_MESH_INDEX_COUNT = 65535;

org.xml3d.webgl.XML3DMeshRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.gl = this.factory.handler.gl;
	this.isValid = false;
	this.meshIsValid = false;
	this._bbox = null;
	this._eventListeners = [];
	this.shaderHandler = factory.renderer.shaderHandler;
	
	this.dataAdapter = factory.renderer.dataFactory.getAdapter(this.node);
	this.dataAdapter.registerObserver(this);
	
	this.dataType = node.getAttribute("type");
	if (!this.dataType)
		this.dataType = "triangles";
	this.dataType = this.dataType.toLowerCase();
	
	this.mesh = this.initMeshGL();
	
	this.__defineGetter__("bbox", function() {
		return this._bbox;
	});
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype = new org.xml3d.webgl.RenderAdapter();
org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.constructor = org.xml3d.webgl.XML3DMeshRenderAdapter;

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.collectDrawableObjects = function(
		transform, opaqueObjects, transparenObjects, outLights, shader, visible) {
	if (this.isValid && this.meshIsValid) {
		this._transform = transform;
		this._shader = shader;
		
		if (!shader || !shader.hasTransparency)
			opaqueObjects.push( this );
		else
			transparentObjects.push( this );
			
		
		this._visible = visible;
	}
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.addEventListener = function(itype, ilistener, icapture) {
	var evl = {
		type : itype,
		listener : ilistener,
		capture : icapture
	};	
	this._eventListeners.push(evl);
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.removeEventListener = function(itype, ilistener, icapture) {
	for (var i=0; i < this._eventListeners.length; i++) {
		var evl = this._eventListeners[i];
		if (evl.type == itype && evl.listener == ilistener) {
			this._eventListeners.splice(i, 1);
			i--;
		}
	}
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.dispatchEvent = function(evt) {
	for (var i=0; i<this._eventListeners.length; i++) {
		var evl = this._eventListeners[i];
		if (evl.type == evt.type) {
			evl.listener.call(this.node, evt);
		}
	}
	
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getGLTypeFromString = function(gl, typeName) {
	switch (typeName) {
		case "triangles"	: return gl.TRIANGLES;
		case "tristrips" 	: return gl.TRIANGLE_STRIP;
		case "points"		: return gl.POINTS;
		case "lines"		: return gl.LINES;
		case "linestrips"	: return gl.LINE_STRIP;
		default				: return gl.TRIANGLES;
	}
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getGLTypeFromArray = function(gl, array) {
	if (array instanceof Int8Array   ) return gl.BYTE;
	if (array instanceof Uint8Array  ) return gl.UNSIGNED_BYTE;
	if (array instanceof Int16Array  ) return gl.SHORT;
	if (array instanceof Uint16Array ) return gl.UNSIGNED_SHORT;
	if (array instanceof Int32Array  ) return gl.INT;
	if (array instanceof Uint32Array ) return gl.UNSIGNED_INT;
	if (array instanceof Float32Array) return gl.FLOAT;
	return gl.FLOAT;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.initMeshGL = function() {
	var meshInfo = {};
	meshInfo.vbos = {};
	var gl = this.gl;
	meshInfo.glType = this.getGLTypeFromString(gl, this.dataType);
	
	var dataTable = this.dataAdapter.createDataTable();
	this._bbox = org.xml3d.webgl.calculateBoundingBox(dataTable.position.data);
	
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

	if (dataTable["xflowShader"]) {
		this.xflowShader = dataTable["xflowShader"];
	}

	this.meshIsValid = true;
	this.isValid = true;
	return meshInfo;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.splitMesh = function(dataTable, maxIndexCount) {
	var verticesPerPolygon = 3;
	maxIndexCount = Math.floor(maxIndexCount / 3) * 3;
	
	var positionSource = dataTable.position.data;
	var indexSource = dataTable.index ? dataTable.index.data : undefined;
	var normalSource = dataTable.normal ? dataTable.normal.data : undefined;
	var texcoordSource = dataTable.texcoord ? dataTable.texcoord.data : undefined;
	
	var vertexStride = dataTable.position.tupleSize;
	var texcoordStride = dataTable.texcoord ? dataTable.texcoord.tupleSize : undefined;
	var currentIndexSize = indexSource.length;
	
	if (indexSource) {
		var boundaryList = [];
		
		var lastBinSize = currentIndexSize % maxIndexCount;
		var numBins = Math.ceil(currentIndexSize / maxIndexCount);
		var bins = new Array();
		
		for (var i = 0; i < numBins; i++) {
			//var binSize = i == numBins - 1 ? lastBinSize : maxIndexCount;
			bins[i] = {};
			bins[i].index = new Uint16Array(maxIndexCount);
			bins[i].index.nextFreeSlot = 0;
			bins[i].position = new Float32Array(maxIndexCount*vertexStride);
			
			if (normalSource)
				bins[i].normal = new Float32Array(maxIndexCount*vertexStride);
			if (texcoordSource)
				bins[i].texcoord = new Float32Array(maxIndexCount*texcoordStride);
		}
		
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
				//bin.index.set([newIndex], bin.index.nextFreeSlot);
				bin.index[bin.index.nextFreeSlot] = newIndex;
				bin.index.nextFreeSlot++;
				
				var vertIndex = oldIndex * vertexStride;
				var position = [];
				for (var k = 0; k < vertexStride; k++) {
					position[k] = positionSource[vertIndex+k];
				}			
				bin.position.set(position, newIndex*vertexStride);
				//bin.position[newIndex * vertexStride] = position;
				
				if(normalSource) {
					var normal = [];
					for (var k = 0; k < vertexStride; k++) {
						normal[k] = normalSource[vertIndex+k];
					}			
					bin.normal.set(normal, newIndex*vertexStride);
					//bin.normal[newIndex*vertexStride] = normal;
				}
				
				var texIndex = oldIndex * texcoordStride;
				if (texcoordSource) {
					var texcoord = [];
					for (var k = 0; k < texcoordStride; k++) {
						texcoord[k] = texcoordSource[texIndex+k];
					}			
					bin.texcoord.set(texcoord, newIndex*texcoordStride);
					//bin.texcoord[newIndex*texcoordStride] = texcoord;
				}
				
			}
		}
		
		//Insert boundary items into meshes
		var targetBin = 0;
		for (var i = 0; i < boundaryList.length; i++) {
			while(bins[targetBin].index.nextFreeSlot + verticesPerPolygon > maxIndexCount) {
				targetBin++;
				if (targetBin >= bins.length) {
					bins[targetBin] = {};
					//We need to create a new bin
					bins[targetBin].index = new Uint16Array(maxIndexCount);
					bins[targetBin].index.nextFreeSlot = 0;
					bins[targetBin].position = new Float32Array(maxIndexCount*vertexStride);
					
					if (normalSource)
						bins[targetBin].normal = new Float32Array(maxIndexCount*vertexStride);
					if (texcoordSource)
						bins[targetBin].texcoord = new Float32Array(maxIndexCount*texcoordStride);
					break;
				}
			}
			
			for (var j = 0; j < verticesPerPolygon; j++) {
				var bin = bins[targetBin];
				
				var oldIndex = indexSource[boundaryList[i] + j];
				var newIndex = bin.index.nextFreeSlot;
				
				//bin.index.set(newIndex, newIndex);
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
				
			}
		}
	
		dataTable.index = [];
		dataTable.position = [];
		if (normalSource)
			dataTable.normal = [];
		if (texcoordSource)
			dataTable.texcoord = [];
		
		for (var i = 0; i < bins.length; i++) {
			dataTable.index[i] = { data : bins[i].index, tupleSize : vertexStride };
			dataTable.position[i] = { data : bins[i].position, tupleSize : vertexStride };
			if (normalSource)
				dataTable.normal[i] = { data : bins[i].normal, tupleSize : vertexStride };
			if (texcoordSource)
				dataTable.position[i] = { data : bins[i].texcoord, tupleSize : texcoordStride };
		}
		
	}
	
	
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.notifyChanged = function(e) {
	if (e.eventType == MutationEvent.REMOVAL) 
		this.factory.renderer.sceneTreeRemoval(e);	
	else if (e.attribute == "src") {
		this.dispose();
		this.mesh = this.initMeshGL();
	}
	else if (e.attribute == "visible")
		this._visible = e.newValue;

	this.factory.renderer.requestRedraw("Mesh attribute was changed.");
	
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.notifyDataChanged = function(e) {
	this.factory.renderer.requestRedraw("Mesh data has changed");
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.internalNotifyChanged = function(what, newValue) {
	if (what == "transform" || what == "parenttransform")
		this._transform = newValue;
	else if (what == "shader")
		this._shader = newValue;
	else if (what == "visible")
		this._visible = newValue;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.evalOnclick = function(evtMethod) {
	if (evtMethod) {
		eval(evtMethod);
	}
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.draw = function(shader) {
	var sAttributes = shader.program.attributes;
	var gl = this.gl;
	var triCount = 0;

	var dataTable = this.dataAdapter.createDataTable();
	var numBins = this.mesh.isIndexed ? this.mesh.vbos.index.length : this.mesh.vbos.position.length;
	
	for (var i = 0; i < numBins; i++) {
	//Bind vertex buffers
		for (var name in sAttributes) {
			var shaderAttribute = sAttributes[name];
			var vbo;
			
			if (this.mesh.vbos[name].length > 1)
				vbo = this.mesh.vbos[name][i];
			else
				vbo = this.mesh.vbos[name][0];
			
			if (!vbo) {
				org.xml3d.debug.logWarning("Missing required mesh data [ "+name+" ], the object may not render correctly.");
			}
	
			gl.enableVertexAttribArray(shaderAttribute.location);		
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
			
			if (dataTable[name] && dataTable[name].forcedUpdate) {
				gl.bufferData(gl.ARRAY_BUFFER, dataTable[name].data, gl.STATIC_DRAW);
				dataTable[name].forcedUpdate = false;
			}
			
			gl.vertexAttribPointer(shaderAttribute.location, vbo.tupleSize, vbo.glType, false, 0, 0);
		}
		
	//Draw the object
		if (this.mesh.isIndexed) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.vbos.index[i]);
			gl.drawElements(this.mesh.glType, this.mesh.vbos.index[i].length, gl.UNSIGNED_SHORT, 0);
			triCount = this.mesh.vbos.index[i].length / 3;
		} else {
			gl.drawArrays(this.mesh.glType, 0, this.mesh.vbos.position[i].length);
			triCount = this.mesh.vbos.position[i].length / 3;
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
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.dispose = function() {
	for (var vbo in this.mesh.vbos) {
		var buffer = this.mesh.vbos[vbo];
		for (var i = 0; i < buffer.length; i++) {
			this.gl.deleteBuffer(buffer[i]);
		}
	}	
	this.isValid = false;
	this.mesh.vbos = {};
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getBoundingBox = function() {
		
	return new XML3DBox(this._bbox);  
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.applyXFlow = function(shader, parameters) {
	var dataTable = this.dataAdapter.createDataTable();
	
	if (dataTable["xflowShader"]) {
		var xflowShader = dataTable["xflowShader"];
			
		var declarations = xflowShader.declarations;
		var body = xflowShader.body;
		shader.program = shader.getXFlowShader(declarations, body);
	
		for (var p in xflowShader.uniforms) {
			var data = xflowShader.uniforms[p].data;
			if (data.length < 2)
				data = data[0];
			
			parameters[p] = data;
		}
	}
	
};
