(function (webgl) {
    /**
     * @interface
     */
    var IRenderObject = function() {};
    IRenderObject.prototype.getModelViewMatrix = function() {};
    IRenderObject.prototype.getModelViewProjectionMatrix = function() {};
    IRenderObject.prototype.getModelMatrixN = function() {};
    IRenderObject.prototype.getModelViewMatrixN = function() {};
    IRenderObject.prototype.getObjectSpaceBoundingBox = function() {};
    IRenderObject.prototype.getWorldSpaceBoundingBox = function() {};
    IRenderObject.prototype.updateWorldSpaceMatrices = function() {};
    IRenderObject.prototype.isVisible = function() {};
    IRenderObject.prototype.setTransformDirty = function() {};
    IRenderObject.prototype.setShader = function() {};
    IRenderObject.prototype.hasTransparency = function() {};

    // Entry:
    /** @const */
    var WORLD_MATRIX_OFFSET = 0;
    /** @const */
    var OBJECT_BB_OFFSET = WORLD_MATRIX_OFFSET + 16;
    /** @const */
    var WORLD_BB_OFFSET = OBJECT_BB_OFFSET + 6;
    /** @const */
    var MODELVIEW_MATRIX_OFFSET = WORLD_BB_OFFSET + 6;
    /** @const */
    var MODELVIEWPROJECTION_MATRIX_OFFSET = MODELVIEW_MATRIX_OFFSET + 16;
    /** @const */
    var MODEL_MATRIX_N_OFFSET = MODELVIEWPROJECTION_MATRIX_OFFSET + 16;
    /** @const */
    var MODELVIEW_MATRIX_N_OFFSET = MODEL_MATRIX_N_OFFSET + 16;
    /** @const */
    var ENTRY_SIZE = MODELVIEW_MATRIX_N_OFFSET + 16;

    //noinspection JSClosureCompilerSyntax,JSClosureCompilerSyntax
    /**
     * Represents a renderable object in the scene.
     * The RenderObject has these responsibilities:
     *  1. Keep track of the transformation hierarchy and bounding boxes
     *  2. Connect the DrawableClosure with the ShaderClosure
     *
     *  The {@link DrawableClosure} is a DrawableObject plus it's data
     *  The {@link ShaderClosure} is a ProgramObject plus it's data
     *  The concrete ShaderClosure can vary per DrawableObject and change
     *  due to scene or object changes. Thus we have to keep track of the
     *  related {@link IShaderComposer}.
     *
     * @constructor
     * @implements {IRenderObject}
     * @param {Scene} scene
     * @param {Object} pageEntry
     * @param {Object} opt
     */
    var RenderObject = function (scene, pageEntry, opt) {
        XML3D.webgl.RenderNode.call(this, webgl.Scene.NODE_TYPE.OBJECT, scene, pageEntry, opt);
        opt = opt || {};

        /**
         * Keep reference to DOM Element need e.g. for picking
         * @type {Element}
         */
        this.node = opt.node;

        /**
         * Object related data
         * @type {{data: Xflow.DataNode|null, type: string}}
         */
        this.object = opt.object || { data: null, type: "triangles" };

        /**
         * Can we rely on current WorldMatrix?
         * @type {boolean}
         */
        this.transformDirty = true;

        /**
         * Can we rely on current Bounding Boxes?
         * @type {boolean}
         */
        this.boundingBoxDirty = true;

        /**
         * The drawable closure transforms object data and type into
         * a drawable entity
         * @type {DrawableClosure}
         */
        this.drawable = this.createDrawable();

        this.shaderHandle = opt.shaderHandle || null;

        /** {Object?} **/
        this.override = null;

    };
    RenderObject.ENTRY_SIZE = ENTRY_SIZE;

    RenderObject.IDENTITY_MATRIX = XML3D.math.mat4.create();

    XML3D.createClass(RenderObject, XML3D.webgl.RenderNode, {
        createDrawable: function () {
            var result = this.scene.createDrawable(this);
            if (result) {
                var that = this;
                result.addEventListener(webgl.Scene.EVENT_TYPE.DRAWABLE_STATE_CHANGED, function (evt) {
                    if (evt.newState === webgl.DrawableClosure.READY_STATE.COMPLETE) {
                        that.scene.moveFromQueueToReady(that);
                    }
                    else if (evt.newState === webgl.DrawableClosure.READY_STATE.INCOMPLETE &&
                        evt.oldState === webgl.DrawableClosure.READY_STATE.COMPLETE) {
                        that.scene.moveFromReadyToQueue(that);
                    }
                });
                result.updateTypeRequest();
                result.calculateBoundingBox();
                result.addEventListener(webgl.Scene.EVENT_TYPE.SCENE_SHAPE_CHANGED, function(evt){
                    that.scene.dispatchEvent({ type: webgl.Scene.EVENT_TYPE.SCENE_SHAPE_CHANGED })
                })
            }
            return result;
        },
        setType: function(type) {
            this.object.type = type;
            // TODO: this.typeChangedEvent
        },
        getType: function() {
            return this.object.type;
        },
        getDataNode: function() {
            return this.object ? this.object.data : null;
        },

        dispose :function () {
            this.scene.remove(this);
        },

        getModelViewMatrix: function(target) {
            var o = this.offset + MODELVIEW_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                target[i] = this.page[o];
            }
        },
        getModelMatrixN: function(target) {
            var o = this.offset + MODEL_MATRIX_N_OFFSET;
            target[0] = this.page[o];
            target[1] = this.page[o+1];
            target[2] = this.page[o+2];
            target[3] = this.page[o+4];
            target[4] = this.page[o+5];
            target[5] = this.page[o+6];
            target[6] = this.page[o+8];
            target[7] = this.page[o+9];
            target[8] = this.page[o+10];
        },
        getModelViewMatrixN: function(target) {
            var o = this.offset + MODELVIEW_MATRIX_N_OFFSET;
            target[0] = this.page[o];
            target[1] = this.page[o+1];
            target[2] = this.page[o+2];
            target[3] = this.page[o+4];
            target[4] = this.page[o+5];
            target[5] = this.page[o+6];
            target[6] = this.page[o+8];
            target[7] = this.page[o+9];
            target[8] = this.page[o+10];
        },


        getModelViewProjectionMatrix: function(dest) {
            var o = this.offset + MODELVIEWPROJECTION_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                dest[i] = this.page[o];
            }
        },

        updateWorldSpaceMatrices: function(view, projection) {
            if (this.transformDirty) {
                this.updateWorldMatrix();
            }
            this.updateModelViewMatrix(view);
            this.updateModelMatrixN();
            this.updateModelViewMatrixN();
            this.updateModelViewProjectionMatrix(projection);
        },

        updateWorldMatrix: (function() {
            var tmp_mat = XML3D.math.mat4.create();
            return function() {
                this.parent.getWorldMatrix(tmp_mat);
                this.setWorldMatrix(tmp_mat);
                this.updateWorldSpaceBoundingBox();
                this.transformDirty = false;
            }
        })(),

        /** Relies on an up-to-date transform matrix **/
        updateModelViewMatrix: function(view) {
            if (this.transformDirty) {
                this.updateWorldMatrix();
            }
            var page = this.page;
            var offset = this.offset;
            XML3D.math.mat4.multiplyOffset(page, offset+MODELVIEW_MATRIX_OFFSET, page, offset+WORLD_MATRIX_OFFSET,  view, 0);
        },

        updateModelMatrixN: (function() {
            var c_tmpMatrix = XML3D.math.mat4.create();
            return function () {
                this.getWorldMatrix(c_tmpMatrix);
                var normalMatrix = XML3D.math.mat4.invert(c_tmpMatrix, c_tmpMatrix);
                normalMatrix = normalMatrix ? XML3D.math.mat4.transpose(normalMatrix, normalMatrix) : RenderObject.IDENTITY_MATRIX;
                var o = this.offset + MODEL_MATRIX_N_OFFSET;
                for(var i = 0; i < 16; i++, o++) {
                    this.page[o] = normalMatrix[i];
                }
            }
        })(),

        /** Relies on an up-to-date view matrix **/
        updateModelViewMatrixN: (function() {
            var c_tmpMatrix = XML3D.math.mat4.create();
            return function () {
                this.getModelViewMatrix(c_tmpMatrix);
                var normalMatrix = XML3D.math.mat4.invert(c_tmpMatrix, c_tmpMatrix);
                normalMatrix = normalMatrix ? XML3D.math.mat4.transpose(normalMatrix, normalMatrix) : RenderObject.IDENTITY_MATRIX;
                var o = this.offset + MODELVIEW_MATRIX_N_OFFSET;
                for(var i = 0; i < 16; i++, o++) {
                    this.page[o] = normalMatrix[i];
                }
            }
        })(),



        /** Relies on an up-to-date view matrix **/
        updateModelViewProjectionMatrix: function(projection) {
            var page = this.page;
            var offset = this.offset;
            XML3D.math.mat4.multiplyOffset(page, offset+MODELVIEWPROJECTION_MATRIX_OFFSET, page, offset+MODELVIEW_MATRIX_OFFSET,  projection, 0);
        },

        setTransformDirty: function() {
            this.transformDirty = true;
            this.setBoundingBoxDirty();
            this.scene.dispatchEvent({type: webgl.Scene.EVENT_TYPE.SCENE_SHAPE_CHANGED});
            this.scene.requestRedraw("Transformation changed");
        },
        /**
         * @param {AdapterHandleNotification} notification
         */
        shaderHandleCallback: function(notification) {
            XML3D.debug.assert(notification.type == XML3D.events.ADAPTER_HANDLE_CHANGED);
            this.updateShaderFromHandle(notification.adapterHandle);
        },

        setShader: function(newHandle) {

            // If we don't have a drawable, we don't need a shader
            // This is for testing purposes and won't occur during normal
            // run
            if(!this.drawable)
                return;

            var oldHandle = this.shaderHandle;

            if(oldHandle == newHandle)
                return;

            if(!this.bindedShaderHandleCallback) this.bindedShaderHandleCallback = this.shaderHandleCallback.bind(this);

            if (oldHandle) {
                oldHandle.removeListener(this.bindedShaderHandleCallback);
            }
            if (newHandle) {
                newHandle.addListener(this.bindedShaderHandleCallback);
            }
            this.shaderHandle = newHandle;
            this.updateShaderFromHandle(newHandle);


            // TODO this.materialChanged();
        },

        /**
         *
         * @param {AdapterHandle|null} handle
         */
        updateShaderFromHandle: function(handle) {
            var shaderInfo = null;

            if(handle) {
                switch (handle.status) {
                    case XML3D.base.AdapterHandle.STATUS.NOT_FOUND:
                        XML3D.debug.logWarning("Shader not found.", handle.url, this.name);
                        break;
                    case XML3D.base.AdapterHandle.STATUS.LOADING:
                        break;
                    case XML3D.base.AdapterHandle.STATUS.READY:
                        shaderInfo = handle.getAdapter().getShaderInfo();
                }
            }

            var composer = this.scene.shaderFactory.createComposerForShaderInfo(shaderInfo);
            this.drawable.setShaderComposer(composer);
        },

        setObjectSpaceBoundingBox: function(box) {
            var o = this.offset + OBJECT_BB_OFFSET;
            this.page[o] =   box[0];
            this.page[o+1] = box[1];
            this.page[o+2] = box[2];
            this.page[o+3] = box[3];
            this.page[o+4] = box[4];
            this.page[o+5] = box[5];
            this.setBoundingBoxDirty();
        },

        getObjectSpaceBoundingBox: function(box) {
            var o = this.offset + OBJECT_BB_OFFSET;
            box[0] = this.page[o];
            box[1] = this.page[o+1];
            box[2] = this.page[o+2];
            box[3] = this.page[o+3];
            box[4] = this.page[o+4];
            box[5] = this.page[o+5];
        },

        setBoundingBoxDirty: function() {
            this.boundingBoxDirty = true;
            this.parent.setBoundingBoxDirty();
        },

        setWorldSpaceBoundingBox: function(bbox) {
            var o = this.offset + WORLD_BB_OFFSET;
            this.page[o] = bbox[0];
            this.page[o+1] = bbox[1];
            this.page[o+2] = bbox[2];
            this.page[o+3] = bbox[3];
            this.page[o+4] = bbox[4];
            this.page[o+5] = bbox[5];
        },

        getWorldSpaceBoundingBox: function(bbox) {
            if (this.boundingBoxDirty) {
                this.updateWorldSpaceBoundingBox();
            }
            var o = this.offset + WORLD_BB_OFFSET;
            bbox[0] = this.page[o];
            bbox[1] = this.page[o+1];
            bbox[2] = this.page[o+2];
            bbox[3] = this.page[o+3];
            bbox[4] = this.page[o+4];
            bbox[5] = this.page[o+5];

        },

        updateWorldSpaceBoundingBox: (function() {
            var c_box = new XML3D.math.bbox.create();
            var c_trans = new XML3D.math.mat4.create();

            return function() {
                this.getObjectSpaceBoundingBox(c_box);
                this.parent.getWorldMatrix(c_trans);
                XML3D.math.bbox.transform(c_box, c_trans, c_box);
                this.setWorldSpaceBoundingBox(c_box);
                this.boundingBoxDirty = false;
            }
        })(),

        setLocalVisible: function(newVal) {
            this.localVisible = newVal;
            if (this.parent.isVisible()) {
                // if parent is not visible this group is also invisible
                this.setVisible(newVal);
                this.setBoundingBoxDirty();
            }
        },

        getProgram: function() {
            return this.drawable.getProgram();
        },

        hasTransparency : function() {
            var program = this.getProgram();
            return program ? program.hasTransparency() : false;
        },

        updateForRendering: function() {
            webgl.SystemNotifier.setNode(this.node);
            this.setShader(this.parent.getShaderHandle());
            try{
                this.drawable && this.drawable.update(this.scene);
            }
            catch(e){
                XML3D.debug.logError("Mesh Error: " + e.message, this.node);
            }
            webgl.SystemNotifier.setNode(null);
        },

        findRayIntersections: (function() {
            var bbox = XML3D.math.bbox.create();
            var opt = {dist:0};

            return function(ray, intersections) {
                this.getWorldSpaceBoundingBox(bbox);
                if (XML3D.math.bbox.intersects(bbox, ray, opt)) {
                   intersections.push(this);
                }
            }
        })()

    });


    // Export
    webgl.RenderObject = RenderObject;

}(XML3D.webgl));
