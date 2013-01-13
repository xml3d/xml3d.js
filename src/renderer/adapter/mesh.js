XML3D.webgl.MAX_MESH_INDEX_COUNT = 65535;

//Adapter for <mesh>
(function() {
    var eventTypes = {onclick:1, ondblclick:1,
        ondrop:1, ondragenter:1, ondragleave:1};

    var noDrawableObject = function() {
        XML3D.debug.logError("Mesh adapter has no callback to its mesh object!");
    },
        /**
         * @type WebGLRenderingContext
         * @private
         */
            rc = window.WebGLRenderingContext;

    var staticAttributes = ["index", "position", "normal", "color", "texcoord", "size", "tangent"];
    var bboxAttributes = ["boundingbox"];

    /**
     * @constructor
     */
    var MeshRenderAdapter = function(factory, node) {
        XML3D.webgl.RenderAdapter.call(this, factory, node);

        this.processListeners();
        this.dataAdapter = XML3D.data.factory.getAdapter(this.node);
        this.parentVisible = true;
        this.renderObject = null; // This is set by renderObject itself

        this.computeRequest = null;
        this.bboxComputeRequest = null;
    };

    XML3D.createClass(MeshRenderAdapter, XML3D.webgl.RenderAdapter);

    var p = MeshRenderAdapter.prototype;

    p.applyTransformMatrix = function(m) {

        if (this.renderObject.transform)
            mat4.multiply(m, m, this.renderObject.transform);

        return m;
    };

    /**
     *
     */
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

    /**
     * @param {XML3D.events.Notification} evt
     */
    p.notifyChanged = function(evt) {
        if( (evt.type == XML3D.events.ADAPTER_HANDLE_CHANGED ) && !evt.internalType ){
            if(evt.key == "shader"){
                this.updateShader(evt.adapter);
                if(evt.handleStatus == XML3D.base.AdapterHandle.STATUS.NOT_FOUND){
                    XML3D.debug.logWarning("Missing shader with id '" + evt.url + "', falling back to default shader.");
                }
            }
            return;
        } else if (evt.type == XML3D.events.NODE_INSERTED)
        // Node insertion is handled by the CanvasRenderAdapter
            return;
        else if (evt.type == XML3D.events.NODE_REMOVED)
            return this.factory.renderer.sceneTreeRemoval(evt);
        else if (evt.type == XML3D.events.THIS_REMOVED) {
            this.clearAdapterHandles();
            return;
        }

        var target = evt.internalType || evt.attrName || evt.wrapped.attrName;

        switch (target) {
            case "parenttransform":
                this.renderObject.transform = evt.newValue;
                break;

            case "parentshader":
                var adapterHandle = evt.newValue;
                this.setShaderHandle(adapterHandle);
                this.updateShader(adapterHandle ? adapterHandle.getAdapter() : null);
                break;

            case "parentvisible":
                this.renderObject.visible = evt.newValue && this.node.visible;
                break;

            case "visible":
                this.renderObject.visible = (evt.wrapped.newValue == "true") && this.node.parentNode.visible;
                break;

            case "src":
                // Handled by data component
                break;

            case "type":
                var newGLType = this.getGLTypeFromString(evt.wrapped.newValue);
                this.renderObject.mesh.glType = newGLType;
                break;

            default:
                XML3D.debug.logWarning("Unhandled mutation event in mesh adapter for parameter '"+target+"'", evt);
                break;
        }

    };

    p.getShaderHandle = function(){
        return this.getConnectedAdapterHandle("shader");
    }

    p.setShaderHandle = function(newHandle){
        this.connectAdapterHandle("shader", newHandle);
        if(newHandle && newHandle.status == XML3D.base.AdapterHandle.STATUS.NOT_FOUND){
            XML3D.debug.logError("Could not find <shader> element of url '" + newHandle.url);
        }
    };
    p.updateShader = function(adapter){
        var shaderName = this.factory.renderer.shaderManager.createShader(adapter,
            this.factory.renderer.lights);
        this.renderObject.shader = shaderName;
        this.renderObject.materialChanged();
        this.factory.renderer.requestRedraw("Shader changed.", false);
    }


    /**
     * @param {WebGLRenderingContext} gl
     * @param {number} type
     * @param {Object} data
     */
    var createBuffer = function(gl, type, data) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
        buffer.length = data.length;
        buffer.glType = getGLTypeFromArray(data);
        return buffer;
    };

    /**
     *
     */
    p.createRequests = function() {
        var that = this;
        this.computeRequest = this.computeRequest || this.dataAdapter.getComputeRequest(staticAttributes,
            function(request, changeType) {
                that.dataChanged(request, changeType);
        });
        this.bboxComputeRequest = this.bboxComputeRequest || this.dataAdapter.getComputeRequest(bboxAttributes);
    };

    p.finishMesh = function() {
        this.createRequests();

        this.bbox = this.calcBoundingBox();
        this.createMeshData();
        return this.renderObject.mesh.valid;
    }

    var emptyFunction = function() {};

    /**
     * @param {string} type
     */
    function createMeshInfo(type) {
        return {
            vbos : {},
            isIndexed: false,
            glType: getGLTypeFromString(type),
            bbox : new window.XML3DBox(),
            update : emptyFunction
        };
    }

    /**
     * @param {Xflow.data.Request} request
     * @param {Xflow.RESULT_STATE} state
     */
    p.dataChanged = function(request, state) {
        var obj = this.renderObject;
        switch(state) {
            case Xflow.RESULT_STATE.CHANGED_STRUCTURE:
                XML3D.debug.logInfo("Mesh structure changed", arguments);
                if(this.renderObject.can("dataStructureChanged"))
                    this.renderObject.dataStructureChanged();
                this.factory.renderer.requestRedraw("Mesh structure changed.");
                break;
            case Xflow.RESULT_STATE.CHANGED_DATA:
                XML3D.debug.logInfo("Mesh values changed", arguments);
                if(this.renderObject.can("dataValueChanged"))
                    this.renderObject.dataValueChanged();
                this.factory.renderer.requestRedraw("Mesh values changed.");
                break;
            default:
                XML3D.debug.logInfo("Unknown state: " + state);
        }
    };

    /**
     *
     */
    p.createMeshData = function() {
        var gl = this.factory.renderer.gl;
        var obj = this.renderObject;
        obj.mesh = obj.mesh || createMeshInfo(this.node.type);

        var calculateBBox = false;
        var dataResult =  this.computeRequest.getResult();

        if (!(dataResult.getOutputData("position") && dataResult.getOutputData("position").getValue())) {
            if(!dataResult.loading)
                XML3D.debug.logWarning("Mesh " + this.node.id + " has no data for required attribute 'position'.");
            obj.mesh.valid = false;
            return;
        }
        for ( var i in staticAttributes) {
            var attr = staticAttributes[i];
            var entry = dataResult.getOutputData(attr);
            if (!entry || !entry.getValue())
                continue;

            var buffer = entry.userData.buffer;

            switch(entry.userData.webglDataChanged) {
            case Xflow.DATA_ENTRY_STATE.CHANGED_VALUE:
                var bufferType = attr == "index" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;

                gl.bindBuffer(bufferType, buffer);
                gl.bufferSubData(bufferType, 0, entry.getValue());
                break;
            case Xflow.DATA_ENTRY_STATE.CHANGED_NEW:
            case Xflow.DATA_ENTRY_STATE.CHANGE_SIZE:
                if (attr == "index") {
                    buffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(entry.getValue()));
                } else {
                    buffer = createBuffer(gl, gl.ARRAY_BUFFER, entry.getValue());
                }
                buffer.tupleSize = entry.getTupleSize();
                entry.userData.buffer = buffer;
                break;
             default:
                 break;
            }

            obj.mesh.vbos[attr] = [];
            obj.mesh.vbos[attr][0] = buffer;

            //TODO: must set isIndexed if indices are removed
            if (attr == "position")
                calculateBBox = true;
            if (attr == "index")
                obj.mesh.isIndexed = true;

            delete entry.userData.webglDataChanged;
        }

        //Calculate a bounding box for the mesh
        if (calculateBBox) {
            this.bbox = this.calcBoundingBox();
            obj.mesh.bbox.set(this.bbox);
        }

        obj.mesh.valid = true;
    };

    /**
     *
     */
    p.destroy = function() {
        this.renderObject.dispose();
        if (this.computeRequest)
            this.computeRequest.clear();
        if (this.bboxComputeRequest)
            this.bboxComputeRequest.clear();
        this.clearAdapterHandles();
    };

    /**
     * @return {XML3DBox}
     */
    p.getBoundingBox = function() {
        return new window.XML3DBox(this.bbox);
    };

    /**
     * @return {XML3DMatrix}
     */
    p.getWorldMatrix = function() {

        var m = new window.XML3DMatrix();

        var obj = this.renderObject;
        if(obj)
            m._data.set(obj.transform);

        return m;
    };

    /**
     * @private
     * @return {XML3DBox} the calculated bounding box of this mesh.
     */
    p.calcBoundingBox = function() {

        var bbox = new window.XML3DBox();

        // try to compute bbox using the boundingbox property of xflow
        var bboxResult = this.bboxComputeRequest.getResult();
        var bboxOutData = bboxResult.getOutputData("boundingbox");
        if (bboxOutData)
        {
            var bboxVal = bboxOutData.getValue();
            bbox.extend(bboxVal[0]);
            bbox.extend(bboxVal[1]);

            return bbox;
        }

        // compute bounding box from positions and indices, if present
        var dataResult = this.computeRequest.getResult();
        var posData = dataResult.getOutputData("position");
        if(!posData)
            return bbox;

        var positions = posData.getValue();

        var idxOutData = dataResult.getOutputData("index");
        var indices = idxOutData ? idxOutData.getValue() : null;

        return XML3D.webgl.calculateBoundingBox(positions, indices);
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

    /**
     * @param {string} typeName
     */
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

    // Export to XML3D.webgl namespace
    XML3D.webgl.MeshRenderAdapter = MeshRenderAdapter;

}());