(function(webgl) {
    /** @const */
    var VIEW_MATRIX_OFFSET = 0;
    /** @const */
    var PROJECTION_MATRIX_OFFSET = 16;
    /** @const */
    var ENTRY_SIZE = PROJECTION_MATRIX_OFFSET + 16;

    /**
     *
     * @constructor
     * @extends {RenderNode}
     */
    var RenderView = function(scene, pageEntry, opt) {
        XML3D.webgl.RenderNode.call(this, webgl.Scene.NODE_TYPE.VIEW, scene, pageEntry, opt);
        opt = opt || {};
        this.position = opt.position || XML3D.math.vec3.create();
        this.orientation = opt.orientation || XML3D.math.mat4.create();
        this.fieldOfView = opt.fieldOfView !== undefined ? opt.fieldOfView : 0.78;
        this.worldSpacePosition = XML3D.math.vec3.create();
        this.projectionAdapter = opt.projectionAdapter;
        this.viewDirty = true;
        this.projectionDirty = true;
    };
    RenderView.ENTRY_SIZE = ENTRY_SIZE;

    XML3D.createClass(RenderView, XML3D.webgl.RenderNode);
    XML3D.extend(RenderView.prototype, {
        updateViewMatrix: (function() {
            var tmp_mat4 = XML3D.math.mat4.create();
            var tmp_parent = XML3D.math.mat4.create();

            return function (source) {
                XML3D.math.mat4.identity(tmp_mat4);
                tmp_mat4[12] = this.position[0];
                tmp_mat4[13] = this.position[1];
                tmp_mat4[14] = this.position[2];
                // tmp = T * O
                XML3D.math.mat4.multiply(tmp_mat4, tmp_mat4, this.orientation);
                this.parent.getWorldMatrix(tmp_parent);
                XML3D.math.mat4.multiply(tmp_mat4, tmp_parent, tmp_mat4);
                XML3D.math.vec3.set(this.worldSpacePosition, tmp_mat4[12], tmp_mat4[13], tmp_mat4[14]);
                XML3D.math.mat4.invert(tmp_mat4, tmp_mat4);
                this.setViewMatrix(tmp_mat4);
            }
        })(),

        updateProjectionMatrix: (function() {
            var tmp = XML3D.math.mat4.create();

            return function(aspect) {
                if (this.projectionAdapter) {
                    this.setProjectionMatrix(this.projectionAdapter.getMatrix("perspective"));
                    return;
                }
                var clipPlane = this.getClippingPlanes();
                var f = 1 / Math.tan(this.fieldOfView / 2);

                tmp[0] = f / aspect;
                tmp[1] = 0;
                tmp[2] = 0;
                tmp[3] = 0;
                tmp[4] = 0;
                tmp[5] = f;
                tmp[6] = 0;
                tmp[7] = 0;
                tmp[8] = 0;
                tmp[9] = 0;
                tmp[10] = (clipPlane.near + clipPlane.far) / (clipPlane.near - clipPlane.far);
                tmp[11] = -1;
                tmp[12] = 0;
                tmp[13] = 0;
                tmp[14] = 2 * clipPlane.near * clipPlane.far / (clipPlane.near - clipPlane.far);
                tmp[15] = 0;

                this.setProjectionMatrix(tmp);
            }
        })(),

        getClippingPlanes: (function() {
            var t_mat = XML3D.math.mat4.create();
            var bb = new XML3D.math.bbox.create();

            return function() {
                this.scene.getBoundingBox(bb);
                if (XML3D.math.bbox.isEmpty(bb)) {
                    return { near: 1, far: 10 };
                };

                this.getViewMatrix(t_mat);
                XML3D.math.bbox.transform(bb, t_mat, bb);

                var bounds = { zMin: bb[2], zMax: bb[5] };
                var length = XML3D.math.bbox.longestSide(bb);

                // Expand the view frustum a bit to ensure 2D objects parallel to the camera are rendered
                bounds.zMin -= length * 0.005;
                bounds.zMax += length * 0.005;
                //console.log(bounds);

                return {near: Math.max(-bounds.zMax, 0.01*length), far: -bounds.zMin};
            }
        })(),

        setViewMatrix: function(source) {
            var o = this.offset + VIEW_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                this.page[o] = source[i];
            }
            this.viewDirty = false;
        },

        setProjectionMatrix: function(source) {
            var o = this.offset + PROJECTION_MATRIX_OFFSET;
            for(var i = 0; i < 16; i++, o++) {
                this.page[o] = source[i];
            }
            this.projectionDirty = false;
        },

        setProjectionAdapter: function(projAdapter) {
            this.projectionAdapter = projAdapter;
            this.setProjectionDirty();
        },

        setTransformDirty: function() {
            this.viewDirty = true;
            this.setProjectionDirty();
            this.scene.requestRedraw("Transformation changed");
        },

        setProjectionDirty: function() {
            this.projectionDirty = true;
        },

        updatePosition: function(newPos) {
            this.setTransformDirty();
            this.position = newPos;
        },

        updateOrientation: function(newOrientation) {
            this.setTransformDirty();
            this.orientation = newOrientation;
        },

        updateFieldOfView: function(newFov) {
            this.setTransformDirty();
            this.fieldOfView = newFov;
        },

        getViewMatrix: function(dest) {
                if (this.viewDirty) {
                    this.updateViewMatrix();
                }
                var o = this.offset + VIEW_MATRIX_OFFSET;
                for(var i = 0; i < 16; i++, o++) {
                    dest[i] = this.page[o];
                }
        },

        getProjectionMatrix: function(dest, aspect) {
                if (this.projectionDirty) {
                    this.updateProjectionMatrix(aspect);
                }
                var o = this.offset + PROJECTION_MATRIX_OFFSET;
                for(var i = 0; i < 16; i++, o++) {
                    dest[i] = this.page[o];
                }
        },

        getWorldSpacePosition: function() {
            return this.worldSpacePosition;
        },

        getWorldSpaceBoundingBox: function(bbox) {
            XML3D.math.bbox.empty(bbox);
        }
    });

    // Export
    webgl.RenderView = RenderView;

})(XML3D.webgl);
