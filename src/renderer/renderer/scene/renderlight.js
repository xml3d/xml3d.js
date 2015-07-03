var RenderNode = require("./rendernode.js");
var Constants = require("./constants.js");
var LightModels = require("../lights/light-models.js");

var NODE_TYPE = Constants.NODE_TYPE;
var EVENT_TYPE = Constants.EVENT_TYPE;

var tmp_worldMatrix = XML3D.math.mat4.create();

var SHADOWMAP_OFFSET_MATRIX = new Float32Array([0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0]);

/** @const */
var CLIPPLANE_NEAR_MIN = 1.0;

/** @const */
var ENTRY_SIZE = 16;

var c_BoundingBox = new XML3D.math.bbox.create();


function createLightModel(type, data, light) {
    switch (type) {
        case "urn:xml3d:light:point":
            return new LightModels.PointLightModel(data, light);
        case "urn:xml3d:light:spot":
            return new LightModels.SpotLightModel(data, light);
        case "urn:xml3d:light:directional":
            return new LightModels.DirectionalLightModel(data, light);
        default:
            XML3D.debug.logWarning("Unknown light model: ", type, ". Using directional instead.");
            return new LightModels.DirectionalLightModel(data, light);
    }
}

/**
 * @constructor
 * @param {Scene} scene
 * @param {Object} pageEntry
 * @param {Object} opt
 * @extends {RenderNode}
 */
var RenderLight = function (scene, pageEntry, opt) {
    RenderNode.call(this, NODE_TYPE.LIGHT, scene, pageEntry, opt);
    opt = opt || {};
    var configuration = opt.configuration || {};
    this.setLightType(configuration.model, configuration.dataNode);
    this.visible = true;
};
RenderLight.ENTRY_SIZE = ENTRY_SIZE;

XML3D.createClass(RenderLight, RenderNode);
XML3D.extend(RenderLight.prototype, {

    setLightType: function (modelId, data) {
        if (this.model) {
            if (this.model.id == modelId) {
                return; // Nothing changed
            }
            this.scene.lights.remove(this);
            this.lightStructureChanged(true);
        }
        this.model = createLightModel(modelId, data, this);
        this.scene.lights.add(this);
        this.lightStructureChanged(false);
    },

    setLocalMatrix: function (source) {
        XML3D.debug.logError("RenderLight::setLocalMatrix not implemented");
    },

    setVisible: function(visible) {
        this.visible = visible;
        this.lightValueChanged(); // TODO: Request rendering
    },

    getFrustum: function (aspect) {
        this.scene.getBoundingBox(c_BoundingBox);
        return this.model.getFrustum(aspect, c_BoundingBox);
    },

    lightValueChanged: function () {
        if (this.model) { // FIXME: Complex dependency
            this.scene.emit(EVENT_TYPE.LIGHT_VALUE_CHANGED, this);
        }
    },

    lightStructureChanged: function (removed) {
        this.scene.emit(EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, this, removed);
    },

    updateWorldMatrix: function () {
        if (this.parent) {
            this.parent.getWorldMatrix(tmp_worldMatrix);
            this.setWorldMatrix(tmp_worldMatrix);
            // We change position / direction of the light
            this.lightValueChanged();
        }
    },

    setTransformDirty: function () {
        this.updateWorldMatrix();
    },


    remove: function () {
        this.parent.removeChild(this);
        this.scene.lights.remove(this);
        this.lightStructureChanged(true);
    },


    getWorldSpaceBoundingBox: function (bbox) {
        XML3D.math.bbox.empty(bbox);
    }
});

module.exports = RenderLight;


