module("Datalist and Multimesh", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/datalist-basic.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Static Test", 3, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if(testStep == 0){
            if( XML3DUnit.getPixelValue(glTest, 250, 150)[0] == 0)
                return;

            XML3DUnit.loadSceneTestImages(self.doc, "xml3dReference", "xml3dTest", function(refImage, testImage){
                QUnit.imageEqual(refImage, testImage, "Multidata render matches");
                start();
            });
        }
    }
    xTest.addEventListener("framedrawn", onFrameDrawn);
    hTest.draw();
    stop();
});


