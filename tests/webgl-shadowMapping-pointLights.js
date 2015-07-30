module("WebGL ShadowMapping PointLights", {
    /*setup : function() {
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
    } */
});

//!!!NOTE: if transformation, light, ... test fail these obviously do too

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests on initial Scene
/////////////////////////////////////////////////////////////////////////////////////////////////
test("Initial Scene, Light at origin no modifications", 7, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-shadowmap-point.html");
    var black = [0, 0, 0, 255], offset = 3;

    var test = frameLoaded.then(function (doc) {
        return doc.querySelector("#xml3DElem");
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);
        var actual = XML3DUnit.getPixelValue(gl, 100, 100);    //reads from lower left corner of canvas
        QUnit.closePixel(actual, [255, 255, 255, 255], 1, "Unmodified Scene, light test 1");
        actual = XML3DUnit.getPixelValue(gl, 150, 150);
        QUnit.closePixel(actual, [137, 255, 255, 255], 1, "Unmodified Scene, light test 2");

        actual = XML3DUnit.getPixelValue(gl, 100, 80 - offset);
        QUnit.closePixel(actual, black, 1, "Unmodified Scene, shadow test lower center");
        actual = XML3DUnit.getPixelValue(gl, 100, 140 - offset);
        QUnit.closePixel(actual, black, 1, "Unmodified Scene, shadow test upper tip");
        actual = XML3DUnit.getPixelValue(gl, 60 + offset, 60 + offset);
        QUnit.closePixel(actual, black, 1, "Unmodified Scene, shadow test left tip");
        actual = XML3DUnit.getPixelValue(gl, 140 - offset, 60 + offset);
        QUnit.closePixel(actual, black, 1, "Unmodified Scene, shadow test right tip");
    });

    test.fin(QUnit.start).done();

});

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests on Scene with light moved to the right
/////////////////////////////////////////////////////////////////////////////////////////////////
test("Light moved", 9, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-shadowmap-point.html");
    var black = [0, 0, 0, 255], offset = 3;

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        doc.getElementById("t_light").setAttribute("translation", "2 0 0");
        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);

        var actual = XML3DUnit.getPixelValue(gl, 100, 100);
        QUnit.closePixel(actual, [255, 255, 255, 255], 1, "Moved Light, light test 1");
        //color MIGHT vary on different render systems but shouldn't
        actual = XML3DUnit.getPixelValue(gl, 90, 100);
        QUnit.closePixel(actual, [225, 255, 255, 255], 1, "Moved Light, light test 2");
        actual = XML3DUnit.getPixelValue(gl, 110, 100);
        QUnit.closePixel(actual, [252, 255, 255, 255], 1, "Moved Light, light test 3");
        actual = XML3DUnit.getPixelValue(gl, 100, 115);
        QUnit.closePixel(actual, [233, 255, 255, 255], 1, "Moved Light, light test 4");

        actual = XML3DUnit.getPixelValue(gl, 40, 100);
        QUnit.closePixel(actual, black, 1, "Moved Light, shadow test center of triangle");
        actual = XML3DUnit.getPixelValue(gl, 40, 140 - offset);
        QUnit.closePixel(actual, black, 1, "Moved Light, shadow test upper tip");
        actual = XML3DUnit.getPixelValue(gl, offset, 60 + offset);
        QUnit.closePixel(actual, black, 1, "Moved Light, shadow test left tip");
        actual = XML3DUnit.getPixelValue(gl, 80 - offset, 60 + offset);
        QUnit.closePixel(actual, black, 1, "Moved Light, shadow test right tip");
    });

    test.fin(QUnit.start).done();


});

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests on Scene with casting triangle moved a bit (might fail if previous did too)
/////////////////////////////////////////////////////////////////////////////////////////////////
test("casting Triangle moved", 6, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-shadowmap-point.html");
    var black = [0, 0, 0, 255], offset = 3;

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        doc.getElementById("t_triangle_i").setAttribute("translation", "1 0 -2.5");
        doc.getElementById("t_light").setAttribute("translation", "2 0 0");

        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);

        var actual = XML3DUnit.getPixelValue(gl, 40, 100);
        notDeepEqual(actual, black, "Moved Triangle, light test 1");

        actual = XML3DUnit.getPixelValue(gl, 80, 100);
        deepEqual(actual, black, "Moved Triangle, shadow test center");
        actual = XML3DUnit.getPixelValue(gl, 80, 140 - offset);
        deepEqual(actual, black, "Moved Triangle, shadow test upper tip");
        actual = XML3DUnit.getPixelValue(gl, 40 + offset, 60 + offset);
        deepEqual(actual, black, "Moved Triangle, shadow test left tip");
        actual = XML3DUnit.getPixelValue(gl, 120 - offset, 60 + offset);
        deepEqual(actual, black, "Moved Triangle, shadow test right tip");
    });

    test.fin(QUnit.start).done();
});

/////////////////////////////////////////////////////////////////////////////////////////////////
//Tests if shadows get updated if switching light off and on again (needs movement tests to work)
/////////////////////////////////////////////////////////////////////////////////////////////////
test("Shadow Map update Test, moving Light and Triangle while light turned of", 9, function() {
   stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-shadowmap-point.html");
    var black = [0, 0, 0, 255], offset = 3;

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        doc.getElementById("t_triangle_i").setAttribute("translation", "0 0 -2.5");
        doc.getElementById("t_light").setAttribute("translation", "2 -2 0");
        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);
        var actual = XML3DUnit.getPixelValue(gl, 160, 40);
        notDeepEqual(actual, black, "Switch Light on/off, light on 1");
        s.ownerDocument.getElementById("light").setAttribute("style", "display: none;");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);
        var actual = XML3DUnit.getPixelValue(gl, 160, 40);
        deepEqual(actual, black, "Switch Light on/off, light out 1");
        s.ownerDocument.getElementById("t_light").setAttribute("translation", "2 0 0");
        s.ownerDocument.getElementById("light").setAttribute("style", "");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);
        var actual = XML3DUnit.getPixelValue(gl, 100, 100);
        deepEqual(actual, [255, 255, 255, 255], "Switch Light on/off, Moved Light - light test");
        actual = XML3DUnit.getPixelValue(gl, 40, 100);
        deepEqual(actual, black, "Switch Light on/off, Moved Light - shadow test");

        //now move the triangle instead of the light
        s.ownerDocument.getElementById("t_triangle_i").setAttribute("translation", "0 0 -2.5");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);
        var actual = XML3DUnit.getPixelValue(gl, 160,          40);
        notDeepEqual(actual, black, "Switch Light on/off, light on 2");
        s.ownerDocument.getElementById("light").setAttribute("style", "display: none;");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);
        var actual = XML3DUnit.getPixelValue(gl, 160,          40);
        deepEqual(actual, black, "Switch Light on/off, light out 2");

        s.ownerDocument.getElementById("t_triangle_i").setAttribute("translation", "1 0 -2.5");
        s.ownerDocument.getElementById("light").setAttribute("style", "");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);
        var actual = XML3DUnit.getPixelValue(gl, 140,          100);
        notDeepEqual(actual, black, "Switch Light on/off, Moved Triangle - light test");
        actual = XML3DUnit.getPixelValue(gl, 80,          100);
        deepEqual(actual, black, "Switch Light on/off, Moved Triangle - shadow test");
        return s;
    });

    test.fin(QUnit.start).done();
});

test("Different small Tests", 6, function() {
     stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-shadowmap-point.html");
    var black = [0, 0, 0, 255], offset = 3;

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        /////////////////////////////////////////////////////////////////////////////////////////////////
        //Test if Far plane is large enough (used to be a bug due to oversimplification)
        //with this bug the left part of the square was black, cut off by the farplane
        //but could also apear as missing shadow if algorithm changed... TODO test for both
        /////////////////////////////////////////////////////////////////////////////////////////////////
        doc.getElementById("t_light").setAttribute("translation", "7 0 0");
        doc.getElementById("t_triangle_i").setAttribute("translation", "1 0 -2.5");
        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);

        var actual = XML3DUnit.getPixelValue(gl, 10, 100);
        notDeepEqual(actual, black, "Visual Far Plane (bug) test");
        //TODO test again internal use an interval

        /////////////////////////////////////////////////////////////////////////////////////////////////
        //Test if object casts shadow if behind camera
        /////////////////////////////////////////////////////////////////////////////////////////////////
        s.ownerDocument.getElementById("t_triangle_i").setAttribute("translation", "0 0 50");
        s.ownerDocument.getElementById("t_light").setAttribute("translation", "0 0 120");
        s.ownerDocument.getElementById("light_intensity").innerHTML = "20000 60000 60000";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);

        var actual = XML3DUnit.getPixelValue(gl, 10, 10);
        notDeepEqual(actual, black, "Object out of view, light");
        actual = XML3DUnit.getPixelValue(gl, 100, 100);
        deepEqual(actual, black, "Object out of view, shadow");

        //on second update there was a bug that objects behind the cam were no longer used in shadowmap
        s.ownerDocument.getElementById("t_triangle_i").setAttribute("translation", "0 0 50");
        s.ownerDocument.getElementById("t_light").setAttribute("translation", "0 0 121");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var gl = getContextForXml3DElement(s);
        var actual = XML3DUnit.getPixelValue(gl, 10, 10);
        notDeepEqual(actual, black, "Object out of view, Second update, light"); //maybe the polygon gets cut on update...
        actual = XML3DUnit.getPixelValue(gl, 100, 100);
        deepEqual(actual, black, "Object out of view, Second update, shadow");
        return s;
    });

    test.fin(QUnit.start).done();

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

