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

    QUnit.deepEqual(this.doc.getElementById("baseData").getOutputNames().sort(),
        ["index", "normal", "position"], "#baseData has correct output names" );
    QUnit.deepEqual(this.doc.getElementById("poseData").getOutputNames().sort(),
        ["posAdd1", "posAdd2"], "#poseData has correct output names" );
    QUnit.deepEqual(this.doc.getElementById("indirectPoseData").getOutputNames().sort(),
        ["posAdd1", "posAdd2"], "#indirectPoseData has correct output names" );
    QUnit.deepEqual(this.doc.getElementById("combinedData").getOutputNames().sort(),
        ["index", "normal", "posAdd1", "posAdd2", "position"], "#combinedData has correct output names" );
    QUnit.deepEqual(this.doc.getElementById("morphedData").getOutputNames().sort(),
        ["index", "normal", "posAdd1", "posAdd2", "position", "weight1", "weight2"],
        "#combinedData has correct output names" );

    QUnit.deepEqual(this.doc.getElementById("unusedData").getOutputNames().sort(),
        ["A", "B"], EPSILON, "#unusedData has correct output names" );
    QUnit.deepEqual(this.doc.getElementById("unusedMorphedData").getOutputNames().sort(),
        ["index", "normal", "posAdd1", "posAdd2", "position", "weight1", "weight2"],
        EPSILON, "#unusedMorphedData has correct output names" );

    ok(this.doc.getElementById("pink").getOutputNames, "<shader> has getOutputNames method");

    this.doc.getElementById("swapReference").src = "#unusedSubData2";

    QUnit.deepEqual(this.doc.getElementById("unusedData").getOutputNames().sort(),
        ["A", "C"], "#unusedData has correct output names after modification" );
});

test("Access Results", function() {

    var result = this.doc.getElementById("baseData").getResult();
    ok(result instanceof this.window.XML3DDataResult, "Result of #baseData is of type XML3DDataResult");
    QUnit.deepEqual(result.getNames().sort(),
        ["index", "normal", "position"], "result of #baseData has correct output names" );

    result = this.doc.getElementById("baseData").getResult(["index", "position"]);

    QUnit.deepEqual(result.getNames().sort(),
        ["index", "position"], "filtered result of #baseData has correct output names" );

    equal(result.getType("index"), XML3DDataResult.INT, "'index' field of #baseData has correct type" );
    QUnit.closeArray(result.getValue("index"),
        new Int32Array([0,1,2,1,2,3]), EPSILON, "'index' field of #baseData has correct value"  );

    equal(result.getType("position"), XML3DDataResult.FLOAT3, "'position' field of #baseData has correct type" );
    QUnit.closeArray(result.getValue("position"),
        new Float32Array([-1, -1, -10,  1, -1, -10,  -1, 1, -10,  1, 1, -10]), EPSILON,
        "'position' field of #baseData has correct value"  );

    equal(result.getValue("normal"), null, "'normal' field value of #baseData result is null (because not requested)" );
    equal(result.getType("normal"), null, "'normal' field type of #baseData result is null (because not requested)" );


    result = this.doc.getElementById("morphedData").getResult(["position"]);

    QUnit.closeArray(result.getValue("position"),
        new Float32Array([-1, -1, -10, 1.5, -1, -10, -1, 1, -10, 2, 1, -10]), EPSILON,
        "'position' field of #morphedData has correct value"  );

    this.doc.getElementById("doubleWeight1").firstChild.nodeValue = "1";


    result = this.doc.getElementById("morphedData").getResult(["position"]);
    QUnit.closeArray(result.getValue("position"),
        new Float32Array([-1.5, -1, -10, 1.5, -1, -10, -2, 1, -10, 2, 1, -10]), EPSILON,
        "'position' field of #morphedData has correct value after change"  );


    result = this.doc.getElementById("unusedData").getResult();
    QUnit.deepEqual(result.getNames().sort(),
        ["A", "B"], "result of #unusedData has correct output names" );


    result = this.doc.getElementById("unusedMorphedData").getResult(["position"]);

    QUnit.closeArray(result.getValue("position"),
        new Float32Array([-1, -1, -10, 1.5, -1, -10, -1, 1, -10, 2, 1, -10]), EPSILON,
        "'position' field of #unusedMorphedData has correct value"  );

    this.doc.getElementById("doubleWeight1U").firstChild.nodeValue = "1";

    result = this.doc.getElementById("unusedMorphedData").getResult(["position"]);
    QUnit.closeArray(result.getValue("position"),
        new Float32Array([-1.5, -1, -10, 1.5, -1, -10, -2, 1, -10, 2, 1, -10]), EPSILON,
        "'position' field of #unusedMorphedData has correct value after change"  );

});


test("Access Output ChannelInfo", function() {
    var channelInfo = this.doc.getElementById("baseData").getOutputChannelInfo("position");
    ok(channelInfo instanceof this.window.XML3DDataChannelInfo, "Channel info is of type XML3DDataChannelInfo");

    equal(channelInfo.type, XML3DDataResult.FLOAT3, "Type of 'position' channel info is float3");
    equal(channelInfo.origin, XML3DDataChannelInfo.ORIGIN_CHILD, "Origin of 'position' channel info is ORIGIN_CHILD");
    equal(channelInfo.originalName, "position", "Original name of 'position' channel info is 'position'");
    equal(channelInfo.seqLength, 1, "Sequence length of 'position' channel info is 1");
    equal(channelInfo.seqMinKey, 0, "Minimum Key of 'position' channel info is 0");
    equal(channelInfo.seqMaxKey, 0, "Maximum Key of 'position' channel info is 0");

    channelInfo = this.doc.getElementById("simpleSequence").getOutputChannelInfo("A");
    equal(channelInfo.seqLength, 3, "Sequence length of 'A' channel info is 3");
    equal(channelInfo.seqMinKey, 0.4, "Minimum Key of 'A' channel info is 0.4");
    equal(channelInfo.seqMaxKey, 3.5, "Maximum Key of 'A' channel info is 3.5");

    channelInfo = this.doc.getElementById("simpleRenaming").getOutputChannelInfo("pos");
    equal(channelInfo.origin, XML3DDataChannelInfo.ORIGIN_CHILD, "Origin of 'pos' channel info is ORIGIN_CHILD");
    equal(channelInfo.originalName, "position", "Original name of 'pos' channel info is 'position'");

    channelInfo = this.doc.getElementById("simpleRenaming").getOutputChannelInfo("index");
    equal(channelInfo.type, XML3DDataResult.INT, "Type of 'index' channel info is int");
    equal(channelInfo.originalName, "index", "Original name of 'index' channel info is 'index'");

    channelInfo = this.doc.getElementById("simpleCompute").getOutputChannelInfo("position");
    equal(channelInfo.origin, XML3DDataChannelInfo.ORIGIN_COMPUTE, "Origin of 'position' channel info is ORIGIN_COMPUTE");
    channelInfo = this.doc.getElementById("simpleCompute").getOutputChannelInfo("posAdd1");
    equal(channelInfo.origin, XML3DDataChannelInfo.ORIGIN_CHILD, "Origin of 'posAdd1' channel info is ORIGIN_CHILD");

    channelInfo = this.doc.getElementById("simpleProtoInstance").getOutputChannelInfo("position");
    equal(channelInfo.origin, XML3DDataChannelInfo.ORIGIN_PROTO, "Origin of 'position' channel info is ORIGIN_PROTO");
    channelInfo = this.doc.getElementById("simpleProtoInstanceCompute").getOutputChannelInfo("posAdd");
    equal(channelInfo.origin, XML3DDataChannelInfo.ORIGIN_COMPUTE, "Origin of 'posAdd' channel info is ORIGIN_COMPUTE");
    channelInfo = this.doc.getElementById("simpleProtoInstance").getOutputChannelInfo("posAdd1");
    equal(channelInfo.origin, XML3DDataChannelInfo.ORIGIN_CHILD, "Origin of 'posAdd1' channel info is ORIGIN_CHILD");

});

