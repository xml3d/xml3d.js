module("Buffer Sharing tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/buffer-sharing.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Cross Buffer Sharing", 3, function() {
    var xTest = this.doc.getElementById("xml3dScene1"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest),
        xRef = this.doc.getElementById("xml3dScene2"), hRef = getHandler(xRef);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if(testStep == 0){
            if( XML3DUnit.getPixelValue(glTest, 100, 150)[0] == 0)
                return;

            XML3DUnit.loadSceneTestImages(self.doc, "xml3dScene1", "xml3dScene2", function(refImage, testImage){
                QUnit.imageEqual(refImage, testImage, "Cross Content Sharing Scenes rendered identical");
                testStep++;

                start();
            });
        }
    }

    xTest.addEventListener("framedrawn", onFrameDrawn);
    hRef.draw();
    hTest.draw();

    stop();
});
