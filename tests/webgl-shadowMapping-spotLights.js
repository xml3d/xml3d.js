module("WebGL ShadowMapping SpotLights", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");

            that.win = document.getElementById("xml3dframe").contentWindow;
            that.doc = document.getElementById("xml3dframe").contentDocument;

            that.doc.shadowTestOffset = 3; //used to check shadows after implementing soft shadows or prevent imprecisions
            //if many tests fail try enhacing to 2,3 (or up to 10 for soft shadows, deepends on algorithm)

            start();
        };
        loadDocument("scenes/webgl-shadowmap-spot.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

//!!!NOTE: if transformation, light, ... test fail these obviously do too

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests on initial Scene
/////////////////////////////////////////////////////////////////////////////////////////////////
test("Initial Scene - Light origin no modifications", 9, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    //h.draw();   //no lazy update test here, see next function

    actual = win.getPixelValue(gl, 100, 100);    //reads from lower left corner of canvas
    deepEqual(actual, [255, 255, 255, 255], "Unmodified Scene, light test 1");
    actual = win.getPixelValue(gl, 100, 197);
    deepEqual(actual, [87, 87, 255, 255], "Unmodified Scene, light test 2");
    actual = win.getPixelValue(gl, 30, 30);
    deepEqual(actual, [86, 86, 255, 255], "Unmodified Scene, light test 3");

    actual = win.getPixelValue(gl, 100, 80 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Unmodified Scene, shadow test lower center");
    actual = win.getPixelValue(gl, 100, 139 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Unmodified Scene, shadow test upper tip");
    actual = win.getPixelValue(gl, 60 + offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Unmodified Scene, shadow test left tip");
    actual = win.getPixelValue(gl, 140 - offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Unmodified Scene, shadow test right tip");

});

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests on Scene with moved light
/////////////////////////////////////////////////////////////////////////////////////////////////
test("Light moved", 16, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    h.draw();

    this.doc.getElementById("t_light").setAttribute("translation", "2 0 0");
    h.draw();
    actual = win.getPixelValue(gl, 100, 100);    //reads from lower left corner of canvas
    deepEqual(actual, [255, 255, 255, 255], "Moved Light 1, light test 1");
    actual = win.getPixelValue(gl, 120, 100);
    deepEqual(actual, [230, 230, 255, 255], "Moved Light 1, light test 2");
    actual = win.getPixelValue(gl, 100, 197);
    deepEqual(actual, [84, 84, 254, 255], "Moved Light 1, light test 3");

    actual = win.getPixelValue(gl, 40, 100 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light 1, shadow test center");
    actual = win.getPixelValue(gl, 40, 139 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light 1, shadow test upper tip");
    actual = win.getPixelValue(gl, 1 + offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light 1, shadow test left tip");
    actual = win.getPixelValue(gl, 80 - offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light 1, shadow test right tip");


    this.doc.getElementById("t_light").setAttribute("translation", "1 1 0");
    h.draw();
    actual = win.getPixelValue(gl, 100, 100);    //reads from lower left corner of canvas
    deepEqual(actual, [255, 255, 255, 255], "Moved Light 2, light test 1");
    actual = win.getPixelValue(gl, 120, 100);
    deepEqual(actual, [223, 223, 255, 255], "Moved Light 2, light test 2");
    actual = win.getPixelValue(gl, 100, 197);
    deepEqual(actual, [100, 100, 255, 255], "Moved Light 2, light test 3");

    actual = win.getPixelValue(gl, 70, 70 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light 2, shadow test center");
    actual = win.getPixelValue(gl, 70, 109 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light 2, shadow test upper tip");
    actual = win.getPixelValue(gl, 30 + offset, 30 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light 2, shadow test left tip");
    actual = win.getPixelValue(gl, 110 - offset, 30 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light 2, shadow test right tip");

});

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests on Scene with moved triangle
/////////////////////////////////////////////////////////////////////////////////////////////////
test("Triangle moved", 16, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    h.draw();

    this.doc.getElementById("t_triangle_i").setAttribute("translation", "2 0 -2.5");
    h.draw();
    actual = win.getPixelValue(gl, 120, 100);    //reads from lower left corner of canvas
    deepEqual(actual, [255, 255, 255, 255], "Moved Triangle 1, light test 1");
    actual = win.getPixelValue(gl, 100, 100);
    deepEqual(actual, [230, 230, 255, 255], "Moved Triangle 1, light test 2");
    actual = win.getPixelValue(gl, 100, 197);
    deepEqual(actual, [87, 87, 255, 255], "Moved Triangle 1, light test 3");

    actual = win.getPixelValue(gl, 180, 100 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Triangle 1, shadow test center");
    actual = win.getPixelValue(gl, 180, 139 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Triangle 1, shadow test upper tip");
    actual = win.getPixelValue(gl, 140 + offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Triangle 1, shadow test left tip");
    actual = win.getPixelValue(gl, 199 - offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Triangle 1, shadow test right tip");


    this.doc.getElementById("t_triangle_i").setAttribute("translation", "-1 1 -2.5");
    h.draw();
    actual = win.getPixelValue(gl, 3, 100);
    deepEqual(actual, [88, 88, 255, 255], "Moved Triangle 2, light test 1");
    actual = win.getPixelValue(gl, 90, 110);
    deepEqual(actual, [255, 255, 255, 255], "Moved Triangle 2, light test 2");
    actual = win.getPixelValue(gl, 120, 100);
    deepEqual(actual, [216, 216, 255, 255], "Moved Triangle 2, light test 3");

    actual = win.getPixelValue(gl, 60, 140 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Triangle 2, shadow test center");
    actual = win.getPixelValue(gl, 60, 179 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Triangle 2, shadow test upper tip");
    actual = win.getPixelValue(gl, 20 + offset, 100 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Triangle 2, shadow test left tip");
    actual = win.getPixelValue(gl, 100 - offset, 100 + offset);
    deepEqual(actual, [255, 255, 255, 255], "Moved Triangle 2, shadow test right tip");

});

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests on Scene with rotated Light and changed direction
/////////////////////////////////////////////////////////////////////////////////////////////////
test("Light Direction and Rotation", 16, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    h.draw();

    this.doc.getElementById("t_triangle_i").setAttribute("translation", "7.5 -7.5 -2.5");
    this.doc.getElementById("t_light").setAttribute("translation", "10 -10 0");
    this.doc.getElementById("t_light_rotation").setAttribute("rotation", "1.0 1.0 0 0.392699");
    h.draw();
    actual = win.getPixelValue(gl, 175, 25);    //reads from lower left corner of canvas
    deepEqual(actual, [194, 194, 255, 255], "Rotated, light test 1");
    actual = win.getPixelValue(gl, 190, 10);
    deepEqual(actual, [255, 255, 255, 255], "Rotated, light test 2");
    actual = win.getPixelValue(gl, 100, 50);
    deepEqual(actual, [71, 71, 212, 255], "Rotated, light test 3");

    actual = win.getPixelValue(gl, 100, 100);
    deepEqual(actual, [0, 0, 0, 255], "Rotated, shadow test center");
    actual = win.getPixelValue(gl, 100, 139 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Rotated, shadow test upper tip");
    actual = win.getPixelValue(gl, 60 + offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Rotated, shadow test left tip");
    actual = win.getPixelValue(gl, 140 - offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Rotated, shadow test right tip");

    ////////////Changed direction

    this.doc.getElementById("t_light_rotation").setAttribute("rotation", "0.0 1.0 0 0.0");
    this.doc.getElementById("light_direction").innerHTML = "-1 1 -2";
    h.draw();
    actual = win.getPixelValue(gl, 175, 25);    //reads from lower left corner of canvas
    deepEqual(actual, [194, 194, 255, 255], "Rotated, light test 1");
    actual = win.getPixelValue(gl, 190, 10);
    deepEqual(actual, [255, 255, 255, 255], "Rotated, light test 2");
    actual = win.getPixelValue(gl, 100, 50);
    deepEqual(actual, [71, 71, 212, 255], "Rotated, light test 3");

    actual = win.getPixelValue(gl, 100, 100);
    deepEqual(actual, [0, 0, 0, 255], "Rotated, shadow test center");
    actual = win.getPixelValue(gl, 100, 139 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Rotated, shadow test upper tip");
    actual = win.getPixelValue(gl, 60 + offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Rotated, shadow test left tip");
    actual = win.getPixelValue(gl, 140 - offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Rotated, shadow test right tip");
});


/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests on Scene, triangle and light behind camera
/////////////////////////////////////////////////////////////////////////////////////////////////
test("casting Object behind camera", 6, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    h.draw();

    this.doc.getElementById("t_triangle_i").setAttribute("translation", "0 0 50");
    this.doc.getElementById("t_light").setAttribute("translation", "0 0 120");
    this.doc.getElementById("light_intensity").innerHTML = "200 200 600";
    h.draw();
    actual = win.getPixelValue(gl, 10,          10);
    notDeepEqual(actual, [0, 0, 0, 255], "Object out of view, light");
    actual = win.getPixelValue(gl, 100,          100);
    deepEqual(actual, [0, 0, 0, 255], "Object out of view, shadow");

    //on second update there was a bug that objects behind the cam were no longer used in shadowmap
    this.doc.getElementById("t_triangle_i").setAttribute("translation", "0 0 50");
    this.doc.getElementById("t_light").setAttribute("translation", "0 0 121");
    h.draw();
    actual = win.getPixelValue(gl, 10,          10);
    notDeepEqual(actual, [0, 0, 0, 255], "Object out of view, Second update, light"); //maybe the polygon gets cut on update...
    actual = win.getPixelValue(gl, 100,          100);
    deepEqual(actual, [0, 0, 0, 255], "Object out of view, Second update, shadow");
});

