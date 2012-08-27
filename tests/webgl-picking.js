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
    var picked = h.updatePickObjectByPoint(88,60);
    ok(h.currentPickObj, "Object picked");
    strictEqual(h.currentPickObj, picked, "Return value matches");
    strictEqual(h.currentPickObj, this.doc.getElementById("pickingMesh1"), "Picked object 'pickingMesh1'");

    picked = h.updatePickObjectByPoint(5,5);
    strictEqual(h.currentPickObj, null, "Nothing picked");
    strictEqual(h.currentPickObj, picked, "Return value matches");
});

test("Pick with large object ids", function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var h = getHandler(xml3dElement);
    var picked = h.updatePickObjectByPoint(220,150);
    ok(h.currentPickObj, "Object picked");
    strictEqual(h.currentPickObj, picked, "Return value matches");
    strictEqual(h.currentPickObj, this.doc.getElementById("pickingMesh6"), "Picked object 'pickingMesh1'");

});

test("xml3d Apadater getElementByPoint test", function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var element = xml3dElement.getElementByPoint(88,60);
    ok(element, "Object picked");
    strictEqual(element, this.doc.getElementById("pickingMesh1"));

    element = xml3dElement.getElementByPoint(5,5);
    strictEqual(element, null, "Nothing picked");
});

test("Position picking test", 3, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var h = getHandler(xml3dElement);
    var target = this.doc.getElementById("pickingMesh1");

    target.addEventListener("click", function(evt) {
    	start();
    	ok(evt.position);
    }, false);

    h.updatePickObjectByPoint(88,60);
    h.dispatchMouseEvent("click", 1, 88, 60, null, target);
    stop();
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

    h.updatePickObjectByPoint(88,60);
    h.dispatchMouseEvent("click", 1, 88, 60, null, target);
    stop();
});

