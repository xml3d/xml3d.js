var NodeAdapterFactory = require("../../base/adapter.js").NodeAdapterFactory;
var Asset = require("./asset.js");
var Misc = require("./misc.js");
var ScriptDataAdapter = require("./script.js");
var TextureDataAdapter = require("./texture.js");
var TransformDataAdapter = require("./transform.js");
var ValueDataAdapter = require("./values.js");
var DataAdapter = require("./data.js");
var ComputeDataAdapter = require("./compute.js");
var DataflowDataAdapter = require("./dataflow.js");
// Register JSON Handler
require("./json/factory.js");
// Register JavaScript Handler (required for external shade.js Javascript resources)
require("./javascript/factory.js");

/**
 * Constructor of XML3DDataAdapterFactory
 * XML3DDataAdapterFactory creates DataAdapter instances for elements using generic data (<mesh>, <data>, <float>,...).
 * Additionally, it manages all DataAdapter instances so that for each node there is always just one DataAdapter. When
 * it creates a DataAdapter, it calls its init method.
 *
 * @constructor
 * @extends AdapterFactory
 */

var XML3DDataAdapterFactory = function () {
    NodeAdapterFactory.call(this, "data");
};
XML3D.createClass(XML3DDataAdapterFactory, NodeAdapterFactory);
XML3DDataAdapterFactory.prototype.aspect = "data";

var reg = {
    'mesh': Misc.SinkDataAdapter,
    'material': Misc.SinkDataAdapter,
    'shader': Misc.SinkDataAdapter, // TODO(ksons): Remove in 5.1
    'light': Misc.SinkDataAdapter,
    'view': Misc.SinkDataAdapter,
    'float': ValueDataAdapter,
    'float2': ValueDataAdapter,
    'float3': ValueDataAdapter,
    'float4': ValueDataAdapter,
    'float4x4': ValueDataAdapter,
    'int': ValueDataAdapter,
    'int4': ValueDataAdapter,
    'bool': ValueDataAdapter,
    'byte': ValueDataAdapter,
    'ubyte': ValueDataAdapter,
    'img': Misc.ImgDataAdapter,
    'texture': TextureDataAdapter,
    'data': DataAdapter,
    'proto': DataAdapter,
    'dataflow': DataflowDataAdapter,
    'compute': ComputeDataAdapter,
    'video': Misc.VideoDataAdapter,
    'script': ScriptDataAdapter,
    'transform': TransformDataAdapter,
    'asset': Asset.AssetAdapter,
    'assetdata': Asset.AssetDataAdapter,
    'assetmesh': Asset.AssetMeshAdapter,
    'model': Asset.AssetAdapter
};

/**
 * Creates a DataAdapter associated with the given node.
 *
 * @param node
 *            element node which uses generic data. The supported elements
 *            are listed in the class description above.
 * @returns DataAdapter instance
 */
XML3DDataAdapterFactory.prototype.createAdapter = function (node) {
    //XML3D.debug.logDebug("Creating adapter: " + node.localName);
    var adapterContructor = reg[node.localName];
    if (adapterContructor !== undefined) {
        return new adapterContructor(this, node);
    }
    XML3D.debug.logWarning("Not supported as data element: " + node.localName);
    return null;
};

module.exports =  XML3DDataAdapterFactory;
