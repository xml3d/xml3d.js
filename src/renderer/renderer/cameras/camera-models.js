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
        type: XC.DATA_TYPE.FLOAT4X4, 'default': mat4.perspective(mat4.create(), (45 * Math.PI / 180), 1, 0.001, 10000)
    }
};

var PerspectiveCameraData = {
    "fov-vertical": {type: XC.DATA_TYPE.FLOAT3, 'default': [(45 * Math.PI / 180)]},
    "fov-horizontal": {type: XC.DATA_TYPE.FLOAT3, 'default': undefined},
    "near": {type: XC.DATA_TYPE.FLOAT3, 'default': undefined},
    "far": {type: XC.DATA_TYPE.FLOAT3, 'default': undefined}
};

/**
 * @param {DataNode|null} dataNode
 * @param {string} model
 * @param defaults
 * @param {function} cb
 * @constructor
 */
var AbstractCameraModel = function (dataNode, cb, model, defaults) {
    assert.equal(typeof cb, 'function');
    assert.equal(typeof model, 'string');
    assert(defaults);

    this.cb = cb;
    this.model = model;
    this.parameters = Object.keys(defaults);

    if (dataNode) {
        var data = new DataNode();
        data.insertBefore(createXflowData(defaults), null);
        data.insertBefore(dataNode, null);
        this.dataNode = data;
    } else {
        this.dataNode = createXflowData(defaults);
    }
    this.cameraParameterRequest = new ComputeRequest(this.dataNode, this.parameters, this.cameraParametersChanged.bind(this));
    this.cameraParametersChanged(this.cameraParameterRequest, null);
};

AbstractCameraModel.prototype = {
    cameraParametersChanged: function (request, changeType) {
        if (changeType) {
            cb(changeType);
        }
    }
};


/**
 * @param cb
 * @param dataNode
 * @constructor
 * @extends AbstractCameraModel
 */
var ProjectiveCameraModel = function (dataNode, cb) {
    AbstractCameraModel.call(this, dataNode, cb, "projective", ProjectiveCameraData);
};

XML3D.createClass(ProjectiveCameraModel, AbstractCameraModel, {
    getProjectionMatrix: function (aspect) {
        var result = this.cameraParameterRequest.getResult();
        var projectionMatrix = result.getOutputData("projectionMatrix").getValue()[0];
        console.log(projectionMatrix);
        return projectionMatrix;
    }, // TODO(ksons): Compute frustum from projection matrix
    getFrustum: function () {
        return null;
    }
});

/**
 * Perspective Camera Model
 * @param dataNode
 * @param cb
 * @extends AbstractCameraModel
 * @constructor
 */
var PerspectiveCameraModel = function (dataNode, cb) {
    AbstractCameraModel.call(this, dataNode, cb, "perspective", PerspectiveCameraData);
    this.frustum = new Frustum();
};

XML3D.createClass(PerspectiveCameraModel, AbstractCameraModel, {

    _updateFrustum: function (aspect) {
        var result = this.cameraParameterRequest.getResult();

        var fovv, fovh, near, far;

        var fovhEntry = result.getOutputData("fov-horizontal");
        if (fovhEntry) {
            fovh = fovhEntry.getValue()[0];
        } else {
            fovv = result.getOutputData("fov-vertical").getValue()[0];
        }

        var nearEntry = result.getOutputData("near");
        if (nearEntry) {
            near = nearEntry.getValue()[0];
        } else {
            near = 0.01;
        }

        var farEntry = result.getOutputData("far");
        if (farEntry) {
            far = farEntry.getValue()[0];
        } else {
            far = 10000;
        }

        if (near == undefined || far == undefined) {
            // Compute near / far clipping planes automatically
        }

        this.frustum.setFrustum(near, far, fovh, fovv, aspect);
    },

    getProjectionMatrix: function (aspect) {
        //console.log("called getProjectionMatrix");
        this._updateFrustum(aspect);
        return this.frustum.getProjectionMatrix(mat4.create());
    },

    getFrustum: function (aspect) {
        this._updateFrustum(aspect);
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
    AbstractCameraModel: AbstractCameraModel, PerspectiveCameraModel: PerspectiveCameraModel
};
