module("Transformations", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/transformations.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Local Transformations", 4, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var trans = this.doc.getElementById("group_transform2");
    var css = this.doc.getElementById("css_transform2");
    var xflow = this.doc.getElementById("xflow_tranform2");

    function onFrameDrawn(){
        QUnit.closeMatrix(css.getLocalMatrix(), trans.getLocalMatrix(), EPSILON, "CSS and <transform> equal");
        QUnit.closeMatrix(xflow.getLocalMatrix(), trans.getLocalMatrix(), EPSILON, "CSS and <data> equal");
        start();
    }
    xTest.addEventListener("framedrawn", onFrameDrawn);
    stop();
    hTest.draw();
});

test("Global Transformations", 4, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var trans = this.doc.getElementById("group_transform1");
    var css = this.doc.getElementById("css_transform1");
    var xflow = this.doc.getElementById("xflow_tranform1");

    function onFrameDrawn(){
        QUnit.closeMatrix(css.getWorldMatrix(), trans.getWorldMatrix(), EPSILON, "CSS and <transform> equal");
        QUnit.closeMatrix(xflow.getWorldMatrix(), trans.getWorldMatrix(), EPSILON, "CSS and <data> equal");
        start();
    }
    xTest.addEventListener("framedrawn", onFrameDrawn);
    stop();
    hTest.draw();
});