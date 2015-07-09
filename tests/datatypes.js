
//============================================================================
//--- XML3DRay ---
//============================================================================

var ray = XML3D.math.ray;

module("math.ray tests", {

    //ident : ray.create(),
    ray1 : new Float32Array([1,2,3,4,5,6])
});

//test("Default Constructor", function() {
//
//    ok(XML3D.math.ray !== 'undefined', "Test for global constructor.");
//    ok(typeof ray.create == 'function', "Global constructor is a function.");
//    ok(typeof ray.create() == 'object', "ray instance is object.");
//
//    QUnit.closeVector(ray.origin(this.ident), XML3D.math.vec3.fromValues(0, 0, 0), EPSILON, "default origin");
//    QUnit.closeVector(ray.direction(this.ident), XML3D.math.vec3.fromValues(0, 0, -1), EPSILON, "default direction");
//});
//
//test("Assigning Constructor", function() {
//
//    QUnit.closeVector(ray.origin(this.ray1), XML3D.math.vec3.fromValues(1,2,3), EPSILON, "origin");
//    QUnit.closeVector(ray.direction(this.ray1), XML3D.math.vec3.fromValues(4,5,6), EPSILON, "direction");
//});
//
//test("Copy Constructor", function()  {
//    var c = ray.create();
//    ray.copy(c, this.ray1);
//    notStrictEqual(c, this.ray1);
//    QUnit.closeArray(c, this.ray1, EPSILON);
//});


// ============================================================================
// --- XML3DBox ---
// ============================================================================

module("math.bbox tests", {

    ident : new XML3D.Box(),

    // hardcoded use in assigning constructor
    incValueBox: new Float32Array([-1, -2, -3, 4, 5, 6]),

    // arbitrary, non-zero size
    box1: new Float32Array([-20, 10, 3, -10, 11, 15]),

    // arbitrary, non-zero size
    box2: new Float32Array([40, 2.9, 14.75, 55.1, 70.43, 15.21]),

    // arbitrary, non-zero size
    box3: new Float32Array([-89.34, -46.3, -12.3, -45.93, -20.124, 379.3])

});

//test("Default Constructor", function() {
//    // only thing we assume: minimum must be greater than maximum, then box is empty
//    ok(this.ident[0] > this.ident[3], "[x] box' min greater than max");
//    ok(this.ident[1] > this.ident[4], "[y] box' min greater than max");
//    ok(this.ident[2] > this.ident[5], "[z] box' min greater than max");
//});
//
//test("Copy Constructor", function() {
//    var b = XML3D.math.bbox.create();
//    XML3D.math.bbox.copy(b, this.box1);
//    notStrictEqual(b, this.box1);
//    QUnit.closeArray(b, this.box1, EPSILON);
//});
//
//
//test("bbox::size: zero size", function() {
//    var s = [0,0,0];
//    XML3D.math.bbox.size(s, this.ident);
//    QUnit.closeVector(s, [0, 0, 0], EPSILON);
//    XML3D.math.bbox.size(s, this.incValueBox);
//    QUnit.closeVector(s, [5, 7, 9], EPSILON);
//});
//
//test("bbox::size: non-zero size", function() {
//    var b = this.box1;
//    var s = [0,0,0];
//    XML3D.math.bbox.size(s, b);
//    var size = XML3D.math.vec3.create();
//    XML3D.math.vec3.sub(size, b.subarray(3,6), b.subarray(0,3));
//    QUnit.closeVector(s, size, EPSILON);
//});
//
//test("bbox::center", function() {
//    var b = this.box2;
//    var c = XML3D.math.vec3.create();
//    XML3D.math.bbox.center(c, b);
//
//    var tc = XML3D.math.vec3.create();
//    XML3D.math.vec3.add(tc, b.subarray(0,3), b.subarray(3,6));
//    XML3D.math.vec3.scale(tc, tc, 0.5);
//    QUnit.closeVector(c, tc, EPSILON);
//});
//
//test("bbox::isEmpty", function() {
//    ok(XML3D.math.bbox.isEmpty(this.ident));
//    ok(!XML3D.math.bbox.isEmpty(this.box3));
//});
//
//test("bbox::transformAxisAligned", function() {
//    var mat = XML3D.math.mat4.create();
//    XML3D.math.mat4.rotateX(mat, mat, 1.57);
//
//    var actual = XML3D.math.bbox.create();
//    XML3D.math.bbox.transformAxisAligned(actual, mat, this.incValueBox);
//    var expected = new Float32Array([ -1, -6, -2, 4, 3, 5 ]);
//
//    QUnit.closeBox(actual, expected, EPSILON, "Transformed box is axis aligned");
//});
//
//test("bbox::transform", function() {
//    var mat = XML3D.math.mat4.create();
//    XML3D.math.mat4.rotateX(mat, mat, 1.57);
//
//    var actual = XML3D.math.bbox.create();
//    XML3D.math.bbox.transform(actual, mat, this.incValueBox);
//    var expected = new Float32Array([-1, 3, -2, 4, -6, 5]);
//
//    QUnit.closeBox(actual, expected, EPSILON, "Transformed box is not axis aligned");
//});
