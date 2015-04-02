module("Materials", {

});

test("Change material model of mesh", 7, function () {
    stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/materials.html");

    var changeFunction = function(f) {
        return function(scene) {
            scene.ownerDocument.defaultView[f]();
            return scene;
        }
    };

    var checkInit = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Blue phong");
        return s;
    });
    var checkURNChange = checkInit.then(changeFunction("setMatte")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 256, 256);
        QUnit.closeArray(pick, [0, 255, 0, 255], PIXEL_EPSILON, "Changed urn script to matte. Should be green now.");
        return s;
    });

    var checkShadeInternal = checkURNChange.then(changeFunction("setShadeInternal")).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [0, 255, 255, 255], PIXEL_EPSILON, "Changed script to internal shade.js material. Should be cyan now.");
        return s;
    });

    var changeShadeInternal = checkShadeInternal.then(changeFunction("changeInternalShadeJS")).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [255, 0, 255, 255], PIXEL_EPSILON, "Changed script content of internal shade.js material. Should be magenta now.");
        return s;
    });
    var checkShadeExternal = changeShadeInternal.then(changeFunction("setShadeExternal")).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [51, 51, 51, 255], PIXEL_EPSILON, "Changed script to external shade.js material in XML document. Should be grey now.");
        return s;
    });
    var checkShadeExternalJS = checkShadeExternal.then(changeFunction("setShadeExternalJS")).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [255, 255, 0, 255], PIXEL_EPSILON, "Changed script to external shade.js material in Javascript document. Should be yellow now.");
        return s;
    });
    checkShadeExternalJS.fin(QUnit.start).done();
});

test("Change material model of asset", 7, function () {
    stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-materials.html");

    var changeFunction = function(f) {
        return function(scene) {
            scene.ownerDocument.defaultView[f]();
            return scene;
        }
    };

    var checkInit = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Blue phong");
        return s;
    });
    var checkURNChange = checkInit.then(changeFunction("setMatte")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 256, 256);
        QUnit.closeArray(pick, [0, 255, 0, 255], PIXEL_EPSILON, "Changed urn script to matte. Should be green now.");
        return s;
    });

    var checkShadeInternal = checkURNChange.then(changeFunction("setShadeInternal")).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [0, 255, 255, 255], PIXEL_EPSILON, "Changed script to internal shade.js material. Should be cyan now.");
        return s;
    });

    var changeShadeInternal = checkShadeInternal.then(changeFunction("changeInternalShadeJS")).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [255, 0, 255, 255], PIXEL_EPSILON, "Changed script content of internal shade.js material. Should be magenta now.");
        return s;
    });
    var checkShadeExternal = changeShadeInternal.then(changeFunction("setShadeExternal")).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [51, 51, 51, 255], PIXEL_EPSILON, "Changed script to external shade.js material in XML document. Should be grey now.");
        return s;
    });
    var checkShadeExternalJS = checkShadeExternal.then(changeFunction("setShadeExternalJS")).then(promiseSceneRendered).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [255, 255, 0, 255], PIXEL_EPSILON, "Changed script to external shade.js material in Javascript document. Should be yellow now.");
        return s;
    });
    checkShadeExternalJS.fin(QUnit.start).done();
});




test("Change transparency", 5, function () {
    stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/materials-transparency.html");

    var changeFunction = function(f) {
        return function(scene) {
            scene.ownerDocument.defaultView[f]();
            return scene;
        }
    };

    var checkInit = frameLoaded.then(function(doc) { return doc.querySelector("xml3d") }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Initially Opaque");
        return s;
    });
    var checkTransparentmaterialChange = checkInit.then(changeFunction("setSemiTransparent")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 256, 256);
        QUnit.closeArray(pick, [127.5, 127.5, 0, 255], PIXEL_EPSILON, "Changed to semi-transparent material. Should be half green, half red now.");
        return s;
    });

    var checkOpaquematerialChange = checkTransparentmaterialChange.then(changeFunction("setOpaque")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 256, 256);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Changed back to opaque. Should be blue now.");
        return s;
    });

    var checkTransparencyChange = checkOpaquematerialChange.then(changeFunction("makeOpaqueTransparent")).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 256, 256);
        QUnit.closeArray(pick, [127.5, 0, 127.5, 255], PIXEL_EPSILON, "Make the opaque object transparent by changing its transparency value. Should be half blue, half red now.");
        return s;
    });

    checkTransparencyChange.fin(QUnit.start).done();
});
