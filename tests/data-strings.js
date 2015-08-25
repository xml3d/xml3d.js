module("Xflow strings", {});

test("Change mesh type with new data element", function () {
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
        deepEqual(actual, [0, 0, 0, 0], "Lines type from another local data element");

        s.ownerDocument.getElementById("meshTypeTest1").setAttribute("type", "xml/data.xml#meshTypeTriangles");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 20, 150);
        deepEqual(actual, [255, 255, 0, 255], "Triangle type from external data element");

        return s;
    });
    test.fin(QUnit.start).done();
});

test("Change mesh type in data element", function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/data-strings.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("meshTypeTest1").setAttribute("type", "#meshTypeDynamic");
        return doc.getElementById("xml3dElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 20, 150);
        deepEqual(actual, [255, 255, 0, 255], "Initial state is correct");

        s.ownerDocument.getElementById("meshTypeChangeTarget").textContent = "lines";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 20, 150);
        deepEqual(actual, [0, 0, 0, 0], "Mesh responded to change in type field");
        return s;
    });
    test.fin(QUnit.start).done();
});

test("Change mesh type through xflow operator", function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/data-strings.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("meshTypeTest1").setAttribute("type", "#meshTypeCompute");
        return doc.getElementById("xml3dElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 20, 150);
        deepEqual(actual, [255, 255, 0, 255], "Initial operator returned triangles type");

        s.ownerDocument.getElementById("meshTypeSelector").textContent = "1";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 20, 150);
        deepEqual(actual, [0, 0, 0, 0], "Changing operator input caused type lines to be used");
        return s;
    });
    test.fin(QUnit.start).done();
});

test("Change texture wrap mode through xflow operator", function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/data-strings.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("textureWrapTest1").setAttribute("style", "display: block");
        doc.getElementById("meshTypeTest1").setAttribute("style", "display: none");
        doc.getElementById("textureElement").setAttribute("wrap", "#textureWrapCompute");
        return doc.getElementById("xml3dElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 20, 130);
        deepEqual(actual, [0, 255, 0, 255], "Initial operator returned 'repeat clamp'");

        s.ownerDocument.getElementById("wrapSelector").textContent = "1";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 20, 130);
        deepEqual(actual, [0, 0, 255, 255], "Changing operator input caused wrap 'repeat'");
        return s;
    });
    test.fin(QUnit.start).done();
});