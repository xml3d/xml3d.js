module("Shader overrides", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/shader-overrides.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Uniform overrides", 8, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var win = this.doc.defaultView;
    var gl = getContextForXml3DElement(xml3dElement);
    var handler = getHandler(xml3dElement);
    var testFunc = function(n) {
        var actual = win.getPixelValue(gl, 40, 175);
        deepEqual(actual, [ 0, 0, 255, 255 ], "1: shader: blue");
        actual = win.getPixelValue(gl, 120, 175);
        deepEqual(actual, [ 255, 0, 0, 255 ], "2: shader: red");
        actual = win.getPixelValue(gl, 200, 175);
        deepEqual(actual, [ 0, 0, 255, 255 ], "2: shader: blue");
        actual = win.getPixelValue(gl, 280, 175);
        deepEqual(actual, [ 255, 255, 0, 255 ], "2: shader: yellow");
        actual = win.getPixelValue(gl, 360, 175);
        deepEqual(actual, [ 0, 255, 0, 255 ], "2: shader: green");
        actual = win.getPixelValue(gl, 440, 175);
        deepEqual(actual, [ 0, 0, 255, 255 ], "2: shader: blue");
        xml3dElement.removeEventListener("framedrawn", testFunc);
        start();
    };

    xml3dElement.addEventListener("framedrawn", testFunc);
    stop();
    handler.draw();
});

test("Uniform override with default shader", 4, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var win = this.doc.defaultView;
    var gl = getContextForXml3DElement(xml3dElement);
    var handler = getHandler(xml3dElement);
    this.doc.getElementById("test1").visible = false;
    this.doc.getElementById("test2").visible = true;
    var testStep = 0;

    var testFunc = function(n) {
        var actual;
        if (testStep === 0) {
            actual = win.getPixelValue(gl, 250, 175);
            deepEqual(actual, [ 0, 255, 0, 255 ], "Green override");
            start();
            testStep++;
        } else {
            console.log("2");
            actual = win.getPixelValue(gl, 250, 175);
            deepEqual(actual, [ 255, 0, 0, 255 ], "Default shader, override removed");
            start();
        }
    };

    xml3dElement.addEventListener("framedrawn", testFunc);
    stop();
    handler.draw();
    var override = this.doc.getElementById("override");
    override.parentNode.removeChild(override);
    handler.draw();
});