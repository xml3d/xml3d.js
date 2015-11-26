module("Element methods tests", {});

test("xml3d methods test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "xml3d");
    ok(node);

    equal(node.getElementByPoint(0,0, new XML3D.Vec3(), new XML3D.Vec3()), null, "xml3d::getElementByPoint returns ");
    ok(node.generateRay(0,0).data instanceof Float32Array, "xml3d::generateRay returns ");
    equal(node.getElementByRay(new XML3D.Ray(), new XML3D.Vec3(), new XML3D.Vec3()), null, "xml3d::getElementByRay returns ");

    ok(node.getLocalBoundingBox().data instanceof Float32Array, "xml3d::getLocalBoundingBox returns ");
    ok(node.getLocalBoundingBox().isEmpty(), "Empty xml3d delivers empty BoundingBox");

    ok(node.getWorldBoundingBox().data instanceof Float32Array, "xml3d::getWorldBoundingBox returns ");
    ok(node.getWorldBoundingBox().isEmpty(), "Empty xml3d delivers empty BoundingBox");
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

    ok(node.getLocalBoundingBox().data instanceof Float32Array, "group::getLocalBoundingBox returns ");
    ok(node.getLocalBoundingBox().isEmpty(), "Empty group delivers empty BoundingBox");

    ok(node.getWorldBoundingBox().data instanceof Float32Array, "group::getWorldBoundingBox returns ");
    ok(node.getWorldBoundingBox().isEmpty(), "Empty group delivers empty BoundingBox");
});
test("mesh interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "mesh");
    ok(node);

    ok(node.getWorldMatrix().data instanceof Float32Array, "mesh::getWorldMatrix returns XML3D.Mat4");
    deepEqual(node.getWorldMatrix().data, XML3D.math.mat4.create(),
            "mesh::getWorldMatrix returns identity matrix if not in hierarchy.");

    ok(node.getLocalMatrix().data instanceof Float32Array, "mesh::getLocalMatrix returns XML3D.Mat4");
    deepEqual(node.getLocalMatrix().data, XML3D.math.mat4.create(),
        "mesh::getLocalMatrix returns identity matrix if not in hierarchy.");

    ok(node.getLocalBoundingBox().data instanceof Float32Array, "mesh::getLocalBoundingBox returns ");
    ok(node.getLocalBoundingBox().isEmpty(), "Empty mesh delivers empty BoundingBox");

    ok(node.getWorldBoundingBox().data instanceof Float32Array, "mesh::getWorldBoundingBox returns ");
    ok(node.getWorldBoundingBox().isEmpty(), "Empty mesh delivers empty BoundingBox");
});
test("light interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "light");
    ok(node);

    ok(node.getLocalMatrix().data instanceof Float32Array, "light::getLocalMatrix returns XML3D.Mat4");
    deepEqual(node.getLocalMatrix().data, XML3D.math.mat4.create(),
        "light::getLocalMatrix returns identity matrix if not in hierarchy.");

    ok(node.getWorldMatrix().data instanceof Float32Array, "light::getWorldMatrix returns XML3D.Mat4");
    deepEqual(node.getWorldMatrix().data, XML3D.math.mat4.create(),
            "light::getWorldMatrix returns identity matrix if not in hierarchy.");
});
test("view interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "view");
    ok(node);

    ok(node.getLocalMatrix().data instanceof Float32Array, "view::getLocalMatrix returns XML3D.Mat4");
    deepEqual(node.getLocalMatrix().data, XML3D.math.mat4.create(),
        "view::getLocalMatrix returns identity matrix if not in hierarchy.");

    ok(node.getWorldMatrix().data instanceof Float32Array, "view::getWorldMatrix returns XML3D.Mat4");
    deepEqual(node.getWorldMatrix().data, XML3D.math.mat4.create(),
            "view::getWorldMatrix returns identity matrix if not in hierarchy.");

    ok(node.getViewMatrix().data instanceof Float32Array, "view::getViewMatrix returns XML3D.Mat4");
    deepEqual(node.getViewMatrix().data, XML3D.math.mat4.create(), "view::getViewMatrix returns with default parameters.");

});

test("model interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "model");
    ok(node);

    ok(node.getLocalMatrix().data instanceof Float32Array, "model::getLocalMatrix returns XML3D.Mat4");
    deepEqual(node.getLocalMatrix().data, XML3D.math.mat4.create(),
        "model::getLocalMatrix returns identity matrix if not in hierarchy.");

    ok(node.getWorldMatrix().data instanceof Float32Array, "model::getWorldMatrix returns XML3D.Mat4");
    deepEqual(node.getWorldMatrix().data, XML3D.math.mat4.create(),
        "model::getWorldMatrix returns identity matrix if not in hierarchy.");

    ok(node.getLocalBoundingBox().data instanceof Float32Array, "model::getLocalBoundingBox returns ");
    ok(node.getLocalBoundingBox().isEmpty(), "Empty model delivers empty BoundingBox");

    ok(node.getWorldBoundingBox().data instanceof Float32Array, "model::getWorldBoundingBox returns ");
    ok(node.getWorldBoundingBox().isEmpty(), "Empty model delivers empty BoundingBox");

});
test("data interface test", function() {
    var node = document.createElementNS("http://www.xml3d.org/2009/xml3d", "data");
    ok(node);

    ok(node.getResult() instanceof XML3DDataResult, "data::getResult returns XML3DDataResult");
    ok(node.getOutputNames() instanceof Array, "data::getOutputNames returns an Array");
});


