module("Primitives", {
    setup : function() {
        var that = this;
        stop();
        Q.fcall(promiseIFrameLoaded, "scenes/primitives.html?xml3d-loglevel=debug").then(function (doc) {
            that.doc = doc;
            ok(true, "Scene loaded");
        }).fin(QUnit.start).done();
    },
    teardown : function() {
    }
});

test("Triangle Strips", 4, function () {
    var self = this;
    var xml3dReference = self.doc.getElementById("xml3d-triangles");
    var xml3dTest = self.doc.getElementById("xml3d-triangle-strips");

    stop();
    promiseSceneRendered(xml3dReference).then(promiseOneSceneCompleteAndRendered, xml3dTest).then(function () {
        QUnit.closeArray(XML3DUnit.readScenePixels(xml3dTest),XML3DUnit.readScenePixels(xml3dReference), PIXEL_EPSILON, "Rendering matches with reference", true);
        var expectedBox = self.doc.getElementById("mesh-triangles").getLocalBoundingBox();
        var actualBox = self.doc.getElementById("mesh-triangle-strips").getLocalBoundingBox();
        QUnit.closeArray(actualBox, expectedBox, EPSILON, "Bounding box of matches with triangle representation");
    }).fin(QUnit.start).done();


});

