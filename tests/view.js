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


test("urn:xml3d:view:projection", 5, function() {
     stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/view.html");

    var changeFunction = function(f, args) {
        return function(scene) {
            scene.ownerDocument.defaultView[f].apply(null, args);
            return scene;
        }
    };

    var defaultView = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var view = s.querySelector(s.view);
        QUnit.closeMatrix(view.getProjectionMatrix(), XML3D.Mat4.perspective(45 / 180 * Math.PI, 500/ 300, 8.95, 11.05), EPSILON);
        return s;
    });

    var customFOVVertical = defaultView.then(changeFunction("changeView", ["top"])).then(promiseSceneRendered).then(function (s) {
        var view = s.querySelector(s.view);
        QUnit.closeMatrix(view.getProjectionMatrix(), XML3D.Mat4.perspective(0.2, 500 / 300, 8.95, 11.05), EPSILON);
        return s;
    });

    var customFOVHorizontal = customFOVVertical.then(changeFunction("changeView", ["bottom"])).then(promiseSceneRendered).then(function (s) {
        var view = s.querySelector(s.view);

        var frustum = new XML3DTestLib.Frustum.Frustum(8.95, 11.05, 0.5, 0, 500 / 300);
        var expected = new XML3D.Mat4();
        frustum.getProjectionMatrix(expected);
        QUnit.closeMatrix(view.getProjectionMatrix(), expected, EPSILON);
        return s;
    });

    var customNearFar = customFOVHorizontal.then(changeFunction("changeView", ["left"])).then(promiseSceneRendered).then(function (s) {
        var view = s.querySelector(s.view);

        var frustum = new XML3DTestLib.Frustum.Frustum(0.2, 20, 0, 0.2, 500 / 300);
        var expected = new XML3D.Mat4();
        frustum.getProjectionMatrix(expected);
        QUnit.closeMatrix(view.getProjectionMatrix(), expected, EPSILON, "custom near/far plane");
        return s;
    });

    customNearFar.fin(QUnit.start).done();
});

test("urn:xml3d:view:projective", 3, function() {
     stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/view.html");

    var changeFunction = function(f, args) {
        return function(scene) {
            scene.ownerDocument.defaultView[f].apply(null, args);
            return scene;
        }
    };

    var defaultProjective = frameLoaded.then(function(doc) {return doc.querySelector("xml3d") })
        .then(changeFunction("changeView", ["left_projective"]))
        .then(promiseSceneRendered).then(function (s) {
        var view = s.querySelector(s.view);
        QUnit.closeMatrix(view.getProjectionMatrix(), XML3D.Mat4.perspective((45 * Math.PI / 180), 1, 0.001, 10000), EPSILON, "Default matrix");
        return s;
    });

    var customProjective = defaultProjective.then(changeFunction("changeView", ["right_projective"]))
        .then(promiseSceneRendered).then(function (s) {
        var view = s.querySelector(s.view);
        var reference = s.querySelector("#view_right");
        QUnit.closeMatrix(view.getProjectionMatrix(), reference.getProjectionMatrix(), EPSILON, "Custom projective matrix");
        return s;
    });

    customProjective.fin(QUnit.start).done();
});
