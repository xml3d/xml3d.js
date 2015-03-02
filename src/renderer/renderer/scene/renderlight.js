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
        case "point":
            return new LightModels.PointLightModel(data, light);
        case "spot":
            return new LightModels.SpotLightModel(data, light);
        case "directional":
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
    var light = opt.light || {};
    this.userData = null;
    this.localIntensity = opt.localIntensity !== undefined ? opt.localIntensity : 1.0;
    this.setLightType(light.type, light.data);
};
RenderLight.ENTRY_SIZE = ENTRY_SIZE;

XML3D.createClass(RenderLight, RenderNode);
XML3D.extend(RenderLight.prototype, {

    setLightType: function (modelId, data) {
        modelId = modelId || "directional";
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
            this.scene.dispatchEvent({type: EVENT_TYPE.LIGHT_VALUE_CHANGED, light: this});
        }
    },

    lightStructureChanged: function (removed) {
        this.scene.dispatchEvent({type: EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, light: this, removed: removed});
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


    setVisible: function (newVal) {
        var visible = (this.localVisible && newVal);
        if (this.visible != visible) {
            this.visible = visible;
            this.lightValueChanged();
        }
    },

    setLocalIntensity: function (intensity) {
        this.localIntensity = intensity;
        this.lightValueChanged();
    },

    remove: function () {
        this.parent.removeChild(this);
        this.scene.lights.remove(this);
        this.lightStructureChanged(true);
    },


    getWorldSpaceBoundingBox: function (bbox) {
        XML3D.math.bbox.empty(bbox);
    },


    // TODO: Move to light model or light model implementation
    getShadowMapLightMatrix: function (target) {
        var L = XML3D.math.mat4.create();
        this.getWorldToLightMatrix(L);
        var lightProjectionMatrix = XML3D.math.mat4.create();
        this.getFrustum(1).getProjectionMatrix(lightProjectionMatrix);
        XML3D.math.mat4.multiply(target, lightProjectionMatrix, L);
    },

    // TODO: Move to light model or light model implementation
    // TODO: Simplify?
    getWorldToLightMatrix: function (mat4) {
        this.getWorldMatrix(mat4);

        //calculate parameters for corresp. light type
        if (this.model.id == "directional") {
            var bb = new XML3D.math.bbox.create();
            this.scene.getBoundingBox(bb);
            var bbSize = XML3D.math.vec3.create();
            var bbCenter = XML3D.math.vec3.create();
            var off = XML3D.math.vec3.create();
            XML3D.math.bbox.center(bbCenter, bb);
            XML3D.math.bbox.size(bbSize, bb);
            var d = XML3D.math.vec3.len(bbSize); //diameter of bounding sphere of the scene
            XML3D.math.vec3.scale(off, this.direction, -0.55 * d); //enlarge a bit on the radius of the scene
            this.position = XML3D.math.vec3.add(this.position, bbCenter, off);
            this.fallOffAngle = 1.568;// set to a default of PI/2, recalculated later

        } else if (this.model.id == "spot") {
            //nothing to do
        } else if (this.model.id == "point") {
            //this.fallOffAngle = Math.PI/4.0;  //calculated on initialization of renderlight
        } else {
            XML3D.debug.logWarning("Light transformation not yet implemented for light type: " + this.model.type);
        }

        //create new transformation matrix depending on the updated parameters
        XML3D.math.mat4.identity(mat4);
        var lookat_mat = XML3D.math.mat4.create();
        var top_vec = XML3D.math.vec3.fromValues(0.0, 1.0, 0.0);
        if ((this.direction[0] == 0.0) && (this.direction[2] == 0.0)) //check if top_vec colinear with direction
            top_vec = XML3D.math.vec3.fromValues(0.0, 0.0, 1.0);
        var up_vec = XML3D.math.vec3.create();
        var dir_len = XML3D.math.vec3.len(this.direction);
        XML3D.math.vec3.scale(up_vec, this.direction, -XML3D.math.vec3.dot(top_vec, this.direction) / (dir_len * dir_len));
        XML3D.math.vec3.add(up_vec, up_vec, top_vec);
        XML3D.math.vec3.normalize(up_vec, up_vec);
        XML3D.math.mat4.lookAt(lookat_mat, XML3D.math.vec3.fromValues(0.0, 0.0, 0.0), this.direction, up_vec);
        XML3D.math.mat4.invert(lookat_mat, lookat_mat);
        XML3D.math.mat4.translate(mat4, mat4, this.position);
        XML3D.math.mat4.multiply(mat4, mat4, lookat_mat);
        // this.setWorldMatrix(mat4);


        if (this.model.id == "directional") { //adjust foa for directional light - needs world Matrix
            var bb = new XML3D.math.bbox.create();
            this.scene.getBoundingBox(bb);
            XML3D.math.bbox.transform(bb, mat4, bb);
            var bbSize = XML3D.math.vec3.create();
            XML3D.math.bbox.size(bbSize, bb);
            var max = (bbSize[0] > bbSize[1]) ? bbSize[0] : bbSize[1];
            max = 0.55 * (max);//enlarge 10percent to make sure nothing gets cut off
            this.fallOffAngle = Math.atan(max);
        }

        XML3D.math.mat4.invert(mat4, mat4);
    },

    // TODO: Move to light model or light model implementation
    getLightData: function (target, offset) {

        /*if (target["castShadow"]) {
         target["castShadow"][offset] = this.castShadow;
         if (this.castShadow) {
         if (target["shadowBias"]) {
         data = result.getOutputData("shadowBias");
         if (this.model.type == "point")
         target["shadowBias"][offset] = data ? data.getValue()[0] : POINT_LIGHT_DEFAULT_SHADOW_BIAS; else if (this.model.type == "spot")
         target["shadowBias"][offset] = data ? data.getValue()[0] : SPOT_LIGHT_DEFAULT_SHADOW_BIAS; else if (this.model.type == "directional")
         target["shadowBias"][offset] = data ? data.getValue()[0] : DIRECTIONAL_LIGHT_DEFAULT_SHADOW_BIAS;
         }
         if (target["lightMatrix"]) {
         var tmp = XML3D.math.mat4.create();
         this.getShadowMapLightMatrix(tmp);
         var off16 = offset * 16;
         for (var i = 0; i < 16; i++) {
         target["lightMatrix"][off16 + i] = tmp[i];
         }
         }
         if (target["lightNearFar"]) {
         var tmpFrustum = this.getFrustum(1);
         var tmp = XML3D.math.vec2.fromValues(tmpFrustum.nearPlane, tmpFrustum.farPlane);
         var off2 = offset * 2;
         for (var i = 0; i < 2; i++) {
         target["lightNearFar"][off2 + i] = tmp[i];
         }
         }
         } else {
         target["shadowBias"][offset] = 0;
         var off16 = offset * 16;
         for (var i = 0; i < 16; i++) {
         target["lightMatrix"][off16 + i] = 0;
         }
         }
         } */
    }
});

module.exports = RenderLight;


