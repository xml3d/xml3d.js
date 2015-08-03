module.exports = {
    XML3D: require("../../src/xml3d.js").XML3D,
    Frustum: require("../../src/renderer/renderer/tools/frustum"),
    Scene: require("../../src/renderer/renderer/scene/scene"),
    SceneConstants: require("../../src/renderer/renderer/scene/constants"),
    XflowConstants: require("../../src/xflow/interface/constants.js"),
    DataNode: require("../../src/xflow/interface/graph.js").DataNode,
    VSConfig: require("../../src/xflow/processing/vs-connect.js").VSConfig,
    VertexShaderRequest: require("../../src/xflow/interface/request.js").VertexShaderRequest,
    ComputeRequest: require("../../src/xflow/interface/request.js").ComputeRequest,
    Events: require("../../src/interface/notification.js"),
    URI: require("../../src/utils/uri.js"),
    AdapterHandle: require("../../src/base/adapterhandle.js"),
    Adapter: require("../../src/base/adapter.js"),
    addFragmentShaderHeader: require("../../src/renderer/webgl/shader/shader-utils.js").addFragmentShaderHeader,
    callAdapterFunc: require("../../src/utils/misc.js").callAdapterFunc,
    XML3DDataAdapterFactory: require("../../src/data/adapter/factory.js")
};
