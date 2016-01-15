module("WebGL Transparency", {});

test("Pick transparency values", 2, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/transparency.html");

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 150, 100);
        QUnit.closePixel(actual, [128, 153, 102, 255], 1, "Mixed cyan and yellow");
    });

    test.fin(QUnit.start).done();
});

test("ProgramObject.hastransparency is set correctly", function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/transparency.html");
    var material;

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        var h = getHandler(scene);
        var shaderFactory = h.renderer.scene.shaderFactory;
        material = shaderFactory.getTemplateById(getWebGLAdapter(doc.getElementById("opaque"))._materialConfiguration.id).shaderClosures[0];
        ok(material, "Found #opaque material");
        if (material) equal(material.hasTransparency(), false, "Opaque material has no transparency set");

        material = shaderFactory.getTemplateById(getWebGLAdapter(doc.getElementById("non-opaque"))._materialConfiguration.id).shaderClosures[0];
        ok(material, "Found #non-opaque material");
        if (material) equal(material.hasTransparency(), true, "Non-Opaque material has transparency set");

        material = shaderFactory.getTemplateById(getWebGLAdapter(doc.getElementById("matte"))._materialConfiguration.id).shaderClosures[0];
        ok(material, "Found #matte material");
        if (material) equal(material.hasTransparency(), false, "Matte material is always opaque");

        var opacityAttribute = doc.getElementById("change_transparencyAttribute");

        material = shaderFactory.getTemplateById(getWebGLAdapter(doc.getElementById("change"))._materialConfiguration.id).shaderClosures[0];

        ok(material, "Found #change material");
        equal(material.hasTransparency(), false, "Initially opaque");
        opacityAttribute.textContent = "0.5";

        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        equal(material.hasTransparency(), true, "Changed after setting opacity parameter to 0.5");
    });

    test.fin(QUnit.start).done();

});

test("Opacity override of non-transparent material", 3, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering02.html");

    var test = frameLoaded.then(function (doc) {
        doc.getElementById("tranparencyGroup").style.display = 'inherit';
        return doc.querySelector("#xml3DElem");
    }).then(promiseSceneRendered).then(function (s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 100, 100);
        deepEqual(actual, [255,127,127,255], "Override caused obj to be rendered with transparency");

        var override = s.querySelector("#opacityOverride");
        override.parentElement.removeChild(override);
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 100, 100);
        deepEqual(actual, [255,255,255,255], "Removed override, obj now opaque");
    });
    test.fin(QUnit.start).done();
});
