module("WebGL Rendering", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering01.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

function getContextForXml3DElement(x) {
    return x._configured.adapters.XML3DRenderAdapterFactory.handler.gl;
};

test("Background and invisible mesh", 4, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);

    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Transparent at 40,40");
    actual = win.getPixelValue(gl, 0, 0);
    deepEqual(actual, [0,0,0,0], "Transparent at 0,0");
});

test("Change visibility via script", 7, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        testFunc = null;

    // Should be
    /*x.addEventListener("framedrawn", function() {
    console.log("Frame drawn");
    });*/

    x._configured.adapters.XML3DRenderAdapterFactory.handler.events.framedrawn.push({
        listener : function(n) {
            ok("Redraw was triggered");
            if(testFunc)
                testFunc(n);
            start();
        }
    });

    testFunc = function(n) {
        equal(n.numberOfObjectsDrawn, 1, "1 Object drawn");
        equal(n.numberOfTrianglesDrawn, 2, "2 Triangles drawn");
        actual = win.getPixelValue(gl, 40, 40);
        deepEqual(actual, [0,0,255,255], "Blue at 40,40");
        actual = win.getPixelValue(gl, 0, 0);
        deepEqual(actual, [0,0,0,0], "Transparent at 0,0");
    };
    stop();
    this.doc.getElementById("myGroup").visible = true;
});