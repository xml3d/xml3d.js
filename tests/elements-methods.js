module("Element methods tests", {});
test("xml3d methods test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "xml3d");
    ok(node);

    ok(node.createXML3DVec3() instanceof XML3DVec3, "xml3d::createXML3DVec3() returns XML3DVec3");
    deepEqual(node.createXML3DVec3(), new XML3DVec3(), "xml3d::createXML3DVec3() == new XML3DVec3()");

    ok(node.createXML3DRotation() instanceof XML3DRotation, "xml3d::createXML3DRotation returns XML3DRotation");
    deepEqual(node.createXML3DRotation(), new XML3DRotation(), "xml3d::createXML3DRotation() == new XML3DRotation()");

    ok(node.createXML3DMatrix() instanceof XML3DMatrix, "xml3d::createXML3DMatrix returns XML3DMatrix");
    deepEqual(node.createXML3DMatrix(), new XML3DMatrix(), "xml3d::createXML3DMatrix() == new XML3DMatrix()");

    ok(node.createXML3DRay() instanceof XML3DRay, "xml3d::createXML3DRay returns XML3DRay");
    deepEqual(node.createXML3DRay(), new XML3DRay(), "xml3d::createXML3DRay() == new XML3DRay()");

    equal(node.getElementByPoint(), null, "xml3d::getElementByPoint returns ");
    ok(node.generateRay() instanceof XML3DRay, "xml3d::generateRay returns ");
    equal(node.getElementByRay(), null, "xml3d::getElementByRay returns ");

    ok(node.getBoundingBox() instanceof XML3DBox, "xml3d::getBoundingBox returns ");
    ok(node.getBoundingBox().isEmpty(), "Empty xml3d delivers empty BoundingBox");
});
test("group interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "group");
    ok(node);

    ok(node.getWorldMatrix() instanceof XML3DMatrix, "group::getWorldMatrix returns XML3DMatrix");
    deepEqual(node.getWorldMatrix(), new XML3DMatrix(),
            "group::getWorldMatrix returns identity matrix if not in hierarchy.");

    ok(node.getLocalMatrix() instanceof XML3DMatrix, "group::getLocalMatrix returns XML3DMatrix");
    deepEqual(node.getLocalMatrix(), new XML3DMatrix(),
            "group::getLocalMatrix returns identity matrix with default attributes.");

    ok(node.getBoundingBox() instanceof XML3DBox, "group::getBoundingBox returns XML3DBox");
    ok(node.getBoundingBox().isEmpty(), "Empty group delivers empty BoundingBox");
});
test("mesh interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "mesh");
    ok(node);

    ok(node.getWorldMatrix() instanceof XML3DMatrix, "mesh::getWorldMatrix returns XML3DMatrix");
    deepEqual(node.getWorldMatrix(), new XML3DMatrix(),
            "mesh::getWorldMatrix returns identity matrix if not in hierarchy.");

    ok(node.getBoundingBox() instanceof XML3DBox, "mesh::getBoundingBox returns XML3DBox");
    ok(node.getBoundingBox().isEmpty(), "Empty mesh delivers empty BoundingBox");
});
test("light interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "light");
    ok(node);

    ok(node.getWorldMatrix() instanceof XML3DMatrix, "light::getWorldMatrix returns XML3DMatrix");
    deepEqual(node.getWorldMatrix(), new XML3DMatrix(),
            "light::getWorldMatrix returns identity matrix if not in hierarchy.");
});
test("view interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "view");
    ok(node);

    ok(node.getWorldMatrix() instanceof XML3DMatrix, "view::getWorldMatrix returns XML3DMatrix");
    deepEqual(node.getWorldMatrix(), new XML3DMatrix(),
            "view::getWorldMatrix returns identity matrix if not in hierarchy.");

    ok(node.getViewMatrix() instanceof XML3DMatrix, "view::getViewMatrix returns XML3DMatrix");
    deepEqual(node.getViewMatrix(), new XML3DMatrix(), "view::getViewMatrix returns with default parameters.");

    equal(node.setDirection(new XML3DVec3(1, 0, 0)), undefined, "view::setDirection returns nothing");
    equal(node.setUpVector(new XML3DVec3(1, 0, 0)), undefined, "view::setUpVector returns nothing");
    equal(node.lookAt(new XML3DVec3(1, 0, 0)), undefined, "view::lookAt returns nothing");
    ok(node.getDirection() instanceof XML3DVec3, "view::getDirection returns XML3DVec3");
    ok(node.getUpVector() instanceof XML3DVec3, "view::getUpVector returns XML3DVec3");

});
