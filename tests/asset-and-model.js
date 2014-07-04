module("Asset and Model", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/asset-basic.xhtml"+window.location.search, this.cb);
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

test("Modify shader assignment", 6, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if(testStep == 0){
            if( XML3DUnit.getPixelValue(glTest, 250, 150)[0] == 0)
                return;
            testStep++;
            self.doc.getElementById("innerSubData").shader = "#pinkShader";
        }
        else if(testStep == 1){
            if( XML3DUnit.getPixelValue(glTest, 324, 40)[0] != 255)
                return;
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 324, 40), [255,127,255,255], EPSILON,
                "One instance has shader color replaced" );
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 124, 134), [0,255,0,255], EPSILON,
                "Other instance with overridden shader has color NOT replaced" );
            testStep++;
            self.doc.getElementById("outerSubData").shader = "";
        }
        else if(testStep == 2){
            if( XML3DUnit.getPixelValue(glTest, 124, 134)[0] != 255)
                return;
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 124, 134), [255,127,255,255], EPSILON,
                "Other instance has overriden shader removed and therefore updated color" );
            testStep++;
            self.doc.getElementById("outerSubData").shader = "#blueShader";
        }
        else if(testStep == 3){
            if( XML3DUnit.getPixelValue(glTest, 124, 134)[0] != 0)
                return;
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 124, 134), [0,0,255,255], EPSILON,
                "Other instance now has blue color due to newly added shader" );
            start();
        }
    }
    xTest.addEventListener("framedrawn", onFrameDrawn);
    hTest.draw();
    stop();
});

test("Modify asset src", 4, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if(testStep == 0){
            if( XML3DUnit.getPixelValue(glTest, 250, 150)[0] == 0)
                return;
            testStep++;
            self.doc.getElementById("mm2").src = "#asset2Alt";
        }
        else if(testStep == 1){
            if( XML3DUnit.getPixelValue(glTest, 69, 121)[3] != 0)
                return;
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 69, 121), [0,0,0,0], EPSILON,
                "Old Rectangle removed" );
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 69, 150), [255,127,255,255], EPSILON,
                "New Rectangle added" );
            start();
        }
    }
    xTest.addEventListener("framedrawn", onFrameDrawn);
    hTest.draw();
    stop();
});

test("Modify asset pick", 6, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if(testStep == 0){
            if( XML3DUnit.getPixelValue(glTest, 250, 150)[0] == 0)
                return;
            testStep++;
            self.doc.getElementById("mm4").pick = "mesh1";
        }
        else if(testStep == 1){
            if( XML3DUnit.getPixelValue(glTest, 434, 150)[3] != 0)
                return;
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 434, 150), [0,0,0,0], EPSILON,
                "mesh2 Rectangle removed" );
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 360, 150), [255,127,127,255], EPSILON,
                "mesh1 Rectangle added" );
            testStep++;
            self.doc.getElementById("mm4").pick = "";
        }
        else if(testStep == 2){
            if( XML3DUnit.getPixelValue(glTest, 360, 150)[3] != 0)
                return;
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 434, 150), [0,0,0,0], EPSILON,
                "mesh2 Rectangle still removed" );
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 360, 150), [0,0,0,0], EPSILON,
                "mesh1 Rectangle also removed" );
            start();
        }
    }
    xTest.addEventListener("framedrawn", onFrameDrawn);
    hTest.draw();
    stop();
});

test("External assets", 3, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if(testStep == 0){
            if( XML3DUnit.getPixelValue(glTest, 250, 150)[0] == 0)
                return;
            XML3DUnit.loadSceneTestImages(self.doc, "xml3dReference", "xml3dTest", function(refImage, testImage){
                QUnit.imageClose(refImage, testImage, 1, "Asset render matches");
                start();
            });
        }
    }
    self.doc.getElementById("mm1").src = "xml/assets.xml#asset1";
    self.doc.getElementById("mm2").src = "xml/assets.xml#asset2";
    self.doc.getElementById("mm3").src = "xml/assets.xml#asset3";
    window.setTimeout(function(){
        xTest.addEventListener("framedrawn", onFrameDrawn);
        hTest.draw();
    }, 100);

    stop();
});

module("Asset and Model", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/asset-classnames.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Static asset with classname pick filter", 3   , function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if(testStep == 0){
            if( XML3DUnit.getPixelValue(glTest, 178, 78)[0] == 0)
                return;
            XML3DUnit.loadSceneTestImages(self.doc, "xml3dReference", "xml3dTest", function(refImage, testImage){
                QUnit.imageEqual(refImage, testImage, "Asset render matches");
                start();
            });
        }
    }
    xTest.addEventListener("framedrawn", onFrameDrawn);
    hTest.draw();
    stop();
});

var NINE_PATCH_COORDS = [
    {x: 178, y: 226, color: [255,127,255,255], name: "top left"},
    {x: 257, y: 226, color: [255,127,255,255], name: "top center"},
    {x: 320, y: 226, color: [255,127,255,255], name: "top right"},
    {x: 178, y: 150, color: [0,0,255,255], name: "center left"},
    {x: 257, y: 150, color: [0,0,255,255], name: "center"},
    {x: 320, y: 150, color: [0,0,255,255], name: "center right"},
    {x: 178, y: 78, color: [255,127,127,255], name: "bottom left"},
    {x: 257, y: 78, color: [255,127,127,255], name: "bottom center"},
    {x: 320, y: 78, color: [255,127,127,255], name: "bottom right"}
];

function test9Patch(glTest, patches, pickFilter){
    var i = patches.length;
    while(i--){
        var coords = NINE_PATCH_COORDS[i];
        if(patches[i]){
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, coords.x, coords.y), coords.color, EPSILON,
                coords.name + " rectangle is visible for '" + pickFilter + "'" );
        }
        else{
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, coords.x, coords.y), [0,0,0,0], EPSILON,
                coords.name + " rectangle is invisible for '" + pickFilter + "'" );
        }
    }
}



test("Modification of classNamePickFilter", 47   , function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;

    var testStep = 0;
    function onFrameDrawn(){
        if(testStep == 0){
            if( XML3DUnit.getPixelValue(glTest, 178, 78)[0] == 0)
                return;
            if( XML3DUnit.getPixelValue(glTest, 247, 78)[3] > 0)
                return;

            test9Patch(glTest, [    1,0,0,
                                    1,0,0,
                                    1,0,0    ], ".left");
            self.doc.getElementById("mm1").pick = ".right";
            testStep++;
        }
        else if(testStep == 1){

            test9Patch(glTest, [    0,0,1,
                                    0,0,1,
                                    0,0,1    ], ".right");
            self.doc.getElementById("mm1").pick = ".left, .top";
            testStep++;
        }
        else if(testStep == 2){

            test9Patch(glTest, [    1,1,1,
                                    1,0,0,
                                    1,0,0    ], ".left, .top");
            self.doc.getElementById("mm1").pick = ".left.top, .right.bottom";
            testStep++;
        }
        else if(testStep == 3){

            test9Patch(glTest, [    1,0,0,
                                    0,0,0,
                                    0,0,1    ], ".left.top, .right.bottom");
            self.doc.getElementById("mm1").pick = ".left.top, .right.bottom, center";
            testStep++;
        }
        else if(testStep == 4){

            test9Patch(glTest, [    1,0,0,
                                    0,1,0,
                                    0,0,1    ],".left.top, .right.bottom, center");
            start();
        }
    }
    self.doc.getElementById("mm1").pick = ".left";
    xTest.addEventListener("framedrawn", onFrameDrawn);
    //hTest.draw();
    stop();
});



