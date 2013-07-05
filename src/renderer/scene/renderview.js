(function() {
    /** @const */
    var VIEW_MATRIX_OFFSET = 0;
    /** @const */
    var PROJECTION_MATRIX_OFFSET = 16;

    /**
     *
     * @constructor
     * @extends {RenderNode}
     */
    var RenderView = function(scene, pageEntry, opt) {
        XML3D.webgl.RenderNode.call(this, scene, pageEntry, opt);
        this.position = opt.position;
        this.orientation = opt.orientation;
        this.fieldOfView = opt.fieldOfView;
        this.worldSpacePosition = [0,0,0];
        this.viewDirty = true;
        this.projectionDirty = true;
    };
    XML3D.createClass(RenderView, XML3D.webgl.RenderNode);
    XML3D.extend(RenderView.prototype, {
        updateViewMatrix: (function() {
            var tmp_mat4 = XML3D.math.mat4.create();
            var tmp_parent = XML3D.math.mat4.create();

            return function (source) {
                var page = this.page;
                var offset = this.offset;
                XML3D.math.mat4.identity(tmp_mat4);
                tmp_mat4[12] = this.position[0];
                tmp_mat4[13] = this.position[1];
                tmp_mat4[14] = this.position[2];
                // tmp = T * O
                XML3D.math.mat4.multiply(tmp_mat4, tmp_mat4, this.orientation);
                this.parent.getWorldMatrix(tmp_parent);
                XML3D.math.mat4.multiply(tmp_mat4, tmp_parent, tmp_mat4);
                this.worldPosition = [tmp_mat4[12], tmp_mat4[13], tmp_mat4[14]];
                XML3D.math.mat4.invert(tmp_mat4, tmp_mat4);
                this.setViewMatrix(tmp_mat4);
            }
        })(),

        updateProjectionMatrix: (function() {
            var tmp = XML3D.math.mat4.create();

            return function(aspect) {
                var clipPlane = this.getClippingPlane();
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

        getClippingPlane: (function() {
            var t_mat = XML3D.math.mat4.create();
            var t_min = XML3D.math.vec3.create();
            var t_max = XML3D.math.vec3.create();

            return function() {
                /*
                this.getViewMatrix(t_mat);
                this.scene.getBoundingBox(t_min, t_max);

                XML3D.math.vec3.transformMat4(t_min, t_min, t_mat);
                XML3D.math.vec3.transformMat4(t_max, t_max, t_mat);
                */
                return {near : 0.1, far : 10000};
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

        setTransformDirty: function() {
            this.viewDirty = true;
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

        getWorldSpaceBoundingBox: function(min, max) {
            min[0] = Number.MAX_VALUE;
            min[1] = Number.MAX_VALUE;
            min[2] = Number.MAX_VALUE;
            max[0] = -Number.MAX_VALUE;
            max[1] = -Number.MAX_VALUE;
            max[2] = -Number.MAX_VALUE;
        }
    });

    // Export
    XML3D.webgl.RenderView = RenderView;

})();
