module("WebGL Picking tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-picking.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});


test("Check current pick object (internal)", function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var h = getHandler(xml3dElement);
    var picked = h.getPickObjectByPoint(88,60);
    ok(h.currentPickObj, "Object picked");
    strictEqual(h.currentPickObj, picked, "Return value matches");
    strictEqual(h.currentPickObj.meshAdapter.node, this.doc.getElementById("pickingMesh1"), "Picked object 'pickingMesh1'");

    picked = h.getPickObjectByPoint(5,5);
    strictEqual(h.currentPickObj, null, "Nothing picked");
    strictEqual(h.currentPickObj, picked, "Return value matches");
});

test("Pick with large object ids", function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var h = getHandler(xml3dElement);
    var target = this.doc.getElementById("pickingMesh6");

    var drawables = h.renderer.scene.ready;
    var objId = -1;
    for ( var i = 0; i < drawables.length; i++) {
        if (drawables[i].meshAdapter.node === target) {
            objId = i;
            break;
        }
    }
    notEqual(objId, -1, "Found Drawable");
    ok(objId > 255, "Object id larger than 255");

    var picked = h.getPickObjectByPoint(220, 150);
    ok(h.currentPickObj, "Object picked");
    strictEqual(h.currentPickObj, picked, "Return value matches");
    strictEqual(h.currentPickObj.meshAdapter.node, this.doc.getElementById("pickingMesh6"), "Picked object 'pickingMesh1'");

});

test("xml3d Apadater getElementByPoint test", function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");

    var position = new XML3DVec3(), normal = new XML3DVec3();
    var element = xml3dElement.getElementByPoint(88,60, position , normal);
    ok(element, "Object picked");
    strictEqual(element, this.doc.getElementById("pickingMesh1"));
    QUnit.closeVector(normal, new XML3DVec3(0,0,1), EPSILON, "Picked correct normal");

    element = xml3dElement.getElementByPoint(5,5, position, normal);
    strictEqual(element, null, "Nothing picked");
    ok(isNaN(position.x) && isNaN(position.y) && isNaN(position.z), "Picked correct position");
    ok(isNaN(normal.x) && isNaN(normal.y) && isNaN(normal.z), "Picked correct normal");
});

test("Object picking test", 3, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var h = getHandler(xml3dElement);
    var target = this.doc.getElementById("pickingMesh1");

    target.addEventListener("click", function(evt) {
        start();
        strictEqual(evt.target, target);
    }, false);

    h.getPickObjectByPoint(88,60);
    stop();
    h.dispatchMouseEvent(h.createMouseEvent("click", { clientX: 88, clientY: 60 }), target);

});

test("Position picking test", 4, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var h = getHandler(xml3dElement);
    var target = this.doc.getElementById("pickingMesh1");

    target.addEventListener("click", function(evt) {
    	start();
    	ok(evt.position);
    	QUnit.closeVector(evt.position, new XML3DVec3(-2.503,2.01,-10), EPSILON, "Picked position is correct");
    }, false);

    h.getPickObjectByPoint(89,51);
    stop();
    h.dispatchMouseEvent(h.createMouseEvent("click", { clientX: 89, clientY: 51 }), target);
});

test("Normal picking test", 4, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var h = getHandler(xml3dElement);
    var target = this.doc.getElementById("pickingMesh1");

    target.addEventListener("click", function(evt) {
        var normal = evt.normal;
        ok(normal);
        QUnit.closeVector(evt.normal, new XML3DVec3(0,0,1), EPSILON, "Picked correct normal");
        start();
    }, false);

    h.getPickObjectByPoint(88,60);
    stop();
    h.dispatchMouseEvent(h.createMouseEvent("click", { clientX: 88, clientY: 60 }), target);
});

test("Don't pick invisible objects", 3, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var expected = this.doc.getElementById("pickingMesh_back");
    var actual = xml3dElement.getElementByPoint(215,60);
    equal(actual, expected, "Pick object behind 'pickingMesh3'");
});

test("Resizing xml3d element reinitializes buffers", 5, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var expected = this.doc.getElementById("pickingMesh7");
    var h = getHandler(xml3dElement);

    var actual = xml3dElement.getElementByPoint(299,199);
    equal(actual, expected, "Pick object 'pickingMesh7'");

    xml3dElement.style.width = "500px";
    h.tick();

    equal(h.renderer.width / h.renderer.height, 500/200, "Renderer has the right aspect ratio");

    actual = xml3dElement.getElementByPoint(416,199);
    equal(actual, expected, "Pick object 'pickingMesh7'");
});

test("Touch", function() {
    if('ontouchstart' in window) {
        console.log("Available", XML3D.webgl.events.available.indexOf("touchstart"));
        notEqual(-1, XML3D.webgl.events.available.indexOf("touchstart"), "touchstart listeners attached");
        notEqual(-1, XML3D.webgl.events.available.indexOf("touchend"), "touchend listeners attached");
        notEqual(-1, XML3D.webgl.events.available.indexOf("touchmove"), "touchmove listeners attached");

    } else {
        console.log("Not Available");
        equal(-1, XML3D.webgl.events.available.indexOf("touchstart"), "No touchstart listeners attached");
        equal(-1, XML3D.webgl.events.available.indexOf("touchend"), "No touchend listeners attached");
        equal(-1, XML3D.webgl.events.available.indexOf("touchmove"), "No touchmove listeners attached");
    }


});

