var XC = require("../../../xflow/interface/constants.js");
var DataNode = require("../../../xflow/interface/graph.js").DataNode;
var InputNode = require("../../../xflow/interface/graph.js").InputNode;
var BufferEntry = require("../../../xflow/interface/data.js").BufferEntry;
var ComputeRequest = require("../../../xflow/interface/request.js").ComputeRequest;
var Frustum = require("../tools/frustum.js").Frustum;
var mat4 = require("gl-matrix").mat4;
var assert = require('assert');



var ProjectiveCameraData = {
    "projectionMatrix": {
        type: XC.DATA_TYPE.FLOAT4X4, default: mat4.perspective(mat4.create(), (45 * Math.PI / 180), 1, 0.001, 10000)
    }
};

var PerspectiveCameraData = {
    "fovVertical": {type: XC.DATA_TYPE.FLOAT3, 'default': [(45 * Math.PI / 180)]},
    "fovHorizontal": {type: XC.DATA_TYPE.FLOAT3, 'default': undefined},
    "near": {type: XC.DATA_TYPE.FLOAT3, 'default': undefined},
    "far": {type: XC.DATA_TYPE.FLOAT3, 'default': undefined},
    "aspect": {type: XC.DATA_TYPE.FLOAT, 'default': undefined},
    "worldBoundingBox": {type: XC.DATA_TYPE.FLOAT, 'default': undefined}
};

/**
 * @param {DataNode|null} dataNode
 * @param scene
 * @param owner
 * @param {string} model
 * @param defaults
 * @constructor
 */
var AbstractCameraModel = function (dataNode, scene, owner, model, defaults) {
    assert.equal(typeof owner.viewFrustumChanged, 'function');
    assert.equal(typeof model, 'string');
    assert(defaults);
    assert(scene);

    this.owner = owner;
    this.model = model;
    this.scene = scene;
    this.parameters = Object.keys(defaults);

    if (dataNode) {
        var data = new DataNode();
        data.insertBefore(createXflowData(defaults), null);
        data.insertBefore(dataNode, null);
        this.dataNode = data;
    } else {
        this.dataNode = createXflowData(defaults);
    }
    this.dataNode.insertBefore(this.scene.data.data, null);

    this.cameraParameterRequest = new ComputeRequest(this.dataNode, this.parameters, this.cameraParametersChanged.bind(this));
    this.cameraParametersChanged(this.cameraParameterRequest, null);
};

AbstractCameraModel.prototype = {
    cameraParametersChanged: function (request, changeType) {
        if (changeType) {
            this.owner.viewFrustumChanged(changeType);
        }
    }
};


/**
 * @param dataNode
 * @param {Scene} scene
 * @param {RenderView} owner
 * @constructor
 * @extends AbstractCameraModel
 */
var ProjectiveCameraModel = function (dataNode, scene, owner) {
    AbstractCameraModel.call(this, dataNode, scene, owner, "projective", ProjectiveCameraData);
};

XML3D.createClass(ProjectiveCameraModel, AbstractCameraModel, {
    getProjectionMatrix: function (aspect) {
        var result = this.cameraParameterRequest.getResult();
        var projectionMatrix = result.getOutputData("projectionMatrix").getValue();
        return projectionMatrix;
    },

    // TODO(ksons): Compute frustum from projection matrix
    getFrustum: function () {
        return null;
    }
});

/**
 * Perspective Camera Model
 * @param dataNode
 * @param scene
 * @param owner
 * @extends AbstractCameraModel
 * @constructor
 */
var PerspectiveCameraModel = function (dataNode, scene, owner) {
    AbstractCameraModel.call(this, dataNode, scene, owner, "perspective", PerspectiveCameraData);
    this.frustum = new Frustum(0.01, 1000, 0, 0.78, 1);
};

XML3D.createClass(PerspectiveCameraModel, AbstractCameraModel, {

    _updateFrustum: function () {
        var result = this.cameraParameterRequest.getResult();

        var fovv, fovh, near, far;

        var fovhEntry = result.getOutputData("fovHorizontal");
        if (fovhEntry) {
            fovh = fovhEntry.getValue()[0];
        } else {
            fovv = result.getOutputData("fovVertical").getValue()[0];
        }

        var nearEntry = result.getOutputData("near");
        if (nearEntry) {
            near = nearEntry.getValue()[0];
        }

        var farEntry = result.getOutputData("far");
        if (farEntry) {
            far = farEntry.getValue()[0];
        }

        var aspect = result.getOutputData("aspect").getValue()[0];

        if (near == undefined || far == undefined) {
            var boundingBox = new XML3D.Box(result.getOutputData("worldBoundingBox").getValue())
            var nearFar = this.owner.getClippingPlanes(boundingBox);

            near = near == undefined ? nearFar.near : near;
            far = far == undefined ? nearFar.far : far;
        }

        this.frustum.setFrustum(near, far, fovh, fovv, aspect /*, orthographic = false */);
    },

    getProjectionMatrix: function () {
        this._updateFrustum();
        return this.frustum.getProjectionMatrix(mat4.create());
    },

    getFrustum: function () {
        this._updateFrustum();
        return this.frustum;
    }
});

function createXflowData(config) {
    var data = new DataNode();
    for (var name in config) {
        var entry = config[name];
        if (entry['default']) {
            createXflowValue(data, name, entry.type, entry['default']);
        }
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




module.exports = {
    AbstractCameraModel: AbstractCameraModel, PerspectiveCameraModel: PerspectiveCameraModel, ProjectiveCameraModel: ProjectiveCameraModel
};
