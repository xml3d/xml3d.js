module("Materials", {
    setup : function() {
        var that = this;
        stop();
        Q.fcall(promiseIFrameLoaded, "scenes/materials.html").then(function (doc) {
            that.doc = doc;
            ok(true, "Scene loaded");
        }).fin(QUnit.start).done();
    }
});

test("Change material model of mesh", 6, function () {
    var doc = this.doc;
    var scene = doc.querySelector("xml3d");
    console.log(scene);
    stop();
    var checkInit = promiseSceneRendered(scene).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Blue phong");
    });
    var checkURNChange = checkInit.then(doc.defaultView.setMatte).then(promiseSceneRendered.bind(null, scene)).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [0, 255, 0, 255], PIXEL_EPSILON, "Changed urn script to matte. Should be green now.");
    });
    var checkShadeInternal = checkURNChange.then(doc.defaultView.setShadeInternal).then(promiseSceneRendered.bind(null, scene)).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [0, 255, 255, 255], PIXEL_EPSILON, "Changed script to internal shade.js shader. Should be cyan now.");
    });
    var checkShadeExternal = checkShadeInternal.then(doc.defaultView.setShadeExternal).then(promiseSceneRendered.bind(null, scene)).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [51, 51, 51, 255], PIXEL_EPSILON, "Changed script to internal shade.js shader. Should be grey now.");
    });
    var checkShadeExternalJS = checkShadeExternal.then(doc.defaultView.setShadeExternalJS).then(promiseSceneRendered.bind(null, scene)).then(function(s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s),256,256);
        QUnit.closeArray(pick, [255, 255, 0, 255], PIXEL_EPSILON, "Changed script to internal shade.js shader. Should be yellow now.");
    });
    checkShadeExternalJS.fin(QUnit.start).done();
});

