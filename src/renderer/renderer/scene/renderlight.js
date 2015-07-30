var RenderNode = require("./rendernode.js");
var Constants = require("./constants.js");
var LightModels = require("../lights/light-models.js");

var NODE_TYPE = Constants.NODE_TYPE;
var EVENT_TYPE = Constants.EVENT_TYPE;


/** @const */
var ENTRY_SIZE = 32;

var c_BoundingBox = new XML3D.Box();


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

    visibilityChanged: function (newVal) {
        // Visibility is a light parameter
        this.lightValueChanged();
    },

    onTransformDirty: function () {
        this.worldMatrixDirty = true;
        this.lightValueChanged();
    },

    remove: function () {
        this.parent.removeChild(this);
        this.scene.lights.remove(this);
        this.lightStructureChanged(true);
    },


    getWorldSpaceBoundingBox: function (bbox) {
        bbox.setEmpty();
    }
});

module.exports = RenderLight;


