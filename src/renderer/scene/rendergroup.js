(function() {
    /** @const */
    var LOCAL_MATRIX_OFFSET = 0;
    /** @const */
    var WORLD_MATRIX_OFFSET = 16;

    /**
     *
     * @constructor
     * @extends {RenderNode}
     */
    var RenderGroup = function(scene, pageEntry, opt) {
        XML3D.webgl.RenderNode.call(this, scene, pageEntry, opt);
        this.shaderHandle = opt.shaderHandle || null;
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
        }

    });

    // Export
    XML3D.webgl.RenderGroup = RenderGroup;

})();
