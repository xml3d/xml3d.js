var MeshClosure = require("../xflow/meshclosure.js");

/**
 * @constructor
 */
var DrawableFactory = function () {};

XML3D.extend(DrawableFactory.prototype, {
    createDrawable: function (obj, context) {
        XML3D.debug.logDebug("DrawableFactory::createDrawable", obj);
        try {
            var result = new MeshClosure(context, obj.getType(), obj.getDataNode(), {boundingBoxChanged: obj.setObjectSpaceBoundingBox.bind(obj)});
            obj.mesh = result.getMesh();
            return result;
        } catch (e) {
            XML3D.debug.logError(e, obj.node);
            return null;
        }
    }
});

module.exports = DrawableFactory;


