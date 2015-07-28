module("View", {

});

test("Change view", 5, function() {
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


test("Projection Matrix (default)", 4, function() {
     stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/view.html");

    var changeFunction = function(f, args) {
        return function(scene) {
            scene.ownerDocument.defaultView[f].apply(null, args);
            return scene;
        }
    };



    var defaultView = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var view = s.querySelector(s.activeView);
        QUnit.closeMatrix(view.getProjectionMatrix(), XML3D.Mat4.perspective(45 / 180 * Math.PI, 500/ 300, 8.95, 11.05), EPSILON);
        return s;
    });

    var customFOVVertical = defaultView.then(changeFunction("changeView", ["top"])).then(promiseSceneRendered).then(function (s) {
        var view = s.querySelector(s.activeView);
        QUnit.closeMatrix(view.getProjectionMatrix(), XML3D.Mat4.perspective(0.2, 500 / 300, 8.95, 11.05), EPSILON);
        return s;
    });

    var customFOVHorizontal = customFOVVertical.then(changeFunction("changeView", ["bottom"])).then(promiseSceneRendered).then(function (s) {
        var view = s.querySelector(s.activeView);

        var frustum = new XML3DTestLib.Frustum.Frustum(8.95, 11.05, 0.5, 0, 500 / 300);
        var expected = new XML3D.Mat4();
        frustum.getProjectionMatrix(expected);
        QUnit.closeMatrix(view.getProjectionMatrix(), expected, EPSILON);
        return s;
    });



    customFOVHorizontal.fin(QUnit.start).done();

});
