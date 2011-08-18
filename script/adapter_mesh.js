

org.xml3d.webgl.XML3DMeshRenderAdapter = function(factory, node) {
	org.xml3d.webgl.RenderAdapter.call(this, factory, node);
	this.gl = this.factory.handler.gl;
	this.isValid = false;
	this._bbox = null;
	
	this.dataAdapter = factory.renderer.dataFactory.getAdapter(this.node);
	
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
	if (this.isValid) {
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

	this._bbox = org.xml3d.webgl.calculateBoundingBox(dataTable.position.data);
	
	this.isValid = true;
	return meshInfo;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.notifyChanged = function(e) {
	if (e.eventType == MutationEvent.REMOVAL) 
		this.factory.renderer.sceneTreeRemoval(e);	
	else if (e.attribute == "src") {
		this.destroy();
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
	
//Bind vertex buffers
	for (var name in this.mesh.vbos) {
		var shaderAttribute = sAttributes[name];
		if (!shaderAttribute)
			continue;
		
		var vbo = this.mesh.vbos[name];

		gl.enableVertexAttribArray(shaderAttribute.location);		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.vertexAttribPointer(shaderAttribute.location, vbo.tupleSize, vbo.glType, false, 0, 0);
	}
	
//Draw the object
	if (this.mesh.isIndexed) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.vbos.index);
		gl.drawElements(this.mesh.glType, this.mesh.vbos.index.length, gl.UNSIGNED_SHORT, 0);
	} else {
		gl.drawArrays(this.mesh.glType, 0, this.mesh.vbos.position.length);
	}
	
//Unbind vertex buffers
	for (var name in this.mesh.vbos) {
		var shaderAttribute = sAttributes[name];
		if (!shaderAttribute)
			continue;
		gl.disableVertexAttribArray(shaderAttribute.location);
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	return this.mesh.vbos.position.length / 9;
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.destroy = function() {
	for (var vbo in this.mesh.vbos) {
		var buffer = this.mesh.vbos[vbo];
		this.gl.deleteBuffer(buffer);
	}	
	this.isValid = false;
	this.mesh.vbos = {};
};

org.xml3d.webgl.XML3DMeshRenderAdapter.prototype.getBoundingBox = function() {
	var min = new XML3DVec3(this._bbox.min[0], this._bbox.min[1], this._bbox.min[2]);
	var max = new XML3DVec3(this._bbox.max[0], this._bbox.max[1], this._bbox.max[2]);
	
	return new XML3DBox(min, max); 
};
