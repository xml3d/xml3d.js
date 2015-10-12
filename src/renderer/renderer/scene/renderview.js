var RenderNode = require("./rendernode.js");
var CameraModels = require("../cameras/camera-models.js");
var Constants = require("./constants.js");
var Frustum = require("../tools/frustum.js").Frustum;
var vec3 = require("gl-matrix").vec3;
var mat4 = require("gl-matrix").mat4;

/** @const */
var CLIPPLANE_NEAR_MIN = 0.01;

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

var DEFAULT_CAMERA_CONFIGURATION = { model: "urn:xml3d:view:perspective", dataNode: null };

/**
 *
 * @constructor
 * @extends {RenderNode}
 */
var RenderView = function (scene, pageEntry, opt) {
    RenderNode.call(this, NODE_TYPE.VIEW, scene, pageEntry, opt);
    opt = opt || {};

    this.lastAspectRatio = 1;
    this.projectionDirty = true;

    this.camera = createCamera(opt.camera ? opt.camera : DEFAULT_CAMERA_CONFIGURATION, scene, this);
    this.localMatrix = mat4.create();
    this.worldSpacePosition = vec3.create();
    this.viewDirty = true;
    this.frustum = null;
};
RenderView.ENTRY_SIZE = ENTRY_SIZE;

XML3D.createClass(RenderView, RenderNode);

XML3D.extend(RenderView.prototype, {

    setLocalMatrix: function (source) {
        this.localMatrix = source;
        this.setTransformDirty();
    },

    getFrustum: function () {
        return this.frustum;
    },

    updateViewMatrix: (function () {
        var tmp_mat4 = mat4.create();
        var tmp_parent = mat4.create();

        return function () {
            mat4.copy(tmp_mat4, this.localMatrix);
            this.parent.getWorldMatrix(tmp_parent);
            mat4.multiply(tmp_mat4, tmp_parent, tmp_mat4);
            vec3.set(this.worldSpacePosition, tmp_mat4[12], tmp_mat4[13], tmp_mat4[14]);
            this.setViewToWorldMatrix(tmp_mat4);
            mat4.invert(tmp_mat4, tmp_mat4);
            this.setWorldToViewMatrix(tmp_mat4);
            this.viewDirty = false;
            // View frustum might have changed due to clipping planes
            this.viewFrustumChanged();
        }
    })(),

    setWorldToViewMatrix: function (source) {
        this.setMat4InPage(source, WORLD_TO_VIEW_MATRIX_OFFSET);
    },

    setViewToWorldMatrix: function (source) {
        this.setMat4InPage(source, VIEW_TO_WORLD_MATRIX_OFFSET);
    },

    setProjectionMatrix: function (source) {
        this.setMat4InPage(source, PROJECTION_MATRIX_OFFSET);
        this.projectionDirty = false;
    },

    setTransformDirty: function () {
        this.viewDirty = true;
        this.scene.requestRedraw("view pose changed");
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

    getProjectionMatrix: function (dest, aspect) {
        if (this.projectionDirty || Math.abs(aspect - this.lastAspectRatio) > 0.001 ) {
            // Set projectionMatrix
            this.frustum = this.camera.getFrustum(aspect);
            if(this.frustum) {
                this.setProjectionMatrix(this.frustum.getProjectionMatrix(mat4.create()));
            } else {
                this.setProjectionMatrix(this.camera.getProjectionMatrix())
            }
            this.lastAspectRatio = aspect;
        }
        this.getMat4FromPage(dest, PROJECTION_MATRIX_OFFSET);
    },

    getWorldSpacePosition: function () {
        return this.worldSpacePosition;
    },

    getWorldSpaceBoundingBox: function (bbox) {
        bbox.setEmpty();
    },

    viewFrustumChanged: function() {
        this.projectionDirty = true;
        this.scene.requestRedraw("view frustum changed");
    },

    getClippingPlanes: function(bb) {
        if(!bb) {
            bb = new XML3D.Box();
            this.scene.getBoundingBox(bb);
        }
        if (bb.isEmpty()) {
            return {near: 1, far: 10};
        }
        var w2v = mat4.create();
        this.getWorldToViewMatrix(w2v);
        bb.transformAxisAligned(w2v);

        var near = -bb.max.z, far = -bb.min.z, expand = Math.max((far - near) * 0.005, 0.05);

        // Expand the view frustum a bit to ensure 2D objects parallel to the camera are rendered
        near = Math.max(near - expand, expand, CLIPPLANE_NEAR_MIN);
        far = Math.max(far + expand, near + expand);
        return {near: near, far: far};
    },

    remove: function() {
        this.camera.destroy();
    }
});

/**
 * @param {Configuration} configuration
 * @param {Scene} scene
 * @param {RenderView} owner
 * @returns {Object}
 */
function createCamera(configuration, scene, owner) {

    switch(configuration.model) {
        case "urn:xml3d:view:perspective":
            return new CameraModels.PerspectiveCameraModel(configuration.dataNode, scene, owner);
        case "urn:xml3d:view:projective":
            return new CameraModels.ProjectiveCameraModel(configuration.dataNode, scene, owner);
        default:
            XML3D.debug.logWarning("Unknown camera model:", configuration.model);
            return new CameraModels.PerspectiveCameraModel(configuration.dataNode, scene, owner);
    }


}

// Export
module.exports = RenderView;

