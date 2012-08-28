XML3D.webgl.MAX_MESH_INDEX_COUNT = 65535;

//Adapter for <mesh>
(function() {
	var eventTypes = {onclick:1, ondblclick:1,
			ondrop:1, ondragenter:1, ondragleave:1};

    var noDrawableObject = function() {
        XML3D.debug.logError("Mesh adapter has no callback to its mesh object!");
    },
    rc = window.WebGLRenderingContext;

    var staticAttributes = ["index", "position", "normal", "color", "texcoord", "size", "tangent"];

    var XML3DMeshRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);

        this.processListeners();
        this.dataAdapter = factory.renderer.dataFactory.getAdapter(this.node);
        //this.dataAdapter.registerConsumer(this);
        this.parentVisible = true;
        this.table = new XML3D.data.ProcessTable(this, staticAttributes, this.dataChanged);
        this.getMyDrawableObject = noDrawableObject;
        this.needsInit = true;
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
            if (type.match(/onmouse/) || eventTypes[type]) {
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

    function getGLTypeFromString(typeName) {
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

    var createBuffer = function(gl, type, data) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
        buffer.length = data.length;
        buffer.glType = getGLTypeFromArray(data);
        return buffer;
    };

    p.createMesh = function() {
        this.dataAdapter.requestData(this.table);
    };

    function check(entry) {
        return !!(entry && entry.getValue());
    }

    var emptyFunction = function() {};

    function createMeshInfo(type) {
        return {
            vbos : {},
            isIndexed: false,
            glType: getGLTypeFromString(type),
            bbox : new window.XML3DBox(),
            update : emptyFunction
        };
    }

    p.dataChanged = function(dataTable) {
        var obj = this.getMyDrawableObject();
        obj.mesh = obj.mesh || createMeshInfo(this.node.type);
        if (obj.mesh.update === emptyFunction) {
            var that = this;
            obj.mesh.update = function() {
                that.updateData.call(that, obj);
                obj.mesh.update = emptyFunction;
            };
            this.factory.renderer.requestRedraw("Mesh data changed.", false);
        };
    };

    p.updateData = function(obj) {
        var init = this.needsInit;
        var gl = this.factory.renderer.gl;

        var foundValidPositions = false;

        var meshInfo = obj.mesh || createMeshInfo(this.node.type);

        var dataTable =  this.table.providers;
        for ( var attr in dataTable) {
            var entry = dataTable[attr];

            if(!(entry.dirty || init))
                continue;

            //console.log(attr);

            switch(attr) {
                case "index":
                    var indexBuffer = entry.data.buffer;
                    if (!indexBuffer || entry.dirty) {
                        indexBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(entry.getValue()));
                        indexBuffer.tupleSize = entry.getTupleSize();
                        entry.data.buffer = indexBuffer;
                    } else {
                        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, v, gl.DYNAMIC_DRAW);
                    }
                    meshInfo.vbos.index = [];
                    meshInfo.vbos.index[0] = indexBuffer;
                    meshInfo.isIndexed = true;
                    break;
                case "position":
                    foundValidPositions = check(dataTable.position);
                    // Fallthrough
                default:
                    var attrBuffer = entry.data.buffer;
                    var v = entry.getValue();
                    if(!v)
                        continue;
                    if (!attrBuffer) {
                        attrBuffer = v.data ? createBuffer(gl, gl.ARRAY_BUFFER, v.data) : createBuffer(gl, gl.ARRAY_BUFFER, v);
                        attrBuffer.tupleSize = entry.getTupleSize();
                        entry.data.buffer = attrBuffer;
                    } else {
                        if (v.data)
                            v = v.data;
                        gl.bindBuffer(gl.ARRAY_BUFFER, attrBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW);
                    }
                    // Set it in everycase, because buffer might be created by other mesh consumer
                    meshInfo.vbos[attr] = [];
                    meshInfo.vbos[attr][0] = attrBuffer;
                }
        }

        if(init && !foundValidPositions) {
            XML3D.debug.logError("Mesh " + this.node.id + " has no data for required attribute 'position'.");
            obj.mesh.valid = false;
            return;
        } else if(foundValidPositions) {
            // We have positons, let's calc a bounding box
            var positions = dataTable.position.getValue();
            if (positions.data)
                positions = positions.data;
            this.bbox = this.bbox || XML3D.webgl.calculateBoundingBox(positions,dataTable.index ? dataTable.index.getValue() : null);
            meshInfo.bbox.set(this.bbox);
        }

        this.needsInit = false;
        meshInfo.valid = true;
        obj.mesh = meshInfo;

    };

    // Disposes of all GL buffers but does not destroy the mesh
    p.dispose = function(gl) {
        if (!gl)
            gl = this.factory.renderer.gl;
        var myObject = this.getMyDrawableObject();
        var vbos = myObject.mesh.vbos;

        for (var vbo in vbos) {
            var buffer = vbos[vbo];
            for (var i = 0; i < buffer.length; i++) {
                gl.deleteBuffer(buffer[i]);
            }
        }
        this.needsInit = true;

        //Remove buffers from data table so they'll be re-created if this mesh is
        //re-added later
        //TODO: Maybe just destroy the entire adapter object externally?
        var dataTable =  this.table.providers;
        for ( var attr in dataTable) {
            delete dataTable[attr].data.buffer;
        }
        myObject.mesh.valid = false;
    };

    // Disposes of all GL buffers and destroys the mesh (along with its DrawableObject)
    // This should only be called if the mesh node is removed from the scene tree
    p.destroy = function(gl) {
        if (!gl)
            gl = this.factory.renderer.gl;
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




    // Export to XML3D.webgl namespace
    XML3D.webgl.XML3DMeshRenderAdapter = XML3DMeshRenderAdapter;

}());