module("Web-Components", {

});

test("Simple square component", function() {
     stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/web-components.html");

    var test = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var square = s.ownerDocument.createElement("x-square");
        var group = s.ownerDocument.getElementById("rootGroup");
        group.appendChild(square);
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),150,100);
        QUnit.closeArray(pick, [0, 255, 0, 255], PIXEL_EPSILON, "Green square component was rendered");
    });


    test.fin(QUnit.start).done();

});

