module("Xflow strings", {});

test("Change mesh type through xflow", function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/data-strings.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("meshTypeTest1").setAttribute("type", "#meshTypeTristrips");
        return doc.getElementById("xml3dElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 20, 150);
        deepEqual(actual, [255, 255, 0, 255], "Tristrips mesh type from local data element");

        s.ownerDocument.getElementById("meshTypeTest1").setAttribute("type", "#meshTypeLines");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 20, 150);
        deepEqual(actual, [0, 0, 0, 255], "Lines type from another local data element");

        s.ownerDocument.getElementById("meshTypeTest1").setAttribute("type", "xml/data.xml#meshTypeTriangles");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 20, 150);
        deepEqual(actual, [255, 255, 0, 255], "Triangle type from external data element");

        return s;
    });
    test.fin(QUnit.start).done();
});
