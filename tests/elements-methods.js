module("Element methods tests", {});
var bbox = XML3D.math.bbox;

test("xml3d methods test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "xml3d");
    ok(node);

    equal(node.getElementByPoint(0,0, new XML3D.Vec3(), new XML3D.Vec3()), null, "xml3d::getElementByPoint returns ");
    ok(node.generateRay(0,0) instanceof Float32Array, "xml3d::generateRay returns ");
    equal(node.getElementByRay(XML3D.math.ray.create(), new XML3D.Vec3(), new XML3D.Vec3()), null, "xml3d::getElementByRay returns ");

    ok(node.getLocalBoundingBox()instanceof Float32Array, "xml3d::getLocalBoundingBox returns ");
    ok(bbox.isEmpty(node.getLocalBoundingBox()), "Empty xml3d delivers empty BoundingBox");

    ok(node.getWorldBoundingBox() instanceof Float32Array, "xml3d::getWorldBoundingBox returns ");
    ok(bbox.isEmpty(node.getWorldBoundingBox()), "Empty xml3d delivers empty BoundingBox");
});
test("group interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "group");
    ok(node);

    ok(node.getWorldMatrix().data instanceof Float32Array, "group::getWorldMatrix returns XML3D.Mat4");
    deepEqual(node.getWorldMatrix().data, XML3D.math.mat4.create(),
            "group::getWorldMatrix returns identity matrix if not in hierarchy.");

    ok(node.getLocalMatrix().data instanceof Float32Array, "group::getLocalMatrix returns XML3D.Mat4");
    deepEqual(node.getLocalMatrix().data, XML3D.math.mat4.create(),
            "group::getLocalMatrix returns identity matrix with default attributes.");

    ok(node.getLocalBoundingBox() instanceof Float32Array, "group::getLocalBoundingBox returns ");
    ok(bbox.isEmpty(node.getLocalBoundingBox()), "Empty group delivers empty BoundingBox");

    ok(node.getWorldBoundingBox() instanceof Float32Array, "group::getWorldBoundingBox returns ");
    ok(bbox.isEmpty(node.getWorldBoundingBox()), "Empty group delivers empty BoundingBox");
});
test("mesh interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "mesh");
    ok(node);

    ok(node.getWorldMatrix().data instanceof Float32Array, "mesh::getWorldMatrix returns XML3D.Mat4");
    deepEqual(node.getWorldMatrix().data, XML3D.math.mat4.create(),
            "mesh::getWorldMatrix returns identity matrix if not in hierarchy.");

    ok(node.getLocalBoundingBox() instanceof Float32Array, "mesh::getLocalBoundingBox returns ");
    ok(bbox.isEmpty(node.getLocalBoundingBox()), "Empty mesh delivers empty BoundingBox");

    ok(node.getWorldBoundingBox() instanceof Float32Array, "mesh::getWorldBoundingBox returns ");
    ok(bbox.isEmpty(node.getWorldBoundingBox()), "Empty mesh delivers empty BoundingBox");
});
test("light interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "light");
    ok(node);

    ok(node.getWorldMatrix().data instanceof Float32Array, "light::getWorldMatrix returns XML3D.Mat4");
    deepEqual(node.getWorldMatrix().data, XML3D.math.mat4.create(),
            "light::getWorldMatrix returns identity matrix if not in hierarchy.");
});
test("view interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "view");
    ok(node);

    ok(node.getWorldMatrix().data instanceof Float32Array, "view::getWorldMatrix returns XML3D.Mat4");
    deepEqual(node.getWorldMatrix().data, XML3D.math.mat4.create(),
            "view::getWorldMatrix returns identity matrix if not in hierarchy.");

    ok(node.getViewMatrix().data instanceof Float32Array, "view::getViewMatrix returns XML3D.Mat4");
    deepEqual(node.getViewMatrix().data, XML3D.math.mat4.create(), "view::getViewMatrix returns with default parameters.");

    equal(node.setDirection([1, 0, 0]), undefined, "view::setDirection returns nothing");
    equal(node.setUpVector([1, 0, 0]), undefined, "view::setUpVector returns nothing");
    equal(node.lookAt([1, 0, 0]), undefined, "view::lookAt returns nothing");
    ok(node.getDirection().data instanceof Float32Array, "view::getDirection returns XML3D.Vec3");
    ok(node.getUpVector().data instanceof Float32Array, "view::getUpVector returns XML3D.Vec3");
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
    QUnit.closeArray(node.position.data, XML3D.math.vec3.create(), EPSILON, "Default position");
    QUnit.closeRotation(node.orientation.data, [0,0,0,1], EPSILON, "Default orientation");
    node.lookAt([0,0,-10]);
    QUnit.closeRotation(node.orientation.data, [0,0,0,1], EPSILON, "Look along default direction");
    node.lookAt([10,0,0]);
    QUnit.closeRotation(node.orientation.data, [0,-1,0, Math.PI/2.0], EPSILON, "Look to the right");
    node.lookAt([0,0,10]);
    QUnit.closeRotation(node.orientation.data, [0,1,0, Math.PI], EPSILON, "Look to the back");
    node.lookAt([-10,0,0]);
    QUnit.closeRotation(node.orientation.data, [0,1,0, Math.PI/2.0], EPSILON, "Look to the left");
});

test("view::setUpVector tests", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "view");
    ok(node);
    QUnit.closeArray(node.position.data, XML3D.math.vec3.create(), EPSILON, "Default position");
    QUnit.closeRotation(node.orientation.data, XML3D.math.vec4.fromValues(0,0,0,1), EPSILON, "Default orientation");
    node.setUpVector([0,0,1]);
    QUnit.closeRotation(node.orientation.data, [1,0,0, Math.PI/2.0], EPSILON, "Up vector is +z");
    node.orientation = new XML3D.Vec4();
    node.setUpVector([0,-1,0]);
    QUnit.closeRotation(node.orientation.data, [0,0,1, Math.PI], EPSILON, "Up vector is -y");
});

test("view::setDirection tests", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "view");
    ok(node);
    QUnit.closeArray(node.position.data, XML3D.math.vec3.create(), EPSILON, "Default position");
    QUnit.closeRotation(node.orientation.data, [0,0,0,1], EPSILON, "Default orientation");
    node.setDirection([0,1,0]);
    QUnit.closeRotation(node.orientation.data, [1,0,0, Math.PI/2.0], EPSILON, "Up vector is +z");
});
