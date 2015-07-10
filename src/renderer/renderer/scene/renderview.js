var RenderNode = require("./rendernode.js");
var Constants = require("./constants.js");
var Frustum = require("../tools/frustum.js").Frustum;
var Vec3 = require("../../../types/vec3.js");
var Mat4 = require("../../../types/mat4.js");

var NODE_TYPE = Constants.NODE_TYPE;
var EVENT_TYPE = Constants.EVENT_TYPE;

    /** @const */
    var VIEW_TO_WORLD_MATRIX_OFFSET = 0;
    /** @const */
    var WORLD_TO_VIEW_MATRIX_OFFSET = 16;
    /** @const */
    var PROJECTION_MATRIX_OFFSET = 32;
    /** @const */
    var ENTRY_SIZE = PROJECTION_MATRIX_OFFSET + 16;

    /** @const */
    var CLIPPLANE_NEAR_MIN = 0.01;

    /** @const */
    var DEFAULT_FIELDOFVIEW = 45 / 180 * Math.PI;

    /**
     *
     * @constructor
     * @extends {RenderNode}
     */
    var RenderView = function(scene, pageEntry, opt) {
        RenderNode.call(this, NODE_TYPE.VIEW, scene, pageEntry, opt);
        opt = opt || {};
        this.position = opt.position || new Vec3();
        this.orientation = opt.orientation || new Mat4();
        this.fieldOfView = opt.fieldOfView !== undefined ? opt.fieldOfView : DEFAULT_FIELDOFVIEW;
        this.worldSpacePosition = new Vec3();
        this.projectionOverride = opt.projectionOverride;
        this.viewDirty = true;
        this.projectionDirty = true;
        this.frustum = new Frustum(1, 100000, 0, this.fieldOfView, 1);
        this.lastAspectRatio = 1;
    };
    RenderView.ENTRY_SIZE = ENTRY_SIZE;

    XML3D.createClass(RenderView, RenderNode);

    XML3D.extend(RenderView.prototype, {
        getFrustum: function() {
            return this.frustum;
        },

        updateViewMatrix: (function() {
            var tmp_mat4 = new Mat4();
            var tmp_parent = new Mat4();

            return function () {
                tmp_mat4.identity();
                tmp_mat4.m41 = this.position.x;
                tmp_mat4.m42 = this.position.y;
                tmp_mat4.m43 = this.position.z;
                // tmp = T * O
                tmp_mat4.multiply(this.orientation);
                this.parent.getWorldMatrix(tmp_parent);
                XML3D.math.mat4.multiply(tmp_mat4.data, tmp_parent.data, tmp_mat4.data);
                this.worldSpacePosition.set(tmp_mat4.m41, tmp_mat4.m42, tmp_mat4.m43);
                this.setViewToWorldMatrix(tmp_mat4);
                tmp_mat4.invert();
                this.setWorldToViewMatrix(tmp_mat4);
                this.viewDirty = false;
            }
        })(),

        updateProjectionMatrix: (function() {
            var tmp = new Mat4();

            return function(aspect) {
                if (this.projectionOverride) {
                    this.setProjectionMatrix(this.projectionOverride);
                    // TODO: Correctly compute frustrum from projection matrix (if possible)
                    this.frustum.setFrustum(1, 100000, 0, this.fieldOfView, 1);
                    return;
                }

                var clipPlane = this.getClippingPlanes(),
                    near = clipPlane.near,
                    far = clipPlane.far,
                    fovy = this.fieldOfView;

                // Calculate perspective projectionMatrix
                tmp.perspective(fovy, aspect, near, far);
                // Set projectionMatrix
                this.setProjectionMatrix(tmp);
                // Update Frustum
                this.frustum.setFrustum(near, far, 0, fovy, aspect);

                this.lastAspectRatio = aspect;
            }
        })(),

        getClippingPlanes: (function() {
            var t_mat = new XML3D.Mat4();
            var bb = new XML3D.Box();

            return function() {
                this.scene.getBoundingBox(bb);
                if (bb.isEmpty()) {
                    return { near: 1, far: 10 };
                }
                this.getWorldToViewMatrix(t_mat);
                bb.transformAxisAligned(t_mat);

                var near = -bb.max.z,
                    far = -bb.min.z,
                    expand = Math.max((far - near) * 0.005, 0.05);

                // Expand the view frustum a bit to ensure 2D objects parallel to the camera are rendered
                far += expand;
                near -= expand;

                return {near: Math.max(near, expand, CLIPPLANE_NEAR_MIN), far: far};
            }
        })(),

        setWorldToViewMatrix: function(source) {
            this.setMat4InPage(source, WORLD_TO_VIEW_MATRIX_OFFSET);
        },

        setViewToWorldMatrix: function(source) {
            this.setMat4InPage(source, VIEW_TO_WORLD_MATRIX_OFFSET);
        },

        setProjectionMatrix: function(source) {
            this.setMat4InPage(source, PROJECTION_MATRIX_OFFSET);
            this.projectionDirty = false;
        },

        setProjectionOverride: function(projAdapter) {
            this.projectionOverride = projAdapter;
            this.setProjectionDirty();
            this.scene.requestRedraw("Projection changed");
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
            this.position.copy(newPos);
        },

        updateOrientation: function(newOrientation) {
            this.setTransformDirty();
            this.orientation.copy(newOrientation);
        },

        updateFieldOfView: function(newFov) {
            this.setTransformDirty();
            this.fieldOfView = newFov;
        },

        getViewToWorldMatrix: function (dest) {
            if (this.viewDirty) {
                this.updateViewMatrix();
            }
            this.getMat4FromPage(dest, VIEW_TO_WORLD_MATRIX_OFFSET);
        },

        getWorldToViewMatrix: function (dest) {
            if (this.viewDirty) {
                this.updateViewMatrix();
            }
            this.getMat4FromPage(dest, WORLD_TO_VIEW_MATRIX_OFFSET);
        },

        getProjectionMatrix: function(dest, aspect) {
            if (this.projectionDirty || aspect != this.lastAspectRatio) {
                this.updateProjectionMatrix(aspect);
            }
            this.getMat4FromPage(dest, PROJECTION_MATRIX_OFFSET);
        },

        getWorldSpacePosition: function() {
            return this.worldSpacePosition;
        },

        getWorldSpaceBoundingBox: function(bbox) {
            bbox.setEmpty();
        }
    });

    // Export
    module.exports = RenderView;

