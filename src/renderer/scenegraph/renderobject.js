(function () {

    /**
     *
     * @interface
     */
    var IRenderNode = function() {};
    IRenderNode.prototype.getModelMatrix = function() {};
    IRenderNode.prototype.setModelMatrix = function() {};
    IRenderNode.prototype.getObjectSpaceBoundingBox = function() {};
    IRenderNode.prototype.getModelViewMatrix = function() {};
    IRenderNode.prototype.getWorldSpaceBoundingBox = function() {};
    IRenderNode.prototype.isVisible = function() {};
    IRenderNode.prototype.getChildren = function() {};
    IRenderNode.prototype.getParent = function() {};

    /**
     *
     * @interface
     * @extends {IRenderNode}
     */
    var IRenderGroup = function() {};

    /**
     *
     * @interface
     * @extends {IRenderNode}
     */
    var IRenderObject = function() {};


    // Entry:
    // 1: WorldTransformation [16 floats]
    var MODEL_MATRIX_OFFSET = 0;
    var MODELVIEW_MATRIX_OFFSET = 16;
    var MODELVIEWPROJECTION_MATRIX_OFFSET = 32;
    var NORMAL_MATRIX_OFFSET = 48;
    var c_tmpMatrix = XML3D.math.mat4.create();


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
        // console.log(pageEntry);
        this.handler = handler;
        this.page = pageEntry.page;
        this.offset = pageEntry.offset;
        this.meshAdapter = opt.meshAdapter;
        this.shaderAdapter = null;
        this.shader = opt.shader || null;
        this.setTransformation(opt.transform || RenderObject.IDENTITY_MATRIX);
        this.visible = opt.visible !== undefined ? opt.visible : true;
        this.meshAdapter.renderObject = this;
        /** {Object?} **/
        this.override = null;
        this.create();
    };

    RenderObject.IDENTITY_MATRIX = XML3D.math.mat4.create();
    RenderObject.prototype = {
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

        getModelMatrix: function(target) {
            var o = this.offset + MODEL_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                target[i] = this.page[o];
            }
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

        getModelViewProjectionMatrix: function(target) {
            var o = this.offset + MODELVIEWPROJECTION_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                target[i] = this.page[o];
            }
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
            XML3D.math.mat4.multiplyOffset(page, offset+MODELVIEW_MATRIX_OFFSET, page, offset+MODEL_MATRIX_OFFSET,  view, 0);
        },
        /** Relies on an up-to-date view matrix **/
        updateNormalMatrix: function() {
            this.getModelViewMatrix(c_tmpMatrix);
            var normalMatrix = XML3D.math.mat4.invert(c_tmpMatrix, c_tmpMatrix);
            normalMatrix = normalMatrix ? XML3D.math.mat4.transpose(normalMatrix, normalMatrix) : RenderObject.IDENTITY_MATRIX;
            var o = this.offset + NORMAL_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                this.page[o] = normalMatrix[i];
            }
        },
        /** Relies on an up-to-date view matrix **/
        updateModelViewProjectionMatrix: function(projection) {
            var page = this.page;
            var offset = this.offset;
            XML3D.math.mat4.multiplyOffset(page, offset+MODELVIEWPROJECTION_MATRIX_OFFSET, page, offset+MODELVIEW_MATRIX_OFFSET,  projection, 0);
        },

        setModelMatrix: function(source) {
            var o = this.offset + MODEL_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                this.page[o] = source[i];
            }
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

        getChildren: function() {
            return [];
        },
        getParent: function() {
            // TODO: Placeholder
        },
        isVisible: function() {
            // TODO: Placeholder
        },
        getWorldSpaceBoundingBox: function() {
            // TODO: Placeholder
        },
        getObjectSpaceBoundingBox: function() {
            // TODO: Placeholder
        }
    };

    // Export
    XML3D.webgl.RenderObject = RenderObject;

    //noinspection JSClosureCompilerSyntax,JSClosureCompilerSyntax
    /**
     *
     * @constructor
     * @implements {IRenderGroup}
     */
    var RenderGroup = function() {

    };

    RenderGroup.prototype = {
        getModelMatrix: function() {
            // TODO: Placeholder
        },
        setModelMatrix: function() {
            // TODO: Placeholder
        },

        getModelViewMatrix: function() {
            // TODO: Placeholder
        },

        getChildren: function() {
            return [];
        },

        getParent: function() {
            // TODO: Placeholder
        },

        isVisible: function() {
            // TODO: Placeholder
        },

        getWorldSpaceBoundingBox: function() {
            // TODO: Placeholder
        },

        getObjectSpaceBoundingBox: function() {
            // TODO: Placeholder
        }

    };

    // Export
    XML3D.webgl.RenderGroup = RenderGroup;
}());
