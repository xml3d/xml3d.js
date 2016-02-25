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
        s.ownerDocument.querySelector("x-square").setAttribute("style", "transform: translate3d(-3px, 0, 0)");
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
        s.ownerDocument.querySelector("x-square").setAttribute("style", "transform: translate3d(-3px, 0, 0)");
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

test("Cube asset component", function() {
    stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/web-components.html");

    var test = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var cube = s.ownerDocument.createElement("x-cube");
        var group = s.ownerDocument.getElementById("rootGroup");
        group.appendChild(cube);

        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),150,100);
        QUnit.closeArray(pick, [255, 0, 255, 255], PIXEL_EPSILON, "Cube rendered with the correct material");

        var cube = s.ownerDocument.querySelector("x-cube");
        var trans = s.ownerDocument.createElement("float3");
        trans.setAttribute("class", "cube-translation");
        trans.setAttribute("name", "translation");
        trans.textContent = "2 0 0";
        cube.appendChild(trans);

        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),215,100);
        QUnit.closeArray(pick, [255, 0, 255, 255], PIXEL_EPSILON, "Cube moved in response to distributed node for translation");

        var t = s.ownerDocument.querySelector("float3.cube-translation");
        t.textContent = "-2 0 0";
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),70,100);
        QUnit.closeArray(pick, [255, 0, 255, 255], PIXEL_EPSILON, "Cube moved in response to translation change");
    });

    test.fin(QUnit.start).done();
});

test("Add/remove multiple mesh component", function() {
    stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/web-components.html");

    var test = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var cube = s.ownerDocument.createElement("x-triplecube");
        var group = s.ownerDocument.getElementById("rootGroup");
        group.appendChild(cube);

        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),150,100);
        QUnit.closeArray(pick, [255, 0, 255, 255], PIXEL_EPSILON, "Middle cube rendered correctly");
        pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),270,100);
        QUnit.closeArray(pick, [255, 0, 255, 255], PIXEL_EPSILON, "Right cube rendered correctly");

        var comp = s.ownerDocument.querySelector("x-triplecube");
        comp.parentElement.removeChild(comp);

        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),270,100);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Right cube was removed");

        pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),150,100);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Middle cube was removed");
    });

    test.fin(QUnit.start).done();
});

test("Add divs to scene graph", function() {
    stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/web-components.html");

    var test = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var cube = s.ownerDocument.createElement("x-triplecube");
        var group = s.ownerDocument.getElementById("rootGroup");
        var div = s.ownerDocument.createElement("div");
        div.setAttribute("id", "scene_div");
        group.appendChild(div);

        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var div = s.ownerDocument.querySelector("#scene_div");
        QUnit.ok(div.getWorldMatrix && div.getWorldBoundingBox, "Div was configured as a group element");

        var wm = div.getWorldMatrix();
        var pwm = div.parentElement.getWorldMatrix();
        QUnit.closeMatrix(wm, pwm, EPSILON, "Div world matrix matches parent's world matrix");

        var mesh = s.ownerDocument.createElement("mesh");
        mesh.setAttribute("src", "#sdata");
        div.appendChild(mesh);

        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),150,100);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Mesh inside div was rendered");

        s.ownerDocument.querySelector("#scene_div").setAttribute("style", "transform: translate3d(4px, 0, 0)");
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),270,100);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Changing div's style transform moved the mesh");

        return s;
    });

    test.fin(QUnit.start).done();
});

test("Transform component", function() {
    stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/web-components.html");

    var test = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var square = s.ownerDocument.querySelector("x-square");
        square.removeAttribute("style");

        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),150,100);
        QUnit.closeArray(pick, [0, 255, 0, 255], PIXEL_EPSILON, "Square component has no transformation");

        var trans = s.ownerDocument.createElement("x-test-transform");
        trans.setAttribute("id", "testTransform");
        s.appendChild(trans);

        var square = s.ownerDocument.querySelector("x-square");
        square.setAttribute("transform", "#testTransform");

        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),250,100);
        QUnit.closeArray(pick, [0, 255, 0, 255], PIXEL_EPSILON, "Cube moved in response to transform component");

        var trans = s.ownerDocument.querySelector("x-test-transform");
        var to = s.ownerDocument.createElement("float3");
        to.setAttribute("name", "translation");
        to.textContent = "-4 0 0";
        trans.appendChild(to);
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),40,100);
        QUnit.closeArray(pick, [0, 255, 0, 255], PIXEL_EPSILON, "Cube moved in response to translation override");

        return s;
    });

    test.fin(QUnit.start).done();
});
