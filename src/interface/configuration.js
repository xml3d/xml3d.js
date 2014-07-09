/* START GENERATED: All following code is generated from the specification. Do not edit manually */
// MeshTypes
XML3D.MeshTypes = {};
XML3D.MeshTypes["triangles"] = 0;
XML3D.MeshTypes[0] = "triangles";
XML3D.MeshTypes["trianglestrips"] = 1;
XML3D.MeshTypes[1] = "trianglestrips";
XML3D.MeshTypes["lines"] = 2;
XML3D.MeshTypes[2] = "lines";
XML3D.MeshTypes["linestrips"] = 3;
XML3D.MeshTypes[3] = "linestrips";
XML3D.MeshTypes["points"] = 4;
XML3D.MeshTypes[4] = "points";
// TextureTypes
XML3D.TextureTypes = {};
XML3D.TextureTypes["2d"] = 0;
XML3D.TextureTypes[0] = "2d";
XML3D.TextureTypes["1d"] = 1;
XML3D.TextureTypes[1] = "1d";
XML3D.TextureTypes["3d"] = 2;
XML3D.TextureTypes[2] = "3d";
// FilterTypes
XML3D.FilterTypes = {};
XML3D.FilterTypes["none"] = 0;
XML3D.FilterTypes[0] = "none";
XML3D.FilterTypes["nearest"] = 1;
XML3D.FilterTypes[1] = "nearest";
XML3D.FilterTypes["linear"] = 2;
XML3D.FilterTypes[2] = "linear";
// WrapTypes
XML3D.WrapTypes = {};
XML3D.WrapTypes["clamp"] = 0;
XML3D.WrapTypes[0] = "clamp";
XML3D.WrapTypes["repeat"] = 1;
XML3D.WrapTypes[1] = "repeat";
XML3D.WrapTypes["border"] = 2;
XML3D.WrapTypes[2] = "border";
// PlatformTypes
XML3D.PlatformTypes = {};
XML3D.PlatformTypes["auto"] = 1;
XML3D.PlatformTypes[1] = "auto";
XML3D.PlatformTypes["js"] = 2;
XML3D.PlatformTypes[2] = "js";
XML3D.PlatformTypes["gl"] = 3;
XML3D.PlatformTypes[3] = "gl";
XML3D.PlatformTypes["cl"] = 4;
XML3D.PlatformTypes[4] = "cl";
// DataFieldType
XML3D.DataFieldType = {};
XML3D.DataFieldType["float "] = 0;
XML3D.DataFieldType[0] = "float ";
XML3D.DataFieldType["float2 "] = 1;
XML3D.DataFieldType[1] = "float2 ";
XML3D.DataFieldType["float3"] = 2;
XML3D.DataFieldType[2] = "float3";
XML3D.DataFieldType["float4"] = 3;
XML3D.DataFieldType[3] = "float4";
XML3D.DataFieldType["float4x4"] = 4;
XML3D.DataFieldType[4] = "float4x4";
XML3D.DataFieldType["int"] = 10;
XML3D.DataFieldType[10] = "int";
XML3D.DataFieldType["int4"] = 11;
XML3D.DataFieldType[11] = "int4";
XML3D.DataFieldType["bool"] = 20;
XML3D.DataFieldType[20] = "bool";
XML3D.DataFieldType["texture"] = 30;
XML3D.DataFieldType[30] = "texture";
// DataChannelOrigin
XML3D.DataChannelOrigin = {};
XML3D.DataChannelOrigin["origin_value "] = 0;
XML3D.DataChannelOrigin[0] = "origin_value ";
XML3D.DataChannelOrigin["origin_child"] = 1;
XML3D.DataChannelOrigin[1] = "origin_child";
XML3D.DataChannelOrigin["origin_source"] = 2;
XML3D.DataChannelOrigin[2] = "origin_source";
XML3D.DataChannelOrigin["origin_compute"] = 3;
XML3D.DataChannelOrigin[3] = "origin_compute";
XML3D.DataChannelOrigin["origin_proto"] = 4;
XML3D.DataChannelOrigin[4] = "origin_proto";

XML3D.classInfo = {};

/**
 * Properties and methods for <xml3d>
 **/
XML3D.classInfo['xml3d'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.CanvasClassHandler, id: 'class'},
    style : {a: XML3D.CanvasStyleHandler},
    onclick : {a: XML3D.EventAttributeHandler},
    ondblclick : {a: XML3D.EventAttributeHandler},
    onmousedown : {a: XML3D.EventAttributeHandler},
    onmouseup : {a: XML3D.EventAttributeHandler},
    onmouseover : {a: XML3D.EventAttributeHandler},
    onmousemove : {a: XML3D.EventAttributeHandler},
    onmouseout : {a: XML3D.EventAttributeHandler},
    onkeypress : {a: XML3D.EventAttributeHandler},
    onkeydown : {a: XML3D.EventAttributeHandler},
    onkeyup : {a: XML3D.EventAttributeHandler},
    height : {a: XML3D.IntAttributeHandler, params: 600},
    width : {a: XML3D.IntAttributeHandler, params: 800},
    createXML3DVec3 : {m: XML3D.methods.xml3dCreateXML3DVec3},
    createXML3DRotation : {m: XML3D.methods.xml3dCreateXML3DRotation},
    createXML3DMatrix : {m: XML3D.methods.xml3dCreateXML3DMatrix},
    createXML3DRay : {m: XML3D.methods.xml3dCreateXML3DRay},
    getElementByPoint : {m: XML3D.methods.xml3dGetElementByPoint},
    generateRay : {m: XML3D.methods.xml3dGenerateRay},
    getElementByRay : {m: XML3D.methods.xml3dGetElementByRay},
    getBoundingBox : {m: XML3D.methods.xml3dGetBoundingBox},
    getRenderInterface : {m: XML3D.methods.xml3dGetRenderInterface},
    activeView : {a: XML3D.ReferenceHandler},
    _term: undefined
};

XML3D.classInfo['compute'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for script
    value: {a: XML3D.StringValueHandler},
    _term: undefined
};

/**
 * Properties and methods for <data>
 **/
XML3D.classInfo['data'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for data
    compute: {a: XML3D.StringAttributeHandler},
    platform: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.PlatformTypes, d: 1}},
    filter: {a: XML3D.StringAttributeHandler},
    getOutputNames: {m: XML3D.methods.XML3DNestedDataContainerTypeGetOutputNames},
    getOutputChannelInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetOutputChannelInfo},
    getComputeInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetComputeInfo},
    getProtoInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetProtoInfo},
    isOutputConnected: {m: XML3D.methods.XML3DNestedDataContainerTypeIsOutputConnected},
    getResult: {m: XML3D.methods.XML3DNestedDataContainerTypeGetResult},
    src: {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <dataflow>
 **/
XML3D.classInfo['dataflow'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for dataflow
    platform: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.PlatformTypes, d: 1}},
    out: {a: XML3D.StringAttributeHandler},
    getOutputNames: {m: XML3D.methods.XML3DNestedDataContainerTypeGetOutputNames},
    getOutputChannelInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetOutputChannelInfo},
    getComputeInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetComputeInfo},
    getProtoInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetProtoInfo},
    isOutputConnected: {m: XML3D.methods.XML3DNestedDataContainerTypeIsOutputConnected},
    getResult: {m: XML3D.methods.XML3DNestedDataContainerTypeGetResult},
    _term: undefined
};
/**
 * Properties and methods for <data>
 **/
XML3D.classInfo['asset'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for data
    src: {a: XML3D.ReferenceHandler},
    pick: {a: XML3D.StringAttributeHandler},
    _term: undefined
};
/**
 * Properties and methods for <defs>
 **/
XML3D.classInfo['defs'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for defs
    _term: undefined
};
/**
 * Properties and methods for <group>
 **/
XML3D.classInfo['group'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for group
    onclick: {a: XML3D.EventAttributeHandler},
    ondblclick: {a: XML3D.EventAttributeHandler},
    onmousedown: {a: XML3D.EventAttributeHandler},
    onmouseup: {a: XML3D.EventAttributeHandler},
    onmouseover: {a: XML3D.EventAttributeHandler},
    onmousemove: {a: XML3D.EventAttributeHandler},
    onmouseout: {a: XML3D.EventAttributeHandler},
    onkeypress: {a: XML3D.EventAttributeHandler},
    onkeydown: {a: XML3D.EventAttributeHandler},
    onkeyup: {a: XML3D.EventAttributeHandler},
    visible: {a: XML3D.BoolAttributeHandler, params: true},
    getWorldMatrix: {m: XML3D.methods.XML3DGraphTypeGetWorldMatrix},
    getLocalMatrix: {m: XML3D.methods.groupGetLocalMatrix},
    getBoundingBox: {m: XML3D.methods.groupGetBoundingBox},
    setWorldSpaceBoundingBox: {m: XML3D.methods.groupSetWorldSpaceBoundingBox},
    transform: {a: XML3D.ReferenceHandler},
    shader: {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <mesh>
 **/
XML3D.classInfo['mesh'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for mesh
    onclick: {a: XML3D.EventAttributeHandler},
    ondblclick: {a: XML3D.EventAttributeHandler},
    onmousedown: {a: XML3D.EventAttributeHandler},
    onmouseup: {a: XML3D.EventAttributeHandler},
    onmouseover: {a: XML3D.EventAttributeHandler},
    onmousemove: {a: XML3D.EventAttributeHandler},
    onmouseout: {a: XML3D.EventAttributeHandler},
    onkeypress: {a: XML3D.EventAttributeHandler},
    onkeydown: {a: XML3D.EventAttributeHandler},
    onkeyup: {a: XML3D.EventAttributeHandler},
    visible: {a: XML3D.BoolAttributeHandler, params: true},
    type: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.MeshTypes, d: 0}},
    compute: {a: XML3D.StringAttributeHandler},
    transform: {a: XML3D.ReferenceHandler},
    shader: {a: XML3D.ReferenceHandler},
    getWorldMatrix: {m: XML3D.methods.XML3DGraphTypeGetWorldMatrix},
    getBoundingBox: {m: XML3D.methods.meshGetBoundingBox},
    setWorldSpaceBoundingBox: {m: XML3D.methods.meshSetWorldSpaceBoundingBox},
    getOutputNames: {m: XML3D.methods.meshGetOutputNames},
    getOutputChannelInfo: {m: XML3D.methods.meshGetOutputChannelInfo},
    getComputeInfo: {m: XML3D.methods.meshGetComputeInfo},
    getProtoInfo: {m: XML3D.methods.meshGetProtoInfo},
    isOutputConnected: {m: XML3D.methods.meshIsOutputConnected},
    getResult: {m: XML3D.methods.meshGetResult},
    src: {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <model>
 **/
XML3D.classInfo['model'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for mesh
    onclick: {a: XML3D.EventAttributeHandler},
    ondblclick: {a: XML3D.EventAttributeHandler},
    onmousedown: {a: XML3D.EventAttributeHandler},
    onmouseup: {a: XML3D.EventAttributeHandler},
    onmouseover: {a: XML3D.EventAttributeHandler},
    onmousemove: {a: XML3D.EventAttributeHandler},
    onmouseout: {a: XML3D.EventAttributeHandler},
    onkeypress: {a: XML3D.EventAttributeHandler},
    onkeydown: {a: XML3D.EventAttributeHandler},
    onkeyup: {a: XML3D.EventAttributeHandler},
    visible: {a: XML3D.BoolAttributeHandler, params: true},
    getWorldMatrix: {m: XML3D.methods.XML3DGraphTypeGetWorldMatrix},
    getBoundingBox: {m: XML3D.methods.meshGetBoundingBox},
    setWorldSpaceBoundingBox: {m: XML3D.methods.meshSetWorldSpaceBoundingBox},
    src: {a: XML3D.ReferenceHandler},
    pick: {a: XML3D.StringAttributeHandler},
    _term: undefined
};
/**
 * Properties and methods for <transform>
 **/
XML3D.classInfo['transform'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for transform
    translation: {a: XML3D.XML3DVec3AttributeHandler, params: [0, 0, 0]},
    scale: {a: XML3D.XML3DVec3AttributeHandler, params: [1, 1, 1]},
    rotation: {a: XML3D.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
    center: {a: XML3D.XML3DVec3AttributeHandler, params: [0, 0, 0]},
    scaleOrientation: {a: XML3D.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
    _term: undefined
};
/**
 * Properties and methods for <shader>
 **/
XML3D.classInfo['shader'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for shader
    compute: {a: XML3D.StringAttributeHandler},
    getOutputNames: {m: XML3D.methods.XML3DShaderProviderTypeGetOutputNames},
    getOutputChannelInfo: {m: XML3D.methods.XML3DShaderProviderTypeGetOutputChannelInfo},
    getComputeInfo: {m: XML3D.methods.XML3DShaderProviderTypeGetComputeInfo},
    getProtoInfo: {m: XML3D.methods.XML3DShaderProviderTypeGetProtoInfo},
    isOutputConnected: {m: XML3D.methods.XML3DShaderProviderTypeIsOutputConnected},
    getResult: {m: XML3D.methods.XML3DShaderProviderTypeGetResult},
    script: {a: XML3D.ReferenceHandler},
    src: {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <light>
 **/
XML3D.classInfo['light'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for light
    onclick: {a: XML3D.EventAttributeHandler},
    ondblclick: {a: XML3D.EventAttributeHandler},
    onmousedown: {a: XML3D.EventAttributeHandler},
    onmouseup: {a: XML3D.EventAttributeHandler},
    onmouseover: {a: XML3D.EventAttributeHandler},
    onmousemove: {a: XML3D.EventAttributeHandler},
    onmouseout: {a: XML3D.EventAttributeHandler},
    onkeypress: {a: XML3D.EventAttributeHandler},
    onkeydown: {a: XML3D.EventAttributeHandler},
    onkeyup: {a: XML3D.EventAttributeHandler},
    visible: {a: XML3D.BoolAttributeHandler, params: true},
    global: {a: XML3D.BoolAttributeHandler, params: false},
    intensity: {a: XML3D.FloatAttributeHandler, params: 1},
    getWorldMatrix: {m: XML3D.methods.XML3DGraphTypeGetWorldMatrix},
    shader: {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <lightshader>
 **/
XML3D.classInfo['lightshader'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for lightshader
    compute: {a: XML3D.StringAttributeHandler},
    getOutputNames: {m: XML3D.methods.XML3DShaderProviderTypeGetOutputNames},
    getOutputChannelInfo: {m: XML3D.methods.XML3DShaderProviderTypeGetOutputChannelInfo},
    getComputeInfo: {m: XML3D.methods.XML3DShaderProviderTypeGetComputeInfo},
    getProtoInfo: {m: XML3D.methods.XML3DShaderProviderTypeGetProtoInfo},
    isOutputConnected: {m: XML3D.methods.XML3DShaderProviderTypeIsOutputConnected},
    getResult: {m: XML3D.methods.XML3DShaderProviderTypeGetResult},
    script: {a: XML3D.ReferenceHandler},
    src: {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <script>
 **/
XML3D.classInfo['script'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for script
    value: {a: XML3D.StringValueHandler},
    src: {a: XML3D.StringAttributeHandler},
    type: {a: XML3D.StringAttributeHandler},
    _term: undefined
};
/**
 * Properties and methods for <assetmesh>
 **/
XML3D.classInfo['assetmesh'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for data
    name: {a: XML3D.StringAttributeHandler},
    type: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.MeshTypes, d: 0}},
    compute: {a: XML3D.StringAttributeHandler},
    filter: {a: XML3D.StringAttributeHandler},
    includes: {a: XML3D.StringAttributeHandler},
    shader: {a: XML3D.ReferenceHandler},
    transform: {a: XML3D.ReferenceHandler},
    platform: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.PlatformTypes, d: 1}},
    getOutputNames: {m: XML3D.methods.XML3DNestedDataContainerTypeGetOutputNames},
    getOutputChannelInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetOutputChannelInfo},
    getComputeInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetComputeInfo},
    getProtoInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetProtoInfo},
    isOutputConnected: {m: XML3D.methods.XML3DNestedDataContainerTypeIsOutputConnected},
    getResult: {m: XML3D.methods.XML3DNestedDataContainerTypeGetResult},
    src: {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <assetdata>
 **/
XML3D.classInfo['assetdata'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for data
    name: {a: XML3D.StringAttributeHandler},
    compute: {a: XML3D.StringAttributeHandler},
    filter: {a: XML3D.StringAttributeHandler},
    includes: {a: XML3D.StringAttributeHandler},
    platform: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.PlatformTypes, d: 1}},
    getOutputNames: {m: XML3D.methods.XML3DNestedDataContainerTypeGetOutputNames},
    getOutputChannelInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetOutputChannelInfo},
    getComputeInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetComputeInfo},
    getProtoInfo: {m: XML3D.methods.XML3DNestedDataContainerTypeGetProtoInfo},
    isOutputConnected: {m: XML3D.methods.XML3DNestedDataContainerTypeIsOutputConnected},
    getResult: {m: XML3D.methods.XML3DNestedDataContainerTypeGetResult},
    src: {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <float>
 **/
XML3D.classInfo['float'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float
    name: {a: XML3D.StringAttributeHandler},
    param: {a: XML3D.BoolAttributeHandler, params: false},
    key: {a: XML3D.FloatAttributeHandler, params: 0.0},
    value: {a: XML3D.FloatArrayValueHandler},
    setScriptValue: {m: XML3D.methods.XML3DDataSourceTypeSetScriptValue},
    _term: undefined
};
/**
 * Properties and methods for <float2>
 **/
XML3D.classInfo['float2'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float2
    name: {a: XML3D.StringAttributeHandler},
    param: {a: XML3D.BoolAttributeHandler, params: false},
    key: {a: XML3D.FloatAttributeHandler, params: 0.0},
    value: {a: XML3D.Float2ArrayValueHandler},
    setScriptValue: {m: XML3D.methods.XML3DDataSourceTypeSetScriptValue},
    _term: undefined
};
/**
 * Properties and methods for <float3>
 **/
XML3D.classInfo['float3'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float3
    name: {a: XML3D.StringAttributeHandler},
    param: {a: XML3D.BoolAttributeHandler, params: false},
    key: {a: XML3D.FloatAttributeHandler, params: 0.0},
    value: {a: XML3D.Float3ArrayValueHandler},
    setScriptValue: {m: XML3D.methods.XML3DDataSourceTypeSetScriptValue},
    _term: undefined
};
/**
 * Properties and methods for <float4>
 **/
XML3D.classInfo['float4'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float4
    name: {a: XML3D.StringAttributeHandler},
    param: {a: XML3D.BoolAttributeHandler, params: false},
    key: {a: XML3D.FloatAttributeHandler, params: 0.0},
    value: {a: XML3D.Float4ArrayValueHandler},
    setScriptValue: {m: XML3D.methods.XML3DDataSourceTypeSetScriptValue},
    _term: undefined
};
/**
 * Properties and methods for <float4x4>
 **/
XML3D.classInfo['float4x4'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float4x4
    name: {a: XML3D.StringAttributeHandler},
    param: {a: XML3D.BoolAttributeHandler, params: false},
    key: {a: XML3D.FloatAttributeHandler, params: 0.0},
    value: {a: XML3D.Float4x4ArrayValueHandler},
    setScriptValue: {m: XML3D.methods.XML3DDataSourceTypeSetScriptValue},
    _term: undefined
};
/**
 * Properties and methods for <int>
 **/
XML3D.classInfo['int'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for int
    name: {a: XML3D.StringAttributeHandler},
    param: {a: XML3D.BoolAttributeHandler, params: false},
    key: {a: XML3D.FloatAttributeHandler, params: 0.0},
    value: {a: XML3D.IntArrayValueHandler},
    setScriptValue: {m: XML3D.methods.XML3DDataSourceTypeSetScriptValue},
    _term: undefined
};
/**
 * Properties and methods for <int4>
 **/
XML3D.classInfo['int4'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for int4
    name: {a: XML3D.StringAttributeHandler},
    param: {a: XML3D.BoolAttributeHandler, params: false},
    key: {a: XML3D.FloatAttributeHandler, params: 0.0},
    value: {a: XML3D.IntArrayValueHandler},
    setScriptValue: {m: XML3D.methods.XML3DDataSourceTypeSetScriptValue},
    _term: undefined
};
/**
 * Properties and methods for <bool>
 **/
XML3D.classInfo['bool'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for bool
    name: {a: XML3D.StringAttributeHandler},
    param: {a: XML3D.BoolAttributeHandler, params: false},
    key: {a: XML3D.FloatAttributeHandler, params: 0.0},
    value: {a: XML3D.BoolArrayValueHandler},
    setScriptValue: {m: XML3D.methods.XML3DDataSourceTypeSetScriptValue},
    _term: undefined
};
/**
 * Properties and methods for <texture>
 **/
XML3D.classInfo['texture'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for texture
    name: {a: XML3D.StringAttributeHandler},
    param: {a: XML3D.BoolAttributeHandler, params: false},
    key: {a: XML3D.FloatAttributeHandler, params: 0.0},
    type: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.TextureTypes, d: 0}},
    filterMin: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.FilterTypes, d: 2}},
    filterMag: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.FilterTypes, d: 2}},
    filterMip: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.FilterTypes, d: 1}},
    wrapS: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.WrapTypes, d: 0}},
    wrapT: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.WrapTypes, d: 0}},
    wrapU: {a: XML3D.EnumAttributeHandler, params: {e: XML3D.WrapTypes, d: 0}},
    borderColor: {a: XML3D.StringAttributeHandler},
    setScriptValue: {m: XML3D.methods.XML3DDataSourceTypeSetScriptValue},
    _term: undefined
};
/**
 * Properties and methods for <img>
 **/
XML3D.classInfo['img'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for img
    src: {a: XML3D.StringAttributeHandler},
    _term: undefined
};
/**
 * Properties and methods for <video>
 **/
XML3D.classInfo['video'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for video
    src: {a: XML3D.StringAttributeHandler},
    autoplay: {a: XML3D.BoolAttributeHandler, params: false},
    play: {m: XML3D.methods.videoPlay},
    pause: {m: XML3D.methods.videoPause},
    _term: undefined
};
/**
 * Properties and methods for <view>
 **/
XML3D.classInfo['view'] = {
    id: {a: XML3D.IDHandler},
    className: {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for view
    onclick: {a: XML3D.EventAttributeHandler},
    ondblclick: {a: XML3D.EventAttributeHandler},
    onmousedown: {a: XML3D.EventAttributeHandler},
    onmouseup: {a: XML3D.EventAttributeHandler},
    onmouseover: {a: XML3D.EventAttributeHandler},
    onmousemove: {a: XML3D.EventAttributeHandler},
    onmouseout: {a: XML3D.EventAttributeHandler},
    onkeypress: {a: XML3D.EventAttributeHandler},
    onkeydown: {a: XML3D.EventAttributeHandler},
    onkeyup: {a: XML3D.EventAttributeHandler},
    visible: {a: XML3D.BoolAttributeHandler, params: true},
    position: {a: XML3D.XML3DVec3AttributeHandler, params: [0, 0, 0]},
    orientation: {a: XML3D.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
    fieldOfView: {a: XML3D.FloatAttributeHandler, params: 0.785398},
    getWorldMatrix: {m: XML3D.methods.XML3DGraphTypeGetWorldMatrix},
    setDirection: {m: XML3D.methods.viewSetDirection},
    setUpVector: {m: XML3D.methods.viewSetUpVector},
    lookAt: {m: XML3D.methods.viewLookAt},
    getDirection: {m: XML3D.methods.viewGetDirection},
    getUpVector: {m: XML3D.methods.viewGetUpVector},
    getViewMatrix: {m: XML3D.methods.viewGetViewMatrix},
    perspective: {a: XML3D.ReferenceHandler},
    _term: undefined
};
/* END GENERATED */
