module("Lights", {});

test("All lights visibility off", 3, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering03.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("dirlight").style.display = 'none';
        doc.getElementById("pointlight").style.display = 'none';

        doc.getElementById("diffuseShadedGroup").style.display = 'inherit';

        return doc.querySelector("#xml3DElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [0, 255, 0, 255], "Green emissive diffuse object");
        return s;
    }).then(function (s) {
        s.ownerDocument.getElementById("diffuseShadedGroup").style.display = 'none';
        s.ownerDocument.getElementById("phongShadedGroup").style.display = 'inherit';
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [0, 0, 0, 255], "Black phong object");
    });
    test.fin(QUnit.start).done();
});

test("Blue directional light", 3, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering03.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("dirlight").style.display = 'inherit';
        doc.getElementById("pointlight").style.display = 'none';

        doc.getElementById("diffuseShadedGroup").style.display = 'inherit';

        return doc.querySelector("#xml3DElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [0, 255, 255, 255], "Diffuse object with green emissive");

        return s;
    }).then(function (s) {
        s.ownerDocument.getElementById("diffuseShadedGroup").style.display = 'none';
        s.ownerDocument.getElementById("phongShadedGroup").style.display = 'inherit';
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [0, 0, 255, 255], "Phong object is lit blue");
    });
    test.fin(QUnit.start).done();

});

test("A red point light", 3, function() {
     stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering03.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("dirlight").style.display = 'none';
        doc.getElementById("pointlight").style.display = 'inherit';

        doc.getElementById("diffuseShadedGroup").style.display = 'inherit';

        return doc.querySelector("#xml3DElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [255,255,0,255], "Diffuse object with green emissive = yellow");

        return s;
    }).then(function (s) {
        s.ownerDocument.getElementById("diffuseShadedGroup").style.display = 'none';
        s.ownerDocument.getElementById("phongShadedGroup").style.display = 'inherit';
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [255,0,0,255], "Phong object is lit red");
    });
    test.fin(QUnit.start).done();
});

test("Red point light, blue dir light", 3, function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering03.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("dirlight").style.display = 'inherit';
        doc.getElementById("pointlight").style.display = 'inherit';
        doc.getElementById("diffuseShadedGroup").style.display = 'inherit';

        return doc.querySelector("#xml3DElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [255,255,255,255], "Diffuse object with green emissive");
        return s;
    }).then(function (s) {
        s.ownerDocument.getElementById("diffuseShadedGroup").style.display = 'none';
        s.ownerDocument.getElementById("phongShadedGroup").style.display = 'inherit';
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [255,0,255,255], "Phong object is lit purple");
    });
    test.fin(QUnit.start).done();
});

test("Change directional light direction", 4, function() {
   stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering03.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("dirlight").style.display = 'inherit';
        doc.getElementById("pointlight").style.display = 'none';
        doc.getElementById("phongShadedGroup").style.display = 'inherit';

        return doc.querySelector("#xml3DElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [0,0,255,255], "Initial light direction");
        return s;
    }).then(function (s) {
        var test = s.ownerDocument.getElementById("t_dirLight");
        test.setAttribute("rotation", "0 1 0 1.571");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [0,0,0,255], "Light parallel to the plane");
        return s;
    }).then(function (s) {
        var test = s.ownerDocument.getElementById("t_dirLight");
        test.setAttribute("rotation", "0 1 0 1.5");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [0,0,180,255], "Light barely hitting the plane");
        return s;
    });
    test.fin(QUnit.start).done();

});

test("Change lightshader intensity", 3, function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering03.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("dirlight").style.display = 'inherit';
        doc.getElementById("pointlight").style.display = 'none';
        doc.getElementById("phongShadedGroup").style.display = 'inherit';

        return doc.querySelector("#xml3DElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [0,0,255,255], "Initial light intensity");
        return s;
    }).then(function (s) {
        var test = s.ownerDocument.getElementById("lsdIntensity");
        test.textContent = "10 10 0";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [255,255,0,255], "Light intensity changed to yellow");
        return s;
    });
    test.fin(QUnit.start).done();

});


test("Adding lights", 5, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering03.html");
    var lightModels;
    var test = frameLoaded.then(function (doc) {
        var s = doc.querySelector("#xml3DElem");
        var h = getHandler(s);
        lightModels = h.renderer.scene.lights._models;
        ok(lightModels.point.lightModels.length == 1 && lightModels.directional.lightModels.length == 1, "Renderer sees 2 lights");

        var newLight = doc.createElement("light");
        newLight.setAttribute("model", "urn:xml3d:light:point");
        newLight.setAttribute("src", "#ls_Point2");
        doc.getElementById("pointlight2").appendChild(newLight);

        return s;
    }).then(promiseSceneRendered).then(function (s) {
        equal(lightModels.point.lightModels.length, 2, "Light was added to the lights array");
        var newSpot = s.ownerDocument.createElement("light");
        newSpot.setAttribute("model", "urn:xml3d:light:spot");
        newSpot.setAttribute("src", "#ls_Spot");
        s.ownerDocument.getElementById("spotlight").appendChild(newSpot);
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        equal(lightModels.spot.lightModels.length, 1, "Spot light was added to the lights array");
        var doc = s.ownerDocument;
        doc.getElementById("dirlight").style.display = 'none';
        doc.getElementById("pointlight").style.display = 'none';
        doc.getElementById("phongShadedGroup").style.display = 'inherit';
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [0, 255, 255, 255], "Phong object is lit by the new lights");
        return s;
    });
    test.fin(QUnit.start).done();

});

test("Removing lights", 4, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering03.html");
    var lightModels;
    var test = frameLoaded.then(function (doc) {
        var s = doc.querySelector("#xml3DElem");
        var h = getHandler(s);
        lightModels = h.renderer.scene.lights._models;
        ok(lightModels.point.lightModels.length == 1 && lightModels.directional.lightModels.length == 1, "Renderer sees 2 lights");

        doc.getElementById("dirlight").style.display = 'inherit';
        doc.getElementById("pointlight").style.display = 'inherit';
        doc.getElementById("phongShadedGroup").style.display = 'inherit';

        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [255, 0, 255, 255], "Phong object is lit by both lights");
        return s;
    }).then(function (s) {
        var doc = s.ownerDocument;
        var dirLight = doc.getElementById("dirlight");
        dirLight.parentNode.removeChild(dirLight);
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [255, 0, 0, 255], "Phong object is lit by the single remaining light only");
        return s;
    });
    test.fin(QUnit.start).done();
});


test("Change light shader", 4, function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering03.html");

    var test = frameLoaded.then(function (doc) {
        var s = doc.querySelector("#xml3DElem");
        doc.getElementById("pointlight").style.display = 'inherit';
    doc.getElementById("dirlight").style.display = 'none';

    doc.getElementById("phongShadedGroup").style.display = 'inherit';


        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [255,0,0,255], "Phong object is lit by red point light shader");
        return s;
    }).then(function (s) {
        var doc = s.ownerDocument;
        doc.getElementById("pointlightLight").src = "#ls_Point2";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [0,0,255,255], "Phong object is lit by blue point light shader");
        return s;
    }).then(function (s) {
        var doc = s.ownerDocument;
        doc.getElementById("pointIntensity").textContent = "0 10 0";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        deepEqual(actual, [0,0,255,255], "Change to old lightshader did not affect the object");
        return s;
    });;
    test.fin(QUnit.start).done();

});


module("Lights", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.win = document.getElementById("xml3dframe").contentWindow;
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering03.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});
