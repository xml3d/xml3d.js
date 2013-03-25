
// ============================================================================
// --- XML3DVec3 ---
// ============================================================================

module("XML3DVec3 tests", {
    ident : new XML3DVec3(),
    vec1 : new XML3DVec3(3.0, 2.5, -1.0),
    vec1Array: new Float32Array([3.0, 2.5, -1.0]),
    vec2 : new XML3DVec3(1.5, -2.0, 3.5)
});

test("Default Constructor", function()  {
    ok(XML3DVec3 !== 'undefined', "Test for global constructor.");
    ok(typeof XML3DVec3 == 'function', "Global constructor is a function.");
    ok(typeof new XML3DVec3() == 'object', "XML3DVec3 instance is object.");
    equal(this.ident.x, 0.0, "x default is 0.0");
    equal(this.ident.y, 0.0, "y default is 0.0");
    equal(this.ident.z, 0.0, "z default is 0.0");

    deepEqual(new XML3DVec3(), new XML3DVec3());
});

test("Assigning Constructor", function()  {
    equal(this.vec1.x, 3.0, "x is 3.0");
    equal(this.vec1.y, 2.5, "y is 2.5");
    equal(this.vec1.z, -1.0, "z is -1.0");
});

test("Copy Constructor", function()  {
    var c = new XML3DVec3(this.vec1);
    notStrictEqual(c, this.vec1);
    equal(c.x, 3.0, "x is 3.0");
    equal(c.y, 2.5, "y is 2.5");
    equal(c.z, -1.0, "z is -1.0");
});

test("Array Constructor", function() {

    var c = new XML3DVec3(this.vec1Array);
    equal(c.x, 3.0, "x is 3.0");
    equal(c.y, 2.5, "y is 2.5");
    equal(c.z, -1.0, "z is -1.0");
});

test("XML3DVec3::toString", function()  {
    equal(this.ident.toString(), "[object XML3DVec3]", "Serialization");
});

test("XML3DVec3::add", function()  {
    equal(typeof this.vec1.__proto__.add, 'function', "XML3DVec3::add does not exist");
    var v = this.vec1.add(this.vec2);
    equal(v.x, 4.5, "Result x is 4.5");
    equal(v.y, 0.5, "Result y is 0.5");
    equal(v.z, 2.5, "Result z is 2.5");
    equal(this.vec1.x, 3.0, "Object unmodified");
    equal(this.vec1.y, 2.5, "Object unmodified");
    equal(this.vec1.z, -1.0, "Object unmodified");
    equal(this.vec2.x, 1.5, "Parameter unmodified");
    equal(this.vec2.y, -2.0, "Parameter unmodified");
    equal(this.vec2.z, 3.5, "Parameter unmodified");
});

test("XML3DVec3::subtract", function()  {
    equal(typeof this.vec1.__proto__.subtract, 'function', "XML3DVec3::subtract does not exist");
    var v = this.vec1.subtract(this.vec2);
    equal(v.x, 1.5, "Result x is 1.5");
    equal(v.y, 4.5, "Result y is 4.5");
    equal(v.z, -4.5, "Result z is -4.5");
    equal(this.vec1.x, 3.0, "Object unmodified");
    equal(this.vec1.y, 2.5, "Object unmodified");
    equal(this.vec1.z, -1.0, "Object unmodified");
    equal(this.vec2.x, 1.5, "Parameter unmodified");
    equal(this.vec2.y, -2.0, "Parameter unmodified");
    equal(this.vec2.z, 3.5, "Parameter unmodified");
});

test("XML3DVec3::length", function()  {
    equal(typeof this.vec1.__proto__.length, 'function', "XML3DVec3::length does not exist");
    var length = this.vec1.length();
    ok(typeof length === 'number');
    QUnit.close(length, 4.031128, EPSILON, "Length of vector should be ~4,0311288741492748261833066151519");
    length = this.ident.length();
    QUnit.close(length, 0, EPSILON, "Length of vector should be ~0");
});

test("XML3DVec3::setVec3Value", function()  {
    equal(typeof this.vec1.__proto__.setVec3Value, 'function', "XML3DVec3::setVec3Value does not exist");
    var v = new XML3DVec3();
    var result = v.setVec3Value("2 -3.5 9090.9");
    ok(result === undefined, "XML3DVec3::setVec3Value returns void.");
    var reference = new XML3DVec3(2, -3.5, 9090.9);
    deepEqual(v, reference, "Vector should be: " + reference.toString());
});

test("XML3DVec3::multiply", function()  {
    equal(typeof this.vec1.__proto__.multiply, 'function', "XML3DVec3::multiply does not exist");
    // TODO: Implement tests
});

test("XML3DVec3::scale", function()  {
    equal(typeof this.vec1.__proto__.scale, 'function', "XML3DVec3::scale does not exist");
    // TODO: Implement tests
});

test("XML3DVec3::dot", function()  {
    equal(typeof this.vec1.__proto__.dot, 'function', "XML3DVec3::dot does not exist");
    // TODO: Implement tests
});

test("XML3DVec3::negate", function()  {
    equal(typeof this.vec1.__proto__.negate, 'function', "XML3DVec3::negate does not exist");
    // TODO: Implement tests
});

test("XML3DVec3::normalize", function()  {
    equal(typeof this.vec1.__proto__.negate, 'function', "XML3DVec3::normalize does not exist");
    // TODO: Implement tests
});

test("XML3DVec3::set vector", function()  {
    equal(typeof this.vec1.__proto__.set, 'function', "XML3DVec3::set does not exist");
    var v = new XML3DVec3();
    v.set(this.vec2);
    notStrictEqual(v, this.vec2);
    QUnit.closeVector(v, this.vec2, EPSILON);
});

test("XML3DVec3::set array", function() {
    var v = new XML3DVec3();
    v.set(this.vec1Array);
    QUnit.closeVector(v, this.vec1, EPSILON);
});

test("XML3DVec3::set values", function() {
    var v = new XML3DVec3();
    v.set(1.5, -2.0, 3.5);
    QUnit.closeVector(v, this.vec2, EPSILON);
});

//============================================================================
//--- XML3DRotation ---
//============================================================================

module("XML3DRotation tests", {
    ident : new XML3DRotation(),
    rot1 : new XML3DRotation(new XML3DVec3(1.0, 0.0, 0.0), Math.PI / 2),
    rot1Quat: new Float32Array([0.7071067690849304, 0, 0, 0.7071067690849304]),
    vec2 : new XML3DVec3(1.5, -2.0, 3.5),
    mat_90x : new XML3DMatrix(
            1,  0, 0, 0,
            0,  0, 1, 0,
            0, -1, 0, 0,
            0,  0, 0, 1),
});

test("Default Constructor", function()  {
    ok(XML3DRotation !== 'undefined', "Test for global constructor.");
    equal(typeof XML3DRotation, 'function', "Global constructor is a function.");
    equal(typeof this.ident, 'object', "XML3DVec3 instance is an object.");
    equal(typeof this.ident.axis, 'object', "XML3DVec3::axis is an object.");
    equal(typeof this.ident.angle, 'number', "XML3DVec3::angle is a number.");

    equal(this.ident.axis.x, 0.0, "axis.x default is 0.0");
    equal(this.ident.axis.y, 0.0, "axis.y default is 0.0");
    equal(this.ident.axis.z, 1.0, "axis.z default is 1.0");
    equal(this.ident.angle, 0.0, "angle default is 0.0");

    deepEqual(new XML3DRotation(), new XML3DRotation());
});

test("Assigning Constructor", function()  {
    QUnit.closeVector(this.rot1.axis, new XML3DVec3(1.0, 0.0, 0.0), EPSILON, "XML3DVec3(1 0 0)");
    QUnit.close(this.rot1.angle, Math.PI / 2, EPSILON, "angle is ~PI/2.0");
});

test("Copy Constructor", function()  {
    var c = new XML3DRotation(this.rot1);
    notStrictEqual(c, this.rot1);
    QUnit.closeRotation(c, this.rot1, EPSILON);
});

test("Setter", function()  {
    var myVec1 = new XML3DRotation(new XML3DVec3(1.0, 0.0, 0.0), Math.PI / 2);
    var myVec2 = new XML3DRotation(new XML3DVec3(1.0, 0.0, 0.0), Math.PI / 2);

    try {
        myVec2.axis = new XML3DVec3(0.0, 1.0, 0.0);
    } catch (e) {
        // may fail silently
    }

    QUnit.closeRotation(myVec2, myVec1, EPSILON, "Can't set axis, thus should be the same");
    myVec2.axis.x = 0.0;
    myVec2.axis.y = 1.0;
    QUnit.closeRotation(myVec2, new XML3DRotation(new XML3DVec3(0.0, 1.0, 0.0), Math.PI / 2), EPSILON, "Can set axis values");

    myVec2 = new XML3DRotation(new XML3DVec3(0.0, 1.0, 0.0), Math.PI / 2);
    myVec2.angle = -Math.PI / 2;
    QUnit.close(myVec2.angle, -Math.PI / 2, EPSILON, "Set angle value");

});

test("XML3DRotation::toString", function()  {
    equal(this.ident.toString(), "[object XML3DRotation]", "Serialization");
});

test("XML3DRotation::setAxisAngle", function()  {
    equal(typeof this.ident.__proto__.setAxisAngle, 'function', "XML3DRotation::setAxisAngle exists");
    // TODO Write tests
});

test("XML3DRotation::setRotation", function()  {
    equal(typeof this.ident.__proto__.setRotation, 'function', "XML3DRotation::setRotation exists");
    // TODO Write tests
});

test("XML3DRotation::interpolate", function()  {
    equal(typeof this.ident.__proto__.interpolate, 'function', "XML3DRotation::interpolate exists");

    var r1 = new XML3DRotation();
    var r2 = new XML3DRotation(new XML3DVec3(1.0, 0.0, 0.0), 0.8);

    var result = r1.interpolate(r2, 0.0);
    deepEqual(r1, new XML3DRotation(), "This rotation may not change");
    QUnit.closeRotation(result, r1, EPSILON, "t= 0.0, result == r1");

    result = r1.interpolate(r2, 1.0);
    QUnit.closeRotation(result, r2, EPSILON, "t= 0.0, result == r2");

    result = r1.interpolate(r2, 0.5);
    QUnit.closeRotation(result, new XML3DRotation(new XML3DVec3(1, 0, 0), 0.4), EPSILON, "Rotation result");
});

test("XML3DRotation::multiply", function()  {
    equal(typeof this.ident.__proto__.multiply, 'function', "XML3DRotation::multiply exists");

    var r1 = new XML3DRotation(new XML3DVec3(0.0, 0.0, 1.0), 0.0);
    var r2 = new XML3DRotation(new XML3DVec3(1.0, 0.0, 0.0), 0.8);

    var result = r1.multiply(r2);
    deepEqual(r1, new XML3DRotation(), "This rotation must not change.");
    QUnit.closeRotation(result, r2, EPSILON, "Multiply with identity rotation, result = r2.");

    result = r2.multiply(r2);
    QUnit.closeRotation(result, new XML3DRotation(new XML3DVec3(1, 0, 0), 1.6), EPSILON, "Multiplication result: XML3DRotation(XML3DVec3(1, 0, 0), 1.6)");

    var r5 = new XML3DRotation(new XML3DVec3(0, 1, 0), Math.PI/2);
    var r6 = new XML3DRotation(new XML3DVec3(0, 0, 1), Math.PI/2);
    result = r5.multiply(r6);

    QUnit.close(result.axis.z,Math.sqrt(1.0/3.0), EPSILON);
    QUnit.close(result.angle, Math.PI*2.0/3.0, EPSILON);

});

test("XML3DRotation::normalize", function()  {
    equal(typeof this.ident.__proto__.normalize, 'function', "XML3DRotation::normalize exists");
    // TODO: Test
});

test("XML3DRotation::toMatrix", function()  {
    equal(typeof this.ident.__proto__.toMatrix, 'function', "XML3DRotation::toMatrix exists");
    var rot = new XML3DRotation(new XML3DVec3(1.0, 0.0, 0.0), Math.PI / 2);
    QUnit.closeMatrix(new XML3DMatrix().rotateAxisAngle(1, 0, 0, Math.PI / 2), rot.toMatrix(), EPSILON);

    QUnit.closeMatrix(this.mat_90x, rot.toMatrix(), EPSILON);
});

test("XML3DRotation::setQuaternion", function()  {
    equal(typeof this.ident.__proto__.setQuaternion, 'function', "XML3DRotation::setQuaternion exists");
    var v = new XML3DRotation();
    v.setQuaternion(new XML3DVec3(0,Math.sqrt(0.5),0),-Math.sqrt(0.5));
    QUnit.closeRotation(v, new XML3DRotation(new XML3DVec3(0,1,0), Math.PI/2.0), EPSILON);

    v.setQuaternion(new XML3DVec3(-0.5,0.5,-0.5),0.5);
    QUnit.closeRotation(v, new XML3DRotation(new XML3DVec3(-0.5774,0.5774,-0.5774), 2/3*Math.PI), EPSILON);
});

test("XML3DRotation::rotateVec3", function()  {
    equal(typeof this.ident.__proto__.rotateVec3, 'function', "XML3DRotation::rotateVec3 exists");

    var r1 = new XML3DRotation(new XML3DVec3(0.0, 0.0, 1.0), Math.PI);
    var v1 = new XML3DVec3(1, 0, 0);

    var result = r1.rotateVec3(v1);
    deepEqual(r1, new XML3DRotation(new XML3DVec3(0.0, 0.0, 1.0), Math.PI), "This rotation must not change.");
    deepEqual(v1, new XML3DVec3(1, 0, 0), "Vector parameter must not change.");

    QUnit.closeVector(result, new XML3DVec3(-1, 0, 0), EPSILON);

    var r2 = new XML3DRotation(new XML3DVec3(0.0, 1.0, 0.0), Math.PI/2.0);
    result = r2.rotateVec3(v1);
    QUnit.closeVector(result, new XML3DVec3(0, 0, -1), EPSILON);
});

test("XML3DRotation::set rotation", function()  {
    equal(typeof this.ident.__proto__.set, 'function', "XML3DRotation::set does not exist");
    var v = new XML3DRotation();
    v.set(this.rot1);
    notStrictEqual(v, this.rot1);
    QUnit.closeRotation(v, this.rot1, EPSILON);

});

test("XML3DRotation::set array", function()  {
    var v = new XML3DRotation();
    v.set(this.rot1Quat);
    QUnit.closeRotation(v, this.rot1, EPSILON);
});

test("XML3DRotation::set axis-angle", function()  {
    var v = new XML3DRotation();
    v.set(this.rot1.axis, this.rot1.angle);
    QUnit.closeRotation(v, this.rot1, EPSILON);
});

//============================================================================
//--- XML3DMatrix ---
//============================================================================

/* Note: Following tests are coined for column-major matrices.
 *
 * Note 2: following tests don't test in detail if all the methods do their
 * job but rather just if the connection to the
 * back-end (in this case RTSG2) works.
 */
module("XML3DMatrix tests", {

    ident : new XML3DMatrix(),

    // incValueMat: values hardcoded in the test
    incValueMat : new XML3DMatrix(
        1,  2,  3,  4,
        5,  6,  7,  8,
        9, 10, 11, 12,
       13, 14, 15, 16),

    incValueMatArray: new Float32Array([
        1,  2,  3,  4,
        5,  6,  7,  8,
        9, 10, 11, 12,
       13, 14, 15, 16]),

    // mat1: arbitrary matrix, but mat1_inv must be inverse of it
    mat1 : new XML3DMatrix(
    2, 2, 12, 0,
        1, 6, 17, 0,
        0, 0,  1, 0,
        1, 2,  3, 1),

    mat1_inv : new XML3DMatrix(
    0.6, -0.2, -3.8, 0,
       -0.1,  0.2, -2.2, 0,
          0,    0,    1, 0,
       -0.4, -0.2,  5.2, 1),

    // mat2: arbitrary, non-invertible matrix
    mat2_noninv : new XML3DMatrix(
    1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 1,
        0, 0, 0, 0),
    // arbitrary axis
    axis : new XML3DVec3(3, 14, -5),

    // mat3: arbitrary matrix, but
    //     mat3_scale and mat3_scalefac must correspond
    mat3 : new XML3DMatrix(
    3, 14,  4, 0,
       15,  5,  9, 0,
       23, 18, 20, 0,
       11, 17, 13, 1),

    mat3_scale : new XML3DMatrix(
    9,  42,  12, 0,
       15,   5,   9, 0,
      -46, -36, -40, 0,
       11,  17,  13, 1),

    mat3_scalefac : new XML3DVec3(3, 1, -2),

    // mat4: arbitrary transform matrix, but
    //     mat4_trans and mat4_transfac must correspond
    mat4 : new XML3DMatrix(
    3, 14,  4, 0,
       15,  5,  9, 0,
       23, 18, 20, 0,
       11, 17, 13, 1),

    mat4_trans : new XML3DMatrix(
    3, 14,  4, 0,
       15,  5,  9, 0,
       23, 18, 20, 0,
      108, 47, 53, 1),

    mat4_transfac : new XML3DVec3(3, 12, -4),

    // mat5 : hardcoded in setMatrixValue() test
    mat5 : new XML3DMatrix(
    3, 15, 23, 108,
       14,  5, 18,  47,
        4,  9, 20,  53,
        0,  0,  0,   1)
});

test("Default Constructor", function()  {
    ok(XML3DMatrix !== 'undefined', "Test for global constructor.");
    ok(typeof XML3DMatrix == 'function', "Global constructor is a function.");
    ok(typeof new XML3DMatrix() == 'object', "XML3DMatrix instance is object.");

    equal(this.ident.m11, 1.0, "m11 default is 1.0");
    equal(this.ident.m12, 0.0, "m12 default is 0.0");
    equal(this.ident.m13, 0.0, "m13 default is 0.0");
    equal(this.ident.m14, 0.0, "m14 default is 0.0");
    equal(this.ident.m21, 0.0, "m21 default is 0.0");
    equal(this.ident.m22, 1.0, "m22 default is 1.0");
    equal(this.ident.m23, 0.0, "m23 default is 0.0");
    equal(this.ident.m24, 0.0, "m24 default is 0.0");
    equal(this.ident.m31, 0.0, "m31 default is 0.0");
    equal(this.ident.m32, 0.0, "m32 default is 0.0");
    equal(this.ident.m33, 1.0, "m33 default is 1.0");
    equal(this.ident.m34, 0.0, "m34 default is 0.0");
    equal(this.ident.m41, 0.0, "m41 default is 0.0");
    equal(this.ident.m42, 0.0, "m42 default is 0.0");
    equal(this.ident.m43, 0.0, "m43 default is 0.0");
    equal(this.ident.m44, 1.0, "m44 default is 1.0");
});

test("Assigning Constructor", function() {

    equal(this.incValueMat.m11, 1, "m11 is 1");
    equal(this.incValueMat.m12, 2, "m12 is 2");
    equal(this.incValueMat.m13, 3, "m13 is 3");
    equal(this.incValueMat.m14, 4, "m14 is 4");
    equal(this.incValueMat.m21, 5, "m21 is 5");
    equal(this.incValueMat.m22, 6, "m22 is 6");
    equal(this.incValueMat.m23, 7, "m23 is 7");
    equal(this.incValueMat.m24, 8, "m24 is 8");
    equal(this.incValueMat.m31, 9, "m31 is 9");
    equal(this.incValueMat.m32, 10, "m32 is 10");
    equal(this.incValueMat.m33, 11, "m33 is 11");
    equal(this.incValueMat.m34, 12, "m34 is 12");
    equal(this.incValueMat.m41, 13, "m41 is 13");
    equal(this.incValueMat.m42, 14, "m42 is 14");
    equal(this.incValueMat.m43, 15, "m43 is 15");
    equal(this.incValueMat.m44, 16, "m44 is 16");

});

test("Array Constructor", function() {

    var m = new XML3DMatrix(this.incValueMatArray);
    QUnit.closeMatrix(m, this.incValueMat, EPSILON);
});

test("Copy Constructor", function() {
    var m = new XML3DMatrix(this.mat1);
    notStrictEqual(m,this.mat1);
    QUnit.closeMatrix(m, this.mat1, EPSILON);
});

test("Value attributes writeable", function() {
    var m = new XML3DMatrix();
    m.m11 = 1;
    m.m12 = 2;
    m.m13 = 3;
    m.m14 = 4;
    m.m21 = 5;
    m.m22 = 6;
    m.m23 = 7;
    m.m24 = 8;
    m.m31 = 9;
    m.m32 = 10;
    m.m33 = 11;
    m.m34 = 12;
    m.m41 = 13;
    m.m42 = 14;
    m.m43 = 15;
    m.m44 = 16;
    QUnit.closeMatrix(m,this.incValueMat, EPSILON);
});

test("XML3DMatrix::toString", function()  {
    equal(this.mat1.toString(), "[object XML3DMatrix]", "Serialization");
});

test("XML3DMatrix::inverse: invertable matrix", function() {
    equal(typeof this.ident.__proto__.inverse, 'function', "XML3DMatrix::inverse does not exist");

    var calc_inv = this.mat1.inverse();

    QUnit.closeMatrix(calc_inv, this.mat1_inv, EPSILON);
});


test("XML3DMatrix::inverse: noninvertible matrix", function() {

    var m = this.mat2_noninv;

    raises(function(){m.inverse();}, "inverting non-invertible matrix");
});

test("XML3DMatrix::multiply", function() {
    equal(typeof this.ident.__proto__.multiply, 'function', "XML3DMatrix::multiply does not exist");

    var calc_id = this.mat1.multiply(this.mat1_inv);

    QUnit.closeMatrix(calc_id, this.ident, EPSILON);

});

test("XML3DMatrix::rotate", function() {
    equal(typeof this.ident.__proto__.rotate, 'function', "XML3DMatrix::rotate does not exist");

    var rot = this.mat1.rotate(2*Math.PI, 2*Math.PI, 2*Math.PI);

    QUnit.closeMatrix(rot, this.mat1, EPSILON);
});

test("XML3DMatrix::rotateAxisAngle", function() {
    equal(typeof this.ident.__proto__.rotateAxisAngle, 'function', "XML3DMatrix::rotateAxisAngle does not exist");

    var rot = this.mat1.rotateAxisAngle(this.axis.x, this.axis.y, this.axis.z, 2*Math.PI);

    QUnit.closeMatrix(rot, this.mat1, EPSILON);
    QUnit.closeMatrix(this.ident.rotateAxisAngle(0,0,1,0), new XML3DMatrix(), EPSILON);
});

test("XML3DMatrix::scale", function() {
    equal(typeof this.ident.__proto__.scale, 'function', "XML3DMatrix::scale does not exist");

    var sf = this.mat3_scalefac;

    var calc_scale = this.mat3.scale(sf.x, sf.y, sf.z);

    QUnit.closeMatrix(calc_scale, this.mat3_scale, EPSILON);
});

test("XML3DMatrix::translate", function() {
    equal(typeof this.ident.__proto__.translate, 'function', "XML3DMatrix::translate does not exist");

    var tf = this.mat4_transfac;

    var calc_trans = this.mat4.translate(tf.x, tf.y, tf.z);

    QUnit.closeMatrix(calc_trans, this.mat4_trans, EPSILON);
    QUnit.close(this.ident.translate(this.mat4_transfac.x,this.mat4_transfac.y, this.mat4_transfac.z).m41, 3, EPSILON);
    QUnit.close(this.ident.translate(this.mat4_transfac.x,this.mat4_transfac.y, this.mat4_transfac.z).m42, 12, EPSILON);
    QUnit.close(this.ident.translate(this.mat4_transfac.x,this.mat4_transfac.y, this.mat4_transfac.z).m43, -4, EPSILON);
});

test("XML3DMatrix::setMatrixValue: valid value", function() {
    equal(typeof this.ident.__proto__.setMatrixValue, 'function', "XML3DMatrix::setMatrixValue does not exist");

    // create a matrix
    var m = new XML3DMatrix();
    m.setMatrixValue("3 15 23 108 14 5 18 47 4 9 20 53 0 0 0 1");

    QUnit.closeMatrix(m, this.mat5, EPSILON);
});

test("XML3DMatrix::setMatrixValue: invalid value", function() {

    // test for assigning wrongly formatted matrix value
    var m = new XML3DMatrix();

    raises(function() {m.setMatrixValue("wrong-matrix-format");}, "set an invalid value");
});

test("XML3DMatrix::CSSMatrix conformance", function() {

    // TODO: Document that XML3DMatrix::rotate and XML3DMatrix::rotateAxisAngle
    // are in radians while the same methods of CSSMatrix use degrees
    if (window.WebKitCSSMatrix) {
        var xml3d = new XML3DMatrix();
        var css = new WebKitCSSMatrix();
        QUnit.closeMatrix(xml3d, css, EPSILON, "Same identity");
        QUnit.closeMatrix(xml3d.translate(1, 2, 3), css.translate(1, 2, 3), EPSILON, "CSSMatrix::translate");
        QUnit.closeMatrix(xml3d.scale(1, 2, 3), css.scale(1, 2, 3), EPSILON, "CSSMatrix::scale");
        QUnit.closeMatrix(xml3d.rotate(Math.PI / 2, 0, 0), css.rotate(90, 0, 0), EPSILON, "CSSMatrix::rotate 1");
        QUnit.closeMatrix(xml3d.rotate(Math.PI / 2, Math.PI / 2, 0), css.rotate(90, 90, 0), EPSILON, "CSSMatrix::rotate 2");
        QUnit.closeMatrix(xml3d.rotate(-Math.PI / 4, Math.PI / 4, Math.PI / 2), css.rotate(-45, 45, 90), EPSILON, "CSSMatrix::rotate 3");
        // temporarily disabled: QUnit.closeMatrix(xml3d.rotate(-Math.PI / 4), css.rotate(-45), EPSILON, "CSSMatrix::rotate 4");
        QUnit.closeMatrix(xml3d.rotate(0,0,-Math.PI / 4), css.rotate(0,0,-45), EPSILON, "CSSMatrix::rotate 4");
        QUnit.closeMatrix(xml3d.rotateAxisAngle(1, 0, 0, Math.PI / 4), css.rotateAxisAngle(1, 0, 0, 45), EPSILON,
                "CSSMatrix::rotateAxisAngle");
        QUnit.closeMatrix(xml3d.translate(1, 2, 3).inverse(), css.translate(1, 2, 3).inverse(), EPSILON,
                "CSSMatrix::inverse (test depends on correct ::translate)");
        QUnit.closeMatrix(xml3d.translate(1, 2, 3).multiply(xml3d.scale(2, 2, 2)), css.translate(1, 2, 3).multiply(css.scale(2, 2, 2)), EPSILON,
                "CSSMatrix::multiply (test depends on correct ::translate and ::scale)");
        // QUnit.closeMatrix(css.rotate(45,0,0),
        // css.rotateAxisAngle(1,0,0,45), EPSILON);
        var rotmat = new WebKitCSSMatrix();
        rotmat = rotmat.rotate(45, 0, 0);
        var xrot = new XML3DRotation(new XML3DVec3(1,0,0), Math.PI / 4).toMatrix();
        QUnit.closeMatrix(rotmat, xrot, EPSILON, "CSSMatrix:rotate matches XML3DRotation.toMatrix()");
    }
});

test("XML3DMatrix::set numbers", function() {
    var m = new XML3DMatrix();
    m.set(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16);

    equal(m.m11, 1, "m11 is 1");
    equal(m.m12, 2, "m12 is 2");
    equal(m.m13, 3, "m13 is 3");
    equal(m.m14, 4, "m14 is 4");
    equal(m.m21, 5, "m21 is 5");
    equal(m.m22, 6, "m22 is 6");
    equal(m.m23, 7, "m23 is 7");
    equal(m.m24, 8, "m24 is 8");
    equal(m.m31, 9, "m31 is 9");
    equal(m.m32, 10, "m32 is 10");
    equal(m.m33, 11, "m33 is 11");
    equal(m.m34, 12, "m34 is 12");
    equal(m.m41, 13, "m41 is 13");
    equal(m.m42, 14, "m42 is 14");
    equal(m.m43, 15, "m43 is 15");
    equal(m.m44, 16, "m44 is 16");
});

test("XML3DMatrix::set array", function() {
    var m = new XML3DMatrix();
    m.set(this.incValueMatArray);
    QUnit.closeMatrix(m, this.incValueMat, EPSILON);
});

test("XML3DMatrix::set matrix", function() {
    var m = new XML3DMatrix();
    m.set(this.mat1);

    notStrictEqual(m, this.mat1);
    QUnit.closeMatrix(m, this.mat1, EPSILON);
});

//============================================================================
//--- XML3DRay ---
//============================================================================

module("XML3DRay tests", {

    ident : new XML3DRay(),

    // hardcoded in assigning constructor
    ray1 : new XML3DRay(
        new XML3DVec3(1,2,3),
        new XML3DVec3(4,5,6)
    )
});

test("Default Constructor", function() {

    ok(XML3DRay !== 'undefined', "Test for global constructor.");
    ok(typeof XML3DRay == 'function', "Global constructor is a function.");
    ok(typeof new XML3DRay() == 'object', "XML3DRay instance is object.");

    QUnit.closeVector(this.ident.origin, new XML3DVec3(0, 0, 0), EPSILON, "default origin");
    QUnit.closeVector(this.ident.direction, new XML3DVec3(0, 0, -1), EPSILON, "default direction");
});

test("Assigning Constructor", function() {

    QUnit.closeVector(this.ray1.origin, new XML3DVec3(1,2,3), EPSILON, "origin");
    QUnit.closeVector(this.ray1.direction, new XML3DVec3(4,5,6), EPSILON, "direction");
});

test("Copy Constructor", function()  {
    var c = new XML3DRay(this.ray1);
    notStrictEqual(c, this.ray1);
    QUnit.closeRay(c, this.ray1, EPSILON);
});

test("XML3DRay::toString", function()  {
    equal(this.ident.toString(), "[object XML3DRay]", "Serialization");
});

test("XML3DRay::set", function()  {
    equal(typeof this.ident.__proto__.set, 'function', "XML3DRay::set does not exist");
    var c = new XML3DRay();
    c.set(this.ray1);
    notStrictEqual(c, this.ray1);
    QUnit.closeRay(c, this.ray1, EPSILON);
});

// ============================================================================
// --- XML3DBox ---
// ============================================================================

module("XML3DBox tests", {

    ident : new XML3DBox(),

    // hardcoded use in assigning constructor
    incValueBox: new XML3DBox(
        new XML3DVec3(-1, -2, -3),
        new XML3DVec3(4,5,6)
    ),

    // arbitrary, non-zero size
    box1: new XML3DBox(
        new XML3DVec3(-20, 10, 3),
        new XML3DVec3(-10, 11, 15)
    ),

    // arbitrary, non-zero size
    box2: new XML3DBox(
        new XML3DVec3(40, 2.9, 14.75),
        new XML3DVec3(55.1, 70.43, 15.21)
    ),

    // arbitrary, non-zero size
    box3: new XML3DBox(
        new XML3DVec3(-89.34, -46.3, -12.3),
        new XML3DVec3(-45.93, -20.124, 379.3)
    )
});

test("Default Constructor", function() {

    ok(XML3DBox !== 'undefined', "Test for global constructor.");
    ok(typeof XML3DBox == 'function', "Global constructor is a function.");
    ok(typeof new XML3DBox() == 'object', "XML3DBox instance is object.");

    // only thing we assume: minimum must be greater than maximum, then box is empty
    ok(this.ident.min.x > this.ident.max.x, "[x] box' min greater than max");
    ok(this.ident.min.y > this.ident.max.y, "[y] box' min greater than max");
    ok(this.ident.min.z > this.ident.max.z, "[z] box' min greater than max");
});

test("Assigning Constructor", function() {
    QUnit.closeVector(this.incValueBox.min, new XML3DVec3(-1, -2, -3), EPSILON);
    QUnit.closeVector(this.incValueBox.max, new XML3DVec3(4, 5, 6), EPSILON);
});

test("Copy Constructor", function() {
    var b = new XML3DBox(this.box1);
    notStrictEqual(b, this.box1);
    QUnit.closeBox(b, this.box1, EPSILON);
});

test("XML3DBox::toString", function()  {
    equal(this.ident.toString(), "[object XML3DBox]", "Serialization");
});


test("XML3DBox setter", function() {

    var s = new XML3DBox();
    s.min.x = -1; s.min.y = -2; s.min.z = -3;
    s.max.x =  4; s.max.y =  5; s.max.z =  6;

    QUnit.closeBox(s, this.incValueBox, EPSILON);
});


test("XML3DBox::size: zero size", function() {

    var s = this.ident.size();
    QUnit.closeVector(s, new XML3DVec3(0, 0, 0), EPSILON);
    s = this.incValueBox.size();
    QUnit.closeVector(s, new XML3DVec3(5, 7, 9), EPSILON);
});

test("XML3DBox::size: non-zero size", function() {
    var b = this.box1;

    QUnit.closeVector(b.size(), b.max.subtract(b.min), EPSILON);
});

test("XML3DBox::center", function() {
    var b = this.box2;
    QUnit.closeVector(b.center(), b.min.add(b.max).scale(0.5), EPSILON);
});

test("XML3DBox::isEmpty", function() {
    ok(this.ident.isEmpty());
    ok(!this.box3.isEmpty());
});

test("XML3DBox::makeEmpty", function() {
    var b = new XML3DBox(this.box3.min, this.box3.max);
    b.makeEmpty();

    ok(b.isEmpty());
    QUnit.closeVector(b.size(), new XML3DVec3(0,0,0), EPSILON);
});

test("XML3DBox::set", function()  {
    equal(typeof this.ident.__proto__.set, 'function', "XML3DBox::set does not exist");
    var b = new XML3DBox();
    b.set(this.box1);
    notStrictEqual(b, this.box1);
    QUnit.closeBox(b, this.box1, EPSILON);
});


//============================================================================
//--- XML3DDataObserver ---
//============================================================================

module("XML3DDataObserver tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.window = document.getElementById("xml3dframe").contentWindow;
            start();
        };
        loadDocument("scenes/xml3d-observer.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});


test("Observe data disconnected from scene graph", function() {

    ok(this.window.XML3DDataObserver, "XML3DDataObserver is defined");


    var xTest = this.doc.getElementById("myXml3d"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testNumber = 0;
    var callback = function(records, observer){
        ok(records.length == 1, "There is one record entry.");
        var result = records[0].result;

        testNumber++;
        if(testNumber == 1){
            ok(result.getValue("position"), "There is a position field.");
            ok(!result.getValue("normal"), "There is no normal field.");
            QUnit.closeArray(result.getValue("position"),
                new Float32Array([-1, -1, -10,    1, -1, -10,   -1, 1, -10,   1, 1, -10])
                , EPSILON, "Value of position matches expected data");

            self.doc.getElementById("singleWeight").firstChild.nodeValue = "0.5";
        }
        if(testNumber == 2){
            QUnit.closeArray(result.getValue("position"),
                new Float32Array([-1.25, -1, -10,    1, -1, -10,   -1.5, 1, -10,   1, 1, -10])
                , EPSILON, "Value of position matches expected data");

            self.doc.getElementById("singleWeight").firstChild.nodeValue = "1";
        }
        if(testNumber == 3){
            QUnit.closeArray(result.getValue("position"),
                new Float32Array([-1.5, -1, -10,    1, -1, -10,   -2, 1, -10,   1, 1, -10])
                , EPSILON, "Value of position matches expected data");

            observer.disconnect();
            self.doc.getElementById("singleWeight").firstChild.nodeValue = "0";
            window.setTimeout(function(){
                ok(testNumber == 3, "Callback was not called after observer was disconnected");
                start();
            }, 200);
        }
    };

    var observer = new this.window.XML3DDataObserver(callback);
    observer.observe(this.doc.getElementById("morphSingle"), {names: "position" });


    this.doc.getElementById("singleWeight").firstChild.nodeValue = "0";

    stop();
});

test("Observe data connected to scene graph", function() {
    var xTest = this.doc.getElementById("myXml3d"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testNumber = 0;
    var checkRendering = false;
    var callback = function(records, observer){
        ok(records.length == 1, "There is one record entry.");
        var result = records[0].result;

        testNumber++;
        if(testNumber == 1){
            ok(result.getValue("position"), "There is a position field.");
            ok(!result.getValue("normal"), "There is no normal field.");

            QUnit.closeArray(result.getValue("position"),
                new Float32Array([-1.5, -1, -10,    1.5, -1, -10,   -2, 1, -10,   2, 1, -10])
                , EPSILON, "Value of position matches expected data");

            self.doc.getElementById("meshGroup").shader = "#pink";
            checkRendering = true;
        }
    };

    function onFrameDrawn(){
        if(checkRendering){
            checkRendering = false;
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 200, 150),
                [255,0,255,255], EPSILON, "Rendering right after observer callback uses modified shader");
            start();
        }
    }

    var observer = new this.window.XML3DDataObserver(callback);
    observer.observe( this.doc.getElementById("morphDouble"), {names: "position" } );
    xTest.addEventListener("framedrawn", onFrameDrawn);

    this.doc.getElementById("doubleWeight1").firstChild.nodeValue = "1";
    stop();
});