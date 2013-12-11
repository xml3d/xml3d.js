(function (webgl) {

    var CHANGE_STATE = {
        NOTHING_CHANGED : 0,
        STRUCTURE_CHANGED : 1,
        TYPE_DATA_CHANGED : 2,
        VS_DATA_CHANGED : 4,
        TYPE_CHANGED: 2+1,
        VS_CHANGED: 4+1,
        SHADER_CHANGED: 32
    };
    var SHADER_CLOSURE_NEEDS_UPDATE = CHANGE_STATE.STRUCTURE_CHANGED | CHANGE_STATE.SHADER_CHANGED;

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
         * Attributes and uniforms values for the shader
         * @type {Xflow.Request}
         */
        this.objectShaderRequest = null;

        /**
         * Bitfield that records the changes reported by Xflow
         * @private
         * @type {number}
         */
        this.changeState = CHANGE_STATE.STRUCTURE_CHANGE;

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

        update: function (scene) {
            if(this.changeState === CHANGE_STATE.NOTHING_CHANGED) {
                return;
            }
            XML3D.debug.logDebug("Update mesh closure", this.changeState);

            var oldValid = !!this.shaderClosure && this.typeDataValid, someError = null, typeDataResolved = false;

            try{
                if(this.changeState & SHADER_CLOSURE_NEEDS_UPDATE)
                this.mesh.clear();

                if (this.changeState & CHANGE_STATE.TYPE_CHANGED) {
                    this.updateTypeData();
                }

                typeDataResolved = true;

                if(this.changeState & (SHADER_CLOSURE_NEEDS_UPDATE | CHANGE_STATE.TYPE_CHANGED)){
                    this.updateIndexBuffer();
                }

                if (this.changeState & SHADER_CLOSURE_NEEDS_UPDATE) {
                    this.updateObjectShaderRequest();
                    this.updateShaderClosure(scene);
                    this.updateObjectShaderData();
                }
                else if (this.changeState & CHANGE_STATE.VS_CHANGED) {
                    this.updateObjectShaderData();
                }

                if(this.dataNode.isSubtreeLoading()){
                    this.shaderClosure = null;
                    this.typeDataValid = false;
                }
            }
            catch(e){
                someError = e;
                if(!typeDataResolved)
                    this.typeDataValid = false;
                else
                    this.shaderClosure = null;
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

            if(someError) throw someError;
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
            this.changeState |= state == Xflow.RESULT_STATE.CHANGED_STRUCTURE ? CHANGE_STATE.STRUCTURE_CHANGED : CHANGE_STATE.TYPE_DATA_CHANGED;
            this.dispatchEvent({ type: webgl.Scene.EVENT_TYPE.SCENE_SHAPE_CHANGED });
            this.context.requestRedraw("Mesh Type Data Change");
            XML3D.debug.logInfo("MeshClosure: Type data changed", request, state, this.changeState);
        },
        getMesh: function () {
            return this.mesh;
        },
        getMeshType: function () {
            return this.mesh.glType;
        },

        updateObjectShaderRequest: function(){
            if(this.objectShaderRequest) this.objectShaderRequest.clear();
            this.objectShaderRequest = null;
            if(this.dataNode.isSubtreeLoading())
                return;

            this.objectShaderRequest = this.shaderComposer.createObjectDataRequest(this.dataNode, this.shaderInputDataChanged.bind(this));
        },
        updateShaderClosure: function(scene){
            this.shaderClosure = null;
            if(!this.dataNode.isSubtreeLoading() && !this.dataNode.getOutputChannelInfo("position"))
            {
                throw new Error("Mesh does not have 'position' attribute.");
                //XML3D.debug.logError("Mesh does not have 'position' attribute.", this.mesh, this.getMeshType());
            }
            else if(!this.dataNode.isSubtreeLoading()){
                this.shaderClosure = this.shaderComposer.getShaderClosure(scene, this.objectShaderRequest.getResult());
            }
        },

        updateIndexBuffer: function(){
            // Add Index buffer, if available
            var dataResult = this.typeRequest.getResult();
            var entry = dataResult.getOutputData("index");
            if(entry && entry.getValue())
                this.handleBuffer("index", entry, true);
        },

        updateObjectShaderData: function() {
            if (!this.shaderClosure) {
                return; // if only the data has changed, it can't get valid after update
            }

            if(!this.bindedHandleBuffer) this.bindedHandleBuffer = this.handleBuffer.bind(this);
            if(!this.bindedHandleUniform) this.bindedHandleUniform = this.handleUniform.bind(this);

            this.shaderComposer.distributeObjectShaderData(this.objectShaderRequest,
                this.bindedHandleBuffer, this.bindedHandleUniform);

            if(!this.mesh.isReadyToRender()){
                throw new Error("Mesh has empty vertex attributes.");
            }
        },

        updateTypeData: function () {
            if (!this.typeDataValid && !(this.changeState & CHANGE_STATE.STRUCTURE_CHANGED)) {
                return; // only if structure has changed, it can't get valid after update
            }

            this.updateTypeRequest();

            this.calculateBoundingBox();

            var dataResult = this.typeRequest.getResult();

            var entry = dataResult.getOutputData("vertexCount");
            this.mesh.setVertexCount(entry && entry.getValue() ? entry.getValue()[0] : null);
            this.typeDataValid = true;
        },
        /**
         * @param {string} name
         * @param {Object} attr
         * @param {Xflow.BufferEntry} xflowDataEntry
         * @param {boolean=} isIndex
         */
        handleBuffer: function (name, xflowDataEntry, isIndex) {
            isIndex = isIndex || false;
            var mesh = this.mesh;

            if(name == "position" && !xflowDataEntry){
                throw new Error("'position' attribute of mesh is empty.");
            }

            if(!xflowDataEntry){
                this.mesh.removeBuffer(name);
                return;
            }

            if(xflowDataEntry.type == Xflow.DATA_TYPE.TEXTURE){
                XML3D.debug.logError("Texture as mesh parameter is not yet supported");
                return;
            }

            var buffer = webgl.getGLBufferFromXflowDataEntry(xflowDataEntry, this.context, name == "index");
            if(isIndex){
                this.updateIndexRange(xflowDataEntry);
            }
            else{
                this.mesh.checkBufferCompatible(name, xflowDataEntry);
            }
            // In every case, set the buffer, because other meshes might have already
            // performed one or more of the tasks above
            mesh.setBuffer(name, buffer);
        },

        updateIndexRange: function(xflowDataEntry){
            var webglData = XML3D.webgl.getXflowEntryWebGlData(xflowDataEntry, this.context.id);
            this.mesh.setIndexRange(webglData.minIndex, webglData.maxIndex);
        },

        checkBufferSize: function(name, xflowDataEntry){
            if(xflowDataEntry.getIterateCount){
                var cnt = xflowDataEntry.getIterateCount();
                if(cnt >= this.mesh.maxIndex)
                    throw new Error("Index range of [" + this.mesh.minIndex + ", " + this.mesh.maxIndex + "] " +
                        " goes beyond element count " + cnt + " of attribute '" + name + "'");
            }
        },

        handleUniform: function(name, xflowDataEntry){
            var value = webgl.getGLUniformValueFromXflowDataEntry(xflowDataEntry, this.context);
            this.mesh.setUniformOverride(name, value);
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
                    this.typeDataValid = false;
                }
                requestNames.push.apply(requestNames, Object.keys(meshConfig.bboxCompute));
            }
            return requestNames;
        },
        checkXflowTypes: function(dataNode, requirements){
            for(var name in requirements){
                var info = dataNode.getOutputChannelInfo(name);
                if(!info) return false;
                if(info.type != requirements[name])
                    return false;
            }
            return true;
        },

        /**
         * @param {Xflow.ComputeRequest} request
         * @param {Xflow.RESULT_STATE} state
         */
        shaderInputDataChanged: function (request, state) {
            this.changeState |= state != Xflow.RESULT_STATE.CHANGED_DATA_VALUE ? CHANGE_STATE.STRUCTURE_CHANGED : CHANGE_STATE.VS_DATA_CHANGED;
            // TODO: We don't know if the change of data only influences the surface shading or the actual mesh shape
            this.dispatchEvent({ type: webgl.Scene.EVENT_TYPE.SCENE_SHAPE_CHANGED });
            this.context.requestRedraw("Mesh Attribute Data Changed");
            XML3D.debug.logInfo("MeshClosure: Attribute data changed", request, state, this.changeState);
        },

        shaderChanged: function(){
            this.changeState |= CHANGE_STATE.SHADER_CHANGED;
        },

        getProgram: function(){
            return this.shaderClosure;
        }

    });

    webgl.MeshClosure = MeshClosure;

}(XML3D.webgl));
