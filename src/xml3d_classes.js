


org.xml3d.classInfo = {};
org.xml3d.document = null;

function getAllElementNodes(elem) {
	if (!elem)
		return [];
	var r = [];
	var n = elem.firstElementChild;
	while(n) {
		r.push(n);
		r = r.concat(getAllElementNodes(n));
		n = n.nextElementSibling;
	}
	return r;
};

function getElementNodes(elem) {
if (!elem)
	return [];
var r = [];
var n = elem.firstElementChild;
while(n) {
	r.push(n);
	n = n.nextElementSibling;
}
return r;
};

org.xml3d.defineClass = function(ctor, parent, methods) {
	if (parent) {
		function inheritance() {
		}
		inheritance.prototype = parent.prototype;
		ctor.prototype = new inheritance();
		ctor.prototype.constructor = ctor;
		ctor.superClass = parent;
	}
	if (methods) {
		for ( var m in methods) {
			ctor.prototype[m] = methods[m];
		}
	}
	return ctor;
};

org.xml3d.isa = function(object, classInfo) {
	var oClass = object._classInfo;
	while (oClass !== undefined)  {
		if (oClass == classInfo)
			return true;
		oClass = oClass.constructor.superClass;
	}
	return false;
};


var getElementByIdWrapper = function(xmldoc, myID, namespace) {

};




//-----------------------------------------------------------------------------
//Class Notification
//-----------------------------------------------------------------------------
org.xml3d.Notification = function(notifier, eventType, attribute, oldValue, newValue) {
	this.notifier = notifier;
	this.eventType = eventType;
	this.attribute = attribute;
	this.oldValue = oldValue;
	this.newValue = newValue;
};


//-----------------------------------------------------------------------------
// Init helper
//-----------------------------------------------------------------------------
org.xml3d.initFloat = function(value, defaultValue) {
	return value ? +value : defaultValue;
};

org.xml3d.initString = function(value, defaultValue) {
	return value ? value : defaultValue;
};

org.xml3d.initInt = function(value, defaultValue) {
	return value ? parseInt(value) : defaultValue;
};

/*
org.xml3d.initBoolean = function(value, defaultValue) {
	return value ? value == "true" : defaultValue;
};
*/

org.xml3d.initBoolean = function(value, defaultValue) {
    if (value === undefined || value == "")
		return defaultValue;
	
	if (typeof value == typeof "") {
		return value == "true" ? true : false;
	}
    return !!value;
};

org.xml3d.initXML3DVec3 = function(value, x, y, z) {
	if (value) {
		var result = new XML3DVec3();
		result.setVec3Value(value);
		return result;
	}
	else return new XML3DVec3(x, y, z);
};

org.xml3d.initXML3DRotation = function(value, x, y, z, angle) {
	var result = new XML3DRotation();
	if (value)
	{
		result.setAxisAngleValue(value);
	}
	else
	{
		result.setAxisAngle(new XML3DVec3(x, y, z), angle);
	}
	return result;
};

org.xml3d.initEnum = function(value, defaultValue, choice)
{
	if(value && typeof(value) == "string" && choice[value.toLowerCase()] !== undefined)
	{
		var index = choice[value.toLowerCase()];
		return choice[index];
	}

	return choice[defaultValue];
};

org.xml3d.initIntArray = function(value, defaultValue) {
	var exp = /([+\-0-9]+)/g;
	return value ? new Int32Array(value.match(exp)) : new Int32Array(defaultValue);
};

org.xml3d.initUInt16Array = function(value, defaultValue) {
	var exp = /([+\-0-9]+)/g;
	return value ? new Uint16Array(value.match(exp)) : new Uint16Array(defaultValue);
};

org.xml3d.initFloatArray = function(value, defaultValue) {
	var exp = /([+\-0-9eE\.]+)/g;
	return value ? new Float32Array(value.match(exp)) :  new Float32Array(defaultValue);
};

org.xml3d.initFloat3Array = function(value, defaultValue) {
	return org.xml3d.initFloatArray(value, defaultValue);
};

org.xml3d.initFloat2Array = function(value, defaultValue) {
	return org.xml3d.initFloatArray(value, defaultValue);
};

org.xml3d.initFloat4Array = function(value, defaultValue) {
	return org.xml3d.initFloatArray(value, defaultValue);
};

org.xml3d.initFloat4x4Array = function(value, defaultValue) {
	return org.xml3d.initFloatArray(value, defaultValue);
};

org.xml3d.initBoolArray = function(value, defaultValue) {
	var converted = value.replace(/(true)/i, "1").replace(/(false)/i, "0");
	return new Uint8Array(converted.match(/\d/i));
};

org.xml3d.initAnyURI = function(node, defaultValue) {
	return org.xml3d.initString(node, defaultValue);
};


//-----------------------------------------------------------------------------
// Checker helper
//-----------------------------------------------------------------------------
org.xml3d.isFloat = function(value)
{
	return typeof value == "number";
};

org.xml3d.isString = function(value)
{
	return typeof value == "string";
};

org.xml3d.isInt = function(value)
{
	return typeof value == "number";
};

org.xml3d.isBoolean = function(value)
{
	return typeof value == "boolean";
};

org.xml3d.isXML3DVec3 = function(value)
{
	return typeof value == "object" && new XML3DVec3().constructor == value.constructor;
};

org.xml3d.isXML3DRotation = function(value, x, y, z, angle)
{
	return typeof value == "object" && new XML3DRotation().constructor == value.constructor;
};

org.xml3d.isEnum = function(value, choice)
{
	return (typeof value == "string" && choice[value.toLowerCase()] != undefined);
};

org.xml3d.isIntArray = function(value)
{
	return typeof value == "object" && new Int32Array().constructor == value.constructor;
};

org.xml3d.isUInt16Array = function(value)
{
	return typeof value == "object" && new Uint16Array().constructor == value.constructor;
};

org.xml3d.isFloatArray = function(value)
{
	return typeof value == "object" && new Float32Array().constructor == value.constructor;
};

org.xml3d.isFloat3Array = function(value)
{
	return org.xml3d.isFloatArray(value);
};

org.xml3d.isFloat2Array = function(value)
{
	return org.xml3d.isFloatArray(value);
};

org.xml3d.isFloat4Array = function(value)
{
	return org.xml3d.isFloatArray(value);
};

org.xml3d.isFloat4x4Array = function(value)
{
	return org.xml3d.isFloatArray(value);
};

org.xml3d.isBoolArray = function(value)
{
	return typeof value == "object" && new Uint8Array().constructor == value.constructor;
};

org.xml3d.isAnyURI = function(node)
{
	return org.xml3d.isString(node);
};

org.xml3d.elementEvents = {
    "framedrawn":1, "mousedown":1, "mouseup":1, "click":1, "mousemove":1, 
	"mouseout":1, "update":1, "mousewheel":1 
};


// MeshTypes
org.xml3d.MeshTypes = {};
org.xml3d.MeshTypes["triangles"] = 0;
org.xml3d.MeshTypes[0] = "triangles";
org.xml3d.MeshTypes["trianglestrips"] = 1;
org.xml3d.MeshTypes[1] = "trianglestrips";
org.xml3d.MeshTypes["lines"] = 2;
org.xml3d.MeshTypes[2] = "lines";
org.xml3d.MeshTypes["linestrips"] = 3;
org.xml3d.MeshTypes[3] = "linestrips";
// TextureTypes
org.xml3d.TextureTypes = {};
org.xml3d.TextureTypes["2d"] = 0;
org.xml3d.TextureTypes[0] = "2d";
org.xml3d.TextureTypes["1d"] = 1;
org.xml3d.TextureTypes[1] = "1d";
org.xml3d.TextureTypes["3d"] = 2;
org.xml3d.TextureTypes[2] = "3d";
// FilterTypes
org.xml3d.FilterTypes = {};
org.xml3d.FilterTypes["none"] = 0;
org.xml3d.FilterTypes[0] = "none";
org.xml3d.FilterTypes["nearest"] = 1;
org.xml3d.FilterTypes[1] = "nearest";
org.xml3d.FilterTypes["linear"] = 2;
org.xml3d.FilterTypes[2] = "linear";
// WrapTypes
org.xml3d.WrapTypes = {};
org.xml3d.WrapTypes["clamp"] = 0;
org.xml3d.WrapTypes[0] = "clamp";
org.xml3d.WrapTypes["repeat"] = 1;
org.xml3d.WrapTypes[1] = "repeat";
org.xml3d.WrapTypes["border"] = 2;
org.xml3d.WrapTypes[2] = "border";
// DataFieldType
org.xml3d.DataFieldType = {};
org.xml3d.DataFieldType["float "] = 0;
org.xml3d.DataFieldType[0] = "float ";
org.xml3d.DataFieldType["float2 "] = 1;
org.xml3d.DataFieldType[1] = "float2 ";
org.xml3d.DataFieldType["float3"] = 2;
org.xml3d.DataFieldType[2] = "float3";
org.xml3d.DataFieldType["float4"] = 3;
org.xml3d.DataFieldType[3] = "float4";
org.xml3d.DataFieldType["float4x4"] = 4;
org.xml3d.DataFieldType[4] = "float4x4";
org.xml3d.DataFieldType["int"] = 5;
org.xml3d.DataFieldType[5] = "int";
org.xml3d.DataFieldType["bool"] = 6;
org.xml3d.DataFieldType[6] = "bool";
org.xml3d.DataFieldType["texture"] = 7;
org.xml3d.DataFieldType[7] = "texture";
org.xml3d.DataFieldType["video"] = 8;
org.xml3d.DataFieldType[8] = "video";

org.xml3d.event = org.xml3d.event || {};

/**
 * Properties and methods for <xml3d>
 **/
org.xml3d.classInfo.xml3d = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	onclick : {a: org.xml3d.EventAttributeHandler},
	ondblclick : {a: org.xml3d.EventAttributeHandler},
	onmousedown : {a: org.xml3d.EventAttributeHandler},
	onmouseup : {a: org.xml3d.EventAttributeHandler},
	onmouseover : {a: org.xml3d.EventAttributeHandler},
	onmousemove : {a: org.xml3d.EventAttributeHandler},
	onmouseout : {a: org.xml3d.EventAttributeHandler},
	onkeypress : {a: org.xml3d.EventAttributeHandler},
	onkeydown : {a: org.xml3d.EventAttributeHandler},
	onkeyup : {a: org.xml3d.EventAttributeHandler},
	height : {a: org.xml3d.IntAttributeHandler, params: 600},
	width : {a: org.xml3d.IntAttributeHandler, params: 800},
	createXML3DVec3 : {m: org.xml3d.methods.xml3dCreateXML3DVec3},
	createXML3DRotation : {m: org.xml3d.methods.xml3dCreateXML3DRotation},
	createXML3DMatrix : {m: org.xml3d.methods.xml3dCreateXML3DMatrix},
	createXML3DRay : {m: org.xml3d.methods.xml3dCreateXML3DRay},
	getElementByPoint : {m: org.xml3d.methods.xml3dGetElementByPoint},
	generateRay : {m: org.xml3d.methods.xml3dGenerateRay},
	getElementByRay : {m: org.xml3d.methods.xml3dGetElementByRay},
	getBoundingBox : {m: org.xml3d.methods.xml3dGetBoundingBox},
	_term: undefined
};
/**
 * Properties and methods for <data>
 **/
org.xml3d.classInfo.data = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	map : {a: org.xml3d.StringAttributeHandler},
	expose : {a: org.xml3d.StringAttributeHandler},
	getResult : {m: org.xml3d.methods.dataGetResult},
	getOutputFieldNames : {m: org.xml3d.methods.dataGetOutputFieldNames},
	_term: undefined
};
/**
 * Properties and methods for <defs>
 **/
org.xml3d.classInfo.defs = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	_term: undefined
};
/**
 * Properties and methods for <group>
 **/
org.xml3d.classInfo.group = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	onclick : {a: org.xml3d.EventAttributeHandler},
	ondblclick : {a: org.xml3d.EventAttributeHandler},
	onmousedown : {a: org.xml3d.EventAttributeHandler},
	onmouseup : {a: org.xml3d.EventAttributeHandler},
	onmouseover : {a: org.xml3d.EventAttributeHandler},
	onmousemove : {a: org.xml3d.EventAttributeHandler},
	onmouseout : {a: org.xml3d.EventAttributeHandler},
	onkeypress : {a: org.xml3d.EventAttributeHandler},
	onkeydown : {a: org.xml3d.EventAttributeHandler},
	onkeyup : {a: org.xml3d.EventAttributeHandler},
	visible : {a: org.xml3d.BoolAttributeHandler, params: true},
	getWorldMatrix : {m: org.xml3d.methods.XML3DGraphTypeGetWorldMatrix},
	getLocalMatrix : {m: org.xml3d.methods.groupGetLocalMatrix},
	getBoundingBox : {m: org.xml3d.methods.groupGetBoundingBox},
	_term: undefined
};
/**
 * Properties and methods for <mesh>
 **/
org.xml3d.classInfo.mesh = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	onclick : {a: org.xml3d.EventAttributeHandler},
	ondblclick : {a: org.xml3d.EventAttributeHandler},
	onmousedown : {a: org.xml3d.EventAttributeHandler},
	onmouseup : {a: org.xml3d.EventAttributeHandler},
	onmouseover : {a: org.xml3d.EventAttributeHandler},
	onmousemove : {a: org.xml3d.EventAttributeHandler},
	onmouseout : {a: org.xml3d.EventAttributeHandler},
	onkeypress : {a: org.xml3d.EventAttributeHandler},
	onkeydown : {a: org.xml3d.EventAttributeHandler},
	onkeyup : {a: org.xml3d.EventAttributeHandler},
	visible : {a: org.xml3d.BoolAttributeHandler, params: true},
	type : {a: org.xml3d.EnumAttributeHandler, params: {e: org.xml3d.MeshTypes, d: 0}},
	getWorldMatrix : {m: org.xml3d.methods.XML3DGraphTypeGetWorldMatrix},
	getBoundingBox : {m: org.xml3d.methods.meshGetBoundingBox},
	_term: undefined
};
/**
 * Properties and methods for <transform>
 **/
org.xml3d.classInfo.transform = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	translation : {a: org.xml3d.XML3DVec3AttributeHandler, params: [0, 0, 0]},
	scale : {a: org.xml3d.XML3DVec3AttributeHandler, params: [1, 1, 1]},
	rotation : {a: org.xml3d.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
	center : {a: org.xml3d.XML3DVec3AttributeHandler, params: [0, 0, 0]},
	scaleOrientation : {a: org.xml3d.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
	_term: undefined
};
/**
 * Properties and methods for <shader>
 **/
org.xml3d.classInfo.shader = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	_term: undefined
};
/**
 * Properties and methods for <light>
 **/
org.xml3d.classInfo.light = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	onclick : {a: org.xml3d.EventAttributeHandler},
	ondblclick : {a: org.xml3d.EventAttributeHandler},
	onmousedown : {a: org.xml3d.EventAttributeHandler},
	onmouseup : {a: org.xml3d.EventAttributeHandler},
	onmouseover : {a: org.xml3d.EventAttributeHandler},
	onmousemove : {a: org.xml3d.EventAttributeHandler},
	onmouseout : {a: org.xml3d.EventAttributeHandler},
	onkeypress : {a: org.xml3d.EventAttributeHandler},
	onkeydown : {a: org.xml3d.EventAttributeHandler},
	onkeyup : {a: org.xml3d.EventAttributeHandler},
	visible : {a: org.xml3d.BoolAttributeHandler, params: true},
	global : {a: org.xml3d.BoolAttributeHandler, params: false},
	intensity : {a: org.xml3d.FloatAttributeHandler, params: 1},
	getWorldMatrix : {m: org.xml3d.methods.XML3DGraphTypeGetWorldMatrix},
	_term: undefined
};
/**
 * Properties and methods for <lightshader>
 **/
org.xml3d.classInfo.lightshader = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	_term: undefined
};
/**
 * Properties and methods for <script>
 **/
org.xml3d.classInfo.script = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	value : {a: org.xml3d.StringAttributeHandler},
	src : {a: org.xml3d.StringAttributeHandler},
	type : {a: org.xml3d.StringAttributeHandler},
	_term: undefined
};
/**
 * Properties and methods for <float>
 **/
org.xml3d.classInfo.float = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	name : {a: org.xml3d.StringAttributeHandler},
	value : {a: org.xml3d.FloatArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <float2>
 **/
org.xml3d.classInfo.float2 = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	name : {a: org.xml3d.StringAttributeHandler},
	value : {a: org.xml3d.Float2ArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <float3>
 **/
org.xml3d.classInfo.float3 = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	name : {a: org.xml3d.StringAttributeHandler},
	value : {a: org.xml3d.Float3ArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <float4>
 **/
org.xml3d.classInfo.float4 = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	name : {a: org.xml3d.StringAttributeHandler},
	value : {a: org.xml3d.Float4ArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <float4x4>
 **/
org.xml3d.classInfo.float4x4 = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	name : {a: org.xml3d.StringAttributeHandler},
	value : {a: org.xml3d.Float4x4ArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <int>
 **/
org.xml3d.classInfo.int = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	name : {a: org.xml3d.StringAttributeHandler},
	value : {a: org.xml3d.IntArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <bool>
 **/
org.xml3d.classInfo.bool = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	name : {a: org.xml3d.StringAttributeHandler},
	value : {a: org.xml3d.BoolArrayValueHandler},
	_term: undefined
};
/**
 * Properties and methods for <texture>
 **/
org.xml3d.classInfo.texture = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	name : {a: org.xml3d.StringAttributeHandler},
	type : {a: org.xml3d.EnumAttributeHandler, params: {e: org.xml3d.TextureTypes, d: 0}},
	filterMin : {a: org.xml3d.EnumAttributeHandler, params: {e: org.xml3d.FilterTypes, d: 2}},
	filterMag : {a: org.xml3d.EnumAttributeHandler, params: {e: org.xml3d.FilterTypes, d: 2}},
	filterMip : {a: org.xml3d.EnumAttributeHandler, params: {e: org.xml3d.FilterTypes, d: 1}},
	wrapS : {a: org.xml3d.EnumAttributeHandler, params: {e: org.xml3d.WrapTypes, d: 0}},
	wrapT : {a: org.xml3d.EnumAttributeHandler, params: {e: org.xml3d.WrapTypes, d: 0}},
	wrapU : {a: org.xml3d.EnumAttributeHandler, params: {e: org.xml3d.WrapTypes, d: 0}},
	borderColor : {a: org.xml3d.StringAttributeHandler},
	_term: undefined
};
/**
 * Properties and methods for <img>
 **/
org.xml3d.classInfo.img = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	src : {a: org.xml3d.StringAttributeHandler},
	_term: undefined
};
/**
 * Properties and methods for <video>
 **/
org.xml3d.classInfo.video = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	src : {a: org.xml3d.StringAttributeHandler},
	_term: undefined
};
/**
 * Properties and methods for <view>
 **/
org.xml3d.classInfo.view = {
	id : {a: org.xml3d.StringAttributeHandler},
	className : {a: org.xml3d.StringAttributeHandler, id: 'class'},
	// TODO: Handle style
	onclick : {a: org.xml3d.EventAttributeHandler},
	ondblclick : {a: org.xml3d.EventAttributeHandler},
	onmousedown : {a: org.xml3d.EventAttributeHandler},
	onmouseup : {a: org.xml3d.EventAttributeHandler},
	onmouseover : {a: org.xml3d.EventAttributeHandler},
	onmousemove : {a: org.xml3d.EventAttributeHandler},
	onmouseout : {a: org.xml3d.EventAttributeHandler},
	onkeypress : {a: org.xml3d.EventAttributeHandler},
	onkeydown : {a: org.xml3d.EventAttributeHandler},
	onkeyup : {a: org.xml3d.EventAttributeHandler},
	visible : {a: org.xml3d.BoolAttributeHandler, params: true},
	position : {a: org.xml3d.XML3DVec3AttributeHandler, params: [0, 0, 0]},
	orientation : {a: org.xml3d.XML3DRotationAttributeHandler, params: [0, 0, 1, 0]},
	fieldOfView : {a: org.xml3d.FloatAttributeHandler, params: 0.785398},
	getWorldMatrix : {m: org.xml3d.methods.XML3DGraphTypeGetWorldMatrix},
	setDirection : {m: org.xml3d.methods.viewSetDirection},
	setUpVector : {m: org.xml3d.methods.viewSetUpVector},
	lookAt : {m: org.xml3d.methods.viewLookAt},
	getDirection : {m: org.xml3d.methods.viewGetDirection},
	getUpVector : {m: org.xml3d.methods.viewGetUpVector},
	getViewMatrix : {m: org.xml3d.methods.viewGetViewMatrix},
	_term: undefined
};
