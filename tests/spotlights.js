module("Spotlights", {});

test("Initialization: entries in lights.spot check", 10, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/spotlights.html");

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        var h = getHandler(scene);
        var lights = h.renderer.scene.lights;
        var lightModels = h.renderer.scene.lights._models;
        var params = {};

        notEqual(lightModels.spot, undefined, "Test for spotlight data existence");

        ok(lightModels.spot.lightModels.length == 1, "Test light count");

        lights.fillGlobalParameters(params, /* force = */ true);

        QUnit.closeArray(params.spotLightIntensity, [10, 10, 10], EPSILON, "Test light intensity entry");
        QUnit.closeArray(params.spotLightAttenuation, [0, 0, 1], EPSILON, "Test light attenuation entry");
        QUnit.closeArray(params.spotLightOn, [1], EPSILON, "Test light 'on' entry");
        QUnit.closeArray(params.spotLightSoftness, [0.5], EPSILON, "Test light softness entry");
        QUnit.closeArray(params.spotLightFalloffAngle, [0.785], EPSILON, "Test light cutOffAngle entry");
        QUnit.closeArray(params.spotLightPosition, [0, 0, 1], EPSILON, "Test for default position entry");
        QUnit.closeArray(params.spotLightDirection, [0, 0, -1], EPSILON, "Test for default direction entry");
        return scene;
    });

    test.fin(QUnit.start).done();
});

test("All spot lights visibility off", 3, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/spotlights.html");

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        var h = getHandler(scene);
        doc.getElementById("mainlight").style.display = 'none';
        doc.getElementById("diffuseShadedGroup").style.display = 'inherit';
        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closePixel(actual, [0, 255, 0, 255], 1, "Green emissive diffuse object");
        return s;
    }).then(function (s) {
        var doc = s.ownerDocument;
        doc.getElementById("diffuseShadedGroup").style.display = 'none';
        doc.getElementById("phongShadedGroup").style.display = 'inherit';
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closePixel(actual, [0, 0, 0, 255], 1, "Black phong object");
        return s;
    });

    test.fin(QUnit.start).done();
});

test("Light spot geometry test", 5, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/spotlights.html");

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        var h = getHandler(scene);
        doc.getElementById("mainlight").style.display = 'inherit';
        doc.getElementById("diffuseShadedGroup").style.display = 'none';
        doc.getElementById("phongShadedGroup").style.display = 'inherit';
        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 100, 100);
        QUnit.closePixel(actual, [255, 255, 255, 255], 1, "White phong light spot (at 100, 100)");
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closePixel(actual, [0, 0, 0, 255], 1, "Black phong background object (at 40, 40)");
        return s;
    }).then(function (s) {
        var doc = s.ownerDocument;
        doc.getElementById("diffuseShadedGroup").style.display = 'inherit';
        doc.getElementById("phongShadedGroup").style.display = 'none';
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 100, 100);
        QUnit.closePixel(actual, [255, 255, 255, 255], 1, "White phong light spot (at 100, 100)");
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closePixel(actual, [0, 255, 0, 255], 1, "Green diffuse background object (at 40, 40)");
        return s;
    });

    test.fin(QUnit.start).done();
});

test("Change of light material parameters check against lights.spot", 7, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/spotlights.html");

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        var h = getHandler(scene);
        var win = doc.defaultView;
        var ls_Spot = doc.querySelector("light");
        var lights = h.renderer.scene.lights;
        var params = {};

        notEqual(lights._models.spot, undefined, "Test for spotlight data existence");
        ok(lights._models.spot.lightModels.length == 1, "Test light count");


        ls_Spot.querySelector("[name=softness]").textContent = "0.2";
        win.XML3D.flushDOMChanges();
        lights.fillGlobalParameters(params, /* force = */ true);
        QUnit.closeArray(params.spotLightSoftness, [0.2], EPSILON, "Test softness entry change");


        ls_Spot.querySelector("[name=falloffAngle]").textContent = "0.6";
        win.XML3D.flushDOMChanges();
        lights.fillGlobalParameters(params, /* force = */ true);
        QUnit.closeArray(params.spotLightFalloffAngle, [0.6], EPSILON, "Test falloffAngle entry change");

        ls_Spot.querySelector("[name=intensity]").textContent = "1 0 1";
        win.XML3D.flushDOMChanges();
        lights.fillGlobalParameters(params, /* force = */ true);
        QUnit.closeArray(params.spotLightIntensity, [1, 0, 1], EPSILON, "Test intensity entry change");

        ls_Spot.querySelector("[name=attenuation]").textContent = "1 0 0";
        win.XML3D.flushDOMChanges();
        lights.fillGlobalParameters(params, /* force = */ true);
        QUnit.closeArray(params.spotLightAttenuation, [1, 0, 0], EPSILON, "Test attenuation entry change");
        return scene;
    });

    test.fin(QUnit.start).done();


});

test("Change in transformation hierarchy check against lights.spot", 3, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/spotlights.html");

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        var h = getHandler(scene);
        var win = doc.defaultView;

        var lights = h.renderer.scene.lights;
        var params = {};

        var t_Lamp = doc.getElementById("t_Lamp");

        t_Lamp.setAttribute("translation", "0 0 3");
        win.XML3D.flushDOMChanges();
        lights.fillGlobalParameters(params, /* force = */ true);
        QUnit.closeArray(params.spotLightPosition, [0, 0, 3], EPSILON, "Test position entry change");

        t_Lamp.setAttribute("rotation", "0 1 0 1.57079632679");
        win.XML3D.flushDOMChanges();
        lights.fillGlobalParameters(params, /* force = */ true);
        QUnit.closeArray(params.spotLightDirection, [-1, 0, 0], EPSILON, "Test position entry change");
        return scene;
    });

    test.fin(QUnit.start).done();

});

