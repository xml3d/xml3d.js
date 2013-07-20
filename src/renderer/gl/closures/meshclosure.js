(function (webgl) {

    var CHANGE_STATE = {
        STRUCTURE_CHANGED : Xflow.RESULT_STATE.CHANGED_STRUCTURE,
        DATA_CHANGED : Xflow.RESULT_STATE.CHANGED_DATA,
        NOTHING_CHANGED : Xflow.RESULT_STATE.NONE
    };

    var READY_STATE = webgl.DrawableClosure.READY_STATE;


    var MESH_PARAMETERS = {};
    MESH_PARAMETERS[WebGLRenderingContext.TRIANGLES] = { position: { required: true }, index: true };
    MESH_PARAMETERS[WebGLRenderingContext.LINES] = { position: { required: true }, index: true };

    var TYPE_FILTER = {};
    for (var param in MESH_PARAMETERS) {
        TYPE_FILTER[param] = Object.keys(MESH_PARAMETERS[param]);
    }

    /**
     *
     * @param context
     * @param type
     * @param data
     * @extends {DrawableClosure}
     * @constructor
     */
    var MeshClosure = function (context, type, data) {
        webgl.DrawableClosure.call(this, context, webgl.DrawableClosure.TYPES.MESH);
        this.mesh = new webgl.GLMesh(context, type);
        this.data = data;
        this.typeRequest = null;
        this._changeState = CHANGE_STATE.STRUCTURE_CHANGED;
        this.initialize();
    };

    XML3D.createClass(MeshClosure, webgl.DrawableClosure, {
        initialize: function () {
            var typeFilter = TYPE_FILTER[this.getMeshType()];
            if (!typeFilter) {
                XML3D.debug.logError("Unsupported Mesh request: ", this.mesh);
                this._valid = false;
                return;
            }
            this.typeRequest = new Xflow.ComputeRequest(this.data, typeFilter, this.typeDataChanged.bind(this));
            this.typeDataChanged(this.typeRequest, CHANGE_STATE.STRUCTURE_CHANGED);
        },
        /**
         *
         * @param {Xflow.ComputeRequest} req
         * @param {Xflow.RESULT_STATE} state
         */
        typeDataChanged: function (req, state) {
            console.log("MeshClosure::typeDataChanged", state === CHANGE_STATE.DATA_CHANGED ? "data_changed" : "structure_changed", req);
            this._changeState = state;
        },
        getMesh: function () {
            return this.mesh;
        },
        getMeshType: function () {
            return this.mesh.glType;
        },
        update: function () {
            console.log("Update mesh closure");
            if(this._changeState === CHANGE_STATE.NOTHING_CHANGED) {
                return;
            }
            if (!this._valid && this._changeState == CHANGE_STATE.DATA_CHANGED) {
                return; // if only the data has changed, it can't get valid after update
            }
            var oldValid = this._valid;
            this.updateMeshData();
            if(oldValid != this._valid) {
                this.dispatchEvent({
                    type: webgl.Scene.EVENT_TYPE.DRAWABLE_STATE_CHANGED,
                    newState: this._valid ? READY_STATE.COMPLETE : READY_STATE.INCOMPLETE,
                    oldState: oldValid    ? READY_STATE.COMPLETE : READY_STATE.INCOMPLETE
                });
            }
            this._changeState = CHANGE_STATE.NOTHING_CHANGED;
        },
        updateMeshData: function () {

            var dataResult = this.typeRequest.getResult();

            var vertexCount = 0,
                complete = true; // Optimistic appraoch

            var meshParams = MESH_PARAMETERS[this.getType()];
            for (var name in meshParams) {
                var param = meshParams[name] || {};
                var entry = dataResult.getOutputData(name);

                if (!entry || !entry.getValue()) {
                    if (param.required) {
                        XML3D.debug.logInfo("Mesh not complete, missing required: ", name, entry);
                        complete = false;
                    }
                    continue;
                }

                if (name == "vertexCount") {
                    vertexCount = entry.getValue();
                    continue;
                }

                switch (entry.type) {
                    case Xflow.DATA_TYPE.TEXTURE:
                        //this.handleTexture(name, entry, obj.shader, this.mesh);
                        XML3D.debug.logError("Texture as mesh parameter is not yet supported");
                        break;
                    default:
                        this.handleBuffer(name, param, entry, this.mesh);
                }

            }
            /*var bbox = this.calcBoundingBox();
             if (bbox) {
             this.renderNode.setObjectSpaceBoundingBox(bbox.min, bbox.max);
             } */
            this.mesh.setVertexCount(vertexCount ? vertexCount[0] : null);
            this._valid = complete;
        },
        /**
         * @param {string} name
         * @param {Object} attr
         * @param {Xflow.BufferEntry} entry
         * @param {GLMesh} mesh
         */
        handleBuffer: function (name, attr, entry, mesh) {
            var webglData = XML3D.webgl.getXflowEntryWebGlData(entry, this.factory.canvasId);
            var buffer = webglData.buffer;
            var gl = this.factory.renderer.context.gl;

            switch (webglData.changed) {
                case Xflow.DATA_ENTRY_STATE.CHANGED_VALUE:
                    var bufferType = name == "index" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;

                    gl.bindBuffer(bufferType, buffer);
                    gl.bufferSubData(bufferType, 0, entry.getValue());
                    break;
                case Xflow.DATA_ENTRY_STATE.CHANGED_NEW:
                case Xflow.DATA_ENTRY_STATE.CHANGE_SIZE:
                    if (name == "index") {
                        buffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(entry.getValue()));
                    } else {
                        buffer = createBuffer(gl, gl.ARRAY_BUFFER, entry.getValue());
                    }
                    buffer.tupleSize = entry.getTupleSize();
                    webglData.buffer = buffer;
                    mesh.setBuffer(name, buffer);
                    break;
                case 0:
                    // No change, but maybe not set as request comes from other mesh than the
                    // creating mesh
                    mesh.setBuffer(name, buffer);
                    break;
            }
            webglData.changed = 0;
        }
    });

    webgl.MeshClosure = MeshClosure;

}(XML3D.webgl));