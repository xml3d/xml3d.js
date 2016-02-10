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
        return s;
    });

    test.fin(QUnit.start).done();
});

test("Distributed nodes", function() {
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

        var square = s.ownerDocument.querySelector("x-square");
        var color = s.ownerDocument.createElement("float3");
        color.setAttribute("name", "diffuseColor");
        color.textContent = "0 0 1";
        square.appendChild(color);
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),70,100);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Distributed node for material property diffuseColor, mesh is now blue");

        var square = s.ownerDocument.querySelector("x-square");
        var pos = s.ownerDocument.createElement("float3");
        pos.setAttribute("name", "position");
        pos.textContent = "3.0 -1.0 1.0 5.0 -1.0 1.0 5.0 1.0 1.0 3.0 1.0 1.0";
        square.appendChild(pos);

        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),170,100);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Distributed node for float3 'position', mesh moves to the right");

        var square = s.ownerDocument.querySelector("x-square");
        var data = s.ownerDocument.createElement("data");
        data.setAttribute("class", "meshdata");
        data.innerHTML = "<int name='index'>0 2 1 0 3 2</int>"+
                           "<float3 name='position'>3.0 1.0 1.0 5.0 1.0 1.0 5.0 3.0 1.0 3.0 3.0 1.0</float3>"+
                           "<float3 name='normal'>0.0 0.0 -1.0 0.0 0.0 -1.0 0.0 0.0 -1.0 0.0 0.0 -1.0</float3>"+
                            "<float2 name='texcoord'>0.0 0.0 1.0 0.0 1.0 1.0 0.0 1.0</float2>";
        square.appendChild(data);
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),170,170);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Distributed node for data replacement, mesh moves up");
    });

    test.fin(QUnit.start).done();
});