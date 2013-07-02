(function () {

    /**
     *
     * @interface
     */
    var IRenderNode = function() {};
    IRenderNode.prototype.getObjectSpaceBoundingBox = function() {};
    IRenderNode.prototype.getWorldMatrix = function() {};
    IRenderNode.prototype.getWorldSpaceBoundingBox = function() {};
    IRenderNode.prototype.getChildren = function() {};
    IRenderNode.prototype.getParent = function() {};
    IRenderNode.prototype.setParent = function() {};
    IRenderNode.prototype.setTransformDirty = function() {};

    /**
     *
     * @interface
     * @extends {IRenderNode}
     */
    var IRenderGroup = function() {};
    IRenderGroup.prototype.getLocalMatrix = function() {};
    IRenderGroup.prototype.setLocalMatrix = function() {};
    IRenderGroup.prototype.addChild = function() {};

    /**
     *
     * @interface
     * @extends {IRenderNode}
     */
    var IRenderObject = function() {};
    IRenderObject.prototype.getModelViewMatrix = function() {};
    IRenderObject.prototype.getModelViewProjectionMatrix = function() {};
    IRenderObject.prototype.getNormalMatrix = function() {};
    IRenderObject.prototype.isVisible = function() {};

    // Entry:
    // 1: WorldTransformation [16 floats]
    var LOCAL_MATRIX_OFFSET = 0;
    var WORLD_MATRIX_OFFSET = 16;
    var MODELVIEW_MATRIX_OFFSET = 32;
    var MODELVIEWPROJECTION_MATRIX_OFFSET = 48;
    var NORMAL_MATRIX_OFFSET = 64;


    /**
     * @constructor
     * @implements {IRenderNode}
     * @param handler
     * @param pageEntry
     * @param opt
     */
    var RenderNode = function(handler, pageEntry, opt) {
        this.parent = null;
        this.handler = handler;
        this.page = pageEntry.page;
        this.offset = pageEntry.offset;
        this.transformDirty = true;
        this.shaderDirty = true;
    };

    XML3D.extend(RenderNode.prototype, {

        getChildren: function() {
            return [];
        },

        getParent: function() {
            return this.parent;
        },

        setParent: function(parent) {
            this.parent = parent;
            if (parent && parent.addChild) {
                parent.addChild(this);
            }
        },

        getWorldSpaceBoundingBox: function() {
            // TODO: Placeholder
        },

        getObjectSpaceBoundingBox: function() {
            // TODO: Placeholder
        },

        getWorldMatrix: function(dest) {
            if (this.transformDirty) {
                this.parent.getWorldMatrix(dest);
                this.setWorldMatrix(dest);
                this.transformDirty = false;
            }
            var o = this.offset + WORLD_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                dest[i] = this.page[o];
            }
        },

        setWorldMatrix: function(source) {
            var o = this.offset + WORLD_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                this.page[o] = source[i];
            }
        },

        setTransformDirty: function() {
            this.transformDirty = true;
        },

        setVisible: function(newVisible) {
            this.visible = newVisible;
        },

        setShaderDirty: function() {
            this.shaderDirty = true;
        }

    });

    XML3D.webgl.RenderNode = RenderNode;

    //noinspection JSClosureCompilerSyntax,JSClosureCompilerSyntax
    /**
     * Represents a renderable object in the scene.
     *
     * @constructor
     * @implements {IRenderObject}
     * @param {RenderObjectHandler} handler
     * @param {Object} pageEntry
     * @param {Object} opt
     */
    var RenderObject = function (handler, pageEntry, opt) {
        XML3D.webgl.RenderNode.call(this, handler, pageEntry, opt);
        // console.log(pageEntry);
        this.meshAdapter = opt.meshAdapter;
        this.shaderAdapter = null;
        this.shader = opt.shader || null;
        this.meshAdapter.renderObject = this;
        /** {Object?} **/
        this.override = null;
        this.setWorldMatrix(opt.transform || RenderObject.IDENTITY_MATRIX);
        this.transformDirty = true;
        this.visible = opt.visible || true;
        this.create();
    };

    RenderObject.IDENTITY_MATRIX = XML3D.math.mat4.create();
    XML3D.createClass(RenderObject, XML3D.webgl.RenderNode);
    XML3D.extend(RenderObject.prototype, {
        onenterReady:function () {
            //console.log("Entering Ready state");
            this.handler.moveFromQueueToReady(this);
        },
        onleaveReady:function () {
            //console.log("Leaving Ready state");
            this.handler.moveFromReadyToQueue(this);
        },
        onafterlightsChanged:function (name, from, to, lights, shaderManager) {
            if (lights) {
                var shaderHandle = this.meshAdapter.getShaderHandle();
                this.shaderAdapter = shaderHandle && shaderHandle.getAdapter();
                this.shader = shaderManager.createShader(this.shaderAdapter, lights);
            }
        },
        onbeforedataComplete:function (name, from, to) {
            //console.log("Before data complete");
            return this.meshAdapter.finishMesh();
        },
        onbeforeprogress: function(name, from, to) {
            //console.log("Before progress", arguments);
            switch (to) {
                case "NoMaterial":
                    return this.shader != null;
            }
            switch (from) {
                case "DirtyMeshData":
                    this.meshAdapter.createMeshData();
            }
        },
        onenterNoMesh:function () {
            // Trigger the creation of the mesh now
            // this.meshAdapter.createMesh();
            return true;
        },
        onenterDisposed:function () {
            this.handler.remove(this);
        },
        onchangestate:function (name, from, to) {
            XML3D.debug.logInfo("Changed: ", name, from, to);
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

        setWorldMatrix: function(source) {
            var o = this.offset + WORLD_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                this.page[o] = source[i];
            }
            this.transformDirty = false;
        },

        updateWorldSpaceMatrices: function(view, projection) {
            this.updateModelViewMatrix(view);
            this.updateNormalMatrix();
            this.updateModelViewProjectionMatrix(projection);
        },

        /** Relies on an up-to-date transform matrix **/
        updateModelViewMatrix: function(view) {
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
            if(!result.outputNames.length)
                return;

            var prog = this.shader.program;
            this.override = Object.create(null);
            for(var name in prog.uniforms) {
                var entry = result.getOutputData(name);
                if (entry && entry.getValue())
                    this.override[name] = entry.getValue();
            }
            XML3D.debug.logInfo("Shader attribute override", result, this.override);
        },

        updateWorldMatrix: (function() {
            var wm_tmp = XML3D.math.mat4.create();
            return function() {
                this.parent.getWorldMatrix(wm_tmp);
                this.setWorldMatrix(wm_tmp);
            };
        })(),

        isVisible: function() {
            return this.visible;
        }

    });

    // Export
    XML3D.webgl.RenderObject = RenderObject;

    //noinspection JSClosureCompilerSyntax,JSClosureCompilerSyntax
    /**
     *
     * @constructor
     * @implements {IRenderGroup}
     */
    var RenderGroup = function(handler, pageEntry, opt) {
        XML3D.webgl.RenderNode.call(this, handler, pageEntry, opt);
        this.children = [];
        this.shader = opt.shader || null;
        this.localVisible = opt.visible || true;
    };
    XML3D.createClass(RenderGroup, XML3D.webgl.RenderNode);
    XML3D.extend(RenderGroup.prototype, {
        getLocalMatrix: function(dest) {
            var o = this.offset + LOCAL_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                dest[i] = this.page[o];
            }
        },

        setLocalMatrix: function(source) {
            var o = this.offset + LOCAL_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                this.page[o] = source[i];
            }
            this.setTransformDirty();
        },

        getWorldSpaceBoundingBox: function() {
            // TODO: Placeholder
        },

        getObjectSpaceBoundingBox: function() {
            // TODO: Placeholder
        },

        addChild: function(child) {
            this.children.push(child);
        },

        getChildren: function() {
            return this.children;
        },

        updateWorldMatrix: function(source) {
            var page = this.page;
            var offset = this.offset;
            XML3D.math.mat4.multiplyOffset(page, offset+WORLD_MATRIX_OFFSET, page, offset+LOCAL_MATRIX_OFFSET,  source, 0);
            this.getWorldMatrix(source);
            for (var i=0; i < this.children.length; i++) {
                this.children[i].updateWorldMatrix(source);
            }
            this.transformDirty = false;
        },

        setTransformDirty: function() {
            this.transformDirty = true;
            this.children.forEach(function(obj) {
                obj.setTransformDirty();
            });
        },

        setVisible: function(newVisible) {
            if ((newVisible && this.localVisible) || !newVisible) {
                this.children.forEach(function(obj) {
                    obj.setVisible(newVisible);
                });
            }
        },

        setLocalVisible: function(newVisible) {
            this.localVisible = newVisible;
            this.setVisible(newVisible);
        },

        setShaderDirty: function() {
            if (!this.shader) {
                this.shaderDirty = true;
                this.children.forEach(function(obj) {
                    obj.setShaderDirty();
                });
            }
        }

    });

    // Export
    XML3D.webgl.RenderGroup = RenderGroup;
}());
