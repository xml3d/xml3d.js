module("ID Changes", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/id-changes.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("material ID changes", function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    hTest.draw();

    var upperLeft = XML3DUnit.getPixelValue(glTest, 64, 200);
    var upperRight = XML3DUnit.getPixelValue(glTest, 164, 200);
    var lowerLeft = XML3DUnit.getPixelValue(glTest, 64, 128);
    var lowerRight = XML3DUnit.getPixelValue(glTest, 164, 128);

    deepEqual(upperLeft, [0,0,0,255] , "Upper left rectangle is black");
    deepEqual(upperRight, [255,0,0,255] , "Upper right rectangle is red");
    deepEqual(lowerLeft, [0,0,255,255] , "Lower left rectangle is blue");
    deepEqual(lowerRight, [255,0,0,255] , "Lower right rectangle is red");

    // ---------------------------------------------------------------------

    // change id of #green material to #green42
    this.doc.getElementById("green").id = "green42";
    hTest.draw();
    ok(true, "Changed id of green material");

    upperRight = XML3DUnit.getPixelValue(glTest, 164, 200);
    deepEqual(upperRight, [0,255,0,255] , "Upper right rectangle is green");

    // ---------------------------------------------------------------------

    // change id of #black material to #black23
    this.doc.getElementById("black").id = "black23";
    hTest.draw();
    ok(true, "Changed id of black material");

    upperLeft = XML3DUnit.getPixelValue(glTest, 64, 200);
    deepEqual(upperLeft, [255,0,0,255] , "Upper left rectangle is red");

    // ---------------------------------------------------------------------

    var newmaterial = this.doc.createElementNS(XML3D.xml3dNS,"material");
    var color = this.doc.createElementNS(XML3D.xml3dNS, "float3");
    color.name = "diffuseColor";
    color.textContent = "1 0 1";
    newmaterial.appendChild(color);
    newmaterial.id = "notThere";
    newmaterial.script = "urn:xml3d:material:flat";
    this.doc.getElementsByTagName("defs")[0].appendChild(newmaterial);
    hTest.draw();
    ok(true, "Add a new material of id #notThere");

    lowerRight = XML3DUnit.getPixelValue(glTest, 164, 128);
    deepEqual(lowerRight, [255,0,255,255] , "Lower right rectangle is pink");



});

