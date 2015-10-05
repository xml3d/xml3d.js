
//============================================================================
//--- XML3DRay ---
//============================================================================

module("XML3DRay tests", {

    ident : new XML3D.Ray(),
    ray1 : new XML3D.Ray(new Float32Array([1,2,3,4,5,6]))
});

test("Default Constructor", function() {

    ok(XML3D.Ray !== 'undefined', "Test for global constructor.");
    ok(typeof XML3D.Ray == 'function', "Global constructor is a function.");
    ok(typeof new XML3D.Ray() == 'object', "ray instance is object.");

    QUnit.closeArray(this.ident.data, [0, 0, 0, 0, 0, -1], EPSILON, "default origin and direction");
});

test("Copy Constructor", function() {
    var data = new Float32Array([0,1,0,0,1,0]);
    var ray = new XML3D.Ray(data);
    QUnit.closeArray(data, [0,1,0,0,1,0], EPSILON, "Ray properly copied the given Float32Array");
});

test("Ray::accessors", function()  {
    var ray = new XML3D.Ray().setFromOriginDirection([1,0,0], [0,1,0]);
    var origin = ray.origin;
    var direction = ray.direction;
    QUnit.closeVector(origin, [1,0,0], EPSILON, "origin getter returned the right value");
    QUnit.closeVector(direction, [0,1,0], EPSILON, "direction getter returned the right value");
    origin.y = 5;
    direction.y = -5;
    QUnit.closeArray(ray.data, [1,5,0,0,-5,0], EPSILON, "Changing the returned vectors also changes the ray's data");

    ray.origin = [5,5,5];
    ray.direction = new XML3D.Vec3(1,0,0);
    QUnit.closeArray(ray.data, [5,5,5,1,0,0], EPSILON, "Setters work with arrays and Vec3 objects");
});

test("Ray::intersects", function()  {
    var ray = new XML3D.Ray().setFromOriginDirection([-5,0,0], [1,0,0]);
    var box = new XML3D.Box(new Float32Array([-1,-1,-1,1,1,1]));
    var didIntersect = ray.intersects(box);
    ok(didIntersect, "Ray intersected the box");
});

test("Ray::copy", function()  {
    var ray = new XML3D.Ray().copy(this.ray1);
    QUnit.closeArray(ray.data, this.ray1.data, EPSILON, "The copy has the right values");
    ray.origin.x = 100;
    QUnit.closeVector(this.ray1.origin, [1,2,3], EPSILON, "Changing the copy did not change the original");
});

test("Ray::clone", function()  {
    var ray = this.ray1.clone();
    QUnit.closeArray(ray.data, this.ray1.data, EPSILON, "The clone has the right values");
    ray.origin.x = 100;
    QUnit.closeVector(this.ray1.origin, [1,2,3], EPSILON, "Changing the clone did not change the original");
});

// ============================================================================
// --- XML3DBox ---
// ============================================================================

module("XML3DBox tests", {

    ident : new XML3D.Box(),

    // hardcoded use in assigning constructor
    incValueBox: new XML3D.Box(new Float32Array([-1, -2, -3, 4, 5, 6])),

    // arbitrary, non-zero size
    box1: new XML3D.Box(new Float32Array([-20, 10, 3, -10, 11, 15])),

    // arbitrary, non-zero size
    box2: new XML3D.Box(new Float32Array([40, 2.9, 14.75, 55.1, 70.43, 15.21])),

    // arbitrary, non-zero size
    box3: new XML3D.Box(new Float32Array([-89.34, -46.3, -12.3, -45.93, -20.124, 379.3]))

});

test("Default Constructor", function() {
    // only thing we assume: minimum must be greater than maximum, then box is empty
    ok(this.ident.data[0] > this.ident.data[3], "[x] box' min greater than max");
    ok(this.ident.data[1] > this.ident.data[4], "[y] box' min greater than max");
    ok(this.ident.data[2] > this.ident.data[5], "[z] box' min greater than max");
});

test("Copy constructor", function() {
    var b = new XML3D.Box(this.box1);
    notStrictEqual(b.data, this.box1.data);
    QUnit.closeArray(b.data, this.box1.data, EPSILON);
});

test("Box::accessors", function() {
    var box = this.box1.clone();
    var min = box.min;
    var max = box.max;
    QUnit.closeVector(min, [-20, 10, 3], EPSILON, "min getter returned the right vector");
    QUnit.closeVector(max, [-10, 11, 15], EPSILON, "max getter returned the right vector");
    min.x = -15;
    max.x = 15;
    QUnit.closeArray(box.data, [-15, 10, 3, 15, 11, 15], EPSILON, "Changing the returned vectors also changes the box's data");

    box.min = [0,0,0];
    box.max = new XML3D.Vec3(10,10,10);
    QUnit.closeArray(box.data, [0,0,0,10,10,10], EPSILON, "Setters work with arrays and Vec3 objects");
});


test("Box::size: zero size", function() {
    var s = this.ident.size();
    QUnit.closeVector(s, [0, 0, 0], EPSILON);
    s = this.incValueBox.size();
    QUnit.closeVector(s, [5, 7, 9], EPSILON);
});

test("bbox::size: non-zero size", function() {
    var b = this.box1;
    var s = b.size();
    var size = b.max.clone().sub(b.min);
    QUnit.closeVector(s, size, EPSILON);
});

test("Box::extent: non-zero extent", function() {
    var b = this.box1;
    var e = b.extent();
    var extent = b.max.clone().sub(b.min).scale(0.5);
    QUnit.closeVector(e, extent, EPSILON);
});

test("Box::longestSide", function() {
    var side = this.box1.longestSide();
    QUnit.close(side, 12, EPSILON, "box1's longest side is 12");
    var side2 = this.ident.longestSide();
    QUnit.close(side2, 0, EPSILON, "Empty box longest side is 0");
});

test("Box::center", function() {
    var b = this.box2;
    var c = b.center();

    var tc = new XML3D.Vec3();
    tc = b.min.add(b.max).scale(0.5);
    QUnit.closeVector(c, tc, EPSILON);
});

test("Box::extend", function() {
    var box = new XML3D.Box();
    box.extend(this.box1);
    QUnit.closeArray(box.data, [-20, 10, 3, -10, 11, 15], EPSILON, "Empty box was extended correctly");

    box.extend([-1, -2, -3, 4, 5, 6]);
    QUnit.closeArray(box.data, [-20, -2, -3, 4, 11, 15], EPSILON, "Non-empty box was extended correctly");
});

test("Box::intersects", function() {
    var ray = new XML3D.Ray();
    ray.origin = [-5,0,0];
    ray.direction = [1,0,0];

    var opt = {dist : 0};
    var didIntersect = this.incValueBox.intersects(ray, opt);
    QUnit.ok(didIntersect, "Ray at (-5,0,0) along x axis intersects the box");
    QUnit.close(opt.dist, 4, EPSILON, "Distance to intersection is correct");

    ray.origin = [0,0,0];
    didIntersect = this.incValueBox.intersects(ray, opt);
    QUnit.ok(didIntersect, "Ray with origin inside the box still intersects it");
    QUnit.close(opt.dist, -1, EPSILON, "Distance to this intersection is -1");

    didIntersect = this.incValueBox.clone().setEmpty().intersects(ray, opt);
    QUnit.ok(!didIntersect, "Box set to empty -> ray does not intersect anymore");
    QUnit.close(opt.dist, Infinity, EPSILON, "Distance is +Infinity");
});


test("Box::isEmpty", function() {
    ok(this.ident.isEmpty());
    ok(!this.box3.isEmpty());
});

test("Box::transformAxisAligned", function() {
    var mat = new XML3D.Mat4().rotateX(1.57);

    var actual = new XML3D.Box(this.incValueBox);
    actual.transformAxisAligned(mat);
    var expected = new XML3D.Box(new Float32Array([ -1, -6, -2, 4, 3, 5 ]));

    QUnit.closeBox(actual, expected, EPSILON, "Transformed box is axis aligned");
});

test("Box::transform", function() {
    var mat = new XML3D.Mat4().rotateX(1.57);

    var actual = new XML3D.Box(this.incValueBox).transform(mat);
    var expected = new XML3D.Box(new Float32Array([-1, 3, -2, 4, -6, 5]));

    QUnit.closeBox(actual, expected, EPSILON, "Transformed box is not axis aligned");
});
