var XflowMesh = require("../xflow/xflow-mesh.js");

/**
 * @constructor
 */
var DrawableFactory = function () {};

XML3D.extend(DrawableFactory.prototype, {
    createDrawable: function (obj, context) {
        XML3D.debug.logDebug("DrawableFactory::createDrawable", obj);
        try {
            var result = new XflowMesh(context, obj.configuration, {boundingBoxChanged: obj.setObjectSpaceBoundingBox.bind(obj)});
            obj.mesh = result.getMesh();
            return result;
        } catch (e) {
            XML3D.debug.logError(e, obj.node);
            return null;
        }
    }
});

module.exports = DrawableFactory;


