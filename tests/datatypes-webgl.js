
module("XML3DVec3 callback tests", {
    setup: function () {
        this.callbackVec3 = function(p) {
            ok(p instanceof XML3DVec3);
            console.log(p.toString());
        };
        this.vec = new XML3DVec3(0, 1, 0, this.callbackVec3);
    }
});

test("XML3DVec3 owner", function()  {
    equal(this.vec._callback, this.callbackVec3, "Callback is set");
});

test("XML3DVec3 setters callback", function()  {
    expect(3);
    this.vec.x = 0.1;
    this.vec.y = -2.0;
    ok(true);
});

test("XML3DVec3::setVec3Value callback", function()  {
    expect(2);
    this.vec.setVec3Value("0 0 0");
    ok(true);
});

module("XML3DRotation callback tests", {
    setup: function () {
        this.callback = function(p) {
            ok(p instanceof XML3DRotation);
            console.log(this.toString());
        };
        this.rot = new XML3DRotation(new XML3DVec3(0,0,1), 3.14, this.callback);
    }
});

test("XML3DRotation owner", function()  {
    equal(this.rot._callback, this.callback, "Callback is set");
});

test("XML3DRotation angle setter callback", function()  {
    expect(2);
    this.rot.angle = 0.1;
    ok(true);
});

test("XML3DRotation axis setter callback", function()  {
    expect(3);
    this.rot.axis.x = 0.707;
    this.rot.axis.z = -0.707;
    ok(true);
});


test("XML3DRotation::setAxisAngleValue callback", function()  {
    expect(2);
    this.rot.setAxisAngleValue("0 0 1 -3.14");
    ok(true);
});

test("XML3DRotation::setAxisAngle callback", function()  {
    expect(2);
    this.rot.setAxisAngle(new XML3DVec3(1,0,0), 1.0);
    ok(true);
});

test("XML3DRotation::setQuaternion callback", function()  {
    expect(2);
    this.rot.setQuaternion(new XML3DVec3(0.7, 0, 0.7), 0);
    ok(true);
});

test("XML3DRotation::setRotation callback", function()  {
    expect(2);
    this.rot.setRotation(new XML3DVec3(1,0,0), new XML3DVec3(0,1,0));
    ok(true);
});

module("XML3DMatrix callback tests", {
    setup: function () {
        this.callback = function(p) {
            ok(p instanceof XML3DMatrix);
            console.log(this.toString());
        };
        this.mat = new XML3DMatrix(this.callback);
    }
});

test("XML3DMatrix callback", function()  {
    equal(this.mat._callback, this.callback, "Callback is set");
});

test("XML3DMatrix::setMatrixValue callback", function()  {
    expect(2);
    this.mat.setMatrixValue("1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16");
    ok(true);
});