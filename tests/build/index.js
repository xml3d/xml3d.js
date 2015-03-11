module.exports = {
    Frustum: require("../../src/renderer/renderer/tools/frustum"),
    Scene: require("../../src/renderer/renderer/scene/scene"),
    SceneConstants: require("../../src/renderer/renderer/scene/constants"),
    XflowConstants: require("../../src/xflow/interface/constants.js"),
    DataNode: require("../../src/xflow/interface/graph.js").DataNode,
    VSConfig: require("../../src/xflow/interface/vs-connect.js").VSConfig,
    VertexShaderRequest: require("../../src/xflow/interface/request.js").VertexShaderRequest,
    ComputeRequest: require("../../src/xflow/interface/request.js").ComputeRequest
};
