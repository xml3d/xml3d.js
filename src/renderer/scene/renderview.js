(function(webgl) {
    /** @const */
    var VIEW_TO_WORLD_MATRIX_OFFSET = 0;
    /** @const */
    var WORLD_TO_VIEW_MATRIX_OFFSET = 16;
    /** @const */
    var PROJECTION_MATRIX_OFFSET = 32;
    /** @const */
    var ENTRY_SIZE = PROJECTION_MATRIX_OFFSET + 16;

    /** @const */
    var CLIPPLANE_NEAR_MIN = 1;

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
        this.frustum = new XML3D.webgl.Frustum(1, 100000, 0, this.fieldOfView, 1);
    };
    RenderView.ENTRY_SIZE = ENTRY_SIZE;

    XML3D.createClass(RenderView, XML3D.webgl.RenderNode);
    XML3D.extend(RenderView.prototype, {
        getFrustum: function() {
            return this.frustum;
        },

        updateViewMatrix: (function() {
            var tmp_mat4 = XML3D.math.mat4.create();
            var tmp_parent = XML3D.math.mat4.create();

            return function () {
                XML3D.math.mat4.identity(tmp_mat4);
                tmp_mat4[12] = this.position[0];
                tmp_mat4[13] = this.position[1];
                tmp_mat4[14] = this.position[2];
                // tmp = T * O
                XML3D.math.mat4.multiply(tmp_mat4, tmp_mat4, this.orientation);
                this.parent.getWorldMatrix(tmp_parent);
                XML3D.math.mat4.multiply(tmp_mat4, tmp_parent, tmp_mat4);
                XML3D.math.vec3.set(this.worldSpacePosition, tmp_mat4[12], tmp_mat4[13], tmp_mat4[14]);
                this.setViewToWorldMatrix(tmp_mat4);
                XML3D.math.mat4.invert(tmp_mat4, tmp_mat4);
                this.setWorldToViewMatrix(tmp_mat4);
                this.viewDirty = false;
            }
        })(),

        updateProjectionMatrix: (function() {
            var tmp = XML3D.math.mat4.create();

            return function(aspect) {
                if (this.projectionAdapter) {
                    this.setProjectionMatrix(this.projectionAdapter.getMatrix("perspective"));
                    return;
                }
                var clipPlane = this.getClippingPlanes(),
                    near = clipPlane.near,
                    far = clipPlane.far,
                    fovy = this.fieldOfView;

                // Calculate perspective projectionMatrix
                XML3D.math.mat4.perspective(tmp, fovy, aspect, near, far);
                // Set projectionMatrix
                this.setProjectionMatrix(tmp);
                // Update Frustum
                this.frustum.setFrustum(near, far, 0, fovy, aspect);
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

                this.getWorldToViewMatrix(t_mat);
                XML3D.math.bbox.transform(bb, t_mat, bb);

                var near = -bb[5],
                    far = -bb[2],
                    expand = Math.max((far - near) * 0.01, 0.1);

                // Expand the view frustum a bit to ensure 2D objects parallel to the camera are rendered
                far += expand;
                near -= expand;

                return {near: Math.max(near, CLIPPLANE_NEAR_MIN), far: far};
            }
        })(),

        /**
         * @param {Float32Array} source
         * @param {number} offset
         */
        setMatrix: function(source, offset) {
            var o = this.offset + offset;
            for(var i = 0; i < 16; i++, o++) {
                this.page[o] = source[i];
            }
        },

        setWorldToViewMatrix: function(source) {
            this.setMatrix(source, WORLD_TO_VIEW_MATRIX_OFFSET);
        },

        setViewToWorldMatrix: function(source) {
            this.setMatrix(source, VIEW_TO_WORLD_MATRIX_OFFSET);
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

        getViewToWorldMatrix: function (dest) {
            if (this.viewDirty) {
                this.updateViewMatrix();
            }
            var o = this.offset + VIEW_TO_WORLD_MATRIX_OFFSET;
            for (var i = 0; i < 16; i++, o++) {
                dest[i] = this.page[o];
            }
        },

        getWorldToViewMatrix: function (dest) {
            if (this.viewDirty) {
                this.updateViewMatrix();
            }
            var o = this.offset + WORLD_TO_VIEW_MATRIX_OFFSET;
            for (var i = 0; i < 16; i++, o++) {
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
