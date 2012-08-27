module("WebGL Picking tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-ambient.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});


test("Picking test", 4, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var h = getHandler(xml3dElement);
    h.renderPick(88,60);
    ok(h.currentPickObj, "Object picked");
    strictEqual(h.currentPickObj, this.doc.getElementById("pickingMesh1"));
});
