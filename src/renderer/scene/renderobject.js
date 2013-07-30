(function (webgl) {
    /**
     * @interface
     */
    var IRenderObject = function() {};
    IRenderObject.prototype.getModelViewMatrix = function() {};
    IRenderObject.prototype.getModelViewProjectionMatrix = function() {};
    IRenderObject.prototype.getNormalMatrix = function() {};
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
    var NORMAL_MATRIX_OFFSET = MODELVIEWPROJECTION_MATRIX_OFFSET + 16;
    /** @const */
    var ENTRY_SIZE = NORMAL_MATRIX_OFFSET + 16;

    var EMPTY_BOUNDING_BOX = XML3D.math.bbox.create();

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
        this.object = opt.object || { data: null, type: "" };

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
         * @type {DrawableClosure!}
         */
        this.drawable = this.createDrawable();

        this.shader = opt.shader || {};
        // Set start values;
        this.initialize();
    };
    RenderObject.ENTRY_SIZE = ENTRY_SIZE;

    RenderObject.IDENTITY_MATRIX = XML3D.math.mat4.create();

    XML3D.createClass(RenderObject, XML3D.webgl.RenderNode, {
        createDrawable: function () {
            var result = this.scene.createDrawable(this);
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
            return result;
        },
        initialize: function () {
            // Initialize World Matrix
            this.setWorldMatrix(RenderObject.IDENTITY_MATRIX);

            // Initialize Bounding Box to empty
            this.setObjectSpaceBoundingBox(EMPTY_BOUNDING_BOX);

            this.setObjectSpaceBoundingBox(XML3D.math.EMPTY_BOX);

            /** {Object?} **/
            this.override = null;
            this.setShader(this.parent.getShaderHandle());
        },
        setType: function(type) {
            this.type = type;
            // TODO: this.typeChangedEvent
        },
        getType: function() {
            return this.type;
        },
        getDataNode: function() {
            return this.object ? this.object.data : null;
        },

        dispose :function () {
            this.scene.remove(this);
        },

        refreshShaderProgram: function() {
            this.program = this.shader.template.getShaderAfterStructureChanged(this.program, this.scene, this.override || {});
        },

        getModelViewMatrix: function(target) {
            var o = this.offset + MODELVIEW_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                target[i] = this.page[o];
            }
        },

        getNormalMatrix: function(target) {
            var o = this.offset + NORMAL_MATRIX_OFFSET;
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
            this.updateNormalMatrix();
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

        /** Relies on an up-to-date view matrix **/
        updateNormalMatrix: (function() {
            var c_tmpMatrix = XML3D.math.mat4.create();
            return function () {
                this.getModelViewMatrix(c_tmpMatrix);
                var normalMatrix = XML3D.math.mat4.invert(c_tmpMatrix, c_tmpMatrix);
                normalMatrix = normalMatrix ? XML3D.math.mat4.transpose(normalMatrix, normalMatrix) : RenderObject.IDENTITY_MATRIX;
                var o = this.offset + NORMAL_MATRIX_OFFSET;
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

        /*
         * @param {Xflow.Result} result
         */
        setOverride: function(result) {
            this.override = null;
            if(!result.outputNames.length) {
                return;
            }

            var prog = this.program;
            var overrides = {};
            for(var name in prog.uniforms) {
                var entry = result.getOutputData(name);
                if (entry && entry.getValue()) {
                    overrides[name] = entry.getValue();
                }
            }
            if (Object.keys(overrides).length > 0) {
                this.override = overrides;
            }
            XML3D.debug.logInfo("Shader attribute override", result, this.override);
        },

        setTransformDirty: function() {
            this.transformDirty = true;
            this.scene.context.requestRedraw("Transformation changed");
        },
        shaderHandleCallback: function() {
            // console.log("Shader handle state changed.", arguments);
        },
        setShader: function(newHandle) {
            console.log("RenderObject::setShader");
            var oldHandle = this.shader.handle;

            if (oldHandle) {
                oldHandle.removeListener(this.shaderHandleCallback);
            }
            if (newHandle) {
                newHandle.addListener(this.shaderHandleCallback);
                switch (newHandle.status) {
                    case XML3D.base.AdapterHandle.STATUS.NOT_FOUND:
                        XML3D.debug.logWarning("Shader not found.", newHandle.url, this.name);
                    // ↓ Fallthrough
                    case XML3D.base.AdapterHandle.STATUS.LOADING:
                        this.shader.template = this.scene.shaderFactory.getDefaultComposer();
                        this.program = this.shader.template.getShaderClosure(this.scene, {});
                        break;
                    case XML3D.base.AdapterHandle.STATUS.READY:
                        this.shader.template = this.scene.shaderFactory.createComposerForShaderInfo(newHandle.getAdapter().getShaderInfo());
                        this.shader.template.addEventListener(webgl.ShaderComposerFactory.EVENT_TYPE.MATERIAL_STRUCTURE_CHANGED, this.refreshShaderProgram.bind(this));
                        //TODO Provide mesh data to the shader
                        this.program = this.shader.template.getShaderClosure(this.scene, {});
                }
            } else {
                console.log("Null shader");
                this.shader.template = this.scene.shaderFactory.getDefaultComposer();
                this.program = this.shader.template.getShaderClosure(this.scene, {});
            }
            this.shader.handle = newHandle;
            // TODO this.materialChanged();
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

            return function() {
                this.getObjectSpaceBoundingBox(c_box);
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
            return this.shader.template.getProgram();
        },

        hasTransparency : function() {
            return this.program ? this.program.hasTransparency() : false;
        }

    });


    // Export
    webgl.RenderObject = RenderObject;

}(XML3D.webgl));
