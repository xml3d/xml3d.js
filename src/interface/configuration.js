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
XML3D.DataFieldType["int"] = 5;
XML3D.DataFieldType[5] = "int";
XML3D.DataFieldType["bool"] = 6;
XML3D.DataFieldType[6] = "bool";
XML3D.DataFieldType["texture"] = 7;
XML3D.DataFieldType[7] = "texture";
XML3D.DataFieldType["video"] = 8;
XML3D.DataFieldType[8] = "video";

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
    activeView : {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <data>
 **/
XML3D.classInfo['data'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for data
    compute : {a: XML3D.StringAttributeHandler},
    filter : {a: XML3D.StringAttributeHandler},
    getResult : {m: XML3D.methods.dataGetResult},
    getOutputFieldNames : {m: XML3D.methods.dataGetOutputFieldNames},
    src : {a: XML3D.ReferenceHandler},
    proto : {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <defs>
 **/
XML3D.classInfo['defs'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for defs
    _term: undefined
};
/**
 * Properties and methods for <group>
 **/
XML3D.classInfo['group'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for group
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
    visible : {a: XML3D.BoolAttributeHandler, params: true},
    getWorldMatrix : {m: XML3D.methods.XML3DGraphTypeGetWorldMatrix},
    getLocalMatrix : {m: XML3D.methods.groupGetLocalMatrix},
    getBoundingBox : {m: XML3D.methods.groupGetBoundingBox},
    transform : {a: XML3D.ReferenceHandler},
    shader : {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <mesh>
 **/
XML3D.classInfo['mesh'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for mesh
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
    visible : {a: XML3D.BoolAttributeHandler, params: true},
    type : {a: XML3D.EnumAttributeHandler, params: {e: XML3D.MeshTypes, d: 0}},
    compute : {a: XML3D.StringAttributeHandler},
    getWorldMatrix : {m: XML3D.methods.XML3DGraphTypeGetWorldMatrix},
    getBoundingBox : {m: XML3D.methods.meshGetBoundingBox},
    src : {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <transform>
 **/
XML3D.classInfo['transform'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for transform
    translation : {a: XML3D.XML3DVec3AttributeHandler, params: [0, 0, 0]},
    scale : {a: XML3D.XML3DVec3AttributeHandler, params: [1, 1, 1]},
    rotation : {a: XML3D.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
    center : {a: XML3D.XML3DVec3AttributeHandler, params: [0, 0, 0]},
    scaleOrientation : {a: XML3D.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
    _term: undefined
};
/**
 * Properties and methods for <shader>
 **/
XML3D.classInfo['shader'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for shader
    compute : {a: XML3D.StringAttributeHandler},
    script : {a: XML3D.ReferenceHandler},
    src : {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <light>
 **/
XML3D.classInfo['light'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for light
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
    visible : {a: XML3D.BoolAttributeHandler, params: true},
    global : {a: XML3D.BoolAttributeHandler, params: false},
    intensity : {a: XML3D.FloatAttributeHandler, params: 1},
    getWorldMatrix : {m: XML3D.methods.XML3DGraphTypeGetWorldMatrix},
    shader : {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <lightshader>
 **/
XML3D.classInfo['lightshader'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for lightshader
    compute : {a: XML3D.StringAttributeHandler},
    script : {a: XML3D.ReferenceHandler},
    src : {a: XML3D.ReferenceHandler},
    _term: undefined
};
/**
 * Properties and methods for <script>
 **/
XML3D.classInfo['script'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for script
    value : {a: XML3D.StringAttributeHandler},
    src : {a: XML3D.StringAttributeHandler},
    type : {a: XML3D.StringAttributeHandler},
    _term: undefined
};
/**
 * Properties and methods for <float>
 **/
XML3D.classInfo['float'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float
    name : {a: XML3D.StringAttributeHandler},
    replaceby : {a: XML3D.StringAttributeHandler},
    seqnr : {a: XML3D.FloatAttributeHandler, params: 0.0},
    value : {a: XML3D.FloatArrayValueHandler},
    _term: undefined
};
/**
 * Properties and methods for <float2>
 **/
XML3D.classInfo['float2'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float2
    name : {a: XML3D.StringAttributeHandler},
    replaceby : {a: XML3D.StringAttributeHandler},
    seqnr : {a: XML3D.FloatAttributeHandler, params: 0.0},
    value : {a: XML3D.Float2ArrayValueHandler},
    _term: undefined
};
/**
 * Properties and methods for <float3>
 **/
XML3D.classInfo['float3'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float3
    name : {a: XML3D.StringAttributeHandler},
    replaceby : {a: XML3D.StringAttributeHandler},
    seqnr : {a: XML3D.FloatAttributeHandler, params: 0.0},
    value : {a: XML3D.Float3ArrayValueHandler},
    _term: undefined
};
/**
 * Properties and methods for <float4>
 **/
XML3D.classInfo['float4'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float4
    name : {a: XML3D.StringAttributeHandler},
    replaceby : {a: XML3D.StringAttributeHandler},
    seqnr : {a: XML3D.FloatAttributeHandler, params: 0.0},
    value : {a: XML3D.Float4ArrayValueHandler},
    _term: undefined
};
/**
 * Properties and methods for <float4x4>
 **/
XML3D.classInfo['float4x4'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float4x4
    name : {a: XML3D.StringAttributeHandler},
    replaceby : {a: XML3D.StringAttributeHandler},
    seqnr : {a: XML3D.FloatAttributeHandler, params: 0.0},
    value : {a: XML3D.Float4x4ArrayValueHandler},
    _term: undefined
};
/**
 * Properties and methods for <int>
 **/
XML3D.classInfo['int'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for int
    name : {a: XML3D.StringAttributeHandler},
    replaceby : {a: XML3D.StringAttributeHandler},
    seqnr : {a: XML3D.FloatAttributeHandler, params: 0.0},
    value : {a: XML3D.IntArrayValueHandler},
    _term: undefined
};
/**
 * Properties and methods for <int4>
 **/
XML3D.classInfo['int4'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for int4
    name : {a: XML3D.StringAttributeHandler},
    replaceby : {a: XML3D.StringAttributeHandler},
    seqnr : {a: XML3D.FloatAttributeHandler, params: 0.0},
    value : {a: XML3D.IntArrayValueHandler},
    _term: undefined
};
/**
 * Properties and methods for <bool>
 **/
XML3D.classInfo['bool'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for bool
    name : {a: XML3D.StringAttributeHandler},
    replaceby : {a: XML3D.StringAttributeHandler},
    seqnr : {a: XML3D.FloatAttributeHandler, params: 0.0},
    value : {a: XML3D.BoolArrayValueHandler},
    _term: undefined
};
/**
 * Properties and methods for <texture>
 **/
XML3D.classInfo['texture'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for texture
    name : {a: XML3D.StringAttributeHandler},
    replaceby : {a: XML3D.StringAttributeHandler},
    seqnr : {a: XML3D.FloatAttributeHandler, params: 0.0},
    type : {a: XML3D.EnumAttributeHandler, params: {e: XML3D.TextureTypes, d: 0}},
    filterMin : {a: XML3D.EnumAttributeHandler, params: {e: XML3D.FilterTypes, d: 2}},
    filterMag : {a: XML3D.EnumAttributeHandler, params: {e: XML3D.FilterTypes, d: 2}},
    filterMip : {a: XML3D.EnumAttributeHandler, params: {e: XML3D.FilterTypes, d: 1}},
    wrapS : {a: XML3D.EnumAttributeHandler, params: {e: XML3D.WrapTypes, d: 0}},
    wrapT : {a: XML3D.EnumAttributeHandler, params: {e: XML3D.WrapTypes, d: 0}},
    wrapU : {a: XML3D.EnumAttributeHandler, params: {e: XML3D.WrapTypes, d: 0}},
    borderColor : {a: XML3D.StringAttributeHandler},
    _term: undefined
};
/**
 * Properties and methods for <img>
 **/
XML3D.classInfo['img'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for img
    src : {a: XML3D.StringAttributeHandler},
    _term: undefined
};
/**
 * Properties and methods for <video>
 **/
XML3D.classInfo['video'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for video
    src : {a: XML3D.StringAttributeHandler},
    _term: undefined
};
/**
 * Properties and methods for <view>
 **/
XML3D.classInfo['view'] = {
    id : {a: XML3D.IDHandler},
    className : {a: XML3D.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for view
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
    visible : {a: XML3D.BoolAttributeHandler, params: true},
    position : {a: XML3D.XML3DVec3AttributeHandler, params: [0, 0, 0]},
    orientation : {a: XML3D.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
    fieldOfView : {a: XML3D.FloatAttributeHandler, params: 0.785398},
    getWorldMatrix : {m: XML3D.methods.XML3DGraphTypeGetWorldMatrix},
    setDirection : {m: XML3D.methods.viewSetDirection},
    setUpVector : {m: XML3D.methods.viewSetUpVector},
    lookAt : {m: XML3D.methods.viewLookAt},
    getDirection : {m: XML3D.methods.viewGetDirection},
    getUpVector : {m: XML3D.methods.viewGetUpVector},
    getViewMatrix : {m: XML3D.methods.viewGetViewMatrix},
    _term: undefined
};
/* END GENERATED */
