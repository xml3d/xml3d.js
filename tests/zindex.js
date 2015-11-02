module("zindex", {});

test("Basic z-index functionality", function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/zindex.html");

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#myXml3d");

        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(scene), 82, 370);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Blue square with >z-index was drawn above");

        pick = XML3DUnit.getPixelValue(getContextForXml3DElement(scene), 282, 372);
        QUnit.closeArray(pick, [255, 0, 255, 255], PIXEL_EPSILON, "z-index from higher up in the scene hierarchy overrides the greater nested value");

        pick = XML3DUnit.getPixelValue(getContextForXml3DElement(scene), 476, 368);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Negative z-index is interpreted properly");

        pick = XML3DUnit.getPixelValue(getContextForXml3DElement(scene), 82, 226);
        QUnit.closeArray(pick, [0, 255, 0, 255], PIXEL_EPSILON, "Group with z-index auto shouldn't create a new stacking context");

        pick = XML3DUnit.getPixelValue(getContextForXml3DElement(scene), 277, 226);
        QUnit.closeArray(pick, [255, 0, 255, 255], PIXEL_EPSILON, "Negative z-index should be drawn below an implicit '0'");

        return scene;
    });
    test.fin(QUnit.start).done();

});

test("Changing z-index", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/zindex.html");

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#myXml3d");
        var layer12b = doc.getElementById("layer1_2b");
        layer12b.setAttribute("style", "z-index: 50");
        return scene;
    }).then(promiseSceneRendered).then(function(scene) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(scene), 82, 370);
        QUnit.closeArray(pick, [0, 255, 0, 255], PIXEL_EPSILON, "Setting z-index higher causes rendering order to change");

        var layer1b2b = scene.ownerDocument.getElementById("layer1b_2b");
        layer1b2b.setAttribute("style", "z-index: auto");
        return scene;
    }).then(promiseSceneRendered).then(function(scene) {
        // By removing the z-index: 4 of the layer1b_2b element the z-index: 100 of the descendant mesh element should now be
        // compared to the z-index: 6 of layer1b's stacking context, which should cause the yellow square with (100) to now render on top
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(scene), 282, 372);
        QUnit.closeArray(pick, [255, 255, 0, 255], PIXEL_EPSILON, "Setting a z-index to auto removes its stacking context");

        var layer1c2 = scene.ownerDocument.getElementById("layer1c_2");
        layer1c2.setAttribute("style", "z-index: -10");
        return scene;
    }).then(promiseSceneRendered).then(function(scene) {
        // Changed the positive z-index to a smaller negative one (-10 vs -9), this should reverse the rendering order
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(scene), 476, 368);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Changing a positive z-index to a negative one");

        var layer1d2b = scene.ownerDocument.getElementById("layer1d_2b");
        layer1d2b.setAttribute("style", "z-index: 3");
        return scene;
    }).then(promiseSceneRendered).then(function(scene) {
        // Opposite of the second .then above, changing 'auto' to '3' should create a new stacking context and reverse the rendering order
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(scene), 82, 226);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Creating a new stacking context by changing 'auto' to '3' ");

    });
    test.fin(QUnit.start).done();
});
