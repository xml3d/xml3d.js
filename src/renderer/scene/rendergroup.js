(function(webgl) {
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
        webgl.RenderNode.call(this, webgl.Scene.NODE_TYPE.GROUP, scene, pageEntry, opt);
        opt = opt || {};
        this.shaderHandle = opt.shaderHandle || null;
        this.boundingBoxDirty = false;
        this.setWorldSpaceBoundingBox(XML3D.math.EMPTY_BOX);
    };
    RenderGroup.ENTRY_SIZE = ENTRY_SIZE;

    XML3D.createClass(RenderGroup, webgl.RenderNode);
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
            bbox[0] = this.page[o];
            bbox[1] = this.page[o+1];
            bbox[2] = this.page[o+2];
            bbox[3] = this.page[o+3];
            bbox[4] = this.page[o+4];
            bbox[5] = this.page[o+5];
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



    updateWorldSpaceBoundingBox: (function() {
            var childBB = XML3D.math.bbox.create();

            return function() {
                var localBB = XML3D.math.bbox.create();

                for(var i = 0, j = this.children.length; i < j; i++) {
                    var obj = this.children[i];
                    if (obj.isVisible()) {
                        obj.getWorldSpaceBoundingBox(childBB);
                        XML3D.math.bbox.extendWithBox(localBB, childBB);
                    }
                }
                this.setWorldSpaceBoundingBox(localBB);
                this.boundingBoxDirty = false;
            }
        })(),

        addChild: function(child) {
            this.children.push(child);
            this.setBoundingBoxDirty();
            this.scene.dispatchEvent({type : webgl.Scene.EVENT_TYPE.SCENE_STRUCTURE_CHANGED, newChild: child});
        },

        removeChild: function(child) {
            var index = this.children.indexOf(child);
            if(index != -1) {
                this.children.splice(index, 1);
            }
            this.scene.dispatchEvent({type : webgl.Scene.EVENT_TYPE.SCENE_STRUCTURE_CHANGED, removedChild: child});
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
            if (this.transformDirty) {
                //We can be sure all child nodes are already set to transformDirty from here
                //return;
            }
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
                obj.setShader && obj.setShader(newHandle);
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
        },

        setLocalVisible: function(newVal) {
            this.localVisible = newVal;
            this.setVisible(this.parent && this.parent.isVisible() && newVal);
            this.setBoundingBoxDirty();
        },

        findRayIntersections: (function() {
            var bbox = XML3D.math.bbox.create();

            return function(ray, intersections) {
                this.getWorldSpaceBoundingBox(bbox);
                if (XML3D.math.bbox.intersects(bbox, ray)) {
                    for (var i=0; i < this.children.length; i++) {
                        this.children[i].findRayIntersections(ray, intersections);
                    }
                }
            }
        })()

    });

    // Export
    webgl.RenderGroup = RenderGroup;

})(XML3D.webgl);
