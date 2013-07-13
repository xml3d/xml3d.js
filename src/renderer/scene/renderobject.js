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


    //noinspection JSClosureCompilerSyntax,JSClosureCompilerSyntax
    /**
     * Represents a renderable object in the scene.
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
        /** @type {XML3D.webl.MeshRenderAdapter} */
        this.meshAdapter = opt.meshAdapter;
        this.shader = opt.shader || null;
        /** {Object?} **/
        this.override = null;
        this.setWorldMatrix(opt.transform || RenderObject.IDENTITY_MATRIX);
        this.transformDirty = true;
        this.boundingBoxDirty = true;
        this.create();
    };
    RenderObject.ENTRY_SIZE = ENTRY_SIZE;

    RenderObject.IDENTITY_MATRIX = XML3D.math.mat4.create();
    XML3D.createClass(RenderObject, XML3D.webgl.RenderNode);
    XML3D.extend(RenderObject.prototype, {
        onenterReady:function () {
            this.scene.moveFromQueueToReady(this);
        },
        onleaveReady:function () {
            this.scene.moveFromReadyToQueue(this);
        },
        onafterlightsChanged:function (name, from, to, lights) {
            if (lights) {
                var shaderHandle = this.parent.getShaderHandle();
                this.shaderClosure = this.scene.shaderFactory.create(shaderHandle, lights);
                //this.shader = shaderManager.createShader(shaderHandle.adapter, lights);
            }
        },
        onbeforedataComplete:function (name, from, to) {
            return this.meshAdapter.finishMesh();
        },
        onbeforeprogress: function(name, from, to) {
            switch (to) {
                case "NoMaterial":
                    if(this.shaderClosure) {
                        this.shaderClosure.update();
                        this.shader = this.shaderClosure.getProgram();
                    } else {
                        // DefaultShader
                    }
                    return !!this.shader;
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
            this.scene.remove(this);
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
            this.setBoundingBoxDirty();
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
            if(!result.outputNames.length) {
                this.override = null;
                return;
            }

            var prog = this.shader;
            this.override = Object.create(null);
            for(var name in prog.uniforms) {
                var entry = result.getOutputData(name);
                if (entry && entry.getValue()) {
                    this.override[name] = entry.getValue();
                }
            }
            XML3D.debug.logInfo("Shader attribute override", result, this.override);
        },

        setTransformDirty: function() {
            this.transformDirty = true;
        },

        setShader: function(newHandle) {
            this.shaderClosure = this.scene.shaderFactory.create(newHandle, this.scene.lights);
            this.materialChanged();
        },

        setObjectSpaceBoundingBox: function(min, max) {
            var o = this.offset + OBJECT_BB_OFFSET;
            this.page[o] = min[0];
            this.page[o+1] = min[1];
            this.page[o+2] = min[2];
            this.page[o+3] = max[0];
            this.page[o+4] = max[1];
            this.page[o+5] = max[2];
            this.setBoundingBoxDirty();
        },

        getObjectSpaceBoundingBox: function(min, max) {
            var o = this.offset + OBJECT_BB_OFFSET;
            min[0] = this.page[o];
            min[1] = this.page[o+1];
            min[2] = this.page[o+2];
            max[0] = this.page[o+3];
            max[1] = this.page[o+4];
            max[2] = this.page[o+5];
        },

        setBoundingBoxDirty: function() {
            this.boundingBoxDirty = true;
            this.parent.setBoundingBoxDirty();
        },

        setWorldSpaceBoundingBox: function(min, max) {
            var o = this.offset + WORLD_BB_OFFSET;
            this.page[o] = min[0];
            this.page[o+1] = min[1];
            this.page[o+2] = min[2];
            this.page[o+3] = max[0];
            this.page[o+4] = max[1];
            this.page[o+5] = max[2];
        },

        getWorldSpaceBoundingBox: function(bbox) {
            if (this.boundingBoxDirty) {
                this.updateWorldSpaceBoundingBox();
            }
            var o = this.offset + WORLD_BB_OFFSET;
            bbox.min[0] = this.page[o];
            bbox.min[1] = this.page[o+1];
            bbox.min[2] = this.page[o+2];
            bbox.max[0] = this.page[o+3];
            bbox.max[1] = this.page[o+4];
            bbox.max[2] = this.page[o+5];
        },

        updateWorldSpaceBoundingBox: (function() {
            var t_box = new XML3D.webgl.BoundingBox();

            return function() {
                this.getObjectSpaceBoundingBox(t_box.min, t_box.max);
                this.setWorldSpaceBoundingBox(t_box.min, t_box.max);
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
        }

    });



    window.StateMachine.create({
        target: RenderObject.prototype,
        events:[
            { name:'create', from:'none', to:'NoLights'   },
            // batch processing
            { name:'progress', from:'NoLights', to:'NoMaterial'   },
            { name:'progress', from:'NoMaterial', to:'NoMesh'   },
            { name:'dataNotComplete', from:'NoMesh', to:'NoMeshData' },
            { name:'dataComplete', from:'NoMesh', to:'Ready' },
            { name:'progress', from:'DirtyMeshData', to:'Ready' },
            // events
            { name:'lightsChanged', from: ['NoLights','NoMaterial', 'NoMesh', 'Ready', 'NoMeshData', 'DirtyMeshData'], to:'NoLights' },
            { name:'materialChanged', from: ['NoMaterial', 'NoMesh', 'Ready', 'NoMeshData', 'DirtyMeshData'], to:'NoMaterial' },
            { name:'materialChanged', from: ['NoLights'], to:'NoLights' },
            { name:'dataStructureChanged', from: ['NoMesh', 'Ready', 'NoMeshData', 'DirtyMeshData'], to:'NoMesh' },
            { name:'dataValueChanged', from: ['Ready', 'DirtyMeshData'], to:'DirtyMeshData' },
            { name:'dispose', from:'*', to:'Disposed' }
        ]});


    // Export
    webgl.RenderObject = RenderObject;

}(XML3D.webgl));
