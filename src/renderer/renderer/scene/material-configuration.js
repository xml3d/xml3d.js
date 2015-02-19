var uniqueObjectId = require("../../webgl/base/utils.js").getUniqueCounter();
/**
 * Connects a material model with a set of default parameters defined by
 * an Xflow DataNode. The MaterialConfiguration is immutable
 *
 * @param model The material model
 * @param {Xflow.DataNode} dataNode  The material parameters of this node
 * @param {{}} opt
 * @constructor
 */
var MaterialConfiguration = function(model, dataNode, opt) {
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

module.exports = MaterialConfiguration;
