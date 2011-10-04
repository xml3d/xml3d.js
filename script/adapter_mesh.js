org.xml3d.webgl.MAX_MESH_INDEX_COUNT = 65535;

org.xml3d.webgl.XML3DMeshRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.gl = this.factory.handler.gl;
	this.isValid = false;
	this.meshIsValid = false;
	this._bbox = null;
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
	if (dataTable.position.data.length > org.xml3d.webgl.MAX_MESH_INDEX_COUNT) {
		splitMesh(dataTable, org.xml3d.webgl.MAX_MESH_INDEX_COUNT);
	} else {
		if (dataTable.index) {
			//indexed primitives
			var mIndices = new Uint16Array(dataTable.index.data);
			var indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mIndices, gl.STATIC_DRAW);
			
			indexBuffer.length = mIndices.length;
			indexBuffer.tupleSize = dataTable.index.tupleSize;
			indexBuffer.glType = this.getGLTypeFromArray(gl, mIndices);
			
			meshInfo.vbos.index = indexBuffer;
			meshInfo.isIndexed = true;		
		} else {
			//?
			meshInfo.isIndexed = false;
		}
	
		for (var attr in dataTable) {
			var a = dataTable[attr];
			
			if(a.isXflow || attr == "xflowShader" || attr == "index")
				continue;
			
			var attrBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, attrBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, a.data, gl.STATIC_DRAW);
			
			attrBuffer.length = a.data.length;
			attrBuffer.tupleSize = a.tupleSize;
			attrBuffer.glType = this.getGLTypeFromArray(gl, a.data);
			
			meshInfo.vbos[attr] = attrBuffer;
		}
	}

	if (dataTable["xflowShader"]) {
		this.xflowShader = dataTable["xflowShader"];
	}
	
	this._bbox = org.xml3d.webgl.calculateBoundingBox(dataTable.position.data);
	
	this.meshIsValid = true;
	this.isValid = true;
	return meshInfo;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.splitMesh = function(dataTable, maxIndexCount) {
	var maxDataSize = dataTable.position.data.length;
	var vertices = dataTable.position.data;
	var indices = dataTable.index.data;
	
	if (dataTable.index) {
		var boundaryList = [];
		maxDataSize = Math.max(indices.length, maxDataSize);	
	
		var lastBinSize = maxDataSize % maxIndexCount;
		var numBins = Math.ceil(maxDataSize / maxIndexCount);
		var bins = new Array(numBins);
		for (var i = 0; i < numBins; i++) {
			var binSize = i == numBins - 1 ? lastBinSize : maxIndexCount;
			
			bins[i].index = new UInt16Array(binSize);
			bins[i].position = new Float32Array(binSize);
			if (dataTable.normal)
				bins[i].normal = new Float32Array(binSize);
			if (dataTable.texcoord)
				bins[i].texcoord = new Float32Array(binSize);
		}
			
		for (var i = 0; i < indices.length; i += dataTable.position.tupleSize) {
			var consistentBin = true;
			var targetBin = indices[i] / maxIndexCount;
			for (j = 1; j < dataTable.position.tupleSize; j++) {
				if (indices[i + j] / maxIndexCount != targetBin) {
					consistentBin = false;
					break;
				}
			}
			
			if (!consistentBin) {
				boundaryList.push(i);
				continue;
			}
			
			var indexTransform = maxIndexCount * targetBin;
			
			for (var j = 0; j < dataTable.position.tupleSize; j++) {
				var newIndex = indices[i + j] - indexTransform;
				
				bins[targetBin];
				
			}
			
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


//Bind vertex buffers
	for (var name in sAttributes) {
		var shaderAttribute = sAttributes[name];
		var vbo = this.mesh.vbos[name];
		if (!vbo) {
			org.xml3d.debug.logWarning("Missing required mesh data [ "+name+" ], the object may not render correctly.");
		}
		
		gl.enableVertexAttribArray(shaderAttribute.location);		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.vertexAttribPointer(shaderAttribute.location, vbo.tupleSize, vbo.glType, false, 0, 0);
	}
	
//Draw the object
	if (this.mesh.isIndexed) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.vbos.index);
		gl.drawElements(this.mesh.glType, this.mesh.vbos.index.length, gl.UNSIGNED_SHORT, 0);
		triCount = this.mesh.vbos.index.length / 3;
	} else {
		gl.drawArrays(this.mesh.glType, 0, this.mesh.vbos.position.length);
		triCount = this.mesh.vbos.position.length / 3;
	}
	
//Unbind vertex buffers
	for (var name in sAttributes) {
		var shaderAttribute = sAttributes[name];
		
		gl.disableVertexAttribArray(shaderAttribute.location);
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	return triCount;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.dispose = function() {
	for (var vbo in this.mesh.vbos) {
		var buffer = this.mesh.vbos[vbo];
		this.gl.deleteBuffer(buffer);
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
