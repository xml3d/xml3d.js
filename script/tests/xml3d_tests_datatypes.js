var org;
if (!org)
	org = {};
else if (typeof org != "object")
	throw new Error("org already exists and is not an object");

if (!org.xml3d)
	org.xml3d = {};
else if (typeof org.xml3d != "object")
	throw new Error("org.xml3d already exists and is not an object");

if (!org.xml3d.tests)
	org.xml3d.tests = {};
else if (typeof org.xml3d.tests != "object")
	throw new Error("org.xml3d.tests already exists and is not an object");


org.xml3d.tests.datatypes = [ 
"XML3DVec3",
"XML3DRotation",
"XML3DMatrix",
"XML3DBox",
"XML3DRay",
];

org.xml3d.tests.XML3DVec3 = {};
org.xml3d.tests.XML3DVec3.functs = [
"setVec3Value",
"add",
"subtract",
"multiply",
"scale",
"cross",
"dot",
"negate",
"length",
"normalize",
];
org.xml3d.tests.XML3DRotation = {};
org.xml3d.tests.XML3DRotation.functs = [
"setRotation",
"setAxisAngle",
"setQuaternion",
"setAxisAngleValue",
"toMatrix",
"rotateVec3",
"interpolate",
"multiply",
"normalize",
];
org.xml3d.tests.XML3DMatrix = {};
org.xml3d.tests.XML3DMatrix.functs = [
"setMatrixValue",
"multiply",
"inverse",
"translate",
"scale",
"rotate",
"rotateAxisAngle",
];
org.xml3d.tests.XML3DBox = {};
org.xml3d.tests.XML3DBox.functs = [
"size",
"center",
"makeEmpty",
"isEmpty",
];
org.xml3d.tests.XML3DRay = {};
org.xml3d.tests.XML3DRay.functs = [
];
 
