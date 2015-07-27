module("Frustum", {
    setup: function() {
    }
});



test("Projection Matrix", 1, function() {
    var frustum = new XML3DTestLib.Frustum.Frustum(1, 10, 0, 0.78, 3/4);
    var mat = new XML3D.Mat4();
    frustum.getProjectionMatrix(mat);
    QUnit.closeMatrix(mat, new XML3D.Mat4.perspective(0.78, 3/4, 1, 10), EPSILON, "Perspective matrix is correct." );
});

test("Planes", function() {
    var near = 1, far = 12;
    var frustum = new XML3DTestLib.Frustum.Frustum(near, far, 0, 0.78, 1);
    var test = new XML3DTestLib.Frustum.FrustumTest(frustum, XML3D.math.mat4.create());

    var planes = test.frustumPlanes;

    // Top
    equal(planes[0].distance, 0, "Distance of top plane");
    equal(Math.min.apply(null, planes[0].normal), planes[0].normal[1], "normal towards -y");

    // Right
    equal(planes[1].distance, 0, "Distance of right plane");
    equal(Math.min.apply(null, planes[1].normal), planes[1].normal[0], "normal towards -x");

    // Bottom
    equal(planes[2].distance, 0, "Distance of bottom plane");
    equal(Math.max.apply(null, planes[2].normal), planes[2].normal[1], "normal towards +y");

    // Top
    equal(planes[3].distance, 0, "Distance of top plane");
    equal(Math.max.apply(null, planes[3].normal), planes[3].normal[0], "normal towards -y");

    // Near
    equal(planes[4].distance, -near, "Distance of near plane");
    equal(Math.min.apply(null, planes[4].normal), planes[4].normal[2], "normal towards +z");

    // far
    equal(planes[5].distance, far, "Distance of far plane");
    equal(Math.max.apply(null, planes[5].normal), planes[5].normal[2], "normal towards -z");

});

test("Culling", function() {
    var frustum = new XML3DTestLib.Frustum.Frustum(1, 12, 0, 0.78, 1);
    var test = new XML3DTestLib.Frustum.FrustumTest(frustum, new XML3D.Mat4());
    var bbox = new XML3D.Box();
    ok(!test.isBoxVisible(bbox), "Empty box is not visible.");


    bbox.data.set([-10, -10, -10, 10, 10, 10]);
    ok(test.isBoxVisible(bbox), "Box is visible.");

    // Box behind far
    bbox.data.set([15, 15, -15, 30, 30, -30]);
    ok(!test.isBoxVisible(bbox), "Box behind far is not visible.");

    // Box before near
    bbox.data.set([-30, -30, 5, 30, 30, -1]);
    ok(!test.isBoxVisible(bbox), "Box before near is not visible.");

});
