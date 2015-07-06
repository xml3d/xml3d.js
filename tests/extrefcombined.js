module("External References", {
    setup : function() {
        var that = this;
        stop();
        Q.fcall(promiseIFrameLoaded, "scenes/extref-combined.xhtml?xml3d-loglevel=debug").then(function (doc) {
            that.doc = doc;
            ok(true, "Scene loaded");
        }).fin(QUnit.start).done();
    },
    teardown : function() {
        //var v = document.getElementById("xml3dframe");
        //v.removeEventListener("load", this.cb, true);
    }
});

test("Mesh JSON reference", 6, function () {
    var self = this;
    var xml3dTest = self.doc.getElementById("xml3dTest");
    var xml3dReference = self.doc.getElementById("xml3dReference");
    var xml3dReference2 = self.doc.getElementById("xml3dReference2");
    stop();
    var test1 = promiseSceneRendered(xml3dReference).then(promiseOneSceneCompleteAndRendered, xml3dTest).then(function () {
        self.doc.getElementById("jsonGroup").visible = true;
        return Q(xml3dTest);
    }).then(promiseSceneRendered).then(function () {
        QUnit.closeArray(XML3DUnit.readScenePixels(xml3dTest),XML3DUnit.readScenePixels(xml3dReference), PIXEL_EPSILON, "JSON render matches", true);
        var box = self.doc.getElementById("myMesh02").getLocalBoundingBox();
        QUnit.closeArray(box, [-1,-1,-10,1,1,-10], EPSILON, "Bounding box of external mesh is: (-1 -1 -10) to (1 1 -10)");
    });

    test1.then(promiseSceneRendered.bind(null, xml3dReference2)).then(function () {
        var meshElement = self.doc.getElementById("myMesh02");
        meshElement.setAttribute("src", "json/simpleMesh2.json");
        return Q(xml3dTest);
    }).then(promiseOneSceneCompleteAndRendered).then(function () {
        QUnit.closeArray(XML3DUnit.readScenePixels(xml3dTest),XML3DUnit.readScenePixels(xml3dReference2), PIXEL_EPSILON, "JSON render matches after change", true);

        var box = self.doc.getElementById("myMesh02").getLocalBoundingBox();
        QUnit.closeArray(box, [1,-3,-10,3,-1,-10], EPSILON, "Bounding box of external mesh is: (1 -3 -10) to (3 -1 -10)");


    }).fin(QUnit.start);
});


test("Sequence JSON reference", 4, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if(testStep == 0){
            if(XML3DUnit.getPixelValue(glTest, 128, 128)[0] == 0)
                return;

            notEqual(XML3DUnit.getPixelValue(glTest, 128, 128)[0], 0, "Something was rendered at all");

            XML3DUnit.loadSceneTestImages(self.doc, "xml3dReference3", "xml3dTest", function(refImage, testImage){
                QUnit.imageEqual(refImage, testImage, "JSON render matches");

                start();
            });
        }
    }

    xTest.addEventListener("framedrawn", onFrameDrawn);

    this.doc.getElementById("jsonSequenceGroup").visible = true;
    hTest.draw();

    stop();
});


test("Mesh XML reference", 5, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if(testStep == 0){
            if( XML3DUnit.getPixelValue(glTest, 64, 200)[0] == 0)
                return;

            XML3DUnit.loadSceneTestImages(self.doc, "xml3dReference", "xml3dTest", function(refImage, testImage){
                QUnit.imageEqual(refImage, testImage, "XML render matches");

                var meshElement = self.doc.getElementById("myMesh03");
                meshElement.setAttribute("src", "xml/meshes.xml#simpleMesh2");

                testStep++;
            });
        }
        if(testStep == 1){
            if( XML3DUnit.getPixelValue(glTest, 128, 128)[0] == 0)
                return;

            XML3DUnit.loadSceneTestImages(self.doc, "xml3dReference2", "xml3dTest", function(refImage, testImage){
                QUnit.imageEqual(refImage, testImage, "XML render matches after change");

                var meshElement = self.doc.getElementById("myMesh03");
                meshElement.setAttribute("src", "xml/meshes.xml#simpleMesh3");

                testStep++;
            });
        }
        if(testStep == 2){
            if( XML3DUnit.getPixelValue(glTest, 64, 200)[0] == 0)
                return;

            XML3DUnit.loadSceneTestImages(self.doc, "xml3dReference", "xml3dTest", function(refImage, testImage){
                QUnit.imageEqual(refImage, testImage, "XML render matches after change to xml reference across two xml files");

                start();
            });
        }
    }

    xTest.addEventListener("framedrawn", onFrameDrawn);


    this.doc.getElementById("xmlGroup").visible = true;
    hTest.draw();

    stop();
});

/*
test("material JSON reference", 3, function() {
    var xRef = this.doc.getElementById("xml3dReference"),
    actual,
    win = this.doc.defaultView,
    glRef = getContextForXml3DElement(xRef), hRef = getHandler(xRef);

    var xTest = this.doc.getElementById("xml3dTest"),
    glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);

    this.doc.getElementById("jsonmaterialGroup").visible = true;
    this.doc.getElementById("meshGroup").setAttribute("material", "#flatgreen");
    hTest.draw();
    hRef.draw();


    var data = glRef.canvas.toDataURL();
    var img = new Image();
    img.onload = function(e) {
        var expected = new Image();
        expected.onload = function(e) {
            QUnit.imageEqual(img, expected, "JSON material render matches");
            start();
        };
        expected.src = glTest.canvas.toDataURL();
        stop();
        start();
    };
    img.src = data;
    stop();

});
 */

test("material XML reference", 4, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest),
        hRef = getHandler(this.doc.getElementById("xml3dReference"));
    var self = this;

    var testStep = 0;

    function onFrameDrawn(){
        if(testStep == 0){
            if( XML3DUnit.getPixelValue(glTest, 64, 200)[1] == 0)
                return;
            testStep++;
            XML3DUnit.loadSceneTestImages(self.doc, "xml3dReference", "xml3dTest", function(refImage, testImage){
                QUnit.imageEqual(refImage, testImage, "XML render matches");

                self.doc.getElementById("groupRef1").setAttribute("material", "#refWood");
                hRef.draw();
                self.doc.getElementById("xmlmaterialGroup").setAttribute("material", "xml/materials.xml#wood");

                testStep++;
            });
        }
        if(testStep == 2){
            if( XML3DUnit.getPixelValue(glTest, 64, 200)[0] == 0)
                return;
            testStep++;
            XML3DUnit.loadSceneTestImages(self.doc, "xml3dReference", "xml3dTest", function(refImage, testImage){
                QUnit.imageEqual(refImage, testImage, "XML render matches");

                start();
            });
        }
    }
    xTest.addEventListener("framedrawn", onFrameDrawn);

    this.doc.getElementById("groupRef1").setAttribute("material", "#refFlatGreen");
    hRef.draw();

    this.doc.getElementById("xmlmaterialGroup").visible = true;
    hTest.draw();

    stop();
});

