module("Material overrides", {

});

test("Uniform overrides (no material recompilation)", 7, function() {
    stop();
   var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/material-overrides.html");

    var test = frameLoaded.then(function (doc) {
        return doc.querySelector("#xml3DElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 175);
        deepEqual(actual, [ 0, 0, 255, 255 ], "1: material: blue");
        actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 120, 175);
        deepEqual(actual, [ 255, 0, 0, 255 ], "2: material: red");
        actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 200, 175);
        deepEqual(actual, [ 0, 0, 255, 255 ], "3: material: blue");
        actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 280, 175);
        deepEqual(actual, [ 255, 255, 0, 255 ], "4: material: yellow");
        actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 360, 175);
        deepEqual(actual, [ 0, 255, 0, 255 ], "5: material: green");
        actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 440, 175);
        deepEqual(actual, [ 0, 0, 255, 255 ], "6: material: blue");

    });
    test.fin(QUnit.start).done();
});

test("Uniform override changes (no material recompilation)", 7, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/material-overrides.html");

    var test = frameLoaded.then(function (doc) {
        var colorElement = doc.getElementById("m_5").querySelector("float3[name=diffuseColor]");
        var mesh5 = doc.getElementById("m_6");

        colorElement.parentNode.removeChild(colorElement);
        mesh5.appendChild(colorElement);

        doc.querySelector("#p_5").textContent = "5: blue";
        doc.querySelector("#p_6").textContent = "6: green";

        return doc.querySelector("#xml3DElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 175);
        deepEqual(actual, [0, 0, 255, 255], "1: material: blue");
        actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 120, 175);
        deepEqual(actual, [255, 0, 0, 255], "2: material: red");
        actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 200, 175);
        deepEqual(actual, [0, 0, 255, 255], "3: material: blue");
        actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 280, 175);
        deepEqual(actual, [255, 255, 0, 255], "4: material: yellow");
        actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 360, 175);
        deepEqual(actual, [0, 0, 255, 255], "5: material: blue");
        actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 440, 175);
        deepEqual(actual, [0, 255, 0, 255], "6: material: green");
    });
    test.fin(QUnit.start).done();

});


test("Uniform override with default material (no material recompilation)", 3, function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/material-overrides.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("test1").style.display = 'none';
        doc.getElementById("test2").style.display = 'inherit';
        return doc.querySelector("#xml3DElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 250, 175);
        deepEqual(actual, [0, 255, 0, 255], "Green override");
        var override = s.ownerDocument.getElementById("override");
        override.parentNode.removeChild(override);
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 250, 175);
        deepEqual(actual, [255, 0, 0, 255], "Default material, override removed");
    });
    test.fin(QUnit.start).done();
});


module("Material overrides", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/material-overrides02.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Texture overrides (with material recompilation)", 8, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var win = this.doc.defaultView;
    var gl = getContextForXml3DElement(xml3dElement);
    var handler = getHandler(xml3dElement);
    var testFunc = function(n) {

        var actual = win.getPixelValue(gl, 40, 150);
        deepEqual(actual, [ 255, 255, 0, 255 ], "1: wave & texture");
        actual = win.getPixelValue(gl, 125, 150);
        deepEqual(actual, [ 255, 0, 0, 255 ], "2: red");
        actual = win.getPixelValue(gl, 200, 150);
        deepEqual(actual, [ 87, 87, 87, 255 ], "3: grey");
        actual = win.getPixelValue(gl, 280, 150);
        deepEqual(actual, [ 87, 87, 0, 255 ], "4: dark yellow");
        actual = win.getPixelValue(gl, 372, 150);
        QUnit.closePixel(actual, [ 86, 86, 86, 255 ], 2, "5: wave");
        actual = win.getPixelValue(gl, 440, 150);
        deepEqual(actual, [ 87, 87, 87, 255 ], "6: grey");
        xml3dElement.removeEventListener("framedrawn", testFunc);
        start();
    };

    xml3dElement.addEventListener("framedrawn", testFunc);
    stop();
    handler.draw();
});

test("Texture override changes (with material recompilation)", 8, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var win = this.doc.defaultView;
    var gl = getContextForXml3DElement(xml3dElement);
    var handler = getHandler(xml3dElement);
    var testFunc = function(n) {
        if(win.getPixelValue(gl, 200, 150)[2] != 0)
            return;

        var actual = win.getPixelValue(gl, 40, 150);
        deepEqual(actual, [ 255, 255, 255, 255 ], "1: wave without texture: white");
        actual = win.getPixelValue(gl, 125, 150);
        deepEqual(actual, [ 255, 0, 0, 255 ], "2: red");
        actual = win.getPixelValue(gl, 200, 150);
        deepEqual(actual, [ 87, 87, 0, 255 ], "3: dark yellow (originally gray)");
        actual = win.getPixelValue(gl, 280, 150);
        deepEqual(actual, [ 87, 87, 0, 255 ], "4: dark yellow");
        actual = win.getPixelValue(gl, 372, 150);
        QUnit.closePixel(actual, [ 86, 86, 86, 255 ], 2, "5: wave");
        actual = win.getPixelValue(gl, 440, 150);
        deepEqual(actual, [ 87, 87, 87, 255 ], "6: grey");
        xml3dElement.removeEventListener("framedrawn", testFunc);
        start();
    };

    handler.draw();
    var textureElement = this.doc.getElementById("m_1").querySelector("texture");
    var mesh3 = this.doc.getElementById("m_3");

    textureElement.parentNode.removeChild(textureElement);
    mesh3.appendChild(textureElement);

    //this.doc.querySelector("#p_5").textContent = "5: blue";
    //this.doc.querySelector("#p_6").textContent = "6: green";


    xml3dElement.addEventListener("framedrawn", testFunc);
    stop();
    handler.draw();

});
