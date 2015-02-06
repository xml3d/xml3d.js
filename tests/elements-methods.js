module("Element methods tests", {});
test("xml3d methods test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "xml3d");
    ok(node);

    equal(node.getElementByPoint(0,0, new XML3DVec3(), new XML3DVec3()), null, "xml3d::getElementByPoint returns ");
    ok(node.generateRay(0,0) instanceof XML3DRay, "xml3d::generateRay returns ");
    equal(node.getElementByRay(new XML3DRay(), new XML3DVec3(), new XML3DVec3()), null, "xml3d::getElementByRay returns ");

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
test("data interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "data");
    ok(node);

    ok(node.getResult() instanceof XML3DDataResult, "data::getResult returns XML3DDataResult");
    ok(node.getOutputNames() instanceof Array, "data::getOutputNames returns an Array");
});


test("view::lookAt tests", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "view");
    ok(node);
    QUnit.closeVector(node.position, new XML3DVec3(), EPSILON, "Default position");
    QUnit.closeRotation(node.orientation, new XML3DRotation(), EPSILON, "Default orientation");
    node.lookAt(new XML3DVec3(0,0,-10));
    QUnit.closeRotation(node.orientation, new XML3DRotation(), EPSILON, "Look along default direction");
    node.lookAt(new XML3DVec3(10,0,0));
    QUnit.closeRotation(node.orientation, new XML3DRotation(new XML3DVec3(0,-1,0),Math.PI/2.0), EPSILON, "Look to the right");
    node.lookAt(new XML3DVec3(0,0,10));
    QUnit.closeRotation(node.orientation, new XML3DRotation(new XML3DVec3(0,1,0),Math.PI), EPSILON, "Look to the back");
    node.lookAt(new XML3DVec3(-10,0,0));
    QUnit.closeRotation(node.orientation, new XML3DRotation(new XML3DVec3(0,1,0),Math.PI/2.0), EPSILON, "Look to the left");
});

test("view::setUpVector tests", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "view");
    ok(node);
    QUnit.closeVector(node.position, new XML3DVec3(), EPSILON, "Default position");
    QUnit.closeRotation(node.orientation, new XML3DRotation(), EPSILON, "Default orientation");
    node.setUpVector(new XML3DVec3(0,0,1));
    QUnit.closeRotation(node.orientation, new XML3DRotation(new XML3DVec3(1,0,0),Math.PI/2.0), EPSILON, "Up vector is +z");
    node.orientation.set(new XML3DRotation());
    node.setUpVector(new XML3DVec3(0,-1,0));
    QUnit.closeRotation(node.orientation, new XML3DRotation(new XML3DVec3(0,0,1),Math.PI), EPSILON, "Up vector is -y");
});

test("view::setDirection tests", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "view");
    ok(node);
    QUnit.closeVector(node.position, new XML3DVec3(), EPSILON, "Default position");
    QUnit.closeRotation(node.orientation, new XML3DRotation(), EPSILON, "Default orientation");
    node.setDirection(new XML3DVec3(0,1,0));
    QUnit.closeRotation(node.orientation, new XML3DRotation(new XML3DVec3(1,0,0),Math.PI/2.0), EPSILON, "Up vector is +z");
});
