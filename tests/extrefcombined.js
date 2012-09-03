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
    var xTest = this.doc.getElementById("xml3dTest"), hTest = getHandler(xTest);

    this.doc.getElementById("jsonGroup").visible = true;
    hTest.draw();

    XML3DUnit.loadSceneTestImages(this.doc, "xml3dReference", "xml3dTest", function(refImage, testImage){
        QUnit.imageEqual(refImage, testImage, "JSON render matches");

        start();
    });
    stop();
});
/*

    var xRef = this.doc.getElementById("xml3dReference"),
    glRef = getContextForXml3DElement(xRef), hRef = getHandler(xRef),
    xRef2 = this.doc.getElementById("xml3dReference2"),
    glRef2 = getContextForXml3DElement(xRef2), hRef2 = getHandler(xRef2);





    var self = this;

    var refImages = [], refImagesLoaded = 0;
    function onLoad(){
        refImagesLoaded++;
        if(refImagesLoaded >= refImages.length)
            doneLoadingReference();
    }

    var img = new Image();
    img.onload = onLoad;
    img.src = glRef.canvas.toDataURL();;
    refImages.push(img);
    img = new Image();
    img.onload = onLoad;
    img.src = glRef2.canvas.toDataURL();
    refImages.push(img);
    stop();

    function doneLoadingReference(){
        var actualImage = new Image();
        actualImage.onload = function(e) {
            QUnit.imageEqual(refImages[0], actualImage, "JSON render matches");

            xTest.addEventListener("framedrawn", function(n) {
                var actualImage = new Image();
                actualImage.onload = function(e) {
                    actual = win.getPixelValue(gl, 128, 128);
                    QUnit.imageEqual(refImages[1], actualImage, "JSON render matches");
                }
                actualImage.src = glTest.canvas.toDataURL();
            });

            // Now modify the scene
            var meshElement = self.doc.getElementById("myMesh02");
            meshElement.src = "json/simpleMesh2.json";

            start();
        };
        actualImage.src = glTest.canvas.toDataURL();
    }

});
*/
test("Textured diffuse shader", 3, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        testFunc = null, h = getHandler(x);
    var group = this.doc.getElementById("diffuseTexGroup");
    group.visible = true;

    x.addEventListener("framedrawn", function(n) {
        if(testFunc)
            testFunc(n);
    });

    testFunc = function(n) {
        actual = win.getPixelValue(gl, 128, 128);
        if (actual[0] == 0) //texture hasn't finished loading yet
            return;
        deepEqual(actual, [251,251,0,255], "Yellow diffuse texture");
        start();
    };

    stop();
});

/*test("Mesh XML reference", 3, function() {
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

test("Shader JSON reference", 3, function() {
    var xRef = this.doc.getElementById("xml3dReference"),
    actual,
    win = this.doc.defaultView,
    glRef = getContextForXml3DElement(xRef), hRef = getHandler(xRef);

    var xTest = this.doc.getElementById("xml3dTest"),
    glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);

    this.doc.getElementById("jsonShaderGroup").visible = true;
    this.doc.getElementById("meshGroup").setAttribute("shader", "#flatgreen");
    hTest.draw();
    hRef.draw();


    var data = glRef.canvas.toDataURL();
    var img = new Image();
    img.onload = function(e) {
        var expected = new Image();
        expected.onload = function(e) {
            QUnit.imageEqual(img, expected, "JSON shader render matches");
            start();
        };
        expected.src = glTest.canvas.toDataURL();
        stop();
        start();
    };
    img.src = data;
    stop();

});

test("Shader XML reference", 3, function() {
    var xRef = this.doc.getElementById("xml3dReference"),
    actual,
    win = this.doc.defaultView,
    glRef = getContextForXml3DElement(xRef), hRef = getHandler(xRef);

    var xTest = this.doc.getElementById("xml3dTest"),
    glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);

    this.doc.getElementById("xmlShaderGroup").visible = true;
    this.doc.getElementById("meshGroup").setAttribute("shader", "#flatgreen");
    hTest.draw();
    hRef.draw();

    var data = glRef.canvas.toDataURL();
    var img = new Image();
    img.onload = function(e) {
        var expected = new Image();
        expected.onload = function(e) {
            QUnit.imageEqual(img, expected, "XML shader render matches");
            start();
        };
        expected.src = glTest.canvas.toDataURL();
        stop();
        start();
    };
    img.src = data;
    stop();

});*/
