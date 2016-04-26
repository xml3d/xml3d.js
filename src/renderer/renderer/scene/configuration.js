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

};

module.exports = Configuration;
