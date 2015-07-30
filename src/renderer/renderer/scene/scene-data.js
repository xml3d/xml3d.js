var DataNode = require("../../../xflow/interface/graph.js").DataNode;
var ComputeRequest = require("../../../xflow/interface/request.js").ComputeRequest;
var XC = require("../../../xflow/interface/constants.js");
var BufferEntry = require("../../../xflow/interface/data.js").BufferEntry;
var InputNode = require("../../../xflow/interface/graph.js").InputNode;

var SceneParameters = ["width", "height", "aspect", "worldBoundingBox"];

/**
 *
 * @constructor
 */
var SceneData = function() {
    this.data = new DataNode(false);

    var width = createInputNode(this.data, "width", XC.DATA_TYPE.FLOAT, new Float32Array([600]));
    var height = createInputNode(this.data, "height", XC.DATA_TYPE.FLOAT, new Float32Array([800]));
    var worldBoundingBox = createInputNode(this.data, "worldBoundingBox", XC.DATA_TYPE.FLOAT, new XML3D.Box().data);

    var request = new ComputeRequest(this.data, SceneParameters, null);
    var result = this.result = request.getResult();

    defineFloatProperty(this, "width", result, width);
    defineFloatProperty(this, "height", result, height);

    Object.defineProperty(this, "worldBoundingBox", {
        get: function () {
            return result.getOutputData("worldBoundingBox").getValue();
        }, set: function (value) {
            worldBoundingBox.data.setValue(value);
        }
    });

    Object.defineProperty(this, "aspect", { writeable: false, get: function() {
        return result.getOutputData("aspect").getValue()[0];
    }});

    this.data.setCompute("aspect = xflow.div(width, height)");

};

function defineFloatProperty(obj, name, result, field) {
    Object.defineProperty(obj, name, {
        get: function () {
            return result.getOutputData(name).getValue()[0];
        },
        set: function (value) {
            field.data.setValue(new Float32Array([value]));
        }
    });
}


function createInputNode(dataNode, name, type, value) {
    var inputNode = new InputNode();
    inputNode.data = new BufferEntry(type, value);
    inputNode.name = name;
    dataNode.appendChild(inputNode);
    return inputNode;
}


module.exports = SceneData;
