module("Element methods tests", {
});
test("xml3d interface test", function() {
	var node = document.createElementNS("http://www.xml3d.org/2009/xml3d","xml3d");
	ok(node);
	equals(typeof node.createXML3DVec3, "function", "xml3d::createXML3DVec3 exists");
	equals(typeof node.createXML3DRotation, "function", "xml3d::createXML3DRotation exists");
	equals(typeof node.createXML3DMatrix, "function", "xml3d::createXML3DMatrix exists");
	equals(typeof node.createXML3DRay, "function", "xml3d::createXML3DRay exists");
	equals(typeof node.getElementByPoint, "function", "xml3d::getElementByPoint exists");
	equals(typeof node.generateRay, "function", "xml3d::generateRay exists");
	equals(typeof node.getElementByRay, "function", "xml3d::getElementByRay exists");
	equals(typeof node.getBoundingBox, "function", "xml3d::getBoundingBox exists");
});
test("group interface test", function() {
	var node = document.createElementNS("http://www.xml3d.org/2009/xml3d","group");
	ok(node);
	equals(typeof node.getWorldMatrix, "function", "group::getWorldMatrix exists");
	equals(typeof node.getLocalMatrix, "function", "group::getLocalMatrix exists");
	equals(typeof node.getBoundingBox, "function", "group::getBoundingBox exists");
});
test("mesh interface test", function() {
	var node = document.createElementNS("http://www.xml3d.org/2009/xml3d","mesh");
	ok(node);
	equals(typeof node.getWorldMatrix, "function", "mesh::getWorldMatrix exists");
	equals(typeof node.getBoundingBox, "function", "mesh::getBoundingBox exists");
});
test("light interface test", function() {
	var node = document.createElementNS("http://www.xml3d.org/2009/xml3d","light");
	ok(node);
	equals(typeof node.getWorldMatrix, "function", "light::getWorldMatrix exists");
});
test("view interface test", function() {
	var node = document.createElementNS("http://www.xml3d.org/2009/xml3d","view");
	ok(node);
	equals(typeof node.getWorldMatrix, "function", "view::getWorldMatrix exists");
	equals(typeof node.setDirection, "function", "view::setDirection exists");
	equals(typeof node.setUpVector, "function", "view::setUpVector exists");
	equals(typeof node.lookAt, "function", "view::lookAt exists");
	equals(typeof node.getDirection, "function", "view::getDirection exists");
	equals(typeof node.getUpVector, "function", "view::getUpVector exists");
	equals(typeof node.getViewMatrix, "function", "view::getViewMatrix exists");
});