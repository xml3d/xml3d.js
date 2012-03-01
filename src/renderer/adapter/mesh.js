xml3d.webgl.MAX_MESH_INDEX_COUNT = 65535;

//Adapter for <mesh>
(function() {

	var XML3DMeshRenderAdapter = function(factory, node) {
	    xml3d.webgl.RenderAdapter.call(this, factory, node);

	    this.processListeners();
	    this.dataAdapter = factory.renderer.dataFactory.getAdapter(this.node);
	    this.dataAdapter.registerObserver(this);

	    this.getMyDrawableObject = function() {
	        xml3d.debug.logError("Mesh adapter has no callback to its mesh object!");
	    };
	};

	xml3d.createClass(XML3DMeshRenderAdapter, xml3d.webgl.RenderAdapter);

	var p = XML3DMeshRenderAdapter.prototype;

	p.processListeners  = function() {
	    var attributes = this.node.attributes;
	    for (var index in attributes) {
	        var att = attributes[index];
	        if (!att.name)
	            continue;

	        var type = att.name;
	        if (type.match(/onmouse/) || type == "onclick") {
	            var eventType = type.substring(2);
	            this.node.addEventListener(eventType,  new Function("evt", att.value), false);
	        }
	    }
	};

	p.registerCallback = function(callback) {
		if (callback instanceof Function)
			this.getMyDrawableObject = callback;
	};

	p.notifyChanged = function(evt) {
		if (evt.type == 0)
			return this.factory.renderer.sceneTreeRemoval(evt);
		else if (evt.type == 2)
			return this.factory.renderer.sceneTreeAddition(evt);
		
		var target = evt.internalType || evt.attrName || evt.wrapped.attrName;
		
		switch (target) {
			case "parentTransform":
				var drawableObject = this.getMyDrawableObject();
				drawableObject.transform = evt.newValue;
			break;
			
			case "src":
				//TODO
			break;
			
			case "type":
				//TODO
			break;
			
			default:
				xml3d.debug.logWarning("Unhandled mutation event in mesh adapter for parameter '"+target+"'");
			break;
		}
		
	};

	p.notifyDataChanged = function(evt) {
	     //TODO: fix object form
	    //this.passChangeToObject(evt);
	};


	p.createMesh = function(gl) {
		//TODO: cache mesh data to support 'instances' --> better performance/storage
		// For now each mesh gets its own set of vertex buffers and such, even if there are 
		// many meshes in the scene that use the exact same set of data (instances)
		
		var dataTable = this.dataAdapter.createDataTable();
		
		if (!dataTable.position || !dataTable.position.data) {
			xml3d.debug.logError("Mesh "+dataAdapter.id+" has no data for required attribute 'position'.");
			return { vbos : {}, glType : 0, valid : false};
		}
		
		var meshInfo = {};
		meshInfo.vbos = {};
		
		var type = this.node.getAttribute("type");
		meshInfo.glType = this.getGLTypeFromString(gl, type);

		if (dataTable.index) {			
			if (dataTable.position.data.length / 3 > xml3d.webgl.MAX_MESH_INDEX_COUNT) {
				 xml3d.webgl.splitMesh(dataTable, xml3d.webgl.MAX_MESH_INDEX_COUNT);
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
		meshInfo.bbox = xml3d.webgl.calculateBoundingBox(dataTable.position.data);
		
		if (dataTable.size) {
			meshInfo.segments = dataTable.size;
		}
		return meshInfo;
		
		
		// return either a meshInfo or an index to the stored mesh in this.meshes
	};
	
	// TODO: move to xflow manager
	p.applyXFlow = function(shader, parameters) {
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

	//TODO: mesh dispose
	p.dispose = function(evt) {
		this.passChangeToObject(evt);
		/*
			for (var vbo in mesh.vbos) {
				var buffer = mesh.vbos[vbo];
				for (var i = 0; i < buffer.length; i++) {
					this.gl.deleteBuffer(buffer[i]);
				}
			}
		*/
	};

    p.getBoundingBox = function() {
        var bbox = new XML3DBox();
        var dataTable = this.dataAdapter.createDataTable();
        if(dataTable && dataTable.position)
            bbox = xml3d.webgl.calculateBoundingBox(dataTable.position.data,dataTable.index.data);
        return bbox;
    };
    

    p.getGLTypeFromString = function(gl, typeName) {
    	if (typeName && typeName.toLowerCase)
    		typeName = typeName.toLowerCase();
    	switch (typeName) {
    		case "triangles"	: return gl.TRIANGLES;
    		case "tristrips" 	: return gl.TRIANGLE_STRIP;
    		case "points"		: return gl.POINTS;
    		case "lines"		: return gl.LINES;
    		case "linestrips"	: return gl.LINE_STRIP;
    		default				: return gl.TRIANGLES;
    	}
    };

    p.getGLTypeFromArray = function(gl, array) {
    	if (array instanceof Int8Array   ) return gl.BYTE;
    	if (array instanceof Uint8Array  ) return gl.UNSIGNED_BYTE;
    	if (array instanceof Int16Array  ) return gl.SHORT;
    	if (array instanceof Uint16Array ) return gl.UNSIGNED_SHORT;
    	if (array instanceof Int32Array  ) return gl.INT;
    	if (array instanceof Uint32Array ) return gl.UNSIGNED_INT;
    	if (array instanceof Float32Array) return gl.FLOAT;
    	return gl.FLOAT;
    };



    // Export to xml3d.webgl namespace
    xml3d.webgl.XML3DMeshRenderAdapter = XML3DMeshRenderAdapter;

}());