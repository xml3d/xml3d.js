var ComputeRequest = require("../../../xflow/interface/request.js").ComputeRequest;
var GL = require("../../webgl/constants.js");
var uniqueObjectId = require("../../webgl/base/utils.js").getUniqueCounter();
/**
 * A configuration connects a model (material, light, camera) with a data node containing
 * the parameters for the model
 * The Configuration is immutable
 *
 * @param model The model (e.g. identified by an URN)
 * @param {Xflow.DataNode} dataNode  The parameters of this model instance
 * @param {{}} opt
 * @constructor
 */
var Configuration = function(model, dataNode, opt) {
    opt = opt || {};

    this.id = uniqueObjectId();

    /**
     * @type {{type: string}}
     */
    this.model = model;

    /**
     * Data Node of the renderObject
     * @type {Xflow.DataNode}
     */
    this.dataNode = dataNode;

    /**
     * A name for debug purposes
     * @type {string|null}
     */
    this.name = opt.name || null;

    this.states = {};

    createStateRequest(this);
};

function createStateRequest(conf) {
    var request = new ComputeRequest(conf.dataNode, ["gl.depthWrite", "gl.depthTest", "gl.depthFunc",
        "gl.blendEquationSeparate", "gl.blendFuncSeparate", "gl.blend", "gl.cullFace", "gl.cullFaceMode"], updateStates.bind(window, conf));
    updateStates(conf, request);
}

function updateStates(conf, request, data) {
    var state = {};
    var result = request.getResult();
    var stateNames = result.outputNames;
    for (var i=0; i < stateNames.length; i++) {
        var name = stateNames[i];
        name = name.substr(3, name.length);
        var vals = result.getOutputData(stateNames[i]).getValue();
        for (var j=0; j<vals.length; j++) {
            var val = vals[j];
            if (GL[val]) {
                vals[j] = GL[val];
            } else if (typeof val == typeof "") {
                vals[j] = val.toLowerCase() !== "false";
            }
        }
        state[name] = vals;
    }
    conf.states = state;
}

module.exports = Configuration;
