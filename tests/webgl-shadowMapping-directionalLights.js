module("WebGL ShadowMapping DirectionalLights", {
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
        loadDocument("scenes/webgl-shadowmap-directional.html"+window.location.search, this.cb);
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
test("Initial Scene and Moved Light", 10, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    h.draw();

    actual = win.getPixelValue(gl, 100, 100);    //reads from lower left corner of canvas
    deepEqual(actual, [102, 204, 102, 255], "Unmodified Scene, light test 1");
    actual = win.getPixelValue(gl, 150, 100);
    deepEqual(actual, [255, 204, 102, 255], "Unmodified Scene, light test 2");

    actual = win.getPixelValue(gl, 150, 139 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Unmodified Scene, shadow test upper tip");
    actual = win.getPixelValue(gl, 110 + offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Unmodified Scene, shadow test left tip");

    ////////////////////////////////////////////////////////////////////////////////////////////
    //moving directional light should have no effect
    this.doc.getElementById("t_light").setAttribute("translation", "1000 100000 120");
    h.draw();   //no lazy update test here, see next function
    actual = win.getPixelValue(gl, 100, 100);
    deepEqual(actual, [102, 204, 102, 255], "Moved Light, light test 1");
    actual = win.getPixelValue(gl, 150, 100);
    deepEqual(actual, [255, 204, 102, 255], "Moved Light, light test 2");

    actual = win.getPixelValue(gl, 150, 139 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light, shadow test upper tip");
    actual = win.getPixelValue(gl, 110 + offset, 60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Moved Light, shadow test left tip");

});

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests on Scene with centered View + setting direction
/////////////////////////////////////////////////////////////////////////////////////////////////
test("Centered View, changing direction and rotating", 20, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        h = getHandler(x),
        offset = this.doc.shadowTestOffset;
    h.draw();//lazy update test

    this.doc.getElementById("t_view").setAttribute("translation", "0 0 40");
    h.draw();

    actual = win.getPixelValue(gl, 10,          10);    //reads from lower left corner of canvas
    deepEqual(actual, [102, 204, 102, 255], "Centered View, light test 1");
    actual = win.getPixelValue(gl, 100,         100);
    deepEqual(actual, [255, 204, 102, 255], "Centered View, light test 2");

    /////////////////////////////////////////////////////////////////////////////////////////////////////

    this.doc.getElementById("light_direction").innerHTML = "-1 0 -1";
    h.draw();
    actual = win.getPixelValue(gl, 100,         150 + offset);
    deepEqual(actual, [72, 144, 72, 255], "Changed Light Direction 1, light test 1");
    actual = win.getPixelValue(gl, 150,         100);
    deepEqual(actual, [72, 144, 72, 255], "Changed Light Direction 1, light test 2");

    actual = win.getPixelValue(gl, 25,          100 );
    deepEqual(actual, [0, 0, 0, 255], "Changed Light Direction 1, shadow test center");
    actual = win.getPixelValue(gl, 25,          135 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Changed Light Direction 1, shadow test upper tip");
    actual = win.getPixelValue(gl, 0 + offset,  60 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Changed Light Direction 1, shadow test left lower corner");


    this.doc.getElementById("light_direction").innerHTML = "1 1 -1";
    h.draw();
    actual = win.getPixelValue(gl, 25,          100);
    deepEqual(actual, [59, 118, 59, 255], "Changed Light Direction 2, light test 1");
    actual = win.getPixelValue(gl, 100,         150+ offset);
    deepEqual(actual, [59, 118, 59, 255], "Changed Light Direction 2, light test 2");

    actual = win.getPixelValue(gl, 175 ,        175 );
    deepEqual(actual, [0, 0, 0, 255], "Changed Light Direction 2, shadow test center");
    actual = win.getPixelValue(gl, 135+offset,  135 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Changed Light Direction 2, shadow test left tip");
    actual = win.getPixelValue(gl, 175,         199 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Changed Light Direction 2, shadow test upper tip");

    /////////////////////////////////////////////////////////////////////////////////////////////////////

    this.doc.getElementById("light_direction").innerHTML = "0 0 -1";
    this.doc.getElementById("t_light").rotation.axis.set(new XML3DVec3(1.0, 1.0, 0));
    this.doc.getElementById("t_light").rotation.angle = -0.84;
    h.draw();
    actual = win.getPixelValue(gl, 150,         100);
    deepEqual(actual, [68, 136, 68, 255], "Rotate Light, light test 1");
    actual = win.getPixelValue(gl, 175,         175);
    deepEqual(actual, [68, 136, 68, 255], "Rotate Light, light test 2");

    actual = win.getPixelValue(gl, 160,          40 );
    deepEqual(actual, [0, 0, 0, 255], "Rotate Light, shadow test center");
    actual = win.getPixelValue(gl, 160,          78 - offset);
    deepEqual(actual, [0, 0, 0, 255], "Rotate Light, shadow test upper tip");
    actual = win.getPixelValue(gl, 140 + offset,  0 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Rotate Light, shadow test left tip");
    actual = win.getPixelValue(gl, 199 - offset,  0 + offset);
    deepEqual(actual, [0, 0, 0, 255], "Rotate Light, shadow test right tip");
});