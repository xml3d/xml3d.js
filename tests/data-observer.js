//============================================================================
//--- XML3DDataObserver ---
//============================================================================

module("XML3DDataObserver tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.window = document.getElementById("xml3dframe").contentWindow;
            start();
        };
        loadDocument("scenes/xml3d-observer.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});


test("Observe data disconnected from scene graph", function() {

    ok(this.window.XML3DDataObserver, "XML3DDataObserver is defined");


    var self = this;

    var testNumber = 0;
    var callback = function(records, observer){
        ok(records.length == 1, "There is one record entry.");
        var result = records[0].result;

        testNumber++;
        if(testNumber == 1){
            ok(result.getValue("position"), "There is a position field.");
            ok(!result.getValue("normal"), "There is no normal field.");
            QUnit.closeArray(result.getValue("position"),
                new Float32Array([-1, -1, -10,    1, -1, -10,   -1, 1, -10,   1, 1, -10])
                , EPSILON, "Value of position matches expected data");

            self.doc.getElementById("singleWeight").textContent = "0.5";
        }
        if(testNumber == 2){
            QUnit.closeArray(result.getValue("position"),
                new Float32Array([-1.25, -1, -10,    1, -1, -10,   -1.5, 1, -10,   1, 1, -10])
                , EPSILON, "Value of position matches expected data");

            self.doc.getElementById("singleWeight").textContent = "1";
        }
        if(testNumber == 3){
            QUnit.closeArray(result.getValue("position"),
                new Float32Array([-1.5, -1, -10,    1, -1, -10,   -2, 1, -10,   1, 1, -10])
                , EPSILON, "Value of position matches expected data");

            observer.disconnect();
            self.doc.getElementById("singleWeight").textContent= "0";
            window.setTimeout(function(){
                ok(testNumber == 3, "Callback was not called after observer was disconnected");
                start();
            }, 200);
        }
    };

    var observer = new this.window.XML3DDataObserver(callback);
    observer.observe(this.doc.getElementById("morphSingle"), {names: "position" });


    this.doc.getElementById("singleWeight").textContent = "0";

    stop();
});

test("Observe data connected to scene graph", function() {
    var xTest = this.doc.getElementById("myXml3d"),
        glTest = getContextForXml3DElement(xTest);
    var self = this;

    var testNumber = 0;
    var checkRendering = false;
    var callback = function(records, observer){
        ok(records.length == 1, "There is one record entry.");
        var result = records[0].result;

        testNumber++;
        if(testNumber == 1){
            ok(result.getValue("position"), "There is a position field.");
            ok(!result.getValue("normal"), "There is no normal field.");

            QUnit.closeArray(result.getValue("position"),
                new Float32Array([-1.5, -1, -10,    1.5, -1, -10,   -2, 1, -10,   2, 1, -10])
                , EPSILON, "Value of position matches expected data");

            self.doc.getElementById("meshGroup").material = "#pink";
            checkRendering = true;
        }
    };

    function onFrameDrawn(){
        if(checkRendering){
            checkRendering = false;
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, 200, 150),
                [255,0,255,255], EPSILON, "Rendering right after observer callback uses modified material");
            start();
        }
    }

    var observer = new this.window.XML3DDataObserver(callback);
    observer.observe( this.doc.getElementById("morphDouble"), {names: "position" } );
    xTest.addEventListener("framedrawn", onFrameDrawn);

    this.doc.getElementById("doubleWeight1").textContent = "1";
    stop();
});
