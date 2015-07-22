var XC = require("../../../xflow/interface/constants.js");
var DataNode = require("../../../xflow/interface/graph.js").DataNode;
var InputNode = require("../../../xflow/interface/graph.js").InputNode;
var BufferEntry = require("../../../xflow/interface/data.js").BufferEntry;
var ComputeRequest = require("../../../xflow/interface/request.js").ComputeRequest;
var Frustum = require("../tools/frustum.js").Frustum;
var mat4 = require("gl-matrix").mat4;

var PerspectiveCameraData = {
    "fov-vertical": {type: XC.DATA_TYPE.FLOAT3, 'default': [(45 * Math.PI / 180)]}
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
 * @param model
 * @param dataNode
 * @param defaults
 * @constructor
 */
var AbstractCameraModel = function(model, dataNode, defaults) {
    this.model = model;
     if (dataNode) {
        var data = new DataNode();
        data.insertBefore(createXflowData(defaults), null);
        data.insertBefore(dataNode, null);
        this.dataNode = data;
    } else {
        this.dataNode = createXflowData(defaults);
    }
    this.frustum = new Frustum();
};

/**
 *
 * @param dataNode
 * @extends AbstractCameraModel
 * @constructor
 */
var PerspectiveCameraModel = function(dataNode) {
    AbstractCameraModel.call(this, "perspective", dataNode, PerspectiveCameraData);
};

XML3D.createClass(PerspectiveCameraModel, AbstractCameraModel, {
    getProjectionMatrix: function(aspect) {
        var tmp = mat4.create();

        //var clipPlane = this.getClippingPlanes(), near = clipPlane.near, far = clipPlane.far, fovy = this.fieldOfView;
        var fovv = 0.78;
        var near = 0.1;
        var far = 1000;

        // Calculate perspective projectionMatrix
        mat4.perspective(tmp, fovv, aspect, near, far);

        this.frustum.setFrustum(near, far, 0, fovv, aspect);
        return tmp;
    },
    getFrustum: function() {
        return this.frustum;
    }
});



module.exports = {
    AbstractCameraModel: AbstractCameraModel,
    PerspectiveCameraModel: PerspectiveCameraModel
};
