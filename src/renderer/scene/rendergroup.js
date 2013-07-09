(function() {
    /** @const */
    var WORLD_MATRIX_OFFSET = 0;
    /** @const */
    var LOCAL_MATRIX_OFFSET = WORLD_MATRIX_OFFSET + 16;
    /** @const */
    var WORLD_BB_OFFSET = LOCAL_MATRIX_OFFSET + 16;
    /** @const */
    var ENTRY_SIZE = WORLD_BB_OFFSET + 6;


    /**
     *
     * @constructor
     * @extends {RenderNode}
     */
    var RenderGroup = function(scene, pageEntry, opt) {
        XML3D.webgl.RenderNode.call(this, scene, pageEntry, opt);
        opt = opt || {};
        this.shaderHandle = opt.shaderHandle || null;
        this.boundingBoxDirty = false;
        var bbox = new XML3D.webgl.BoundingBox();
        this.setWorldSpaceBoundingBox(bbox.min, bbox.max);
    };
    RenderGroup.ENTRY_SIZE = ENTRY_SIZE;

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
            this.setBoundingBoxDirty();
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

        setWorldSpaceBoundingBox: function(min, max) {
            var o = this.offset + WORLD_BB_OFFSET;
            this.page[o] = min[0];
            this.page[o+1] = min[1];
            this.page[o+2] = min[2];
            this.page[o+3] = max[0];
            this.page[o+4] = max[1];
            this.page[o+5] = max[2];
        },

        updateWorldSpaceBoundingBox: (function() {
            var local_mat = XML3D.math.mat4.create();

            return function() {
                var localBB = new XML3D.webgl.BoundingBox();
                this.children.forEach(function(obj) {
                    var childBB = new XML3D.webgl.BoundingBox();
                    obj.getWorldSpaceBoundingBox(childBB);
                    localBB.extend(childBB);
                });
                this.getLocalMatrix(local_mat);
                localBB.makeAxisAligned(local_mat);
                this.setWorldSpaceBoundingBox(localBB.min, localBB.max);
                this.boundingBoxDirty = false;
            }
        })(),

        addChild: function(child) {
            this.children.push(child);
        },

        removeChild: function(child) {
            this.children.splice(this.children.indexOf(child), 1);
        },

        getChildren: function() {
            return this.children;
        },

        updateWorldMatrix: function(source) {
            var page = this.page;
            var offset = this.offset;
            XML3D.math.mat4.multiplyOffset(page, offset+WORLD_MATRIX_OFFSET, page, offset+LOCAL_MATRIX_OFFSET,  source, 0);
            this.transformDirty = false;
        },

        setTransformDirty: function() {
            this.transformDirty = true;
            this.children.forEach(function(obj) {
                obj.setTransformDirty();
            });
        },

        setLocalShaderHandle: function(newHandle) {
            this.shaderHandle = undefined;
            if (newHandle === undefined) {
                // Shader was removed, we need to propagate the parent shader down
                this.setShader(this.parent.getShaderHandle());
            } else {
                this.setShader(newHandle);
            }
            this.shaderHandle = newHandle;
        },

        setShader: function(newHandle) {
            if (this.shaderHandle !== undefined) {
                // Local shader overrides anything coming from upstream
                return;
            }
            this.children.forEach(function(obj) {
                obj.setShader(newHandle);
            });
        },

        getShaderHandle: function() {
            if (!this.shaderHandle) {
                return this.parent.getShaderHandle();
            }
            return this.shaderHandle;
        },

        setBoundingBoxDirty: function() {
            this.boundingBoxDirty = true;
            if (this.parent) {
                this.parent.setBoundingBoxDirty();
            }
        }

    });

    // Export
    XML3D.webgl.RenderGroup = RenderGroup;

})();
