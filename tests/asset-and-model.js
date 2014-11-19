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
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 324, 40), [255,127,255,255], PIXEL_EPSILON,
                "One instance has shader color replaced" );
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 124, 134), [0,255,0,255], PIXEL_EPSILON,
                "Other instance with overridden shader has color NOT replaced" );
            testStep++;
            self.doc.getElementById("outerSubData").shader = "";
        }
        else if(testStep == 2){
            if( XML3DUnit.getPixelValue(glTest, 124, 134)[0] != 255)
                return;
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 124, 134), [255,127,255,255], PIXEL_EPSILON,
                "Other instance has overriden shader removed and therefore updated color" );
            testStep++;
            self.doc.getElementById("outerSubData").shader = "#blueShader";
        }
        else if(testStep == 3){
            if( XML3DUnit.getPixelValue(glTest, 124, 134)[0] != 0)
                return;
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 124, 134), [0,0,255,255], PIXEL_EPSILON,
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
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 69, 121), [0,0,0,0], PIXEL_EPSILON,
                "Old Rectangle removed" );
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 69, 150), [255,127,255,255], PIXEL_EPSILON,
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
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 434, 150), [0,0,0,0], PIXEL_EPSILON,
                "mesh2 Rectangle removed" );
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 360, 150), [255,127,127,255], PIXEL_EPSILON,
                "mesh1 Rectangle added" );
            testStep++;
            self.doc.getElementById("mm4").pick = "";
        }
        else if(testStep == 2){
            if( XML3DUnit.getPixelValue(glTest, 360, 150)[3] != 0)
                return;
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 434, 150), [0,0,0,0], PIXEL_EPSILON,
                "mesh2 Rectangle still removed" );
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 360, 150), [0,0,0,0], PIXEL_EPSILON,
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
                QUnit.imageClose(refImage, testImage, PIXEL_EPSILON, "Asset render matches");
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
        loadDocument("scenes/asset-recursive.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Recursive external assets and data", 3, function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest);

    function onFrameDrawn(){
        if( XML3DUnit.getPixelValue(glTest, 250, 150)[0] == 0)
            return;
        QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 250, 150), [255,0,0,255], PIXEL_EPSILON, "Recursive external asset is rendered" );
        start();
    }
    stop();
    xTest.addEventListener("framedrawn", onFrameDrawn);
    onFrameDrawn();
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
                QUnit.imageClose(refImage, testImage, PIXEL_EPSILON, "Asset render matches");
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
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, coords.x, coords.y), coords.color, PIXEL_EPSILON,
                coords.name + " rectangle is visible for '" + pickFilter + "'" );
        }
        else{
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, coords.x, coords.y), [0,0,0,0], PIXEL_EPSILON,
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

module("Asset and Model", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/asset-nested.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

var NESTED_TESTS = [
    {id: "#mm1", pos: "center", desc: "Basic Instance of nested assets", checks:
        [{x: 251, y: 150, color: [127,127,127,255] },
         {x: 305, y: 150, color: [127,127,127,255] },
         {x: 296, y: 124, color: [0,0,0,0] }]
    },
    {id: "#mm2", pos: "top center", desc: "Overriding root data", checks:
        [{x: 251, y: 220, color: [255,127,0,255] },
        {x: 305, y: 220, color: [255,127,0,255] }]
    },
    {id: "#mm3", pos: "bottom center", desc: "Overriding root and sub asset data", checks:
        [{x: 251, y: 75, color: [127,127,255,255] },
        {x: 305, y: 75, color: [127,127,255,255] }]
    },
    {id: "#mm4", pos: "center left", desc: "Extending from #mm2, overriding root data", checks:
        [{x: 141, y: 150, color: [127,255,127,255] },
        {x: 194, y: 150, color: [127,255,127,255]}]
    },
    {id: "#mm5", pos: "top left", desc: "Extending from #mm3, added new asset", checks:
        [{x: 141, y: 220, color: [127,127,255,255] },
        {x: 194, y: 220, color: [127,127,255,255]},
        {x: 183, y: 247, color: [255,127,0,255]},
        {x: 188, y: 254, color: [0,0,0,0]}]
    },
    {id: "#mm6", pos: "bottom left", desc: "Extending from #mm2,adding new asset mesh within sub asset", checks:
        [{x: 141, y: 75, color: [255,127,0,255] },
        {x: 194, y: 75, color: [255,127,0,255] },
        {x: 181, y: 102, color: [255,127,0,255] },
        {x: 190, y: 107, color: [0,0,0,0] }]
    },
    {id: "#mm7", pos: "center right", desc: "Extending from #mm4, adding weird asset linking right into main sub asset via parent", checks:
        [{x: 360, y: 150, color: [127,255,127,255] },
        {x: 410, y: 150, color: [127,255,127,255]},
        {x: 401, y: 175, color: [127,255,127,255]},
        {x: 411, y: 183, color: [127,255,127,255]}]
    },
    {id: "#mm8", pos: "top right", desc: "Extending from #mm4, adding weird asset and extending main sub asset base entry", checks:
        [{x: 360, y: 220, color: [255,255,0,255] },
        {x: 410, y: 220, color: [255,255,0,255]},
        {x: 401, y: 246, color: [255,255,0,255]},
        {x: 411, y: 257, color: [255,255,0,255]}]
    },
    {id: "#mm9", pos: "bottom right", desc: "Extending from #mm3, adding a three level asset hierarchy with linking", checks:
        [{x: 360, y: 75, color: [127,127,255,255] },
        {x: 410, y: 75, color: [127,127,255,255]},
        {x: 401, y: 101, color: [127,127,255,255]},
        {x: 408, y: 108, color: [0,0,0,0]}]
    }
];


test("Nested Assets" , function() {
    var xTest = this.doc.getElementById("xml3dTest"),
        glTest = getContextForXml3DElement(xTest), hTest = getHandler(xTest);
    var self = this;
    for(var i = 0; i < NESTED_TESTS.length; ++i){
        var test = NESTED_TESTS[i];
        var checks= test.checks;
        for(var j = 0; j < checks.length; ++j){
            var check = checks[j];
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, check.x, check.y), check.color, PIXEL_EPSILON,
                test.id + " (" + test.pos + "): " + test.desc + " - check #" + (j+1)  );
        }
    }

});

