
// MeshTypes
xml3d.MeshTypes = {};
xml3d.MeshTypes["triangles"] = 0;
xml3d.MeshTypes[0] = "triangles";
xml3d.MeshTypes["trianglestrips"] = 1;
xml3d.MeshTypes[1] = "trianglestrips";
xml3d.MeshTypes["lines"] = 2;
xml3d.MeshTypes[2] = "lines";
xml3d.MeshTypes["linestrips"] = 3;
xml3d.MeshTypes[3] = "linestrips";
// TextureTypes
xml3d.TextureTypes = {};
xml3d.TextureTypes["2d"] = 0;
xml3d.TextureTypes[0] = "2d";
xml3d.TextureTypes["1d"] = 1;
xml3d.TextureTypes[1] = "1d";
xml3d.TextureTypes["3d"] = 2;
xml3d.TextureTypes[2] = "3d";
// FilterTypes
xml3d.FilterTypes = {};
xml3d.FilterTypes["none"] = 0;
xml3d.FilterTypes[0] = "none";
xml3d.FilterTypes["nearest"] = 1;
xml3d.FilterTypes[1] = "nearest";
xml3d.FilterTypes["linear"] = 2;
xml3d.FilterTypes[2] = "linear";
// WrapTypes
xml3d.WrapTypes = {};
xml3d.WrapTypes["clamp"] = 0;
xml3d.WrapTypes[0] = "clamp";
xml3d.WrapTypes["repeat"] = 1;
xml3d.WrapTypes[1] = "repeat";
xml3d.WrapTypes["border"] = 2;
xml3d.WrapTypes[2] = "border";
// DataFieldType
xml3d.DataFieldType = {};
xml3d.DataFieldType["float "] = 0;
xml3d.DataFieldType[0] = "float ";
xml3d.DataFieldType["float2 "] = 1;
xml3d.DataFieldType[1] = "float2 ";
xml3d.DataFieldType["float3"] = 2;
xml3d.DataFieldType[2] = "float3";
xml3d.DataFieldType["float4"] = 3;
xml3d.DataFieldType[3] = "float4";
xml3d.DataFieldType["float4x4"] = 4;
xml3d.DataFieldType[4] = "float4x4";
xml3d.DataFieldType["int"] = 5;
xml3d.DataFieldType[5] = "int";
xml3d.DataFieldType["bool"] = 6;
xml3d.DataFieldType[6] = "bool";
xml3d.DataFieldType["texture"] = 7;
xml3d.DataFieldType[7] = "texture";
xml3d.DataFieldType["video"] = 8;
xml3d.DataFieldType[8] = "video";

xml3d.classInfo = {};

/**
 * Properties and methods for <xml3d>
 **/
xml3d.classInfo.xml3d = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.CanvasClassHandler, id: 'class'},
    style : {a: xml3d.CanvasStyleHandler},
	onclick : {a: xml3d.EventAttributeHandler},
	ondblclick : {a: xml3d.EventAttributeHandler},
	onmousedown : {a: xml3d.EventAttributeHandler},
	onmouseup : {a: xml3d.EventAttributeHandler},
	onmouseover : {a: xml3d.EventAttributeHandler},
	onmousemove : {a: xml3d.EventAttributeHandler},
	onmouseout : {a: xml3d.EventAttributeHandler},
	onkeypress : {a: xml3d.EventAttributeHandler},
	onkeydown : {a: xml3d.EventAttributeHandler},
	onkeyup : {a: xml3d.EventAttributeHandler},
	height : {a: xml3d.IntAttributeHandler, params: 600},
	width : {a: xml3d.IntAttributeHandler, params: 800},
	createXML3DVec3 : {m: xml3d.methods.xml3dCreateXML3DVec3},
	createXML3DRotation : {m: xml3d.methods.xml3dCreateXML3DRotation},
	createXML3DMatrix : {m: xml3d.methods.xml3dCreateXML3DMatrix},
	createXML3DRay : {m: xml3d.methods.xml3dCreateXML3DRay},
	getElementByPoint : {m: xml3d.methods.xml3dGetElementByPoint},
	generateRay : {m: xml3d.methods.xml3dGenerateRay},
	getElementByRay : {m: xml3d.methods.xml3dGetElementByRay},
	getBoundingBox : {m: xml3d.methods.xml3dGetBoundingBox},
	activeView : {a: xml3d.ReferenceHandler},
	_term: undefined
};
/**
 * Properties and methods for <data>
 **/
xml3d.classInfo.data = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for data
	map : {a: xml3d.StringAttributeHandler},
	expose : {a: xml3d.StringAttributeHandler},
	getResult : {m: xml3d.methods.dataGetResult},
	getOutputFieldNames : {m: xml3d.methods.dataGetOutputFieldNames},
	src : {a: xml3d.ReferenceHandler},
	script : {a: xml3d.ReferenceHandler},
	_term: undefined
};
/**
 * Properties and methods for <defs>
 **/
xml3d.classInfo.defs = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for defs
	_term: undefined
};
/**
 * Properties and methods for <group>
 **/
xml3d.classInfo.group = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for group
	onclick : {a: xml3d.EventAttributeHandler},
	ondblclick : {a: xml3d.EventAttributeHandler},
	onmousedown : {a: xml3d.EventAttributeHandler},
	onmouseup : {a: xml3d.EventAttributeHandler},
	onmouseover : {a: xml3d.EventAttributeHandler},
	onmousemove : {a: xml3d.EventAttributeHandler},
	onmouseout : {a: xml3d.EventAttributeHandler},
	onkeypress : {a: xml3d.EventAttributeHandler},
	onkeydown : {a: xml3d.EventAttributeHandler},
	onkeyup : {a: xml3d.EventAttributeHandler},
	visible : {a: xml3d.BoolAttributeHandler, params: true},
	getWorldMatrix : {m: xml3d.methods.XML3DGraphTypeGetWorldMatrix},
	getLocalMatrix : {m: xml3d.methods.groupGetLocalMatrix},
	getBoundingBox : {m: xml3d.methods.groupGetBoundingBox},
	transform : {a: xml3d.ReferenceHandler},
	shader : {a: xml3d.ReferenceHandler},
	_term: undefined
};
/**
 * Properties and methods for <mesh>
 **/
xml3d.classInfo.mesh = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for mesh
	onclick : {a: xml3d.EventAttributeHandler},
	ondblclick : {a: xml3d.EventAttributeHandler},
	onmousedown : {a: xml3d.EventAttributeHandler},
	onmouseup : {a: xml3d.EventAttributeHandler},
	onmouseover : {a: xml3d.EventAttributeHandler},
	onmousemove : {a: xml3d.EventAttributeHandler},
	onmouseout : {a: xml3d.EventAttributeHandler},
	onkeypress : {a: xml3d.EventAttributeHandler},
	onkeydown : {a: xml3d.EventAttributeHandler},
	onkeyup : {a: xml3d.EventAttributeHandler},
	visible : {a: xml3d.BoolAttributeHandler, params: true},
	type : {a: xml3d.EnumAttributeHandler, params: {e: xml3d.MeshTypes, d: 0}},
	getWorldMatrix : {m: xml3d.methods.XML3DGraphTypeGetWorldMatrix},
	getBoundingBox : {m: xml3d.methods.meshGetBoundingBox},
	src : {a: xml3d.ReferenceHandler},
	_term: undefined
};
/**
 * Properties and methods for <transform>
 **/
xml3d.classInfo.transform = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for transform
	translation : {a: xml3d.XML3DVec3AttributeHandler, params: [0, 0, 0]},
	scale : {a: xml3d.XML3DVec3AttributeHandler, params: [1, 1, 1]},
	rotation : {a: xml3d.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
	center : {a: xml3d.XML3DVec3AttributeHandler, params: [0, 0, 0]},
	scaleOrientation : {a: xml3d.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
	_term: undefined
};
/**
 * Properties and methods for <shader>
 **/
xml3d.classInfo.shader = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for shader
	script : {a: xml3d.ReferenceHandler},
	src : {a: xml3d.ReferenceHandler},
	_term: undefined
};
/**
 * Properties and methods for <light>
 **/
xml3d.classInfo.light = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for light
	onclick : {a: xml3d.EventAttributeHandler},
	ondblclick : {a: xml3d.EventAttributeHandler},
	onmousedown : {a: xml3d.EventAttributeHandler},
	onmouseup : {a: xml3d.EventAttributeHandler},
	onmouseover : {a: xml3d.EventAttributeHandler},
	onmousemove : {a: xml3d.EventAttributeHandler},
	onmouseout : {a: xml3d.EventAttributeHandler},
	onkeypress : {a: xml3d.EventAttributeHandler},
	onkeydown : {a: xml3d.EventAttributeHandler},
	onkeyup : {a: xml3d.EventAttributeHandler},
	visible : {a: xml3d.BoolAttributeHandler, params: true},
	global : {a: xml3d.BoolAttributeHandler, params: false},
	intensity : {a: xml3d.FloatAttributeHandler, params: 1},
	getWorldMatrix : {m: xml3d.methods.XML3DGraphTypeGetWorldMatrix},
	shader : {a: xml3d.ReferenceHandler},
	_term: undefined
};
/**
 * Properties and methods for <lightshader>
 **/
xml3d.classInfo.lightshader = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for lightshader
	script : {a: xml3d.ReferenceHandler},
	src : {a: xml3d.ReferenceHandler},
	_term: undefined
};
/**
 * Properties and methods for <script>
 **/
xml3d.classInfo.script = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for script
	value : {a: xml3d.StringAttributeHandler},
	src : {a: xml3d.StringAttributeHandler},
	type : {a: xml3d.StringAttributeHandler},
	_term: undefined
};
/**
 * Properties and methods for <float>
 **/
xml3d.classInfo.float = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float
	name : {a: xml3d.StringAttributeHandler},
	value : {a: xml3d.FloatArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <float2>
 **/
xml3d.classInfo.float2 = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float2
	name : {a: xml3d.StringAttributeHandler},
	value : {a: xml3d.Float2ArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <float3>
 **/
xml3d.classInfo.float3 = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float3
	name : {a: xml3d.StringAttributeHandler},
	value : {a: xml3d.Float3ArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <float4>
 **/
xml3d.classInfo.float4 = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float4
	name : {a: xml3d.StringAttributeHandler},
	value : {a: xml3d.Float4ArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <float4x4>
 **/
xml3d.classInfo.float4x4 = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for float4x4
	name : {a: xml3d.StringAttributeHandler},
	value : {a: xml3d.Float4x4ArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <int>
 **/
xml3d.classInfo.int = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for int
	name : {a: xml3d.StringAttributeHandler},
	value : {a: xml3d.IntArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <bool>
 **/
xml3d.classInfo.bool = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for bool
	name : {a: xml3d.StringAttributeHandler},
	value : {a: xml3d.BoolArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <texture>
 **/
xml3d.classInfo.texture = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for texture
	name : {a: xml3d.StringAttributeHandler},
	type : {a: xml3d.EnumAttributeHandler, params: {e: xml3d.TextureTypes, d: 0}},
	filterMin : {a: xml3d.EnumAttributeHandler, params: {e: xml3d.FilterTypes, d: 2}},
	filterMag : {a: xml3d.EnumAttributeHandler, params: {e: xml3d.FilterTypes, d: 2}},
	filterMip : {a: xml3d.EnumAttributeHandler, params: {e: xml3d.FilterTypes, d: 1}},
	wrapS : {a: xml3d.EnumAttributeHandler, params: {e: xml3d.WrapTypes, d: 0}},
	wrapT : {a: xml3d.EnumAttributeHandler, params: {e: xml3d.WrapTypes, d: 0}},
	wrapU : {a: xml3d.EnumAttributeHandler, params: {e: xml3d.WrapTypes, d: 0}},
	borderColor : {a: xml3d.StringAttributeHandler},
	_term: undefined
};
/**
 * Properties and methods for <img>
 **/
xml3d.classInfo.img = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for img
	src : {a: xml3d.StringAttributeHandler},
	_term: undefined
};
/**
 * Properties and methods for <video>
 **/
xml3d.classInfo.video = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for video
	src : {a: xml3d.StringAttributeHandler},
	_term: undefined
};
/**
 * Properties and methods for <view>
 **/
xml3d.classInfo.view = {
	id : {a: xml3d.StringAttributeHandler},
    className : {a: xml3d.StringAttributeHandler, id: 'class'},
    // TODO: Handle style for view
	onclick : {a: xml3d.EventAttributeHandler},
	ondblclick : {a: xml3d.EventAttributeHandler},
	onmousedown : {a: xml3d.EventAttributeHandler},
	onmouseup : {a: xml3d.EventAttributeHandler},
	onmouseover : {a: xml3d.EventAttributeHandler},
	onmousemove : {a: xml3d.EventAttributeHandler},
	onmouseout : {a: xml3d.EventAttributeHandler},
	onkeypress : {a: xml3d.EventAttributeHandler},
	onkeydown : {a: xml3d.EventAttributeHandler},
	onkeyup : {a: xml3d.EventAttributeHandler},
	visible : {a: xml3d.BoolAttributeHandler, params: true},
	position : {a: xml3d.XML3DVec3AttributeHandler, params: [0, 0, 0]},
	orientation : {a: xml3d.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
	fieldOfView : {a: xml3d.FloatAttributeHandler, params: 0.785398},
	getWorldMatrix : {m: xml3d.methods.XML3DGraphTypeGetWorldMatrix},
	setDirection : {m: xml3d.methods.viewSetDirection},
	setUpVector : {m: xml3d.methods.viewSetUpVector},
	lookAt : {m: xml3d.methods.viewLookAt},
	getDirection : {m: xml3d.methods.viewGetDirection},
	getUpVector : {m: xml3d.methods.viewGetUpVector},
	getViewMatrix : {m: xml3d.methods.viewGetViewMatrix},
	_term: undefined
};
