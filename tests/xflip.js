module("Xflip tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.window = document.getElementById("xml3dframe").contentWindow;
            start();
        };
        loadDocument("scenes/xflip.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Grayscale Image", function() {
    var node = this.doc.getElementById("output");
    this.window.Xflip.addCallback(function(){
        if(!node.finished())
            return;
        var canvas = node.getCanvas();

        var pixelData = canvas.getContext("2d").getImageData(0,0,1,1);
        var color = [pixelData.data[0], pixelData.data[1], pixelData.data[2], pixelData.data[3]];

        if(!color[0]) return;

        QUnit.closeArray(color, [182,182,182,255], EPSILON, "Color of processed image is gray." );

        start();
    });

    stop();
});

