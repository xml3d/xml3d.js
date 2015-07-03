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
}

function getHandler(x) {
    //console.dir(x);
    var renderer = getRenderer(x);
    return renderer ? renderer._canvasHandler : null;
}

function getContextForXml3DElement(x) {
    var renderer = getRenderer(x);
    return renderer ? renderer.context.gl : null;
}

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
        QUnit.closeArray(bb, [1,1,0,-1,-1,0], "Local box is has max [1, 1, 0] and min [-1, -1, 0]");
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

        QUnit.closeArray(bb, [1,1,-3,-1,-1,-3], "World box has max [1, 1, -3] and min [-1, -1, -3]");
        start();
    });
    stop();
    group.style.display = 'inherit';

});

test("Change material via script", 6, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);
    var group = this.doc.getElementById("myGroup");

    group.style.display = 'inherit';
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Red at 40,40 [visible true]");

    group.setAttribute("material", "#flatblue");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,255,255], "Blue at 40,40 [flat material]");

    group.setAttribute("material", "#phonggreen");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,255], "Black at 40,40 [phong material, no light, no emission]");

    var materialColor = this.doc.getElementById("phonggreen_emissive");
    materialColor.textContent = "0 0 1";
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,255,255], "Blue at 40,40 [set emissive color]");

});

test("Change visible/material for nested groups", 8, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);

    var outerGroup = this.doc.getElementById("group1");
    var innerGroup = this.doc.getElementById("group2");
    innerGroup.setAttribute("style", "display: inherit;");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Transparent at 40,40 [parent group's visible overrides child]");

    innerGroup.setAttribute("style", "display: none;");
    outerGroup.setAttribute("style", "display: inherit;");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Transparent at 40,40 [child group's visible overrides parent]");

    innerGroup.setAttribute("style", "display: inherit;");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,255,255], "Blue at 40,40 [both visible, child material overrides parent]");

    /*innerGroup.setAttribute("material", "");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,255,0,255], "Yellow at 40,40 [remove child material, #flatYellow active]");

    innerGroup.setAttribute("material", "#flatblue");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,255,255], "Blue at 40,40 [re-add child material]");

    outerGroup.setAttribute("material", "#flatblack");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,255,255], "Blue at 40,40 [child material overrides new parent material]");*/
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

test("Nested transforms", 8, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);
    var group3 = this.doc.getElementById("group3");
    var group4 = this.doc.getElementById("group4");

    group3.style.display = 'inherit';
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,0,255], "Red at 90,90 [nested y-axis rotations]");

    var t3 = this.doc.getElementById("t_group3");
    var t4 = this.doc.getElementById("t_group4");
    t3.setAttribute("rotation", "0 1 0 0");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,0,0], "Transparent at 90,90 [outer rotation 0, inner 90]");

    // Rotate both inner and outer around y-axis 90 degrees, should flip the shape around
    t3.setAttribute("rotation", "0 1 0 1.57");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,0,255], "Red at 90,90 [set outer rotation 90]");

    // Rotate inner -90 around local x-axis (actually around z since we've rotated 90 around x first)
    t4.setAttribute("rotation", "1 0 0 -1.57");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,0,0], "Transparent at 90,90 [inner x-axis rotation -90]");

    // Rotate outer 90 around x-axis, this should undo the -90 x-axis rotation of inner
    t3.setAttribute("rotation", "1 0 0 1.57");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,0,255], "Red at 90,90 [cancel inner rotation with outer]");

    // Move the shape 3 units to the right so it's off the screen
    t4.setAttribute("translation", "3 0 0");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,0,0], "Transparent at 90,90 [add inner translation]");

});

test("Camera with group transforms", 7, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);
    var group5 = this.doc.getElementById("group5");
    var camTransform = this.doc.getElementById("t_camera1");
    var view = this.doc.getElementById("transformTestView");
    var camtest = this.doc.getElementById("viewTest");

    //Simple test of camera orientation to check that view matrix is built correctly
    camtest.style.display = 'inherit';
    x.setAttribute("activeView", "#viewOrientationTest");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,0,255], "Simple camera orientation check, Red");

    camtest.style.display = 'none';
    group5.style.display = 'inherit';
    x.setAttribute("activeView", "#transformTestView");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,255,0,255], "Camera facing back of cube, Yellow");

    camTransform.setAttribute("rotation", "1 0 0 1.57");
    camTransform.setAttribute("translation", "0 3 0");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,255,255], "Camera facing top of cube, Blue");

    view.setAttribute("orientation", "0 1 0 0");
    camTransform.setAttribute("translation", "0 -6 0");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,255,255], "Camera facing bottom of cube, Purple");

    view.setAttribute("orientation", "0 0 0 0");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,255,255], "Camera with orientation '0 0 0 0', Purple");

});

test("Camera setDirection/upVector", 5, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);
    var group5 = this.doc.getElementById("group5");
    var view = this.doc.getElementById("viewOrientationTest");
    var camtest = this.doc.getElementById("viewTest");

    camtest.style.display = 'inherit';
    view.setAttribute("orientation", "0 0 1 0");
    x.setAttribute("activeView", "#viewOrientationTest");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,0,0], "Camera looking down z axis, transparent");

    view.setDirection(XML3D.math.vec3.fromValues(1, 0, 0));
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,0,255], "Camera looking to the right, red");

    view.setUpVector(XML3D.math.vec3.fromValues(0, -1, 0));
    view.setDirection(XML3D.math.vec3.fromValues(-1, 0, 0));
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,255,0,255], "Camera looking left, yellow");
});

test("Add a mesh dynamically", 4, function() {
    var x = this.doc.getElementById("xml3DElem");
    var g = this.doc.getElementById("myGroup");
    var count = 0;
    var doc = this.doc;

    x.addEventListener("framedrawn", function(n) {
            if (count == 0) {
                equal(n.detail.count.objects, 1, "Initially one drawable object");
                var group = doc.createElementNS(XML3D.xml3dNS,"group");
                var mesh = doc.createElementNS(XML3D.xml3dNS,"mesh");
                mesh.setAttribute('id',"new_mesh");
                mesh.setAttribute('src',"#meshdata");
                g.appendChild(group);
                group.appendChild(mesh);
                stop();
            } else if (count == 1) {
                equal(n.detail.count.objects, 2, "Now two drawable objects");
            }
            count++;
            start();
    });
    stop();
    g.style.visible = 'inherit';
});

test("Add invisible groups and meshes", 7, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);

    var mesh = this.doc.createElementNS("http://www.xml3d.org/2009/xml3d", "mesh");
    mesh.setAttribute("src", "#meshdata");
    mesh.setAttribute("visible", "false");

    // Add a mesh
    x.appendChild(mesh);
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Mesh is invisible");

    mesh.setAttribute("visible", "true");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Mesh is now visible");
    x.removeChild(mesh);

    var group = this.doc.createElementNS("http://www.xml3d.org/2009/xml3d", "group");
    group.setAttribute("visible", "false");
    group.appendChild(mesh);
    x.appendChild(group);
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Group is invisible");

    group.setAttribute("visible", "true");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Group is visible");
    x.removeChild(group);

    mesh.setAttribute("visible", "false");
    h.draw();
    x.appendChild(group);
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Mesh inside group is invisible");

});
