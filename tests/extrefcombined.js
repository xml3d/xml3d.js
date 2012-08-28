module("External References", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/extref-combined.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Mesh JSON reference", 3, function() {
    var xRef = this.doc.getElementById("xml3dReference"),
    actual,
    win = this.doc.defaultView,
    glRef = getContextForXml3DElement(xRef), hRef = getHandler(xRef);

    var xTest = this.doc.getElementById("xml3dTest"),
    glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);

    this.doc.getElementById("jsonGroup").visible = true;
    hTest.draw();


    var data = glRef.canvas.toDataURL();
    var img = new Image();
    img.onload = function(e) {
        var expected = new Image();
        expected.onload = function(e) {
            QUnit.imageEqual(img, expected, "JSON render matches");
            start();
        };
        expected.src = glTest.canvas.toDataURL();
        stop();
        start();
    };
    img.src = data;
    stop();

});

test("Mesh XML reference", 3, function() {
    var xRef = this.doc.getElementById("xml3dReference"),
    actual,
    win = this.doc.defaultView,
    glRef = getContextForXml3DElement(xRef), hRef = getHandler(xRef);

    var xTest = this.doc.getElementById("xml3dTest"),
    glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);

    this.doc.getElementById("xmlGroup").visible = true;
    hTest.draw();


    var data = glRef.canvas.toDataURL();
    var img = new Image();
    img.onload = function(e) {
        var expected = new Image();
        expected.onload = function(e) {
            QUnit.imageEqual(img, expected, "XML render matches");
            start();
        };
        expected.src = glTest.canvas.toDataURL();
        stop();
        start();
    };
    img.src = data;
    stop();

});
