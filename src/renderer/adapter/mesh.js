XML3D.webgl.MAX_MESH_INDEX_COUNT = 65535;

//Adapter for <mesh>
(function() {
    var noDrawableObject = function() {
        XML3D.debug.logError("Mesh adapter has no callback to its mesh object!");
    },
    rc = window.WebGLRenderingContext;

    var XML3DMeshRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);

        this.processListeners();
        this.dataAdapter = factory.renderer.dataFactory.getAdapter(this.node);
	    //this.dataAdapter.registerConsumer(this);
        this.parentVisible = true;

        this.getMyDrawableObject = noDrawableObject;
    };

    XML3D.createClass(XML3DMeshRenderAdapter, XML3D.webgl.RenderAdapter);

    var p = XML3DMeshRenderAdapter.prototype;

    p.processListeners  = function() {
        var attributes = this.node.attributes;
        for (var index in attributes) {
            var att = attributes[index];
            if (!att.name)
                continue;

            var type = att.name;
            if (type.match(/onmouse/) || type == "onclick" || type == "ondblclick") {
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
            // Node insertion is handled by the CanvasRenderAdapter
            return;
        else if (evt.type == 2)
            return this.factory.renderer.sceneTreeRemoval(evt);

        var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

        switch (target) {
            case "parenttransform":
                this.getMyDrawableObject().transform = evt.newValue;
                break;

            case "parentshader":
                var newShaderId = evt.newValue ? evt.newValue.node.id : "defaultShader";
                this.getMyDrawableObject().shader = newShaderId;
                break;

			case "parentvisible":
                this.getMyDrawableObject().visible = evt.newValue && this.node.visible;
                break;

            case "visible":
                this.getMyDrawableObject().visible = (evt.wrapped.newValue == "true") && this.node.parentNode.visible;
                break;

            case "src":
                this.dispose(evt);
				this.createMesh();
                break;

            case "type":
                var newGLType = this.getGLTypeFromString(evt.wrapped.newValue);
                this.getMyDrawableObject().mesh.glType = newGLType;
                break;

            default:
                XML3D.debug.logWarning("Unhandled mutation event in mesh adapter for parameter '"+target+"'");
                break;
        }

    };

    p.notifyDataChanged = function(evt) {
         //TODO: fix object form
        //this.passChangeToObject(evt);
    };


    var getGLTypeFromArray = function(array) {
        if (array instanceof Int8Array)
            return rc.BYTE;
        if (array instanceof Uint8Array)
            return rc.UNSIGNED_BYTE;
        if (array instanceof Int16Array)
            return rc.SHORT;
        if (array instanceof Uint16Array)
            return rc.UNSIGNED_SHORT;
        if (array instanceof Int32Array)
            return rc.INT;
        if (array instanceof Uint32Array)
            return rc.UNSIGNED_INT;
        if (array instanceof Float32Array)
            return rc.FLOAT;
        return rc.FLOAT;
    };



    var createBuffer = function(gl, type, data) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
        buffer.length = data.length;
        buffer.glType = getGLTypeFromArray(data);
        return buffer;
    };

	p.createMesh = function() {
		this.dataAdapter.requestOutputData(this, ["index", "position", "normal", "color", "texcoord", "size"], null, this.dataChanged);
	};

	var ALL_CHANGED = -1;

	p.dataChanged = function(dataTable, changedEntry) {
        changedEntry = changedEntry || ALL_CHANGED;

        var gl = this.factory.renderer.getGLContext();
        var obj = this.getMyDrawableObject();

        var positions;
        if (!dataTable.position || !(positions = dataTable.position.getValue())) {
            XML3D.debug.logError("Mesh " + this.node.id + " has no data for required attribute 'position'.");
            obj.mesh = {
                vbos : {},
                glType : 0,
                valid : false
            };
            return;
        }

        // We have positons, let's calc a bounding box
        this.bbox = XML3D.webgl.calculateBoundingBox(dataTable.position.value,dataTable.index.value);


        var meshInfo = {
            vbos : {},
            glType : this.getGLTypeFromString(this.node.type)
        };

        if (dataTable.index) {


            if (positions.length / 3 > XML3D.webgl.MAX_MESH_INDEX_COUNT) {
                XML3D.webgl.splitMesh(dataTable, XML3D.webgl.MAX_MESH_INDEX_COUNT);
            }

            if (dataTable.index.length > 0) {
                var numIndexBins = dataTable.index.length;
                meshInfo.vbos.index = [];
                for ( var i = 0; i < numIndexBins; i++) {
                    var mIndices = new Uint16Array(dataTable.index[i].data);
                    var indexBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mIndices, gl.STATIC_DRAW);

                    indexBuffer.length = mIndices.length;
                    indexBuffer.tupleSize = dataTable.index[i].tupleSize;
                    indexBuffer.glType = getGLTypeFromArray(mIndices);

                    meshInfo.vbos.index[i] = indexBuffer;
                    meshInfo.isIndexed = true;
                }
            } else {
                var indexBuffer = dataTable.index.data.buffer;
                if (!indexBuffer || changedEntry == ALL_CHANGED || changedEntry == dataTable.index)
                {
                    indexBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(dataTable.index.getValue()));
                    indexBuffer.tupleSize = dataTable.index.getTupleSize();
                    dataTable.index.data.buffer = indexBuffer;
                }

                meshInfo.vbos.index = [];
                meshInfo.vbos.index[0] = indexBuffer;
                meshInfo.isIndexed = true;

            }
        } else {
            // ?
            meshInfo.isIndexed = false;
        }

        for ( var attr in dataTable) {
            var a = dataTable[attr];


            if (a.isXflow || attr == "xflowShader" || attr == "index" || attr == "segments")
                continue;

            if (a.length > 0) {
                var numBins = a.length;
                meshInfo.vbos[attr] = [];

                for ( var i = 0; i < numBins; i++) {
                    var attrBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, attrBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, a[i].value, gl.STATIC_DRAW);

                    attrBuffer.length = a[i].value.length;
                    attrBuffer.tupleSize = a[i].tupleSize;
                    attrBuffer.glType = getGLTypeFromArray(a[i].value);

                    meshInfo.vbos[attr][i] = attrBuffer;
                }
            } else {
                var attrBuffer = a.data.buffer;
                if (!attrBuffer || changedEntry == ALL_CHANGED) {
                    var v = a.getValue();
                    attrBuffer = createBuffer(gl, gl.ARRAY_BUFFER, v);
                    attrBuffer.tupleSize = a.getTupleSize();
                    a.data.buffer = attrBuffer;
                } else if (changedEntry == a) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, attrBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, a.getValue(), gl.DYNAMIC_DRAW);
                }
                meshInfo.vbos[attr] = [];
                meshInfo.vbos[attr][0] = attrBuffer;
            }
        }

        meshInfo.valid = true;
        meshInfo.bbox = XML3D.webgl.calculateBoundingBox(dataTable.position.data,dataTable.index ? dataTable.index.data : null);
        
        if (dataTable.size) {
            meshInfo.segments = dataTable.size;
        }
		obj.mesh = meshInfo;
		this.factory.renderer.requestRedraw("Mesh data changed.", false);
    };
    
    // TODO: move to xflow manager
	/*p.applyXFlow = function(shader, parameters) {
        var dataTable = this.dataAdapter.createDataTable();

        if (dataTable["xflowShader"]) {
            var xflowShader = dataTable["xflowShader"];

            var declarations = xflowShader.declarations;
            var body = xflowShader.body;
            shader.program = shader.getXFlowShader(declarations, body);

            for (var p in xflowShader.uniforms) {
				var data = xflowShader.uniforms[p].value;
                if (data.length < 2)
                    data = data[0];

                parameters[p] = data;
            }
        }

	};*/

    // Disposes of all GL buffers but does not destroy the mesh
    p.dispose = function(gl) {
        if (!gl)
            gl = this.factory.renderer.getGLContext();
        var myObject = this.getMyDrawableObject();
        var vbos = myObject.mesh.vbos;

        for (var vbo in vbos) {
            var buffer = vbos[vbo];
            for (var i = 0; i < buffer.length; i++) {
                gl.deleteBuffer(buffer[i]);
            }
        }

        myObject.mesh.valid = false;
    };

    // Disposes of all GL buffers and destroys the mesh (along with its DrawableObject)
    // This should only be called if the mesh node is removed from the scene tree
    p.destroy = function(gl) {
        if (!gl)
            gl = this.factory.renderer.getGLContext();
        if (this.getMyDrawableObject == noDrawableObject) {
            return; //This mesh either has no GL data or was already deleted
        }
        this.dispose(gl);
        this.factory.renderer.removeDrawableObject(this.getMyDrawableObject());
        this.getMyDrawableObject = noDrawableObject;
    };

    p.getBoundingBox = function() {
        return this.bbox;
    };

   p.getGLTypeFromString = function(typeName) {
        if (typeName && typeName.toLowerCase)
            typeName = typeName.toLowerCase();
        switch (typeName) {
        case "triangles":
            return rc.TRIANGLES;
        case "tristrips":
            return rc.TRIANGLE_STRIP;
        case "points":
            return rc.POINTS;
        case "lines":
            return rc.LINES;
        case "linestrips":
            return rc.LINE_STRIP;
        default:
            return rc.TRIANGLES;
        }
    };



    // Export to XML3D.webgl namespace
    XML3D.webgl.XML3DMeshRenderAdapter = XML3DMeshRenderAdapter;

}());