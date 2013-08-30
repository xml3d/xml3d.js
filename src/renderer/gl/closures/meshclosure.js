(function (webgl) {

    var CHANGE_STATE = {
        NOTHING_CHANGED : 0,
        TYPE_STRUCTURE_CHANGED : 1,
        TYPE_DATA_CHANGED : 2,
        TYPE_CHANGED: 3,
        VS_STRUCTURE_CHANGED : 8,
        VS_DATA_CHANGED : 16,
        VS_CHANGED: 24,
        SHADER_CHANGED: 32
    };
    var SHADER_CLOSURE_NEEDS_UPDATE = CHANGE_STATE.VS_STRUCTURE_CHANGED | CHANGE_STATE.SHADER_CHANGED;

    var READY_STATE = webgl.DrawableClosure.READY_STATE;


    var MESH_PARAMETERS = {};

    MESH_PARAMETERS[WebGLRenderingContext.TRIANGLES] = {
        attributeData: {"position": Xflow.DATA_TYPE.FLOAT3 },
        typeData: {
            "index": Xflow.DATA_TYPE.INT,
            "solid": Xflow.DATA_TYPE.BOOL,
            "vertexCount": Xflow.DATA_TYPE.INT
        },
        bboxFix: {
            "boundingBox" : Xflow.DATA_TYPE.FLOAT3
        },
        bboxCompute: {
            "position" : Xflow.DATA_TYPE.FLOAT3
        } };
    MESH_PARAMETERS[WebGLRenderingContext.LINE_STRIP] = MESH_PARAMETERS[WebGLRenderingContext.TRIANGLES];
    MESH_PARAMETERS[WebGLRenderingContext.LINES] = MESH_PARAMETERS[WebGLRenderingContext.TRIANGLES];
    MESH_PARAMETERS[WebGLRenderingContext.POINTS] = MESH_PARAMETERS[WebGLRenderingContext.TRIANGLES];



    var getGLTypeFromArray = function(array) {
        var GL = window.WebGLRenderingContext;
        if (array instanceof Int8Array)
            return GL.BYTE;
        if (array instanceof Uint8Array)
            return GL.UNSIGNED_BYTE;
        if (array instanceof Int16Array)
            return GL.SHORT;
        if (array instanceof Uint16Array)
            return GL.UNSIGNED_SHORT;
        if (array instanceof Int32Array)
            return GL.INT;
        if (array instanceof Uint32Array)
            return GL.UNSIGNED_INT;
        if (array instanceof Float32Array)
            return GL.FLOAT;
        return GL.FLOAT;
    };
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
     * @param {webgl.GLContext} context
     * @param {string} type
     * @param {Xflow.DataNode} dataNode
     * @extends {DrawableClosure}
     * @constructor
     */
    var MeshClosure = function (context, type, dataNode, opt) {
        webgl.DrawableClosure.call(this, context, webgl.DrawableClosure.TYPES.MESH);
        opt = opt || {};
        this.mesh = new webgl.GLMesh(context, type);

        /**
         * Data Node of the renderObject
         * @type {Xflow.DataNode}
         */
        this.dataNode = dataNode;

        /**
         * Shader Composer that will provide ShaderClosure and Program
         * @type {webgl.AbstractShaderComposer}
         */
        this.shaderComposer = null;

        /**
         * Shader Closure used by this mesh
         * @type {webgl.AbstractShaderClosure}
         */
        this.shaderClosure = null;

        /**
         * Attributes required to create the GLMesh
         * @type {Xflow.ComputeRequest}
         */
        this.typeRequest = null;

        /**
         * Are all attributes required by drawable available?
         * @type {boolean}
         */
        this.typeDataValid = true;

        /**
         * Attributes required for the attached shader
         * @type {Xflow.VertexShaderRequest}
         */
        this.vsRequest = null;

        /**
         * Bitfield that records the changes reported by Xflow
         * @private
         * @type {number}
         */
        this.changeState = CHANGE_STATE.TYPE_STRUCTURE_CHANGED;

        /**
         * Callback if bounding box has changed. Gets only called if
         * this.boundingBoxRequired is true.
         * @type {*|function(Float32Array)}
         */
        this.boundingBoxChanged = opt.boundingBoxChanged || function() {};

        this.initialize();
    };

    XML3D.createClass(MeshClosure, webgl.DrawableClosure, {
        initialize: function () {
            this.typeDataChanged(this.typeRequest, Xflow.RESULT_STATE.CHANGED_STRUCTURE);
            this.shaderChanged();
        },

        setShaderComposer: function(shaderComposer){
            if(!this.bindedShaderChanged) this.bindedShaderChanged = this.shaderChanged.bind(this);

            if(this.shaderComposer)
                this.shaderComposer.removeEventListener(webgl.ShaderComposerFactory.EVENT_TYPE.MATERIAL_STRUCTURE_CHANGED,
                                                            this.bindedShaderChanged);

            this.shaderComposer = shaderComposer;
            if(this.shaderComposer)
                this.shaderComposer.addEventListener(webgl.ShaderComposerFactory.EVENT_TYPE.MATERIAL_STRUCTURE_CHANGED,
                                                            this.bindedShaderChanged);

            this.changeState |= CHANGE_STATE.SHADER_CHANGED;
        },

        update: function () {
            if(this.changeState === CHANGE_STATE.NOTHING_CHANGED) {
                return;
            }
            XML3D.debug.logDebug("Update mesh closure", this.changeState);

            var oldValid = !!this.shaderClosure && this.typeDataValid;

            if(this.changeState & SHADER_CLOSURE_NEEDS_UPDATE)
                this.mesh.clearBuffers();

            if (this.changeState & CHANGE_STATE.TYPE_CHANGED) {
                this.updateTypeData();
            }

            if(this.changeState & (SHADER_CLOSURE_NEEDS_UPDATE | CHANGE_STATE.TYPE_CHANGED)){
                this.updateIndexBuffer();
            }

            if (this.changeState & SHADER_CLOSURE_NEEDS_UPDATE) {
                this.updateVSRequest();
                this.updateShaderClosure();
                this.updateVsData();
            }
            else if (this.changeState & CHANGE_STATE.VS_CHANGED) {
                this.updateVsData();
            }

            var newValid = !!this.shaderClosure && this.typeDataValid;

            if(oldValid != newValid) {
                this.dispatchEvent({
                    type: webgl.Scene.EVENT_TYPE.DRAWABLE_STATE_CHANGED,
                    newState: newValid ? READY_STATE.COMPLETE : READY_STATE.INCOMPLETE,
                    oldState: oldValid ? READY_STATE.COMPLETE : READY_STATE.INCOMPLETE
                });
            }

            this.changeState = CHANGE_STATE.NOTHING_CHANGED;
        },

        calculateBoundingBox: (function() {
            var c_empty = XML3D.math.bbox.create();

            return function() {
                // compute bounding box from positions and indices, if present
                var dataResult = this.typeRequest.getResult();
                var boundingBoxEntry = dataResult.getOutputData("boundingBox");
                if(boundingBoxEntry){
                    this.boundingBoxChanged(XML3D.webgl.calculateBoundingBox(boundingBoxEntry.getValue(), null));
                    return;
                }
                var positionEntry = dataResult.getOutputData("position");
                if(!positionEntry)   {
                    this.boundingBoxChanged(c_empty);
                    return;
                }
                var indexEntry = dataResult.getOutputData("index");
                this.boundingBoxChanged(XML3D.webgl.calculateBoundingBox(positionEntry.getValue(), indexEntry ? indexEntry.getValue() : null));
            }
        }()),
        /**
         *
         * @param {Xflow.ComputeRequest} request
         * @param {Xflow.RESULT_STATE} state
         */
        typeDataChanged: function (request, state) {
            this.changeState |= state == Xflow.RESULT_STATE.CHANGED_STRUCTURE ? CHANGE_STATE.TYPE_STRUCTURE_CHANGED : CHANGE_STATE.TYPE_DATA_CHANGED;
            this.context.requestRedraw("Mesh Type Data Change");
            XML3D.debug.logInfo("MeshClosure: Type data changed", request, state, this.changeState);
        },
        getMesh: function () {
            return this.mesh;
        },
        getMeshType: function () {
            return this.mesh.glType;
        },

        updateVSRequest: function(){
            if(this.vsRequest) this.vsRequest.clear();

            this.vsRequest = this.shaderComposer.createVsRequest(this.dataNode, this.vsDataChanged.bind(this));
        },
        updateShaderClosure: function(){
            this.shaderClosure = this.shaderComposer.getShaderClosure(this.scene, this.vsRequest.getResult());
        },

        /**
         * @param {Object<string,*>} attributes
         * @param {Xflow.ComputeResult} dataResult
         * @param {function(string)} missingCB
         * @returns boolean true, if all required attributes were set
         */
        updateMeshFromResult: function (attributes, dataResult, missingCB) {
            var complete = true;
            for (var name in attributes) {
                var param = attributes[name] || {};
                var entry = dataResult.getOutputData(name);
                if (!entry || !entry.getValue()) {
                    if (param.required) {
                        // If required and loading has finished, give a call
                        dataResult.loading || missingCB(name);
                        complete = false;
                    }
                    continue;
                }
                if (name == "vertexCount") {
                    continue;
                }
                switch (entry.type) {
                    case Xflow.DATA_TYPE.TEXTURE:
                        XML3D.debug.logError("Texture as mesh parameter is not yet supported");
                        break;
                    default:
                        this.handleBuffer(name, entry, this.mesh);
                }
            }
            return complete;
        },
        updateIndexBuffer: function(){
            // Add Index buffer, if available
            var dataResult = this.typeRequest.getResult();
            var entry = dataResult.getOutputData("index");
            if(entry && entry.getValue())
                this.handleBuffer("index", entry, this.mesh );
        },

        updateVsData: function() {
            if (!this.shaderClosure) {
                return; // if only the data has changed, it can't get valid after update
            }

            var result = this.vsRequest.getResult();

            var inputNames = result.shaderInputNames;
            for(var i = 0; i < inputNames.length; ++i){
                var name = inputNames[i];
                if(result.isShaderInputUniform(name)){
                    this.mesh.setUniformOverride(name, result.getShaderInputData(name));
                }
                else{
                    this.handleBuffer(name, result.getShaderInputData(name), this.mesh )
                }
            }
            var outputNames = result.shaderOutputNames;
            for(var i = 0; i < outputNames.length; ++i){
                var name = outputNames[i];
                if(result.isShaderOutputUniform(name)){
                    this.mesh.setUniformOverride(name, result.getUniformOutputData(name));
                }
            }
        },

        updateTypeData: function () {
            if (!this.typeDataValid && !(this.changeState & CHANGE_STATE.TYPE_STRUCTURE_CHANGED)) {
                return; // only if structure has changed, it can't get valid after update
            }

            this.updateTypeRequest();

            this.calculateBoundingBox();

            var dataResult = this.typeRequest.getResult();
            var entry = dataResult.getOutputData("index");
            if(entry && entry.getValue())
                this.handleBuffer("index", entry, this.mesh );

            entry = dataResult.getOutputData("vertexCount");
            this.mesh.setVertexCount(entry && entry.getValue() ? entry.getValue()[0] : null);
            this.typeDataValid = true;
        },
        /**
         * @param {string} name
         * @param {Object} attr
         * @param {Xflow.BufferEntry} entry
         * @param {GLMesh} mesh
         */
        handleBuffer: function (name, entry, mesh) {
            var webglData = XML3D.webgl.getXflowEntryWebGlData(entry, this.context.id);
            var buffer = webglData.buffer;
            var gl = this.context.gl;

            switch (webglData.changed) {
                case Xflow.DATA_ENTRY_STATE.CHANGED_VALUE:
                    var bufferType = name == "index" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;

                    gl.bindBuffer(bufferType, buffer);
                    gl.bufferSubData(bufferType, 0, entry.getValue());
                    break;
                case Xflow.DATA_ENTRY_STATE.CHANGED_NEW:
                case Xflow.DATA_ENTRY_STATE.CHANGED_SIZE:
                    if (name == "index") {
                        buffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(entry.getValue()));
                    } else {
                        buffer = createBuffer(gl, gl.ARRAY_BUFFER, entry.getValue());
                    }
                    buffer.tupleSize = entry.getTupleSize();
                    webglData.buffer = buffer;
                    break;
            }
            // In every case, set the buffer, because other meshes might have already
            // performed one or more of the tasks above
            mesh.setBuffer(name, buffer);

            webglData.changed = 0;
        },
        /**
         *
         * @param {Object.<string, *>} attributes
         */
        setAttributeRequest: function(attributes) {
            this.attributes = attributes;
            this.attributeRequest = new Xflow.ComputeRequest(this.dataNode, Object.keys(attributes), this.attributeDataChanged.bind(this));
            this.attributeDataChanged(this.attributeRequest, Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        },

        /**
         *
         */
        updateTypeRequest: function() {
            var meshConfig = MESH_PARAMETERS[this.getMeshType()];
            if (!meshConfig) {
                XML3D.debug.logError("Unsupported Mesh request: ", this.mesh, this.getMeshType());
                this.typeDataValid = false;
                return;
            }
            var requestNames = this.getTypeRequestNames(meshConfig);

            if(!this.typeRequest || this.typeRequest.filter != requestNames){
                if(this.typeRequest) this.typeRequest.clear();
                this.typeRequest = new Xflow.ComputeRequest(this.dataNode, requestNames, this.typeDataChanged.bind(this));
            }
        },

        getTypeRequestNames: function(meshConfig){
            var requestNames = [];
            requestNames.push.apply(requestNames, Object.keys(meshConfig.typeData));
            // We always request fixed bounding box values: that way we can react, when those values get available
            requestNames.push.apply(requestNames, Object.keys(meshConfig.bboxFix));
            var computeBBox = !this.checkXflowTypes(this.dataNode, meshConfig.bboxFix);

            if(computeBBox){
                if(!this.checkXflowTypes(this.dataNode, meshConfig.bboxCompute)){
                    XML3D.debug.logError("Mesh does not contain valid data required to compute BBOX.", this.mesh, this.getMeshType());
                    this.typeDataValid = false;
                    return;
                }
                requestNames.push.apply(requestNames, Object.keys(meshConfig.bboxCompute));
            }
            return requestNames;
        },
        checkXflowTypes: function(dataNode, requirements){
            for(var name in requirements){
                var info = dataNode.getOutputChannelInfo(name);
                if(!info) return false;
                if(!info.type != requirements[name])
                    return false;
            }
            return true;
        },

        /**
         * @param {Xflow.ComputeRequest} request
         * @param {Xflow.RESULT_STATE} state
         */
        vsDataChanged: function (request, state) {
            this.changeState |= state == Xflow.RESULT_STATE.CHANGED_STRUCTURE ? CHANGE_STATE.VS_STRUCTURE_CHANGED : CHANGE_STATE.VS_DATA_CHANGED;
            this.context.requestRedraw("Mesh Attribute Data Changed");
            XML3D.debug.logInfo("MeshClosure: Attribute data changed", request, state, this.changeState);
        },

        shaderChanged: function(){
            this.changeState |= CHANGE_STATE.SHADER_CHANGED;
        },

        /**
         * Returns a compute request for custom mesh parameters
         * @param {Array.<string>} filter
         * @param {function(Xflow.ComputeRequest, Xflow.RESULT_STATE)} callback
         */
        getRequest: function(filter, callback) {
            return new Xflow.ComputeRequest(this.dataNode, filter, callback);
        }
    });

    webgl.MeshClosure = MeshClosure;

}(XML3D.webgl));
