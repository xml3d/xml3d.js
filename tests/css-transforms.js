module("CSS Transformations", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/css-transforms.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Static Transforms", 3, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if(testStep == 0){
            if( XML3DUnit.getPixelValue(glTest, 200, 100)[0] == 0) {
                ok(false, "Nothing rendered at all");
                return;
            }

            XML3DUnit.loadSceneTestImages(self.doc, "xml3dReference", "xml3dTest", function(refImage, testImage){
                QUnit.imageEqual(refImage, testImage, "CSS-Tranform Render matches");
                testStep++;

                start();
            });
        }
    }

    xTest.addEventListener("framedrawn", onFrameDrawn);

    this.doc.getElementById("rootGroup").visible = true;
    hTest.draw();

    stop();
});

test("Change transform", 5, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;
    var group = this.doc.getElementById("rootGroup");
    group.visible = true;

    hTest.draw();
    var actual = XML3DUnit.getPixelValue(glTest, 200, 100);
    deepEqual(actual, [ 255, 0, 0, 255 ], "Original transform is correct");

    group.setAttribute("style", "transform: translate3d(2px,0px,-10px)");
    hTest.draw();
    actual = XML3DUnit.getPixelValue(glTest, 300, 100);
    deepEqual(actual, [ 255, 0, 0, 255 ], "Group was moved to the right");

    this.doc.getElementById("mesh").setAttribute("style", "transform: translate3d(0, 2, 0)");
    hTest.draw();
    actual = XML3DUnit.getPixelValue(glTest, 30, 150);
    deepEqual(actual, [ 255, 0, 0, 255 ], "Mesh was moved up");
});
