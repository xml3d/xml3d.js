var uniqueObjectId = require("../../webgl/base/utils.js").getUniqueCounter();
/**
 * Connects a light model with a data node containing light paramters
 * and a render light to evaluate the world position of the light.
 * The LightConfiguration is immutable
 *
 * @param model The light model
 * @param {Xflow.DataNode} dataNode  The light parameters of this node
 * @param {RenderLight} light  The light in the transformation hierarchy
 * @param {{}} opt
 * @constructor
 */
var LightConfiguration = function(model, dataNode, opt) {
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

module.exports = LightConfiguration;
