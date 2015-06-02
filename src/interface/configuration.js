var methods = require("./methods.js");
var handlers = require("./attributes.js");
var properties = require("./properties.js");

// MeshTypes
var MeshTypes = {};
MeshTypes["triangles"] = 0;
MeshTypes[0] = "triangles";
MeshTypes["trianglestrips"] = 1;
MeshTypes[1] = "trianglestrips";
MeshTypes["lines"] = 2;
MeshTypes[2] = "lines";
MeshTypes["linestrips"] = 3;
MeshTypes[3] = "linestrips";
MeshTypes["points"] = 4;
MeshTypes[4] = "points";
// TextureTypes
var TextureTypes = {};
TextureTypes["2d"] = 0;
TextureTypes[0] = "2d";
TextureTypes["1d"] = 1;
TextureTypes[1] = "1d";
TextureTypes["3d"] = 2;
TextureTypes[2] = "3d";

// PlatformTypes
var PlatformTypes = {};
PlatformTypes["auto"] = 1;
PlatformTypes[1] = "auto";
PlatformTypes["js"] = 2;
PlatformTypes[2] = "js";
PlatformTypes["gl"] = 3;
PlatformTypes[3] = "gl";
PlatformTypes["cl"] = 4;
PlatformTypes[4] = "cl";
// DataFieldType
var DataFieldType = {};
DataFieldType["float "] = 0;
DataFieldType[0] = "float ";
DataFieldType["float2 "] = 1;
DataFieldType[1] = "float2 ";
DataFieldType["float3"] = 2;
DataFieldType[2] = "float3";
DataFieldType["float4"] = 3;
DataFieldType[3] = "float4";
DataFieldType["float4x4"] = 4;
DataFieldType[4] = "float4x4";
DataFieldType["int"] = 10;
DataFieldType[10] = "int";
DataFieldType["int4"] = 11;
DataFieldType[11] = "int4";
DataFieldType["bool"] = 20;
DataFieldType[20] = "bool";
DataFieldType["texture"] = 30;
DataFieldType[30] = "texture";
// DataChannelOrigin
var DataChannelOrigin = {};
DataChannelOrigin["origin_value "] = 0;
DataChannelOrigin[0] = "origin_value ";
DataChannelOrigin["origin_child"] = 1;
DataChannelOrigin[1] = "origin_child";
DataChannelOrigin["origin_source"] = 2;
DataChannelOrigin[2] = "origin_source";
DataChannelOrigin["origin_compute"] = 3;
DataChannelOrigin[3] = "origin_compute";
DataChannelOrigin["origin_proto"] = 4;
DataChannelOrigin[4] = "origin_proto";

var classInfo = {};

/**
 * Properties and methods for <xml3d>
 **/
classInfo['xml3d'] = {
    id : {a: handlers.IDHandler},
    className : {a: handlers.CanvasClassHandler, id: 'class'},
    style : {a: handlers.CanvasStyleHandler},
    onclick : {a: handlers.EventAttributeHandler},
    ondblclick : {a: handlers.EventAttributeHandler},
    onmousedown : {a: handlers.EventAttributeHandler},
    onmouseup : {a: handlers.EventAttributeHandler},
    onmouseover : {a: handlers.EventAttributeHandler},
    onmousemove : {a: handlers.EventAttributeHandler},
    onmouseout : {a: handlers.EventAttributeHandler},
    onkeypress : {a: handlers.EventAttributeHandler},
    onkeydown : {a: handlers.EventAttributeHandler},
    onkeyup : {a: handlers.EventAttributeHandler},
    onload: {a: handlers.EventAttributeHandler},
    onframedrawn: {a: handlers.EventAttributeHandler},
    complete: {p: properties.xml3dComplete},
    height : {a: handlers.IntAttributeHandler, params: 600},
    width : {a: handlers.IntAttributeHandler, params: 800},
    getElementByPoint : {m: methods.xml3dGetElementByPoint},
    generateRay : {m: methods.xml3dGenerateRay},
    getElementByRay : {m: methods.xml3dGetElementByRay},
    getWorldBoundingBox : {m: methods.getWorldBoundingBox},
    getLocalBoundingBox : {m: methods.getLocalBoundingBox},
    getRenderInterface : {m: methods.xml3dGetRenderInterface},
    activeView : {a: handlers.StringAttributeHandler}
    };

classInfo['compute'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    value: {a: handlers.StringValueHandler}
    };

/**
 * Properties and methods for <data>
 **/
classInfo['data'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    compute: {a: handlers.StringAttributeHandler},
    platform: {a: handlers.EnumAttributeHandler, params: {e: PlatformTypes, d: 1}},
    filter: {a: handlers.StringAttributeHandler},
    onload: {a: handlers.EventAttributeHandler},
    onprogress: {a: handlers.EventAttributeHandler},
    complete: {p: properties.XML3DNestedDataContainerTypeComplete},
    progressLevel: {p: properties.XML3DNestedDataContainerTypeProgressLevel},
    getOutputNames: {m: methods.XML3DNestedDataContainerTypeGetOutputNames},
    getOutputChannelInfo: {m: methods.XML3DNestedDataContainerTypeGetOutputChannelInfo},
    getComputeInfo: {m: methods.XML3DNestedDataContainerTypeGetComputeInfo},
    getProtoInfo: {m: methods.XML3DNestedDataContainerTypeGetProtoInfo},
    isOutputConnected: {m: methods.XML3DNestedDataContainerTypeIsOutputConnected},
    getResult: {m: methods.XML3DNestedDataContainerTypeGetResult},
    src: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <dataflow>
 **/
classInfo['dataflow'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    platform: {a: handlers.EnumAttributeHandler, params: {e: PlatformTypes, d: 1}},
    out: {a: handlers.StringAttributeHandler},
    onload: {a: handlers.EventAttributeHandler},
    onprogress: {a: handlers.EventAttributeHandler},
    complete: {p: properties.XML3DNestedDataContainerTypeComplete},
    progressLevel: {p: properties.XML3DNestedDataContainerTypeProgressLevel},
    getOutputNames: {m: methods.XML3DNestedDataContainerTypeGetOutputNames},
    getOutputChannelInfo: {m: methods.XML3DNestedDataContainerTypeGetOutputChannelInfo},
    getComputeInfo: {m: methods.XML3DNestedDataContainerTypeGetComputeInfo},
    getProtoInfo: {m: methods.XML3DNestedDataContainerTypeGetProtoInfo},
    isOutputConnected: {m: methods.XML3DNestedDataContainerTypeIsOutputConnected},
    getResult: {m: methods.XML3DNestedDataContainerTypeGetResult}
    };
/**
 * Properties and methods for <data>
 **/
classInfo['asset'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    onload: {a: handlers.EventAttributeHandler},
    onprogress: {a: handlers.EventAttributeHandler},
    complete: {p: properties.AssetComplete},
    progressLevel: {p: properties.AssetProgressLevel},
    src: {a: handlers.StringAttributeHandler},
    name: {a: handlers.StringAttributeHandler},
    pick: {a: handlers.StringAttributeHandler},
    transform: {a: handlers.StringAttributeHandler},
    material: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <defs>
 **/
classInfo['defs'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'}
    };
/**
 * Properties and methods for <group>
 **/
classInfo['group'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    onclick: {a: handlers.EventAttributeHandler},
    ondblclick: {a: handlers.EventAttributeHandler},
    onmousedown: {a: handlers.EventAttributeHandler},
    onmouseup: {a: handlers.EventAttributeHandler},
    onmouseover: {a: handlers.EventAttributeHandler},
    onmousemove: {a: handlers.EventAttributeHandler},
    onmouseout: {a: handlers.EventAttributeHandler},
    onkeypress: {a: handlers.EventAttributeHandler},
    onkeydown: {a: handlers.EventAttributeHandler},
    onkeyup: {a: handlers.EventAttributeHandler},
    visible: {a: handlers.BoolAttributeHandler, params: true},
    getWorldMatrix: {m: methods.XML3DGraphTypeGetWorldMatrix},
    getLocalMatrix: {m: methods.groupGetLocalMatrix},
    getWorldBoundingBox : {m: methods.getWorldBoundingBox},
    getLocalBoundingBox : {m: methods.getLocalBoundingBox},
    transform: {a: handlers.StringAttributeHandler},
    material: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <mesh>
 **/
classInfo['mesh'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    onclick: {a: handlers.EventAttributeHandler},
    ondblclick: {a: handlers.EventAttributeHandler},
    onmousedown: {a: handlers.EventAttributeHandler},
    onmouseup: {a: handlers.EventAttributeHandler},
    onmouseover: {a: handlers.EventAttributeHandler},
    onmousemove: {a: handlers.EventAttributeHandler},
    onmouseout: {a: handlers.EventAttributeHandler},
    onkeypress: {a: handlers.EventAttributeHandler},
    onkeydown: {a: handlers.EventAttributeHandler},
    onkeyup: {a: handlers.EventAttributeHandler},
    onload: {a: handlers.EventAttributeHandler},
    onprogress: {a: handlers.EventAttributeHandler},
    complete: {p: properties.XML3DNestedDataContainerTypeComplete},
    progressLevel: {p: properties.XML3DNestedDataContainerTypeProgressLevel},
    visible: {a: handlers.BoolAttributeHandler, params: true},
    type: {a: handlers.EnumAttributeHandler, params: {e: MeshTypes, d: 0}},
    compute: {a: handlers.StringAttributeHandler},
    transform: {a: handlers.StringAttributeHandler},
    material: {a: handlers.StringAttributeHandler},
    getWorldMatrix: {m: methods.XML3DGraphTypeGetWorldMatrix},
    getWorldBoundingBox : {m: methods.getWorldBoundingBox},
    getLocalBoundingBox : {m: methods.getLocalBoundingBox},
    getOutputNames: {m: methods.meshGetOutputNames},
    getOutputChannelInfo: {m: methods.meshGetOutputChannelInfo},
    getComputeInfo: {m: methods.meshGetComputeInfo},
    getProtoInfo: {m: methods.meshGetProtoInfo},
    isOutputConnected: {m: methods.meshIsOutputConnected},
    getResult: {m: methods.meshGetResult},
    src: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <model>
 **/
classInfo['model'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    onclick: {a: handlers.EventAttributeHandler},
    ondblclick: {a: handlers.EventAttributeHandler},
    onmousedown: {a: handlers.EventAttributeHandler},
    onmouseup: {a: handlers.EventAttributeHandler},
    onmouseover: {a: handlers.EventAttributeHandler},
    onmousemove: {a: handlers.EventAttributeHandler},
    onmouseout: {a: handlers.EventAttributeHandler},
    onkeypress: {a: handlers.EventAttributeHandler},
    onkeydown: {a: handlers.EventAttributeHandler},
    onkeyup: {a: handlers.EventAttributeHandler},
    onload: {a: handlers.EventAttributeHandler},
    onprogress: {a: handlers.EventAttributeHandler},
    complete: {p: properties.AssetComplete},
    progressLevel: {p: properties.AssetProgressLevel},
    visible: {a: handlers.BoolAttributeHandler, params: true},
    getWorldMatrix: {m: methods.XML3DGraphTypeGetWorldMatrix},
    getWorldBoundingBox : {m: methods.getWorldBoundingBox},
    getLocalBoundingBox : {m: methods.getLocalBoundingBox},
    src: {a: handlers.StringAttributeHandler},
    pick: {a: handlers.StringAttributeHandler},
    transform: {a: handlers.StringAttributeHandler},
    material: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <transform>
 **/
classInfo['transform'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    translation: {a: handlers.XML3DVec3AttributeHandler, params: [0, 0, 0]},
    scale: {a: handlers.XML3DVec3AttributeHandler, params: [1, 1, 1]},
    rotation: {a: handlers.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
    center: {a: handlers.XML3DVec3AttributeHandler, params: [0, 0, 0]},
    scaleOrientation: {a: handlers.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]}
    };
/**
 * Properties and methods for <material>
 **/
classInfo['material'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    onload: {a: handlers.EventAttributeHandler},
    onprogress: {a: handlers.EventAttributeHandler},
    complete: {p: properties.XML3DNestedDataContainerTypeComplete},
    progressLevel: {p: properties.XML3DNestedDataContainerTypeProgressLevel},
    compute: {a: handlers.StringAttributeHandler},
    getOutputNames: {m: methods.XML3DShaderProviderTypeGetOutputNames},
    getOutputChannelInfo: {m: methods.XML3DShaderProviderTypeGetOutputChannelInfo},
    getComputeInfo: {m: methods.XML3DShaderProviderTypeGetComputeInfo},
    getProtoInfo: {m: methods.XML3DShaderProviderTypeGetProtoInfo},
    isOutputConnected: {m: methods.XML3DShaderProviderTypeIsOutputConnected},
    getResult: {m: methods.XML3DShaderProviderTypeGetResult},
    script: {a: handlers.StringAttributeHandler},
    src: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <light>
 **/
classInfo['light'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    onclick: {a: handlers.EventAttributeHandler},
    ondblclick: {a: handlers.EventAttributeHandler},
    onmousedown: {a: handlers.EventAttributeHandler},
    onmouseup: {a: handlers.EventAttributeHandler},
    onmouseover: {a: handlers.EventAttributeHandler},
    onmousemove: {a: handlers.EventAttributeHandler},
    onmouseout: {a: handlers.EventAttributeHandler},
    onkeypress: {a: handlers.EventAttributeHandler},
    onkeydown: {a: handlers.EventAttributeHandler},
    onkeyup: {a: handlers.EventAttributeHandler},
    visible: {a: handlers.BoolAttributeHandler, params: true},
    global: {a: handlers.BoolAttributeHandler, params: false},
    getWorldMatrix: {m: methods.XML3DGraphTypeGetWorldMatrix},
    onload: {a: handlers.EventAttributeHandler},
    onprogress: {a: handlers.EventAttributeHandler},
    complete: {p: properties.XML3DNestedDataContainerTypeComplete},
    progressLevel: {p: properties.XML3DNestedDataContainerTypeProgressLevel},
    compute: {a: handlers.StringAttributeHandler},
    getOutputNames: {m: methods.XML3DShaderProviderTypeGetOutputNames},
    getOutputChannelInfo: {m: methods.XML3DShaderProviderTypeGetOutputChannelInfo},
    getComputeInfo: {m: methods.XML3DShaderProviderTypeGetComputeInfo},
    getProtoInfo: {m: methods.XML3DShaderProviderTypeGetProtoInfo},
    isOutputConnected: {m: methods.XML3DShaderProviderTypeIsOutputConnected},
    getResult: {m: methods.XML3DShaderProviderTypeGetResult},
    src: {a: handlers.StringAttributeHandler},
    model: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <lightshader>
 * // TODO(ksons): Remove in XML3D 5.1
 **/
classInfo['lightshader'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    onload: {a: handlers.EventAttributeHandler},
    onprogress: {a: handlers.EventAttributeHandler},
    complete: {p: properties.XML3DNestedDataContainerTypeComplete},
    progressLevel: {p: properties.XML3DNestedDataContainerTypeProgressLevel},
    compute: {a: handlers.StringAttributeHandler},
    getOutputNames: {m: methods.XML3DShaderProviderTypeGetOutputNames},
    getOutputChannelInfo: {m: methods.XML3DShaderProviderTypeGetOutputChannelInfo},
    getComputeInfo: {m: methods.XML3DShaderProviderTypeGetComputeInfo},
    getProtoInfo: {m: methods.XML3DShaderProviderTypeGetProtoInfo},
    isOutputConnected: {m: methods.XML3DShaderProviderTypeIsOutputConnected},
    getResult: {m: methods.XML3DShaderProviderTypeGetResult},
    script: {a: handlers.StringAttributeHandler},
    src: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <script>
 **/
classInfo['script'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    value: {a: handlers.StringValueHandler},
    src: {a: handlers.StringAttributeHandler},
    name: {a: handlers.StringAttributeHandler},
    type: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <assetmesh>
 **/
classInfo['assetmesh'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    name: {a: handlers.StringAttributeHandler},
    match: {a: handlers.StringAttributeHandler},
    type: {a: handlers.EnumAttributeHandler, params: {e: MeshTypes, d: 0}},
    compute: {a: handlers.StringAttributeHandler},
    filter: {a: handlers.StringAttributeHandler},
    includes: {a: handlers.StringAttributeHandler},
    material: {a: handlers.StringAttributeHandler},
    transform: {a: handlers.StringAttributeHandler},
    platform: {a: handlers.EnumAttributeHandler, params: {e: PlatformTypes, d: 1}},
    getOutputNames: {m: methods.XML3DNestedDataContainerTypeGetOutputNames},
    getOutputChannelInfo: {m: methods.XML3DNestedDataContainerTypeGetOutputChannelInfo},
    getComputeInfo: {m: methods.XML3DNestedDataContainerTypeGetComputeInfo},
    getProtoInfo: {m: methods.XML3DNestedDataContainerTypeGetProtoInfo},
    isOutputConnected: {m: methods.XML3DNestedDataContainerTypeIsOutputConnected},
    getResult: {m: methods.XML3DNestedDataContainerTypeGetResult},
    src: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <assetdata>
 **/
classInfo['assetdata'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    name: {a: handlers.StringAttributeHandler},
    compute: {a: handlers.StringAttributeHandler},
    filter: {a: handlers.StringAttributeHandler},
    includes: {a: handlers.StringAttributeHandler},
    platform: {a: handlers.EnumAttributeHandler, params: {e: PlatformTypes, d: 1}},
    getOutputNames: {m: methods.XML3DNestedDataContainerTypeGetOutputNames},
    getOutputChannelInfo: {m: methods.XML3DNestedDataContainerTypeGetOutputChannelInfo},
    getComputeInfo: {m: methods.XML3DNestedDataContainerTypeGetComputeInfo},
    getProtoInfo: {m: methods.XML3DNestedDataContainerTypeGetProtoInfo},
    isOutputConnected: {m: methods.XML3DNestedDataContainerTypeIsOutputConnected},
    getResult: {m: methods.XML3DNestedDataContainerTypeGetResult},
    src: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <float>
 **/
classInfo['float'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    name: {a: handlers.StringAttributeHandler},
    param: {a: handlers.BoolAttributeHandler, params: false},
    key: {a: handlers.FloatAttributeHandler, params: 0.0},
    value: {a: handlers.FloatArrayValueHandler},
    setScriptValue: {m: methods.XML3DDataSourceTypeSetScriptValue}
    };
/**
 * Properties and methods for <float2>
 **/
classInfo['float2'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    name: {a: handlers.StringAttributeHandler},
    param: {a: handlers.BoolAttributeHandler, params: false},
    key: {a: handlers.FloatAttributeHandler, params: 0.0},
    value: {a: handlers.Float2ArrayValueHandler},
    setScriptValue: {m: methods.XML3DDataSourceTypeSetScriptValue}
    };
/**
 * Properties and methods for <float3>
 **/
classInfo['float3'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    name: {a: handlers.StringAttributeHandler},
    param: {a: handlers.BoolAttributeHandler, params: false},
    key: {a: handlers.FloatAttributeHandler, params: 0.0},
    value: {a: handlers.Float3ArrayValueHandler},
    setScriptValue: {m: methods.XML3DDataSourceTypeSetScriptValue}
    };
/**
 * Properties and methods for <float4>
 **/
classInfo['float4'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    name: {a: handlers.StringAttributeHandler},
    param: {a: handlers.BoolAttributeHandler, params: false},
    key: {a: handlers.FloatAttributeHandler, params: 0.0},
    value: {a: handlers.Float4ArrayValueHandler},
    setScriptValue: {m: methods.XML3DDataSourceTypeSetScriptValue}
    };
/**
 * Properties and methods for <float4x4>
 **/
classInfo['float4x4'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    name: {a: handlers.StringAttributeHandler},
    param: {a: handlers.BoolAttributeHandler, params: false},
    key: {a: handlers.FloatAttributeHandler, params: 0.0},
    value: {a: handlers.Float4x4ArrayValueHandler},
    setScriptValue: {m: methods.XML3DDataSourceTypeSetScriptValue}
    };
/**
 * Properties and methods for <int>
 **/
classInfo['int'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    name: {a: handlers.StringAttributeHandler},
    param: {a: handlers.BoolAttributeHandler, params: false},
    key: {a: handlers.FloatAttributeHandler, params: 0.0},
    value: {a: handlers.IntArrayValueHandler},
    setScriptValue: {m: methods.XML3DDataSourceTypeSetScriptValue}
    };
/**
 * Properties and methods for <int4>
 **/
classInfo['int4'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    name: {a: handlers.StringAttributeHandler},
    param: {a: handlers.BoolAttributeHandler, params: false},
    key: {a: handlers.FloatAttributeHandler, params: 0.0},
    value: {a: handlers.IntArrayValueHandler},
    setScriptValue: {m: methods.XML3DDataSourceTypeSetScriptValue}
    };
/**
 * Properties and methods for <bool>
 **/
classInfo['bool'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    name: {a: handlers.StringAttributeHandler},
    param: {a: handlers.BoolAttributeHandler, params: false},
    key: {a: handlers.FloatAttributeHandler, params: 0.0},
    value: {a: handlers.BoolArrayValueHandler},
    setScriptValue: {m: methods.XML3DDataSourceTypeSetScriptValue}
    };
/**
 * Properties and methods for <texture>
 **/
classInfo['texture'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    name: {a: handlers.StringAttributeHandler},
    param: {a: handlers.BoolAttributeHandler, params: false},
    key: {a: handlers.FloatAttributeHandler, params: 0.0},
    type: {a: handlers.EnumAttributeHandler, params: {e: TextureTypes, d: 0}},
    filter: {a: handlers.StringAttributeHandler},
    wrap: {a: handlers.StringAttributeHandler},
    anisotropy: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <img>
 **/
classInfo['img'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    src: {a: handlers.StringAttributeHandler}
    };
/**
 * Properties and methods for <video>
 **/
classInfo['video'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    src: {a: handlers.StringAttributeHandler},
    autoplay: {a: handlers.BoolAttributeHandler, params: false},
    play: {m: methods.videoPlay},
    pause: {m: methods.videoPause}
    };
/**
 * Properties and methods for <view>
 **/
classInfo['view'] = {
    id: {a: handlers.IDHandler},
    className: {a: handlers.StringAttributeHandler, id: 'class'},
    onclick: {a: handlers.EventAttributeHandler},
    ondblclick: {a: handlers.EventAttributeHandler},
    onmousedown: {a: handlers.EventAttributeHandler},
    onmouseup: {a: handlers.EventAttributeHandler},
    onmouseover: {a: handlers.EventAttributeHandler},
    onmousemove: {a: handlers.EventAttributeHandler},
    onmouseout: {a: handlers.EventAttributeHandler},
    onkeypress: {a: handlers.EventAttributeHandler},
    onkeydown: {a: handlers.EventAttributeHandler},
    onkeyup: {a: handlers.EventAttributeHandler},
    visible: {a: handlers.BoolAttributeHandler, params: true},
    position: {a: handlers.XML3DVec3AttributeHandler, params: [0, 0, 0]},
    orientation: {a: handlers.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
    fieldOfView: {a: handlers.FloatAttributeHandler, params: 0.785398},
    getWorldMatrix: {m: methods.XML3DGraphTypeGetWorldMatrix},
    setDirection: {m: methods.viewSetDirection},
    setUpVector: {m: methods.viewSetUpVector},
    lookAt: {m: methods.viewLookAt},
    getDirection: {m: methods.viewGetDirection},
    getUpVector: {m: methods.viewGetUpVector},
    getViewMatrix: {m: methods.viewGetViewMatrix},
    projection: {a: handlers.StringAttributeHandler}
    };

module.exports = {
    classInfo : classInfo,
    MeshTypes : MeshTypes,
    TextureTypes : TextureTypes,
    PlatformTypes : PlatformTypes,
    DataFieldTypes : DataFieldType,
    DataChannelOrigin : DataChannelOrigin
};
