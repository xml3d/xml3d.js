module("Data API tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.window = document.getElementById("xml3dframe").contentWindow;
            start();
        };
        loadDocument("scenes/data-api.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Access Output Names", function() {

    QUnit.closeArray(this.doc.getElementById("baseData").getOutputNames().sort(),
        ["index", "normal", "position"], EPSILON, "#baseData has correct output names" );
    QUnit.closeArray(this.doc.getElementById("poseData").getOutputNames().sort(),
        ["posAdd1", "posAdd2"], EPSILON, "#poseData has correct output names" );
    QUnit.closeArray(this.doc.getElementById("indirectPoseData").getOutputNames().sort(),
        ["posAdd1", "posAdd2"], EPSILON, "#indirectPoseData has correct output names" );
    QUnit.closeArray(this.doc.getElementById("combinedData").getOutputNames().sort(),
        ["index", "normal", "posAdd1", "posAdd2", "position"], EPSILON, "#combinedData has correct output names" );
    QUnit.closeArray(this.doc.getElementById("morphedData").getOutputNames().sort(),
        ["index", "normal", "posAdd1", "posAdd2", "position", "weight1", "weight2"],
        EPSILON, "#combinedData has correct output names" );

    QUnit.closeArray(this.doc.getElementById("unusedData").getOutputNames().sort(),
        ["A", "B"], EPSILON, "#unusedData has correct output names" );
    QUnit.closeArray(this.doc.getElementById("unusedMorphedData").getOutputNames().sort(),
        ["index", "normal", "posAdd1", "posAdd2", "position", "weight1", "weight2"],
        EPSILON, "#unusedMorphedData has correct output names" );

    ok(!this.doc.getElementById("pink").getOutputNames, "<shader> doesn't have getOutputNames method");

    this.doc.getElementById("swapReference").src = "#unusedSubData2";

    QUnit.closeArray(this.doc.getElementById("unusedData").getOutputNames().sort(),
        ["A", "C"], EPSILON, "#unusedData has correct output names after modification" );
});

test("Access Results", function() {

    var result = this.doc.getElementById("baseData").getResult();
    ok(result instanceof this.window.XML3DDataResult, "Result of #baseData is of type XML3DDataResult");
    QUnit.closeArray(result.getNames().sort(),
        ["index", "normal", "position"], EPSILON, "result of #baseData has correct output names" );

    result = this.doc.getElementById("baseData").getResult(["index", "position"]);

    QUnit.closeArray(result.getNames().sort(),
        ["index", "position"], EPSILON, "filtered result of #baseData has correct output names" );

    ok(result.get("index") instanceof this.window.XML3DDataEntry, "Entry for 'index' is of type XML3DDataEntry" );
    equal(result.get("index").type, XML3DDataEntry.INT, "'index' field of #baseData has correct type" );
    QUnit.closeArray(result.get("index").value,
        new Int32Array([0,1,2,1,2,3]), EPSILON, "'index' field of #baseData has correct value"  );

    equal(result.get("position").type, XML3DDataEntry.FLOAT3, "'position' field of #baseData has correct type" );
    QUnit.closeArray(result.get("position").value,
        new Float32Array([-1, -1, -10,  1, -1, -10,  -1, 1, -10,  1, 1, -10]), EPSILON,
        "'position' field of #baseData has correct value"  );

    equal(result.get("normal"), null, "'normal' field of #baseData result is null (because not requested)" );


    result = this.doc.getElementById("morphedData").getResult(["position"]);

    QUnit.closeArray(result.get("position").value,
        new Float32Array([-1, -1, -10, 1.5, -1, -10, -1, 1, -10, 2, 1, -10]), EPSILON,
        "'position' field of #morphedData has correct value"  );

    this.doc.getElementById("doubleWeight1").firstChild.nodeValue = "1";


    result = this.doc.getElementById("morphedData").getResult(["position"]);
    QUnit.closeArray(result.get("position").value,
        new Float32Array([-1.5, -1, -10, 1.5, -1, -10, -2, 1, -10, 2, 1, -10]), EPSILON,
        "'position' field of #morphedData has correct value after change"  );


    result = this.doc.getElementById("unusedData").getResult();
    QUnit.closeArray(result.getNames().sort(),
        ["A", "B"], EPSILON, "result of #unusedData has correct output names" );


    result = this.doc.getElementById("unusedMorphedData").getResult(["position"]);

    QUnit.closeArray(result.get("position").value,
        new Float32Array([-1, -1, -10, 1.5, -1, -10, -1, 1, -10, 2, 1, -10]), EPSILON,
        "'position' field of #unusedMorphedData has correct value"  );

    this.doc.getElementById("doubleWeight1U").firstChild.nodeValue = "1";

    result = this.doc.getElementById("unusedMorphedData").getResult(["position"]);
    QUnit.closeArray(result.get("position").value,
        new Float32Array([-1.5, -1, -10, 1.5, -1, -10, -2, 1, -10, 2, 1, -10]), EPSILON,
        "'position' field of #unusedMorphedData has correct value after change"  );

});

