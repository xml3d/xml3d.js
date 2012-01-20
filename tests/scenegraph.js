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
    for (elem in elems)
        QUnit.closeMatrix(elems[elem].getWorldMatrix(), a, 0.000001, "Untransformed " + elems[elem].nodeName
                + " delivers indentity world matrix");

    QUnit.closeMatrix(elems.view.getViewMatrix(), a, 0.000001, "Untransformed view matrix");
});

test("View Transformation local", function() {
    var view = this.doc.getElementById("myView");

    var axis = new XML3DVec3(1, 0, 0);
    var m = new XML3DMatrix();
    m = m.translate(0, 0, 10).inverse();
    view.position.z = 10.0;
    QUnit.closeMatrix(view.getViewMatrix(), m, 0.000001, "View translated to 0,0,10.");
    QUnit.close(view.getViewMatrix().m43, -10, 0.000001, "Checked entry in matrix");

    // Turn around
        view.orientation.setAxisAngle(axis, Math.PI / 2);
        m = new XML3DMatrix().translate(0, 0, 10).rotateAxisAngle(1, 0, 0, Math.PI / 2).inverse();
        QUnit.closeMatrix(view.getViewMatrix(), m, 0.000001, "View oriented around x-Axis.");
        QUnit.close(view.getViewMatrix().m42, -10, 0.000001, "Checked entry in matrix");
        QUnit.close(view.getViewMatrix().m23, -1, 0.000001, "Checked entry in matrix");

        view.setAttribute("orientation", "0 1 0 " + Math.PI / 4);
        view.setAttribute("position", "1 2 3");
        m = new XML3DMatrix().translate(1, 2, 3).rotateAxisAngle(0, 1, 0, Math.PI / 4).inverse();
        QUnit.closeMatrix(view.getViewMatrix(), m, 0.000001, "View set with attributes.");
        var halfSqrt = Math.sqrt(0.5);
        QUnit.close(view.getViewMatrix().m11, halfSqrt, 0.000001, "Checked entry in matrix");
        QUnit.close(view.getViewMatrix().m13, halfSqrt, 0.000001, "Checked entry in matrix");
        QUnit.close(view.getViewMatrix().m31, -halfSqrt, 0.000001, "Checked entry in matrix");
        QUnit.close(view.getViewMatrix().m33, halfSqrt, 0.000001, "Checked entry in matrix");
    });

test("Group Transformation local", function() {
    var group = this.doc.getElementById("myGroup");
    group.setAttribute("transform", "#t_identity");
    var a = new XML3DMatrix();
    QUnit.closeMatrix(group.getLocalMatrix(), a, 0.000001, "Group references #t_identity: local Matrix");
    QUnit.closeMatrix(group.getWorldMatrix(), new XML3DMatrix(), 0.000001, "Global transformation is identity");

    a = a.translate(1, 2, 3);
    group.setAttribute("transform", "#t_translation");
    QUnit.closeMatrix(group.getLocalMatrix(), a, 0.000001, "Group references #t_translation: local Matrix");
    QUnit.closeMatrix(group.getWorldMatrix(), new XML3DMatrix(), 0.000001, "Global transformation is identity");

    a = new XML3DMatrix(1, 0, 0, 0, 0, -0, 1, 0, 0, -1, -0, 0, 0, 0, 0, 1);
    group.setAttribute("transform", "#t_rotation");
    QUnit.closeMatrix(group.getLocalMatrix(), a, 0.000001, "Group references #t_rotation: local Matrix");

    a = new XML3DMatrix().scale(1, 2, 3);
    group.setAttribute("transform", "#t_scale");
    QUnit.closeMatrix(group.getLocalMatrix(), a, 0.000001, "Group references #t_scale: local Matrix");

    a = new XML3DMatrix(1, 0, 0, 0, 0, 0, 2, 0, 0, -3, 0, 0, 1, 2, 3, 1);
    group.setAttribute("transform", "#t_mixed");
    QUnit.closeMatrix(group.getLocalMatrix(), a, 0.0001, "Group references #t_mixed: local Matrix");

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
