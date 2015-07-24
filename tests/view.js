module("View", {

});

test("Change view", function() {
     stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/view.html");

    var changeFunction = function(f, args) {
        return function(scene) {
            scene.ownerDocument.defaultView[f].apply(null, args);
            return scene;
        }
    };

    var initialView = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),50,50);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "transparent");
        pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),250,130);
        QUnit.closeArray(pick, [159, 0, 0, 255], PIXEL_EPSILON, "red");
        return s;
    });

    var frontView = initialView.then(changeFunction("changeView", ["front"])).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),250,130);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "blue");
        return s;
    });

    var rearView = frontView.then(changeFunction("changeView", ["rear"])).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),250,130);
        QUnit.closeArray(pick, [159, 0, 0, 255], PIXEL_EPSILON, "read");
        return s;
    });




    rearView.fin(QUnit.start).done();



});
