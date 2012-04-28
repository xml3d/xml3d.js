module("WebGL Rendering", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering01.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }

});

function getContextForXml3DElement(x) {
    return x._configured.adapters.XML3DRenderAdapterFactory.factory.handler.gl;
};

function getHandler(x) {
	return x._configured.adapters.XML3DRenderAdapterFactory.factory.handler;
};

test("Background and invisible mesh", 4, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);

    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Transparent at 40,40");
    actual = win.getPixelValue(gl, 0, 0);
    deepEqual(actual, [0,0,0,0], "Transparent at 0,0");
});

test("Change visibility via script", 9, function() {
    var x = this.doc.getElementById("xml3DElem"),
        actual,
        win = this.doc.defaultView,
        gl = getContextForXml3DElement(x),
        testFunc = null, h = getHandler(x);

    x.addEventListener("framedrawn", function(n) {
            ok("Redraw was triggered");
            ok(!h.needDraw, "Redraw not required");
            if(testFunc)
                testFunc(n);
            start();
    });
    testFunc = function(n) {
        equal(n.detail.numberOfObjectsDrawn, 1, "1 Object drawn");
        equal(n.detail.numberOfTrianglesDrawn, 2, "2 Triangles drawn");
        actual = win.getPixelValue(gl, 40, 40);
        deepEqual(actual, [255,0,0,255], "Red at 40,40");
        actual = win.getPixelValue(gl, 0, 0);
        deepEqual(actual, [0,0,0,0], "Transparent at 0,0");
    };
    stop();
    this.doc.getElementById("myGroup").visible = true;
    ok(h.needDraw, "Redraw required");
});

test("Change active view via script", 7, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("xml3DElem");
    var h = getHandler(x);
    x.addEventListener("framedrawn", function(n) {
            ok("Redraw was triggered"); // 6
            ok(!h.needDraw, "Redraw not required"); // 7
            start();
    });
    stop();
    equal(x.activeView, "#defaultView", "Initial active view is #default"); // 3
    x.activeView = "#viewOrientationTest";
    equal(x.activeView, "#viewOrientationTest", "New active view is #viewOrientationTest"); // 4
    ok(h.needDraw, "Redraw required"); // 5, fails in < 920181
});


test("Test mesh.getBoundingBox", 4, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("xml3DElem");
    var h = getHandler(x);
    var group = this.doc.getElementById("myGroup");
    var mesh = this.doc.getElementById("mySimpleMesh");
    x.addEventListener("framedrawn", function(n) {
        var bb = mesh.getBoundingBox();
        var max = bb._max._data;
        var min = bb._min._data;
        
        deepEqual([max[0], max[1], max[2]], [1,1,0], "BBox max is (1,1,0)");
        deepEqual([min[0], min[1], min[2]], [-1,-1,0], "BBox min is (-1,-1,0)");
    	start();
    });
    stop();
    group.visible = true;
   
});

test("Change shader via script", 6, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);
    var group = this.doc.getElementById("myGroup");

    group.visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Red at 40,40 [visible true]");

    group.setAttribute("shader", "#flatblue");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,255,255], "Blue at 40,40 [flat shader]");

    group.setAttribute("shader", "#phonggreen");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,231,0,255], "Green at 40,40 [phong shader]");

    var shaderColor = this.doc.getElementById("phonggreen_color");
    shaderColor.textContent = "0 0 1";
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,231,255], "Blue at 40,40 [change color]");

});

test("Change visible/shader for nested groups", 8, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);

    var outerGroup = this.doc.getElementById("group1");
    var innerGroup = this.doc.getElementById("group2");
    innerGroup.setAttribute("visible", "true");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Transparent at 40,40 [parent group's visible overrides child]");

    innerGroup.setAttribute("visible", "false");
    outerGroup.setAttribute("visible", "true");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Transparent at 40,40 [child group's visible overrides parent]");

    innerGroup.setAttribute("visible", "true");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,255,255], "Blue at 40,40 [both visible, child shader overrides parent]");

    innerGroup.setAttribute("shader", "");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,231,0,255], "Green at 40,40 [remove child shader]");

    innerGroup.setAttribute("shader", "#flatblue");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,255,255], "Blue at 40,40 [re-add child shader]");
    
    outerGroup.setAttribute("shader", "#flatblack");
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,255,255], "Blue at 40,40 [child shader overrides new parent shader]");
});

test("Add/remove meshes and groups", 6, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);

    var mesh = document.createElementNS("http://www.xml3d.org/2009/xml3d", "mesh");
    mesh.setAttribute("src", "#meshdata");
    x.appendChild(mesh);
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Red at 40,40 [add mesh]");

    x.removeChild(mesh);
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Transparent at 40,40 [remove mesh]");

    var group = document.createElementNS("http://www.xml3d.org/2009/xml3d", "group");
    group.appendChild(mesh);
    x.appendChild(group);
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [255,0,0,255], "Red at 40,40 [add group with mesh]");

    x.removeChild(group);
    h.draw();
    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,0], "Transparent at 40,40 [remove group]");
});

test("Nested transforms", 8, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);
    var group3 = this.doc.getElementById("group3");
    var group4 = this.doc.getElementById("group4");

    group3.visible = true;
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
    camtest.visible = true;
    x.setAttribute("activeView", "#viewOrientationTest");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,0,255], "Simple camera orientation check, Red");
    
    camtest.visible = false;
    group5.visible = true;
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
    
    camtest.visible = true;
    view.setAttribute("orientation", "0 0 1 0");
    x.setAttribute("activeView", "#viewOrientationTest");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,0,0], "Camera looking down z axis, transparent");
    
    view.setDirection(new XML3DVec3(1, 0, 0));
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,0,255], "Camera looking to the right, red");
  
    view.setUpVector(new XML3DVec3(0, -1, 0));
    view.setDirection(new XML3DVec3(-1, 0, 0));
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,255,0,255], "Camera looking left, yellow");
});

test("Pick pass flag", 7, function() {
    var x = this.doc.getElementById("xml3DElem");
    var h = getHandler(x);
    h.renderPick(0,0);
    ok(!h.needPickingDraw, "No picking needed after pick rendering");
    this.doc.getElementById("group2").setAttribute("shader","#flatblack");
    ok(!h.needPickingDraw, "Changing shaders does not require a picking pass");
    this.doc.getElementById("t_cubebottom").translation.x = 5;
    ok(h.needPickingDraw, "Changing transformation does require a picking pass");
    h.renderPick(0,0);
    ok(!h.needPickingDraw, "No picking needed after pick rendering");
    this.doc.getElementById("t_cubebottom").translation.x = 3;
    this.doc.getElementById("group2").setAttribute("shader","#flatblue");
    // This failed because setting shader set flag to 'false'
    ok(h.needPickingDraw, "Changing transformation does require a picking pass");
});

module("WebGL Shaders and Textures", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering02.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Simple texture", 3, function() {
	var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    testFunc = null, h = getHandler(x);	
	this.doc.getElementById("myGroup").visible = true;

	x.addEventListener("framedrawn", function(n) {
	        if(testFunc)
	            testFunc(n);        
	});
	
	testFunc = function(n) {
	    actual = win.getPixelValue(gl, 40, 40);
	    if (actual[0] == 0)
	    	return;
	    deepEqual(actual, [231,231,0,255], "Yellow texture");
	    start();
	};
	stop();

});


test("Changing texture", 3, function() {
	var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    testFunc = null, h = getHandler(x);	
	this.doc.getElementById("myGroup").visible = true;
	
	x.addEventListener("framedrawn", function(n) {
	        if(testFunc)
	            testFunc(n);
	});
	
	testFunc = function(n) {
	    actual = win.getPixelValue(gl, 40, 40);
	    if (actual[0] == 0)
	    	return;
	    deepEqual(actual, [231,0,231,255], "Magenta texture");
	    start();
	};
	
	stop();
	this.doc.getElementById("tex1img").setAttribute("src", "textures/magenta.png");
	
});

test("NPOT texture resizing", 4, function() {
	var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    testFunc = null, h = getHandler(x);	
	
	x.addEventListener("framedrawn", function(n) {
	        if(testFunc)
	            testFunc(n);
	});
	
	testFunc = function(n) {
	    actual = win.getPixelValue(gl, 40, 40);
	    if ((actual[1] + actual[2]) == 0)
	    	return;
	    deepEqual(actual, [0,231,0,255], "Green at 40,40");
	    actual = win.getPixelValue(gl, 120, 80);
	    deepEqual(actual, [0,0,231,255], "Blue at 120,80");
	    start();
	};
	
	this.doc.getElementById("npotTexGroup").visible = true;
	stop();
	
});

test("Textured diffuse shader", 3, function() {
	var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    testFunc = null, h = getHandler(x);
	var group = this.doc.getElementById("diffuseTexGroup");
	group.visible = true;

	x.addEventListener("framedrawn", function(n) {
	        if(testFunc)
	            testFunc(n);
	});
	
	testFunc = function(n) {
		actual = win.getPixelValue(gl, 40, 40);
		if (actual[0] == 0) //texture hasn't finished loading yet
			return;
		deepEqual(actual, [231,231,0,255], "Yellow diffuse texture");
		start();
	};
	
	stop();
});

test("Diffuse shader with vertex colors", 3, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);
    var cgroup = this.doc.getElementById("coloredMeshGroup");
    
    cgroup.visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    QUnit.closePixel(actual, [102,102,27,255], 1, "Corners have colors red, yellow, green, blue");

});

test("Custom shader", 4, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);

    var cshader = this.doc.getElementById("customShader");
    var group = this.doc.getElementById("myGroup");
    group.visible = true;
    group.setAttribute("shader", "#customShader");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,255,0,255], "Yellow custom shader");

    //The shader has a green diffuseColor parameter that should override the standard blue
    cshader.setAttribute("script", "urn:xml3d:shader:phong");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,231,0,255], "Change shader script to standard phong");

});


module("Multiple XML3D nodes", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/multiple-canvas.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Default view with no activeView set", 3, function() {
    var x = this.doc.getElementById("xml3DElem2"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    
    actual = win.getPixelValue(gl, 275, 100);
    deepEqual(actual, [0,0,0,0], "Found correct view node");
});

