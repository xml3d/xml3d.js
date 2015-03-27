var XflowMesh = require("../xflow/xflow-mesh.js");
var XflowVolume = require("../xflow/xflow-volume.js");

/**
 * @constructor
 */
var DrawableFactory = function () {};

XML3D.extend(DrawableFactory.prototype, {
    createDrawable: function (obj, context) {
        XML3D.debug.logDebug("DrawableFactory::createDrawable", obj);

        var isVolume = obj.getType() == "volume";

        try {
            var result;
            if (isVolume) {
                result = new XflowVolume(context, obj.getDataNode(), "triangles", {boundingBoxChanged: obj.setObjectSpaceBoundingBox.bind(obj)});
            } else {
                result = new XflowMesh(context, obj.getDataNode(), obj.getType(), {boundingBoxChanged: obj.setObjectSpaceBoundingBox.bind(obj)});
            }

            obj.mesh = result.getMesh();
            return result;
        } catch (e) {
            XML3D.debug.logError(e, obj.node);
            return null;
        }
    }
});

module.exports = DrawableFactory;


