var RenderNode = require("./rendernode.js");
var CameraModels = require("../cameras/camera-models.js");
var Constants = require("./constants.js");
var Frustum = require("../tools/frustum.js").Frustum;
var vec3 = require("gl-matrix").vec3;
var mat4 = require("gl-matrix").mat4;

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

var DEFAULT_CAMERA_CONFIGURATION = { model: "urn:xml3d:camera:perspective", dataNode: null };

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

    this.camera = createCamera(opt.camera ? opt.camera : DEFAULT_CAMERA_CONFIGURATION, this.cameraValueChanged.bind(this));
    this.localMatrix = mat4.create();
    this.worldSpacePosition = vec3.create();
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
        }
    })(),

    getClippingPlanes: (function () {
        var t_mat = mat4.create();
        var bb = new XML3D.Box();

        return function () {
            this.scene.getBoundingBox(bb);
            if (bb.isEmpty()) {
                return {near: 1, far: 10};
            }
            this.getWorldToViewMatrix(t_mat);
            bb.transformAxisAligned(t_mat);

            var near = -bb.max.z, far = -bb.min.z, expand = Math.max((far - near) * 0.005, 0.05);

            // Expand the view frustum a bit to ensure 2D objects parallel to the camera are rendered
            far += expand;
            near -= expand;

            return {near: Math.max(near, expand, CLIPPLANE_NEAR_MIN), far: far};
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
        this.scene.requestRedraw("View's pose changed");
    },

    setProjectionDirty: function () {
        this.projectionDirty = true;
        this.scene.requestRedraw("View's camera changed");
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
            this.setProjectionMatrix(this.camera.getProjectionMatrix(aspect));
            this.frustum = this.camera.getFrustum(aspect);
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

    cameraValueChanged: function() {
        this.setProjectionDirty();
    }
});

/**
 * @param {Configuration} configuration
 * @param {function} cb
 * @returns {Object}
 */
function createCamera(configuration, cb) {

    switch(configuration.model) {
        case "urn:xml3d:camera:perspective":
            return new CameraModels.PerspectiveCameraModel(configuration.dataNode, cb);
        default:
            XML3D.debug.logWarning("Unknown camera model:", configuration.model);
            return new CameraModels.PerspectiveCameraModel(configuration.dataNode, cb);
    }


}

// Export
module.exports = RenderView;

