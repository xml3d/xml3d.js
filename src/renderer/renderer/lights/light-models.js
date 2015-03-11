var Frustum = require("../tools/frustum.js").Frustum;
var XC = require("../../../xflow/interface/constants.js");
var DataNode = require("../../../xflow/interface/graph.js").DataNode;
var InputNode = require("../../../xflow/interface/graph.js").InputNode;
var BufferEntry = require("../../../xflow/interface/data.js").BufferEntry;
var ComputeRequest = require("../../../xflow/interface/request.js").ComputeRequest;

var PointLightData = {
    "intensity": {type: XC.DATA_TYPE.FLOAT3, 'default': [1, 1, 1]},
    "attenuation": {type: XC.DATA_TYPE.FLOAT3, 'default': [0, 0, 1]},
    "position": {type: XC.DATA_TYPE.FLOAT3, 'default': [0, 0, 0]},
    "shadowBias": {type: XC.DATA_TYPE.FLOAT, 'default': [0.0001]},
    "castShadow": {type: XC.DATA_TYPE.BOOL, 'default': [false]},
    "on": {type: XC.DATA_TYPE.BOOL, 'default': [true]}
};

var SpotLightData = {
    "intensity": {type: XC.DATA_TYPE.FLOAT3, 'default': [1, 1, 1]},
    "attenuation": {type: XC.DATA_TYPE.FLOAT3, 'default': [0, 0, 1]},
    "position": {type: XC.DATA_TYPE.FLOAT3, 'default': [0, 0, 0]},
    "direction": {type: XC.DATA_TYPE.FLOAT3, 'default': [0, 0, -1]},
    "falloffAngle": {type: XC.DATA_TYPE.FLOAT, 'default': [Math.PI / 4]},
    "softness": {type: XC.DATA_TYPE.FLOAT, 'default': [0.0]},
    "shadowBias": {type: XC.DATA_TYPE.FLOAT, 'default': [0.0001]},
    "castShadow": {type: XC.DATA_TYPE.BOOL, 'default': [false]},
    "on": {type: XC.DATA_TYPE.BOOL, 'default': [true]}
};

var DirectionalLightData = {
    "intensity": {type: XC.DATA_TYPE.FLOAT3, 'default': [1, 1, 1]},
    "direction": {type: XC.DATA_TYPE.FLOAT3, 'default': [0, 0, -1]},
    "shadowBias": {type: XC.DATA_TYPE.FLOAT, 'default': [0.0001]},
    "castShadow": {type: XC.DATA_TYPE.BOOL, 'default': [false]},
    "on": {type: XC.DATA_TYPE.BOOL, 'default': [true]}
};


function createXflowData(config) {
    var data = new DataNode();
    for (var name in config) {
        var entry = config[name];
        createXflowValue(data, name, entry.type, entry['default']);
    }
    return data;
}

function createXflowValue(dataNode, name, type, value) {
    var buffer = new BufferEntry(type, new XC.TYPED_ARRAY_MAP[type](value));
    var inputNode = new InputNode();
    inputNode.data = buffer;
    inputNode.name = name;
    dataNode.appendChild(inputNode);
}

/**
 * Base class for light models
 * @param {string} id Unique id that identifies the light model
 * @param {RenderLight} light
 * @param {DataNode} dataNode
 * @param {Object} config Configuration that contains the light model's parameters and default values
 * @constructor
 */
var LightModel = function (id, light, dataNode, config) {
    this.id = id;
    this.light = light;
    this.dataNode = dataNode;
    this.configuration = config;
    this.parameters = Object.keys(config);
    /**
     * If the light has not data, just use the default parameters
     */
    if (dataNode) {
        dataNode.insertBefore(createXflowData(config), null);
    } else {
        dataNode = createXflowData(config);
    }
    this.lightParameterRequest = new ComputeRequest(dataNode, this.parameters, this.lightParametersChanged.bind(this));
    this.lightParametersChanged(this.lightParameterRequest, null);
};

LightModel.prototype = {
    /**
     * Copies the light parameters in an array of the same size
     * @param {Object} target Name to typed array map containing the data
     * @param {number} offset Slot in the array to be filled
     */
    fillLightParameters: function (target, offset) {
        var result = this.lightParameterRequest.getResult();
        this.parameters.forEach(function (name) {
            var entry = result.getOutputData(name);
            var size = XC.DATA_TYPE_TUPLE_SIZE[entry.type];
            var value = entry.getValue();
            target[name].set(value.subarray(0, size), offset * size);
        });
        this.transformParameters(target, offset);
    },

    allocateParameterArray: function (size) {
        var parameterArrays = {};
        var config = this.configuration;
        this.parameters.forEach(function (name) {
            var type = config[name].type;
            var tupleSize = XC.DATA_TYPE_TUPLE_SIZE[type];
            parameterArrays[name] = new XC.TYPED_ARRAY_MAP[type](tupleSize * size);
        });
        return parameterArrays;
    },

    lightParametersChanged: function (request, changeType) {
        if (changeType) {
            this.light.lightValueChanged();
        }
    },

    getFrustum: function(aspect, sceneBoundingBox) {
        var orthogonal = this.id == "directional";
        var t_mat = XML3D.math.mat4.create();

        if (XML3D.math.bbox.isEmpty(sceneBoundingBox)) {
            return new Frustum(1.0, 110.0, 0, this.fallOffAngle * 2, aspect, orthogonal)
        }
        this.light.getWorldToLightMatrix(t_mat);

        XML3D.math.bbox.transform(sceneBoundingBox, t_mat, sceneBoundingBox);

        var near = 1.0, far = 2.0;
        if (this.id == "point") {
            //TODO optimise near ?
            near = 1.0;
            far = Math.max(Math.abs(sceneBoundingBox[0]), Math.abs(sceneBoundingBox[1]), Math.abs(sceneBoundingBox[2]), Math.abs(sceneBoundingBox[3]), Math.abs(sceneBoundingBox[4]), Math.abs(sceneBoundingBox[5]));
        } else {
            near = -sceneBoundingBox[5];
            far = -sceneBoundingBox[2];
        }
        var expand = Math.max((far - near) * 0.30, 0.05);

        // Expand the view frustum a bit to ensure 2D objects parallel to the camera are rendered
        far += expand;
        near -= expand;
        return new Frustum(1.0, far, 0, this.fallOffAngle * 2, aspect, orthogonal);
    }

};

var c_tmpWorldMatrix = XML3D.math.mat4.create();

function transformPose(light, position, direction) {
    light.getWorldMatrix(c_tmpWorldMatrix);
    if (position) {
        XML3D.math.vec3.transformMat4(position, position, c_tmpWorldMatrix);
    }
    if (direction) {
        XML3D.math.vec3.transformDirection(direction, direction, c_tmpWorldMatrix);
        XML3D.math.vec3.normalize(direction, direction);
    }
}

function transformDefault(target, offset, light) {
    var color = target["intensity"].subarray(offset * 3, offset * 3 + 3);
    XML3D.math.vec3.scale(color, color, light.localIntensity);
    target["on"][offset] = light.visible;
}


/**
 * Implement XML3D's predefined point light model urn:xml3d:lightshader:point
 * @param {DataNode} dataNode
 * @param {RenderLight} light
 * @extends LightModel
 * @constructor
 */
var PointLightModel = function (dataNode, light) {
    LightModel.call(this, "point", light, dataNode, PointLightData);
};

XML3D.createClass(PointLightModel, LightModel, {

    transformParameters: function (target, offset) {
        var position = target["position"].subarray(offset * 3, offset * 3 + 3);
        transformPose(this.light, position, null);
        transformDefault(target, offset, this.light);
    },

    getFrustum: function (aspect) {
        var orthogonal = this.light.type == "directional";
        var t_mat = XML3D.math.mat4.create();
        var bb = new XML3D.math.bbox.create();
        this.scene.getBoundingBox(bb);

        if (XML3D.math.bbox.isEmpty(bb)) {
            return new Frustum(1.0, 110.0, 0, this.fallOffAngle * 2, aspect, orthogonal)
        }
        this.getWorldToLightMatrix(t_mat);

        XML3D.math.bbox.transform(bb, t_mat, bb);

        var near = 1.0, far = 2.0;
        if (this.light.type == "point") {
            //TODO optimise near ?
            near = 1.0;
            far = Math.max(Math.abs(bb[0]), Math.abs(bb[1]), Math.abs(bb[2]), Math.abs(bb[3]), Math.abs(bb[4]), Math.abs(bb[5]));
        } else {
            near = -bb[5];
            far = -bb[2];
        }
        var expand = Math.max((far - near) * 0.30, 0.05);

        // Expand the view frustum a bit to ensure 2D objects parallel to the camera are rendered
        far += expand;
        near -= expand;
        return new Frustum(1.0, far, 0, this.fallOffAngle * 2, aspect, orthogonal);
    }


});




/**
 * Implement XML3D's predefined spot light model urn:xml3d:lightshader:spot
 * @param {DataNode} dataNode
 * @param {RenderLight} light
 * @extends LightModel
 * @constructor
 */
var SpotLightModel = function (dataNode, light) {
    LightModel.call(this, "spot", light, dataNode, SpotLightData);
};


XML3D.createClass(SpotLightModel, LightModel, {

    transformParameters: function (target, offset) {
        var position = target["position"].subarray(offset * 3, offset * 3 + 3);
        var direction = target["direction"].subarray(offset * 3, offset * 3 + 3);
        transformPose(this.light, position, direction);
        transformDefault(target, offset, this.light);
    }

});




/**
 * Implement XML3D's predefined spot light model urn:xml3d:lightshader:directional
 * @param {DataNode} dataNode
 * @param {RenderLight} light
 * @extends LightModel
 * @constructor
 */
var DirectionalLightModel = function (dataNode, light) {
    LightModel.call(this, "directional", light, dataNode, DirectionalLightData);
};

XML3D.createClass(DirectionalLightModel, LightModel, {

    transformParameters: function (target, offset) {
        var direction = target["direction"].subarray(offset * 3, offset * 3 + 3);
        transformPose(this.light, null, direction);

        transformDefault(target, offset, this.light);
    }

});

module.exports = {
    PointLightModel: PointLightModel, SpotLightModel: SpotLightModel, DirectionalLightModel: DirectionalLightModel

};
