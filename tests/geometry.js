module("Geometry", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/points.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Color Points", 14, function() {
    var xTest = this.doc.getElementById("myXml3d"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if( XML3DUnit.getPixelValue(glTest, 300, 170)[0] == 0)
            return;

        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 300, 170), [255,255,255,255], EPSILON,
            "Lower Point has correct color" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 300, 233), [102,102,102,255], EPSILON,
            "Upper Point has correct color" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 267, 202), [153,153,153,255], EPSILON,
            "Left Point has correct color" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 331, 202), [204,204,204,255], EPSILON,
            "Right Point has correct color" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 300, 200), [0,0,0,0], EPSILON,
            "Center points is transparent" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 283, 166), [0,0,0,0], EPSILON,
            "Dimensions of medium distance points are small enough" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 284, 166), [255,255,255,255], EPSILON,
            "Dimensions of medium distance points are big enough" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 283, 166), [0,0,0,0], EPSILON,
            "Dimensions of medium distance points are small enough" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 280, 37), [255,255,255,255], EPSILON,
            "Dimensions of near distance points are big enough" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 279, 37), [0,0,0,0], EPSILON,
            "Dimensions of near distance points are big enough" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 288, 273), [255,255,255,255], EPSILON,
            "Dimensions of near distance points are big enough" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 287, 273), [0,0,0,0], EPSILON,
            "Dimensions of near distance points are big enough" );
        start();
    }

    stop();
    xTest.addEventListener("framedrawn", onFrameDrawn);
    hTest.draw();

});

test("Texture Points", 7, function() {
    var xTest = this.doc.getElementById("myXml3d"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if( XML3DUnit.getPixelValue(glTest, 172, 168)[0] != 255)
            return;

        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 172, 168), [255,0,0,255], EPSILON,
            "Lower Point has correct texture" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 172, 232), [0,255,255,255], EPSILON,
            "Upper Point has correct texture" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 138, 200), [0,255,0,255], EPSILON,
            "Left Point has correct texture" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 198, 200), [0,0,255,255], EPSILON,
            "Right Point has correct texture" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 158, 155), [0,0,0,0], EPSILON,
            "Corner Point is transparent due to round texture image" );
        start();
    }

    stop();
    xTest.addEventListener("framedrawn", onFrameDrawn);
    hTest.draw();

});
test("Texture Color Points", 6, function() {
    var xTest = this.doc.getElementById("myXml3d"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if( XML3DUnit.getPixelValue(glTest, 428, 167)[0] != 255)
            return;

        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 428, 167), [255,0,0,255], EPSILON,
            "Lower Point has correct texture and color" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 428, 231), [0,102,102,255], EPSILON,
            "Upper Point has correct texture and color" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 396, 200), [0,153,0,255], EPSILON,
            "Left Point has correct texture and color" );
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 460, 200), [0,0,204,255], EPSILON,
            "Right Point has correct texture and color" );
        start();
    }

    stop();
    xTest.addEventListener("framedrawn", onFrameDrawn);
    hTest.draw();
});

module("Geometry", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/lines.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Color Lines", 8, function() {
    var xTest = this.doc.getElementById("myXml3d"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if( XML3DUnit.getPixelValue(glTest, 300, 211)[0] == 0)
            return;

        ok( XML3DUnit.getPixelValue(glTest, 300, 211)[0] > 0 , EPSILON,
            "Center Vertical Line exists");
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 300, 233), [0,0,0,0], EPSILON,
            "Center Vertical Line has right length" );
        ok( XML3DUnit.getPixelValue(glTest, 316, 200)[0] > 0 , EPSILON,
            "Center Horizontal Line exists");
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 333, 200), [0,0,0,0], EPSILON,
            "Center Horizontal Line has right length" );


        ok(XML3DUnit.getPixelValue(glTest, 217, 200)[3] != 0 &&
           XML3DUnit.getPixelValue(glTest, 203, 215)[3] != 0 &&
           XML3DUnit.getPixelValue(glTest, 186, 200)[3] != 0,
            "Indexed Line correct");

        ok(XML3DUnit.getPixelValue(glTest, 410, 199)[3] != 0 &&
            XML3DUnit.getPixelValue(glTest, 412, 216)[3] != 0 &&
            XML3DUnit.getPixelValue(glTest, 379, 215)[3] != 0,
            "Linestrips correct");
        start();
    }

    stop();
    xTest.addEventListener("framedrawn", onFrameDrawn);
    hTest.draw();

});