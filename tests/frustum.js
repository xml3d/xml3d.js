module("Frustum", {

});


test("Projection Matrix", 1, function() {
    var frustum = new XML3D.webgl.Frustum(1, 10, 0, 0.78, 3/4);
    var mat = XML3D.math.mat4.create();
    frustum.getProjectionMatrix(mat);
    QUnit.closeArray(mat, XML3D.math.mat4.perspective(XML3D.math.mat4.create(), 0.78, 3/4, 1, 10), EPSILON, "Perspective matrix is correct." )
});

test("Culling", function() {
    var frustum = new XML3D.webgl.Frustum(1, 12, 0, 0.78, 1);
    var test = new XML3D.webgl.FrustumTest(frustum, XML3D.math.mat4.create());
    var bbox = XML3D.math.bbox.create();
    ok(!test.isBoxVisible(bbox), "Empty box is not visible.");


    bbox = [-10, -10, -10, 10, 10, 10];
    ok(test.isBoxVisible(bbox), "Box is visible.");

    // Box behind far
   /* bbox = [15, 15, 15, 30, 30, 30];
    ok(!test.isBoxVisible(bbox), "Box behind far is not visible.");

    // Box before near
    bbox = [0, 0, -30, 15, 15, -15];
    ok(!test.isBoxVisible(bbox), "Box before near is not visible.");*/

    // Box before near
    bbox = [-15, -15, -30, 15, 15, -10];
    ok(!test.isBoxVisible(bbox), "Box before near is not visible.");

    // Box before near
    bbox = [-15, -15, -31, 15, 15, -9];
    ok(!test.isBoxVisible(bbox), "Box before near is not visible.");

});
