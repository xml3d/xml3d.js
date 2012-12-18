module("Scene Loading", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/scene-loading.xhtml", this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Check onload", function() {
    ok(this.doc.XML3D !== undefined, "Access to XML3D object of loaded scene");
    ok(this.doc.onloadCounter !== undefined, "Access to onload counter of loaded scene");
    equal(this.doc.onloadCounter, 3, "Correct number of loaded xml3d elements");
});
