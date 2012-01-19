var setupScene = function(url, f) {
    var v = document.getElementById("xml3dframe");
    ok(v, "Found frame.");
    v.style.float = "right";
    v.style.width = "500px";
    v.style.height = "300px";
    v.addEventListener("load", f, true);
    v.src = url;
};

module("Transformation hierarchy", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/basic.xhtml", this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Defaults", function() {
        var elems = {};
        elems.group = this.doc.getElementById("myGroup");
        elems.mesh = this.doc.getElementById("myMesh01");
        elems.view = this.doc.getElementById("myView");
        elems.light = this.doc.getElementById("myLight");

        var a = new XML3DMatrix();
        for(elem in elems)
            QUnit.closeMatrix(elems[elem].getWorldMatrix(), a, 0.000001, "Untransformed "+elems[elem].nodeName+" delivers indentity world matrix");

        QUnit.closeMatrix(elems.view.getViewMatrix(), a, 0.000001, "Untransformed view matrix");
});

test("Modification", function() {
    var elems = {};
    elems.group = this.doc.getElementById("myGroup");
    elems.mesh = this.doc.getElementById("myMesh01");
    elems.view = this.doc.getElementById("myView");
    elems.light = this.doc.getElementById("myLight");

    var a = new XML3DMatrix();
    a = a.translate(0,0,10).inverse();
    elems.view.position.z = 10.0;
    QUnit.closeMatrix(elems.view.getViewMatrix(), a, 0.000001, "View translated to 0,0,10.");
});

module("Bounding Boxes", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/basic.xhtml", this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Defaults", function() {
    var xml3d = this.doc.getElementById("myXml3d");
    ok(xml3d.getBoundingBox().isEmpty(), "Empty xml3d delivers empty BoundingBox");

    var group = this.doc.getElementById("myGroup");
    ok(group.getBoundingBox().isEmpty(), "Empty group delivers empty BoundingBox");

    var mesh = this.doc.getElementById("myMesh01");
    ok(mesh.getBoundingBox().isEmpty(), "Empty mesh delivers empty BoundingBox");
});
