module("Xflow Bugs", {});

test("Check cannot read property channeling of undefined", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/xflow_caching.html");
    frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function(scene) {
        ok(!scene.ownerDocument.defaultView.forceTestFail);
        return scene;

    }).fin(QUnit.start).done();
});

