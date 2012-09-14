module("Images", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/transform.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

function getCanvasForXml3DElement(x) {
    return x._configured.canvas;
};

test("Image test", 3, function() {
    var x = this.doc.getElementById("xml3DElem");
    var canvas = getCanvasForXml3DElement(x);
    var data = canvas.toDataURL();
    var img = new Image();
    img.onload = function(e) {
        var expected = new Image();
        expected.onload = function(e) {
            QUnit.imageEqual(img, expected, "Transform equals");
            start();
        };
        expected.src = "./scenes/textures/yellow.png";
        stop();
        start();
    };
    img.src = data;
    stop();

});