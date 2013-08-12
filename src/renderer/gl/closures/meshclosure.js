(function (webgl) {

    var CHANGE_STATE = {
        NOTHING_CHANGED : 0,
        TYPE_STRUCTURE_CHANGED : 1,
        TYPE_DATA_CHANGED : 2,
        TYPE_CHANGED: 3,
        ATTRIBUTE_STRUCTURE_CHANGED : 8,
        ATTRIBUTE_DATA_CHANGED : 16,
        ATTRIBUTE_CHANGED: 24
    };

    var READY_STATE = webgl.DrawableClosure.READY_STATE;


    var MESH_PARAMETERS = {};
    MESH_PARAMETERS[WebGLRenderingContext.TRIANGLES] = { position: { required: true }, index: true };
    MESH_PARAMETERS[WebGLRenderingContext.LINE_STRIP] = { position: { required: true }, index: true };
    MESH_PARAMETERS[WebGLRenderingContext.LINES] = { position: { required: true }, index: true };
    MESH_PARAMETERS[WebGLRenderingContext.POINTS] = { position: { required: true }, index: true };



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
     * @param {Xflow.DataNode} data
     * @extends {DrawableClosure}
     * @constructor
     */
    var MeshClosure = function (context, type, data, opt) {
        webgl.DrawableClosure.call(this, context, webgl.DrawableClosure.TYPES.MESH);
        opt = opt || {};
        this.mesh = new webgl.GLMesh(context, type);
        this.data = data;

        /**
         * Attributes required to create the GLMesh
         * @type {Xflow.ComputeRequest}
         */
        this.typeRequest = null;

        /**
         * Are all attributes required by drawable available?
         * @type {boolean}
         */
        this.typeDataValid = false;

        /**
         * Attributes required for the attached shader
         * @type {Xflow.ComputeRequest}
         */
        this.attributeRequest = null;

        /**
         * Are all attributes required by shader available?
         * @type {boolean}
         */
        this.attributeDataValid = true;

        /**
         * Bitfield that records the changes reported by Xflow
         * @private
         * @type {number}
         */
        this.changeState = CHANGE_STATE.TYPE_STRUCTURE_CHANGED;

        /**
         * Do we have to calculate the bounding box of this mesh?
         * @type {boolean}
         */
        this.boundingBoxRequired = true;

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
            var meshConfig = MESH_PARAMETERS[this.getMeshType()];
            if (!meshConfig) {
                XML3D.debug.logError("Unsupported Mesh request: ", this.mesh, this.getMeshType());
                this.typeDataValid = false;
                return;
            }
            this.setTypeRequest(meshConfig);
        },
        setBoundingBoxRequired: function(required) {
            this.boundingBoxRequired = required;
            this.calculateBoundingBox();
        },
        calculateBoundingBox: (function() {
            var c_empty = XML3D.math.bbox.create();

            return function() {
                if(!this.boundingBoxRequired)
                    return;

                // compute bounding box from positions and indices, if present
                var dataResult = this.typeRequest.getResult();
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
        update: function () {

            if(this.changeState === CHANGE_STATE.NOTHING_CHANGED) {
                return;
            }
            XML3D.debug.logDebug("Update mesh closure", this.changeState);

            var oldValid = this.attributeDataValid && this.typeDataValid;

            if (this.changeState & CHANGE_STATE.TYPE_CHANGED) {
                this.updateTypeData();
            }
            if (this.changeState & CHANGE_STATE.ATTRIBUTE_CHANGED) {
                this.updateAttributeData();
            }

            var newValid = this.attributeDataValid && this.typeDataValid;

            if(oldValid != newValid) {
                this.dispatchEvent({
                    type: webgl.Scene.EVENT_TYPE.DRAWABLE_STATE_CHANGED,
                    newState: newValid ? READY_STATE.COMPLETE : READY_STATE.INCOMPLETE,
                    oldState: oldValid ? READY_STATE.COMPLETE : READY_STATE.INCOMPLETE
                });
            }


            this.changeState = CHANGE_STATE.NOTHING_CHANGED;
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
                        this.handleBuffer(name, param, entry, this.mesh);
                }
            }
            return complete;
        },
        updateAttributeData: function() {
            if (!this.attributeDataValid && !(this.changeState & CHANGE_STATE.ATTRIBUTE_STRUCTURE_CHANGED)) {
                return; // if only the data has changed, it can't get valid after update
            }
            var dataResult = this.attributeRequest.getResult();
            var attributes = this.attributes;
            var complete = this.updateMeshFromResult(attributes, dataResult, function(name) {
                XML3D.debug.logError("Required shader attribute", name, "is missing for mesh");
            });

            this.attributeDataValid = complete;
        },

        updateTypeData: function () {
            if (!this.typeDataValid && !(this.changeState & CHANGE_STATE.TYPE_STRUCTURE_CHANGED)) {
                return; // only if structure has changed, it can't get valid after update
            }
            var dataResult = this.typeRequest.getResult();
            var meshAttributes = this.meshAttributes;

            var vertexCount = 0;
            var complete = this.updateMeshFromResult(meshAttributes, dataResult, function(name) {
                XML3D.debug.logError("Required mesh attribute ", name, "is missing for mesh");
            });

            this.calculateBoundingBox();
            var entry = dataResult.getOutputData("vertexCount");
            this.mesh.setVertexCount(entry && entry.getValue() ? entry.getValue()[0] : null);
            this.typeDataValid = complete;
        },
        /**
         * @param {string} name
         * @param {Object} attr
         * @param {Xflow.BufferEntry} entry
         * @param {GLMesh} mesh
         */
        handleBuffer: function (name, attr, entry, mesh) {
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
            this.attributeRequest = new Xflow.ComputeRequest(this.data, Object.keys(attributes), this.attributeDataChanged.bind(this));
            this.attributeDataChanged(this.attributeRequest, Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        },

        /**
         *
         * @param {Object.<string, *>} attributes
         */
        setTypeRequest: function(attributes) {
            this.meshAttributes = attributes;
            this.typeRequest = new Xflow.ComputeRequest(this.data, Object.keys(attributes), this.typeDataChanged.bind(this));
            this.typeDataChanged(this.typeRequest, Xflow.RESULT_STATE.CHANGED_STRUCTURE);
        },

        /**
         * @param {Xflow.ComputeRequest} request
         * @param {Xflow.RESULT_STATE} state
         */
        attributeDataChanged: function (request, state) {
            this.changeState |= state == Xflow.RESULT_STATE.CHANGED_STRUCTURE ? CHANGE_STATE.ATTRIBUTE_STRUCTURE_CHANGED : CHANGE_STATE.ATTRIBUTE_DATA_CHANGED;
            this.context.requestRedraw("Mesh Attribute Data Changed");
            XML3D.debug.logInfo("MeshClosure: Attribute data changed", request, state, this.changeState);
        },

        /**
         * Returns a compute request for custom mesh parameters
         * @param {Array.<string>} filter
         * @param {function(Xflow.ComputeRequest, Xflow.RESULT_STATE)} callback
         */
        getRequest: function(filter, callback) {
            return new Xflow.ComputeRequest(this.data, filter, callback);
        }
    });

    webgl.MeshClosure = MeshClosure;

}(XML3D.webgl));
