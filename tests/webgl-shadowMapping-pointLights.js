module("WebGL ShadowMapping PointLights", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");

            that.win = document.getElementById("xml3dframe").contentWindow;
            that.doc = document.getElementById("xml3dframe").contentDocument;

            that.doc.shadowTestOffset = 1; //used to check shadows after implementing soft shadows or prevent imprecisions
            //if many tests fail try enhacing to 2,3 (or up to 10 for soft shadows, deepends on algorithm)

            start();
        };
        loadDocument("scenes/webgl-shadowmap-point.html"+window.location.search, this.cb);
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
test("Initial Scene, Light at origin no modifications", 8, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    //h.draw();   //no lazy update test here, see next function

    actual = win.getPixelValue(gl, 100, 100);    //reads from lower left corner of canvas
    deepEqual(actual, [255, 255, 255, 255], "Unmodified Scene, light test 1");
    actual = win.getPixelValue(gl, 150, 150);
    deepEqual(actual, [137, 255, 255, 255], "Unmodified Scene, light test 2");

    actual = win.getPixelValue(gl, 100, 80 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Unmodified Scene, shadow test lower center");
    actual = win.getPixelValue(gl, 100, 140 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Unmodified Scene, shadow test upper tip");
    actual = win.getPixelValue(gl, 60 + offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Unmodified Scene, shadow test left tip");
    actual = win.getPixelValue(gl, 140 - offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Unmodified Scene, shadow test right tip");
});

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests on Scene with light moved to the right
/////////////////////////////////////////////////////////////////////////////////////////////////
test("Light moved", 10, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    h.draw(); //shall prevent lazy update bugs

    this.doc.getElementById("t_light").setAttribute("translation", "2 0 0");
    h.draw();

    actual = win.getPixelValue(gl, 100,         100);
    deepEqual(actual, [255, 255, 255, 255], "Moved Light, light test 1");
    //color MIGHT vary on different render systems but shouldn't
    actual = win.getPixelValue(gl, 90,          100);
    deepEqual(actual, [225, 255, 255, 255], "Moved Light, light test 2");
    actual = win.getPixelValue(gl, 110,         100);
    deepEqual(actual, [252, 255, 255, 255], "Moved Light, light test 3");
    actual = win.getPixelValue(gl, 100,         115);
    deepEqual(actual, [233, 255, 255, 255], "Moved Light, light test 4");

    actual = win.getPixelValue(gl, 40,          100);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light, shadow test center of triangle");
    actual = win.getPixelValue(gl, 40,          140-offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light, shadow test upper tip");
    actual = win.getPixelValue(gl, 0+offset,    60+offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light, shadow test left tip");
    actual = win.getPixelValue(gl, 80-offset,   60+offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light, shadow test right tip");
});

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests on Scene with casting triangle moved a bit (might fail if previous did too)
/////////////////////////////////////////////////////////////////////////////////////////////////
test("casting Triangle moved", 7, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    h.draw();


    this.doc.getElementById("t_triangle_i").setAttribute("translation", "1 0 -2.5");
    this.doc.getElementById("t_light").setAttribute("translation", "2 0 0");
    h.draw();
    actual = win.getPixelValue(gl, 40,          100);
    notDeepEqual(actual, [0, 0, 0, 255], "Moved Triangle, light test 1");

    actual = win.getPixelValue(gl, 80,          100);
    deepEqual(actual, [0, 0, 0, 255], "Moved Triangle, shadow test center");
    actual = win.getPixelValue(gl, 80,          140-offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Triangle, shadow test upper tip");
    actual = win.getPixelValue(gl, 40+offset,   60+offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Triangle, shadow test left tip");
    actual = win.getPixelValue(gl, 120-offset,  60+offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Triangle, shadow test right tip");
});

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests if shadows get updated if switching light off and on again (needs movement tests to work)
/////////////////////////////////////////////////////////////////////////////////////////////////
test("Shadow Map update Test, moving Light and Triangle while light turned of", 10, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    h.draw();


    this.doc.getElementById("t_triangle_i").setAttribute("translation", "0 0 -2.5");
    this.doc.getElementById("t_light").setAttribute("translation", "2 -2 0");
    h.draw();
    actual = win.getPixelValue(gl, 160,          40);
    notDeepEqual(actual, [0, 0, 0, 255], "Switch Light on/off, light on 1");

    this.doc.getElementById("light").setAttribute("visible", "false");
    h.draw();
    actual = win.getPixelValue(gl, 160,          40);
    deepEqual(actual, [0, 0, 0, 255], "Switch Light on/off, light out 1");

    this.doc.getElementById("t_light").setAttribute("translation", "2 0 0");
    this.doc.getElementById("light").setAttribute("visible", "true");
    h.draw();
    actual = win.getPixelValue(gl, 100,         100);
    deepEqual(actual, [255, 255, 255, 255], "Switch Light on/off, Moved Light - light test");
    actual = win.getPixelValue(gl, 40,          100);
    deepEqual(actual, [0, 0, 0, 255], "Switch Light on/off, Moved Light - shadow test");

    //not move the triangle instead of the light

    this.doc.getElementById("t_triangle_i").setAttribute("translation", "0 0 -2.5");
    h.draw();
    actual = win.getPixelValue(gl, 160,          40);
    notDeepEqual(actual, [0, 0, 0, 255], "Switch Light on/off, light on 2");

    this.doc.getElementById("light").setAttribute("visible", "false");
    h.draw();
    actual = win.getPixelValue(gl, 160,          40);
    deepEqual(actual, [0, 0, 0, 255], "Switch Light on/off, light out 2");

    this.doc.getElementById("t_triangle_i").setAttribute("translation", "1 0 -2.5");
    this.doc.getElementById("light").setAttribute("visible", "true");
    h.draw();
    actual = win.getPixelValue(gl, 140,          100);
    notDeepEqual(actual, [0, 0, 0, 255], "Switch Light on/off, Moved Triangle - light test");

    actual = win.getPixelValue(gl, 80,          100);
    deepEqual(actual, [0, 0, 0, 255], "Switch Light on/off, Moved Triangle - shadow test");
});

test("Different small Tests", 7, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    h.draw();

    /////////////////////////////////////////////////////////////////////////////////////////////////
    //Test if Far plane is large enough (used to be a bug due to oversimplification)
    //with this bug the left part of the square was black, cut off by the farplane
    //but could also apear as missing shadow if algorithm changed... TODO test for both
    /////////////////////////////////////////////////////////////////////////////////////////////////
    this.doc.getElementById("t_triangle_i").setAttribute("translation", "1 0 -2.5");
    this.doc.getElementById("t_light").setAttribute("translation", "7 0 0");
    h.draw();
    actual = win.getPixelValue(gl, 10,          100);
    notDeepEqual(actual, [0, 0, 0, 255], "Visual Far Plane (bug) test");
    //TODO test again internal use an interval


    /////////////////////////////////////////////////////////////////////////////////////////////////
    //Test if objects nearer than 1 unit cast shadows
    /////////////////////////////////////////////////////////////////////////////////////////////////
    /*this.doc.getElementById("t_triangle_i").setAttribute("translation", "0 0 -0.5");
    this.doc.getElementById("t_light").setAttribute("translation", "0 0 0");
    h.draw();
    actual = win.getPixelValue(gl, 100,          100);
    deepEqual(actual, [0, 0, 0, 255], "Object nearer than 1 can casts shadow");
    //TODO test again internal use an interval*/

    /////////////////////////////////////////////////////////////////////////////////////////////////
    //Test if object casts shadow if behind camera
    /////////////////////////////////////////////////////////////////////////////////////////////////
    this.doc.getElementById("t_triangle_i").setAttribute("translation", "0 0 50");
    this.doc.getElementById("t_light").setAttribute("translation", "0 0 120");
    this.doc.getElementById("light_intensity").innerHTML = "20000 60000 60000";
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


   ///*************************************////
    //-Shadow of items behind cam/ out of viewfield
    //Rotating light
    //Test boundingbox size
    //Test Bias size
    //Lightbleeding test
    //-Farplane test
    //-near plane <0.5 test
    //enabling diabling light shadow update
    //adding triangle update shadowmap
    //check farplane against theoretical maximal light reach
    //move view

});

