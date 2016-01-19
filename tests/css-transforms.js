module("CSS Transformations", {});

test("Static Transforms", 2, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/css-transforms.html");

    var test = frameLoaded.then(function (doc) {
        XML3DUnit.loadSceneTestImages(doc, "xml3dReference", "xml3dTest", function (refImage, testImage) {
            QUnit.imageEqual(refImage, testImage, "CSS-Tranform Render matches");
        });
    });
    test.fin(QUnit.start).done();
});

test("Change transform", 4, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/css-transforms.html");
    var group;

    var test = frameLoaded.then(function (doc) {
        group = doc.getElementById("rootGroup");
        group.style.display = 'inherit';
        return doc.getElementById("xml3dTest");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 200, 100);
        deepEqual(actual, [255, 0, 0, 255], "Original transform is correct");
        group.setAttribute("style", "transform: translate3d(2px,0px,-10px)");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 300, 100);
        deepEqual(actual, [255, 0, 0, 255], "Group was moved to the right");
        s.ownerDocument.getElementById("mesh").setAttribute("style", "transform: translate3d(0px, 2px, 0px)");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 30, 150);
        deepEqual(actual, [255, 0, 0, 255], "Mesh was moved up");
        return s;
    });
    test.fin(QUnit.start).done();

});

test("matrix3d with e notation", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/css-transforms.html");
    var group;

    var test = frameLoaded.then(function(doc) {
        group = doc.getElementById("rootGroup");
        group.setAttribute("style", "transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 20e-1, 0, -0.1e2, 1)");
        return doc.getElementById("xml3dTest");
    }).then(promiseSceneRendered).then(function(s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 300, 100);
        deepEqual(actual, [255, 0, 0, 255], "Group was moved to the right");
    });
    test.fin(QUnit.start).done();
});

test("CSS transitions", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/css-transforms.html");
    var group;

    var test = frameLoaded.then(function(doc) {
        group = doc.getElementById("secondGroup");
        group.setAttribute("style", "transform: translate3d(0,0,-10px);");
        return doc.getElementById("xml3dTest");
    }).then(promiseSceneRendered).then(function(s) {
        group.setAttribute("style", "transform: translate3d(-3px, 0, -10px); transition: transform 100ms linear;");
        return s;
    }).then(function(s) {
        return new Promise(function(resolve, reject) {
            setTimeout(resolve.bind(resolve, s), 50);
        });
    }).then(function(s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 129, 110);
        deepEqual(actual, [255, 0, 0, 255], "Group was animated to new position");
    });
    test.fin(QUnit.start).done();
});
