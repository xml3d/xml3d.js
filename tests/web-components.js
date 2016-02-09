module("Web-Components", {

});

test("Simple square component", function() {
     stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/web-components.html");

    var test = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        // Workaround for Chrome bug https://bugs.webkit.org/show_bug.cgi?id=14563
        // computed style is incorrect the first time it's queried after removing and re-adding a node to the scene if this query happens
        // as part of the mutation event processing. This happens as part of the document.registerElement function that we overwrite in dom.js,
        // causing the returned transform style to be "none" during initialization of the x-square's GroupRenderAdapter.
        // Firefox does not show this behavior and instead returns the correct style.
        s.ownerDocument.querySelector("x-square").setAttribute("style", "transform: translate3d(-3px, 0, -10px)");
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),70,100);
        QUnit.closeArray(pick, [0, 255, 0, 255], PIXEL_EPSILON, "Component already in DOM at page load was rendered");

        var square = s.ownerDocument.createElement("x-square");
        var group = s.ownerDocument.getElementById("rootGroup");
        group.appendChild(square);
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),150,100);
        QUnit.closeArray(pick, [0, 255, 0, 255], PIXEL_EPSILON, "Javascript added component was rendered");

        var square = s.ownerDocument.querySelector("x-square");
        var color = s.ownerDocument.createElement("float3");
        color.setAttribute("name", "diffuseColor");
        color.textContent = "0 0 1";
        square.appendChild(color);
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),150,100);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Distributed node for material property diffuseColor");
    });



    test.fin(QUnit.start).done();

});

