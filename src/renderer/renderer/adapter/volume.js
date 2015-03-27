var MeshRenderAdapter = require("./mesh.js");
var Resource = require("../../../base/resourcemanager.js").Resource;

/**
 * @constructor
 */
var VolumeRenderAdapter = function (factory, node) {
    MeshRenderAdapter.call(this, factory, node);
};

XML3D.createClass(VolumeRenderAdapter, MeshRenderAdapter, {
     getMeshType: function () {
        return "volume";
    }
});


module.exports = VolumeRenderAdapter;

