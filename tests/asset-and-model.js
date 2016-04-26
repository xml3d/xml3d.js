module("Asset and Model", {});

test("Static Test", 2, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-basic.html");

    var test = frameLoaded.then(function (doc) {
        XML3DUnit.loadSceneTestImages(doc, "xml3dReference", "xml3dTest", function (refImage, testImage) {
            QUnit.imageEqual(refImage, testImage, "Multidata render matches");
        });
    });
    test.fin(QUnit.start).done();
});

test("External asset with CSS", 4, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-basic.html");

    var test = frameLoaded.then(function (doc) {
        var xTest = doc.getElementById("xml3dTest");
        doc.getElementById("innerSubData").material = "#pinkmaterial";
        return xTest;
    }).then(promiseSceneRendered).then(function (s) {
        QUnit.closeArray(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 132, 288), [255, 127, 255, 255], PIXEL_EPSILON, "Left cube was transformed properly");
        QUnit.closeArray(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 249, 287), [255, 127, 255, 255], PIXEL_EPSILON, "Right cube pair was loaded");
        QUnit.closeArray(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 347, 287), [0,0,0,0], PIXEL_EPSILON, "Right most cube with display:none is not visible");
        return s;
    });

    test.fin(QUnit.start).done();

});


test("Modify material assignment", 5, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-basic.html");

    var test = frameLoaded.then(function (doc) {
        var xTest = doc.getElementById("xml3dTest");
        doc.getElementById("innerSubData").material = "#pinkmaterial";
        return xTest;
    }).then(promiseSceneRendered).then(function (s) {
        QUnit.closePixel(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 324, 40), [255, 127, 255, 255], PIXEL_EPSILON, "One instance has material color replaced");
        QUnit.closePixel(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 124, 134), [0, 255, 0, 255], PIXEL_EPSILON, "Other instance with overridden material has color NOT replaced");
        s.ownerDocument.getElementById("outerSubData").material = "";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        QUnit.closeArray(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 124, 134), [255, 127, 255, 255], PIXEL_EPSILON, "Other instance has overriden material removed and therefore updated color");
        s.ownerDocument.getElementById("outerSubData").material = "#bluematerial";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        QUnit.closeArray(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 124, 134), [0, 0, 255, 255], PIXEL_EPSILON, "Other instance now has blue color due to newly added material");
        return s;
    });
    test.fin(QUnit.start).done();

});

test("Modify visibility", function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-basic.html");

    var test = frameLoaded.then(function (doc) {
        var xTest = doc.getElementById("xml3dTest");
        var mm1 = doc.getElementById("mm1");
        var override = doc.createElement("assetmesh");
        override.setAttribute("name", "mesh1");
        override.setAttribute("id", "mesh1Override");
        override.setAttribute("style", "display: none");
        mm1.appendChild(override);
        return xTest;
    }).then(promiseSceneRendered).then(function (s) {
        QUnit.closePixel(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 248, 151), [0,0,0,0], PIXEL_EPSILON, "Assetmesh visibility was overridden");
        s.querySelector("#mesh1Override").setAttribute("style", "display: notnone");
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        QUnit.closePixel(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 248, 151), [255, 127, 127, 255], PIXEL_EPSILON, "Assetmesh responded to change in visibility");
        return s;
    });
    test.fin(QUnit.start).done();
});

test("Modify CSS transform on assetmesh", function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-basic.html");

    var test = frameLoaded.then(function (doc) {
        var xTest = doc.getElementById("xml3dTest");
        var mesh2 = doc.getElementById("outerSubData");
        mesh2.setAttribute("style", "transform: translateX(2px)");
        return xTest;
    }).then(promiseSceneRendered).then(function (s) {
        QUnit.closePixel(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 192, 137), [0,255,0, 255], PIXEL_EPSILON, "Assetmesh transform was overridden");
        s.querySelector("#outerSubData").setAttribute("style", "");
        return s;
    }).then(promiseSceneRendered).then(function(s) {
        QUnit.closePixel(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 130, 137), [0, 255, 0, 255], PIXEL_EPSILON, "Assetmesh returned to original position");
        return s;
    });
    test.fin(QUnit.start).done();
});

test("Modify asset pick", 5, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-basic.html");

    var test = frameLoaded.then(function (doc) {
        var xTest = doc.getElementById("xml3dTest");
        doc.getElementById("mm4").pick = "mesh1";
        return xTest;
    }).then(promiseSceneRendered).then(function (s) {
        QUnit.closeArray(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 434, 150), [0, 0, 0, 0], PIXEL_EPSILON, "mesh2 Rectangle removed");
        QUnit.closeArray(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 360, 150), [255, 127, 127, 255], PIXEL_EPSILON, "mesh1 Rectangle added");
        s.ownerDocument.getElementById("mm4").pick = "";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        QUnit.closeArray(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 434, 150), [0, 0, 0, 0], PIXEL_EPSILON, "mesh2 Rectangle still removed");
        QUnit.closeArray(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 360, 150), [0, 0, 0, 0], PIXEL_EPSILON, "mesh1 Rectangle also removed");
        return s;
    });
    test.fin(QUnit.start).done();
});

test("Recursive external assets and data", 2, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-recursive.html");

    var test = frameLoaded.then(function (doc) {
        return doc.getElementById("xml3dTest");
    }).then(promiseOneSceneCompleteAndRendered).then(function (s) {
        QUnit.closeArray(XML3DUnit.getPixelValue(getContextForXml3DElement(s), 250, 150), [255, 0, 0, 255], PIXEL_EPSILON, "Recursive external asset is rendered");
        return s;
    });
    test.fin(QUnit.start).done();
});


test("Static asset with classname pick filter", 2, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-classnames.html");

    var test = frameLoaded.then(function (doc) {
        XML3DUnit.loadSceneTestImages(doc, "xml3dReference", "xml3dTest", function (refImage, testImage) {
            QUnit.imageEqual(refImage, testImage, "Asset render matches");
        });
    });
    test.fin(QUnit.start).done();

});

var NINE_PATCH_COORDS = [{x: 178, y: 226, color: [255, 127, 255, 255], name: "top left"}, {
    x: 257, y: 226, color: [255, 127, 255, 255], name: "top center"
}, {x: 320, y: 226, color: [255, 127, 255, 255], name: "top right"}, {
    x: 178, y: 150, color: [0, 0, 255, 255], name: "center left"
}, {x: 257, y: 150, color: [0, 0, 255, 255], name: "center"}, {
    x: 320, y: 150, color: [0, 0, 255, 255], name: "center right"
}, {x: 178, y: 78, color: [255, 127, 127, 255], name: "bottom left"}, {
    x: 257, y: 78, color: [255, 127, 127, 255], name: "bottom center"
}, {x: 320, y: 78, color: [255, 127, 127, 255], name: "bottom right"}];

function test9Patch(glTest, patches, pickFilter) {
    var i = patches.length;
    while (i--) {
        var coords = NINE_PATCH_COORDS[i];
        if (patches[i]) {
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, coords.x, coords.y), coords.color, PIXEL_EPSILON, coords.name + " rectangle is visible for '" + pickFilter + "'");
        } else {
            QUnit.closeArray(XML3DUnit.getPixelValue(glTest, coords.x, coords.y), [0, 0, 0, 0], PIXEL_EPSILON, coords.name + " rectangle is invisible for '" + pickFilter + "'");
        }
    }
}


test("Modification of classNamePickFilter", 46, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-classnames.html");

    var test = frameLoaded.then(function (doc) {
        var scene = doc.getElementById("xml3dTest");
        doc.getElementById("mm1").pick = ".left";
        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        test9Patch(getContextForXml3DElement(s), [1, 0, 0, 1, 0, 0, 1, 0, 0], ".left");
        s.ownerDocument.getElementById("mm1").pick = ".right";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        test9Patch(getContextForXml3DElement(s), [0, 0, 1, 0, 0, 1, 0, 0, 1], ".right");
        s.ownerDocument.getElementById("mm1").pick = ".left, .top";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        test9Patch(getContextForXml3DElement(s), [1, 1, 1, 1, 0, 0, 1, 0, 0], ".left, .top");
        s.ownerDocument.getElementById("mm1").pick = ".left.top, .right.bottom";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        test9Patch(getContextForXml3DElement(s), [1, 0, 0, 0, 0, 0, 0, 0, 1], ".left.top, .right.bottom");
        s.ownerDocument.getElementById("mm1").pick = ".left.top, .right.bottom, center";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        test9Patch(getContextForXml3DElement(s), [1, 0, 0, 0, 1, 0, 0, 0, 1], ".left.top, .right.bottom, center");
        return s;
    });
    test.fin(QUnit.start).done();

});

var NESTED_TESTS = [{
    id: "#mm1",
    pos: "center",
    desc: "Basic Instance of nested assets",
    checks: [{x: 251, y: 150, color: [127, 127, 127, 255]}, {x: 305, y: 150, color: [127, 127, 127, 255]}, {
        x: 296, y: 124, color: [0, 0, 0, 0]
    }]
}, {
    id: "#mm2",
    pos: "top center",
    desc: "Overriding root data",
    checks: [{x: 251, y: 220, color: [255, 127, 0, 255]}, {x: 305, y: 220, color: [255, 127, 0, 255]}]
}, {
    id: "#mm3",
    pos: "bottom center",
    desc: "Overriding root and sub asset data",
    checks: [{x: 251, y: 75, color: [127, 127, 255, 255]}, {x: 305, y: 75, color: [127, 127, 255, 255]}]
}, {
    id: "#mm4",
    pos: "center left",
    desc: "Extending from #mm2, overriding root data",
    checks: [{x: 141, y: 150, color: [127, 255, 127, 255]}, {x: 194, y: 150, color: [127, 255, 127, 255]}]
}, {
    id: "#mm5",
    pos: "top left",
    desc: "Extending from #mm3, added new asset",
    checks: [{x: 141, y: 220, color: [127, 127, 255, 255]}, {x: 194, y: 220, color: [127, 127, 255, 255]}, {
        x: 183, y: 247, color: [255, 127, 0, 255]
    }, {x: 188, y: 254, color: [0, 0, 0, 0]}]
}, {
    id: "#mm6",
    pos: "bottom left",
    desc: "Extending from #mm2,adding new asset mesh within sub asset",
    checks: [{x: 141, y: 75, color: [255, 127, 0, 255]}, {x: 194, y: 75, color: [255, 127, 0, 255]}, {
        x: 181, y: 102, color: [255, 127, 0, 255]
    }, {x: 190, y: 107, color: [0, 0, 0, 0]}]
}, {
    id: "#mm7",
    pos: "center right",
    desc: "Extending from #mm4, adding weird asset linking right into main sub asset via parent",
    checks: [{x: 360, y: 150, color: [127, 255, 127, 255]}, {x: 410, y: 150, color: [127, 255, 127, 255]}, {
        x: 401, y: 175, color: [127, 255, 127, 255]
    }, {x: 411, y: 183, color: [127, 255, 127, 255]}]
}, {
    id: "#mm8",
    pos: "top right",
    desc: "Extending from #mm4, adding weird asset and extending main sub asset base entry",
    checks: [{x: 360, y: 220, color: [255, 255, 0, 255]}, {x: 410, y: 220, color: [255, 255, 0, 255]}, {
        x: 401, y: 246, color: [255, 255, 0, 255]
    }, {x: 411, y: 257, color: [255, 255, 0, 255]}]
}, {
    id: "#mm9",
    pos: "bottom right",
    desc: "Extending from #mm3, adding a three level asset hierarchy with linking",
    checks: [{x: 360, y: 75, color: [127, 127, 255, 255]}, {x: 410, y: 75, color: [127, 127, 255, 255]}, {
        x: 401, y: 101, color: [127, 127, 255, 255]
    }, {x: 408, y: 108, color: [0, 0, 0, 0]}]
}];


test("Nested Assets", function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-nested.html");

    var test = frameLoaded.then(function (doc) {
        return doc.getElementById("xml3dTest");
    }).then(promiseSceneRendered).then(function (s) {
         for (var i = 0; i < NESTED_TESTS.length; ++i) {
            var test = NESTED_TESTS[i];
            var checks = test.checks;
            for (var j = 0; j < checks.length; ++j) {
                var check = checks[j];
                QUnit.closeArray(XML3DUnit.getPixelValue(getContextForXml3DElement(s), check.x, check.y), check.color, PIXEL_EPSILON, test.id + " (" + test.pos + "): " + test.desc + " - check #" + (j + 1));
            }
        }
        return s;
    });
    test.fin(QUnit.start).done();

});


test("Modify asset src", 3, function () {
    stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/asset-basic.html");

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3dTest");
        doc.getElementById("mm2").src = "#asset2Alt";
        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 69, 121);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Old Rectangle removed");
        pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 69, 150);
        QUnit.closeArray(pick, [255, 127, 255, 255], PIXEL_EPSILON, "New Rectangle added");
        return s;
    });

    test.fin(QUnit.start).done();

});
