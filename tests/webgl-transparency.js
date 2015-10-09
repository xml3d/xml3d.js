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
