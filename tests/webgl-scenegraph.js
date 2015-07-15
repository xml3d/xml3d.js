module("WebGL Scenegraph", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.win = document.getElementById("xml3dframe").contentWindow;
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering01.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    },
    isRenderNodeInScene: function(name, scene) {
        var found = false;
        scene.traverse(function(node) {
            found = found || node.name == name;
        });
        return found;
    }

});



function getCanvasId(x) {
    var factory = getWebGLFactory(x);
    return factory ? factory.canvasId : null;
}

function getRenderer(x) {
    //console.dir(x);
    var factory = getWebGLFactory(x);
    return factory ? factory.getRenderer() : null;
};

function getHandler(x) {
    //console.dir(x);
    var renderer = getRenderer(x);
    return renderer ? renderer._canvasHandler : null;
};

function getContextForXml3DElement(x) {
    var renderer = getRenderer(x);
    return renderer ? renderer.context.gl : null;
};

test("Change active view via script", 8, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("xml3DElem");
    var h = getHandler(x);
    x.addEventListener("framedrawn", function(n) {
            ok("Redraw was triggered"); // 7
            ok(!h.renderer.needsDraw, "Redraw not required"); // 8
            start();
    });
    stop();
    equal(x.activeView, "#defaultView", "Initial active view is #default"); // 3

    var v = this.doc.getElementById("defaultView");
    var m = XML3D.math.mat4.create();
    QUnit.closeMatrix(v.getViewMatrix(), XML3D.math.mat4.translate(m, m, [0,0,-3]), EPSILON, "Check view matrix"); // 4

    x.activeView = "#viewOrientationTest";
    this.win.XML3D.flushDOMChanges();
    equal(x.activeView, "#viewOrientationTest", "New active view is #viewOrientationTest"); // 5
    ok(h.renderer.needsDraw, "Redraw required"); // 6, fails in < 920181
});


test("Test mesh.getLocalBoundingBox", 3, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("xml3DElem");
    var h = getHandler(x);
    var group = this.doc.getElementById("myTransformedGroup");
    var mesh = this.doc.getElementById("myTransformedMesh");
    x.addEventListener("framedrawn", function(n) {
        var bb = mesh.getLocalBoundingBox();
        QUnit.closeArray(bb.data, [1,1,0,-1,-1,0], "Local box is has max [1, 1, 0] and min [-1, -1, 0]");
        start();
    });
    stop();
    group.style.display = 'inherit';

});

test("Test mesh.getWorldBoundingBox", 3, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("xml3DElem");
    var h = getHandler(x);
    var group = this.doc.getElementById("myTransformedGroup");
    var mesh = this.doc.getElementById("myTransformedMesh");
    x.addEventListener("framedrawn", function(n) {
        var bb = mesh.getWorldBoundingBox();
        QUnit.closeArray(bb.data, [1,1,-3,-1,-1,-3], "World box has max [1, 1, -3] and min [-1, -1, -3]");

        start();
    });
    stop();
    group.style.display = 'inherit';

});


test("Simple add/remove mesh", 12, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);

    var mesh = this.doc.createElementNS("http://www.xml3d.org/2009/xml3d", "mesh");
    mesh.setAttribute("src", "#meshdata");

    // Add a mesh
    x.appendChild(mesh);
    var renderNode = getWebGLAdapter(mesh).renderNode;
    var scene = renderNode.scene;
    equal(scene.ready.indexOf(renderNode), -1, "renderNode not in 'Ready' before draw");
    h.draw();
    notEqual(scene.ready.indexOf(renderNode), -1, "renderNode in 'Ready' after draw");
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Red at 40,40 [add mesh]");

    // Remove the mesh
    var adapter = getWebGLAdapter(mesh);
    x.removeChild(mesh);
    ok(!getWebGLAdapter(mesh), "Mesh adapter is removed");
    equal(scene.ready.indexOf(adapter.renderNode), -1, "renderNode not in ready list after dispose");
    equal(scene.queue.indexOf(adapter.renderNode), -1, "renderNode not in queue list after dispose");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Transparent at 40,40 [remove mesh]");

    // Add the mesh again
    x.appendChild(mesh);
    equal(scene.ready.indexOf(renderNode), -1, "renderNode not in 'Ready' before draw");
    h.draw();
    notEqual(scene.ready.indexOf(getWebGLAdapter(mesh).renderNode), -1, "renderNode in 'Ready' after draw");
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Red at 40,40 [re-add mesh]");


});

test("Simple add/remove group with mesh", 10, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);

    var mesh = this.doc.createElementNS("http://www.xml3d.org/2009/xml3d", "mesh");
    mesh.setAttribute("src", "#meshdata");
    var group = this.doc.createElementNS("http://www.xml3d.org/2009/xml3d", "group");
    group.appendChild(mesh);
    //console.log(getWebGLAdapter(mesh).renderNode.is("NoLights"));

    // Add group
    x.appendChild(group);
    var renderNode = getWebGLAdapter(mesh).renderNode;
    var scene = renderNode.scene;
    equal(scene.ready.indexOf(renderNode), -1, "renderNode not in 'Ready' before draw");
    h.draw();
    notEqual(scene.ready.indexOf(renderNode), -1, "renderNode not in 'Ready' before draw");
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Red at 40,40 [add group with mesh]");

    var adapter = getWebGLAdapter(mesh);
    // Remove group
    x.removeChild(group);
    ok(!getWebGLAdapter(group), "Group adapter is removed");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Transparent at 40,40 [remove group]");

    // Re-add group
    x.appendChild(group);
    equal(scene.ready.indexOf(renderNode), -1, "renderNode not in 'Ready' before draw");
    h.draw();
    notEqual(scene.ready.indexOf(renderNode), 1, "renderNode not in 'Ready' before draw");
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Red at 40,40 [add group with mesh]");
});

test("Simple add/remove transformed group with mesh", 17, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);
    x.setAttribute("activeView", "#identView");
    var mesh = this.doc.createElementNS("http://www.xml3d.org/2009/xml3d", "mesh");
    mesh.setAttribute("id", "addedMesh");
    mesh.setAttribute("src", "#meshdata");
    var group = this.doc.createElementNS("http://www.xml3d.org/2009/xml3d", "group");
    group.setAttribute("id", "addedGroup");
    group.setAttribute("transform", "#t_grouptransformed");

    group.appendChild(mesh);
    //console.log(getWebGLAdapter(mesh).renderNode.is("NoLights"));

    // Add group
    x.appendChild(group);

    var renderNode = getWebGLAdapter(mesh).renderNode;
    var scene = renderNode.scene;

    ok(this.isRenderNodeInScene("addedMesh", scene), "Render node in scene");
    ok(this.isRenderNodeInScene("addedGroup", scene), "Group in scene");

    equal(scene.ready.indexOf(renderNode), -1, "renderNode not in 'Ready' before draw");
    h.draw();
    notEqual(scene.ready.indexOf(renderNode), -1, "renderNode in 'Ready' after draw");
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Red at 40,40 [add group with mesh]");

    // Remove group
    var adapter = getWebGLAdapter(mesh);
    x.removeChild(group);
    this.win.XML3D.flushDOMChanges();
    ok(!this.isRenderNodeInScene("addedMesh", scene), "Mesh not in scene");
    ok(!this.isRenderNodeInScene("addedGroup", scene), "Group not in scene");


    ok(!getWebGLAdapter(group), "Group adapter is removed");
    ok(!getWebGLAdapter(mesh), "Mesh adapter is removed");
    //ok(adapter.renderNode.is("Disposed"), "renderNode in 'Disposed' after removal");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Transparent at 40,40 [remove group]");

    // Re-add group
    x.appendChild(group);
    this.win.XML3D.flushDOMChanges();
    ok(this.isRenderNodeInScene("addedMesh", scene), "Render node in scene");
    ok(this.isRenderNodeInScene("addedGroup", scene), "Group in scene");
    var renderNode = getWebGLAdapter(mesh).renderNode;
    equal(scene.ready.indexOf(renderNode), -1, "renderNode not in 'Ready' before draw");
    h.draw();
    notEqual(scene.ready.indexOf(renderNode), -1, "renderNode not in 'Ready' before draw");
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Red at 40,40 [add group with mesh]");
});

module("WebGL Scenegraph", {});

test("Add invisible groups and meshes", 6, function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering01.html");
    var mesh, group;

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        mesh = doc.createElement("mesh");
        mesh.setAttribute("src", "#meshdata");
        mesh.setAttribute("style", "display: none;");
        // Add a mesh
        scene.appendChild(mesh);
        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Mesh is invisible");
        return s;
    }).then(function (s) {
        mesh.style.display = "inherit";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Mesh is now visible");
        return s;
    }).then(function (s) {
        var doc = s.ownerDocument;
        s.removeChild(mesh);
        group = doc.createElement("group");
        group.setAttribute("style", "display: none;");
        group.appendChild(mesh);
        s.appendChild(group);
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Group is invisible");
        return s;
    }).then(function (s) {
        group.style.display = "inherit";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Group is visible");
        return s;
    }).then(function (s) {
        mesh.style.display = "none";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Mesh is invisible");
        return s;
    });
    test.fin(QUnit.start).done();

});

test("Change material via script", 5, function () {

    stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering01.html");
    var group;

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        group = doc.getElementById("myGroup");
        group.style.display = 'inherit';
        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Red at 40,40 [visible true]");
        return s;
    }).then(function (s) {
        group.setAttribute("material", "#flatblue");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Blue at 40,40 [flat material]");
        return s;
    }).then(function (s) {
        group.setAttribute("material", "#phonggreen");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [0, 0, 0, 255], PIXEL_EPSILON, "[phong material, no light, no emission]");
        return s;
    }).then(function (s) {
        var doc = s.ownerDocument;
        var materialColor = doc.getElementById("phonggreen_emissive");
        materialColor.textContent = "0 0 1";
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Blue at 40,40 [set emissive color]");
        return s;
    });

    test.fin(QUnit.start).done();

});

test("Change visible/material for nested groups", 7, function() {
     stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering01.html");
    var outerGroup, innerGroup;

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");

        outerGroup = doc.getElementById("group1");
        innerGroup = doc.getElementById("group2");
        innerGroup.setAttribute("style", "display: inherit;");

        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Transparent");
        return s;
    }).then(function (s) {
        innerGroup.setAttribute("style", "display: none;");
        outerGroup.setAttribute("style", "display: inherit;");

        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Transparent at 40,40 [child group's visible overrides parent]");
        return s;
    }).then(function (s) {
        innerGroup.setAttribute("style", "display: inherit;");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Blue at 40,40 [both visible, child material overrides parent]");
        return s;
    }).then(function (s) {
        innerGroup.setAttribute("material", "");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [255, 255, 0, 255], PIXEL_EPSILON, "Yellow at 40,40 [remove child material, #flatYellow active]");
        return s;
    }).then(function (s) {
        innerGroup.setAttribute("material", "#flatblue");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Blue at 40,40 [re-add child material]");
        return s;
    }).then(function (s) {
        outerGroup.setAttribute("material", "#flatblack");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 40, 40);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON,  "Blue at 40,40 [child material overrides new parent material]");
        return s;
    });

    test.fin(QUnit.start).done();
});

test("Camera with group transforms", 6, function () {
    stop();

    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering01.html");
    var camtest, group5, camTransform, view;

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        camTransform = doc.getElementById("t_camera1");
        view = doc.getElementById("transformTestView");
        camtest = doc.getElementById("viewTest");
        group5 = doc.getElementById("group5");

        //Simple test of camera orientation to check that view matrix is built correctly
        camtest.style.display = 'inherit';
        scene.setAttribute("activeView", "#viewOrientationTest");

        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Simple camera orientation check, Red");
        return s;
    }).then(function (s) {
        camtest.style.display = 'none';
        group5.style.display = 'inherit';
        s.setAttribute("activeView", "#transformTestView");

        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [255, 255, 0, 255], PIXEL_EPSILON, "Camera facing back of cube, Yellow");
        return s;
    }).then(function (s) {
        camTransform.setAttribute("rotation", "1 0 0 1.57");
        camTransform.setAttribute("translation", "0 3 0");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [0, 0, 255, 255], PIXEL_EPSILON, "Camera facing top of cube, Blue")
        return s;
    }).then(function (s) {
        view.setAttribute("orientation", "0 1 0 0");
        camTransform.setAttribute("translation", "0 -6 0");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [255, 0, 255, 255], PIXEL_EPSILON, "Camera facing bottom of cube, Purple")
        return s;
    }).then(function (s) {
        view.setAttribute("orientation", "0 0 0 0");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [255, 0, 255, 255], PIXEL_EPSILON, "Camera with orientation '0 0 0 0', Purple")
        return s;
    });

    test.fin(QUnit.start).done();


});

test("Nested transforms", 7, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering01.html");

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        var group3 = doc.getElementById("group3");
        var group4 = doc.getElementById("group4");

        group3.style.display = 'inherit';

        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Red at 90,90 [nested y-axis rotations]");
        return s;
    }).then(function (s) {
        var doc = s.ownerDocument;
        var t3 = doc.getElementById("t_group3");
        t3.setAttribute("rotation", "0 1 0 0");

        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Transparent at 90,90 [outer rotation 0, inner 90]");
        return s;
    }).then(function (s) {
        // Rotate both inner and outer around y-axis 90 degrees, should flip the shape around
        var doc = s.ownerDocument;
        var t3 = doc.getElementById("t_group3");
        t3.setAttribute("rotation", "0 1 0 1.57");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Red at 90,90 [set outer rotation 90]");
        return s;
    }).then(function (s) {
        // Rotate both inner and outer around y-axis 90 degrees, should flip the shape around
        var doc = s.ownerDocument;
        var t4 = doc.getElementById("t_group4");
        // Rotate inner -90 around local x-axis (actually around z since we've rotated 90 around x first)
        t4.setAttribute("rotation", "1 0 0 -1.57");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Transparent at 90,90 [inner x-axis rotation -90]");
        return s;
    }).then(function (s) {
        // Rotate both inner and outer around y-axis 90 degrees, should flip the shape around
        var doc = s.ownerDocument;
        var t3 = doc.getElementById("t_group3");
        // Rotate outer 90 around x-axis, this should undo the -90 x-axis rotation of inner
        t3.setAttribute("rotation", "1 0 0 1.57");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Red at 90,90 [cancel inner rotation with outer]");
        return s;
    }).then(function (s) {
        // Rotate both inner and outer around y-axis 90 degrees, should flip the shape around
        var doc = s.ownerDocument;
        var t4 = doc.getElementById("t_group4");
        // Rotate outer 90 around x-axis, this should undo the -90 x-axis rotation of inner
        t4.setAttribute("translation", "3 0 0");
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Transparent at 90,90 [add inner translation]");
        return s;
    });

    test.fin(QUnit.start).done();

});

test("Camera setDirection/upVector", 4, function () {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering01.html");
    var view;

    var test = frameLoaded.then(function (doc) {
        var scene = doc.querySelector("#xml3DElem");
        var group5 = doc.getElementById("group5");
        var camtest = doc.getElementById("viewTest");

        view = doc.getElementById("viewOrientationTest");

        camtest.style.display = 'inherit';
        view.setAttribute("orientation", "0 0 1 0");
        scene.setAttribute("activeView", "#viewOrientationTest");

        return scene;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [0, 0, 0, 0], PIXEL_EPSILON, "Camera looking down z axis, transparent");
        return s;
    }).then(function (s) {
        view.setDirection(XML3D.Vec3.fromValues(1, 0, 0));
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [255, 0, 0, 255], PIXEL_EPSILON, "Camera looking to the right, red");
        return s;
    }).then(function (s) {
        view.setUpVector(XML3D.Vec3.fromValues(0, -1, 0));
        view.setDirection(XML3D.Vec3.fromValues(-1, 0, 0));
        return s;
    }).then(promiseSceneRendered).then(function (s) {
        var pick = XML3DUnit.getPixelValue(getContextForXml3DElement(s), 90, 90);
        QUnit.closeArray(pick, [255, 255, 0, 255], PIXEL_EPSILON, "Camera looking left, yellow");
        return s;
    });
    test.fin(QUnit.start).done();

});

test("Add a mesh dynamically", 3, function() {
     stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/webgl-rendering01.html");
    var d, g;

    var test = frameLoaded.then(function (doc) {
        d = doc;
        var scene = doc.querySelector("#xml3DElem");
        g = doc.getElementById("myGroup");
        g.style.display = 'inherit';
        return scene;
    }).then(promiseSceneRenderedEvent).then(function (evt) {
        equal(evt.detail.count.objects, 1, "Initially one drawable object");
        return evt.target;
    }).then(function (s) {
        var group = d.createElement("group");
        var mesh = d.createElement("mesh");
        mesh.setAttribute('id', "new_mesh");
        mesh.setAttribute('src', "#meshdata");
        g.appendChild(group);
        group.appendChild(mesh);
        return s;
    }).then(promiseSceneRenderedEvent).then(function (evt) {
        equal(evt.detail.count.objects, 2, "Now two drawable objects");
    });
    test.fin(QUnit.start).done();

});

