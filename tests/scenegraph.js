EPSILON = 0.001;

module("Transformation hierarchy", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/basic.html", this.cb);
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

    var a = XML3D.math.mat4.create();
    for (var elem in elems)
        QUnit.closeMatrix(elems[elem].getWorldMatrix(), a, EPSILON, "Untransformed " + elems[elem].nodeName
                + " delivers indentity world matrix");

    QUnit.closeMatrix(elems.view.getViewMatrix().data, a, EPSILON, "Untransformed view matrix");
});

test("View Transformation local", function() {
    var view = this.doc.getElementById("myView");

    var m = XML3D.math.mat4.create();
    XML3D.math.mat4.translate(m,m,[0,0,10]);
    XML3D.math.mat4.invert(m, m);

    view.style.transform = "translate3d(0,0,10px)";
    QUnit.closeMatrix(view.getViewMatrix(), m, EPSILON, "View translated to 0,0,10.");
    QUnit.close(view.getViewMatrix().data[14], -10, EPSILON, "Checked entry in matrix");

    // Turn around
    view.style.transform += "rotate3d(1,0,0,90deg)";

    var q = XML3D.math.vec4.create();
    m = XML3D.math.mat4.create();
    var axis = XML3D.math.vec3.fromValues(1, 0, 0);

    XML3D.math.quat.setAxisAngle(q, axis, Math.PI /2);
    XML3D.math.mat4.fromRotationTranslation(m, q, [0,0,10]);
    XML3D.math.mat4.invert(m,m);
    QUnit.closeMatrix(view.getViewMatrix(), m, EPSILON, "View oriented around x-Axis.");
    QUnit.close(view.getViewMatrix().data[13], -10, EPSILON, "Checked entry in matrix");
    QUnit.close(view.getViewMatrix().data[6], -1, EPSILON, "Checked entry in matrix");

    view.setAttribute("style", "transform: translate3d(1px, 2px, 3px) rotate3d(0, 1, 0, 45deg);");
    // console.log(view.style.transform);
    m = XML3D.math.mat4.create();
    XML3D.math.mat4.translate(m, m, [1,2,3]);
    XML3D.math.mat4.rotate(m, m, Math.PI / 4, [0, 1, 0]);
    XML3D.math.mat4.invert(m, m);
    QUnit.closeMatrix(view.getViewMatrix(), m, EPSILON, "View set with attributes.");
    var halfSqrt = Math.sqrt(0.5);
    QUnit.close(view.getViewMatrix().data[0], halfSqrt, EPSILON, "Checked entry in matrix");
    QUnit.close(view.getViewMatrix().data[2], halfSqrt, EPSILON, "Checked entry in matrix");
    QUnit.close(view.getViewMatrix().data[8], -halfSqrt, EPSILON, "Checked entry in matrix");
    QUnit.close(view.getViewMatrix().data[10], halfSqrt, EPSILON, "Checked entry in matrix");
});

test("Group Transformation local", function() {
    var group = this.doc.getElementById("myGroup");
    group.setAttribute("transform", "#t_identity");
    var a = XML3D.math.mat4.create();
    QUnit.closeMatrix(group.getLocalMatrix(), a, EPSILON, "Group references #t_identity: local Matrix");
    QUnit.closeMatrix(group.getWorldMatrix(), XML3D.math.mat4.create(), EPSILON, "Global transformation is identity");

    XML3D.math.mat4.translate(a, a, [1, 2, 3]);
    group.setAttribute("transform", "#t_translation");
    QUnit.closeMatrix(group.getLocalMatrix(), a, EPSILON, "Group references #t_translation: local Matrix");
    QUnit.closeMatrix(group.getWorldMatrix(), group.getLocalMatrix(), EPSILON, "Global matrix is the same");

    a = [1, 0, 0, 0, 0, -0, 1, 0, 0, -1, -0, 0, 0, 0, 0, 1];
    group.setAttribute("transform", "#t_rotation");
    QUnit.closeMatrix(group.getLocalMatrix(), a, EPSILON, "Group references #t_rotation: local Matrix");

    a = XML3D.math.mat4.scale(a, XML3D.math.mat4.create(), [1, 2, 3]);
    group.setAttribute("transform", "#t_scale");
    QUnit.closeMatrix(group.getLocalMatrix(), a, EPSILON, "Group references #t_scale: local Matrix");

    a = [1, 0, 0, 0, 0, 0, 2, 0, 0, -3, 0, 0, 1, 2, 3, 1];
    group.setAttribute("transform", "#t_mixed");
    QUnit.closeMatrix(group.getLocalMatrix(), a, EPSILON, "Group references #t_mixed: local Matrix");

    });

test("Hierarchy", function() {
    var parent = this.doc.getElementById("parentGroup");
    var child1 = this.doc.getElementById("child01");
    var child2 = this.doc.getElementById("child02");
    var a = XML3D.math.mat4.create();
    XML3D.math.mat4.rotateX(a, a, Math.PI/2.0);
    QUnit.closeMatrix(parent.getLocalMatrix(), a, EPSILON, "Local Matrix");
    QUnit.closeMatrix(parent.getWorldMatrix(), parent.getLocalMatrix(), EPSILON, "Global transformation same as local");
    QUnit.closeMatrix(child1.getLocalMatrix(), XML3D.math.mat4.create(), EPSILON, "Child1 matrix is identity");
    QUnit.closeMatrix(child1.getLocalMatrix(), XML3D.math.mat4.create(), EPSILON, "Child2 matrix is identity");
    QUnit.closeMatrix(child1.getWorldMatrix(), parent.getWorldMatrix(), EPSILON, "World Matrix of child");
    QUnit.closeMatrix(child1.getWorldMatrix(), child2.getWorldMatrix(), EPSILON, "World Matrix of child");
    child1.transform = "#t_rotation2";
    var mat = new XML3D.Mat4();
    QUnit.closeMatrix(child1.getLocalMatrix(),mat.rotateY(Math.PI/2.0), EPSILON, "Child1 matrix is now a rotation matrix.");
    mat = parent.getWorldMatrix();
    QUnit.closeMatrix(child1.getWorldMatrix(), mat.rotateY(Math.PI/2.0), EPSILON, "World Matrix of child not changed through local matrix change.");
    QUnit.closeMatrix(child2.getLocalMatrix(), XML3D.math.mat4.create(), EPSILON, "Child2 matrix is still identity");

    //Change parent transformation
    parent.transform = "#t_rotation3";
    mat = new XML3D.Mat4();
    QUnit.closeMatrix(parent.getLocalMatrix(), mat.rotateZ(Math.PI/2.0), EPSILON, "New parent local matrix");
    mat = new XML3D.Mat4();
    QUnit.closeMatrix(child1.getWorldMatrix(), mat.rotateZ(Math.PI/2.0).rotateY(Math.PI/2.0), EPSILON, "New child1 global matrix");
    // Failed in 361f96c because of reference copies in transformation propagation
    QUnit.closeMatrix(child2.getWorldMatrix(), parent.getWorldMatrix(), EPSILON, "New child2 global matrix");

    var t = this.doc.getElementById("t_rotation3");
    t.translation = new XML3D.Vec3(1,2,3);
    mat = new XML3D.Mat4();
    QUnit.closeMatrix(parent.getLocalMatrix(), mat.translate([1,2,3]).rotateZ(Math.PI/2.0), EPSILON, "New parent local matrix");
    mat = parent.getLocalMatrix();
    QUnit.closeMatrix(child1.getWorldMatrix(), mat.rotateY(Math.PI/2.0), EPSILON, "New child1 global matrix");
    // Failed in 361f96c because of reference copies in transformation propagation
    QUnit.closeMatrix(child2.getWorldMatrix(), parent.getLocalMatrix(), EPSILON, "New child2 global matrix");
});

test("Transformation creates non-regular matrix", 2, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("myXml3d");
    var t = this.doc.getElementById("t_regular");
    var h = getHandler(x);
    t.scale = XML3D.math.vec3.fromValues(0,0,0); // Used to throw exception due to singular matrix
    h && h.draw();
});

// ============================================================================
// === Bounding Boxes ===
// ============================================================================
module("Bounding Boxes", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.win = document.getElementById("xml3dframe").contentWindow;
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.xml3dElement = that.doc.getElementById("myXml3d");
            start();
        };
        loadDocument("scenes/boundingBox.html", this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});



test("Groups and Meshes, Local space", 18, function() {
    var frontTopMeshBox = this.doc.getElementById("m_TopFront").getLocalBoundingBox();
    var frontBotMeshBox = this.doc.getElementById("m_BotFront").getLocalBoundingBox();
    var emptyBox = this.doc.getElementById("empty_group").getLocalBoundingBox();
    var rootBox = this.doc.getElementById("g_Root").getLocalBoundingBox();
    var topCubeBox = this.doc.getElementById("g_TopCube").getLocalBoundingBox();
    var botCubeBox = this.doc.getElementById("g_BotCube").getLocalBoundingBox();
    var cubeMeshBox = this.doc.getElementById("cube_mesh").getLocalBoundingBox();
    var cubeGroupBox = this.doc.getElementById("cube_group").getLocalBoundingBox();
    var splitCubeBox1 = this.doc.getElementById("split_cube_mesh1").getLocalBoundingBox();
    var splitCubeBox2 = this.doc.getElementById("split_cube_mesh2").getLocalBoundingBox();
    var scaled_group = this.doc.getElementById("scaled_group").getLocalBoundingBox();
    var translated_group = this.doc.getElementById("translated_group").getLocalBoundingBox();
    var rotated_group = this.doc.getElementById("rotated_group").getLocalBoundingBox();
    var hierarchy = this.doc.getElementById("hierarchy").getLocalBoundingBox();
    var hierarchyScaled = this.doc.getElementById("hierarchy-scaled").getLocalBoundingBox();
    var hierarchy2Scaled = this.doc.getElementById("hierarchy2-scaled").getLocalBoundingBox();
    ok(emptyBox.isEmpty(), "Empty group delivers empty BoundingBox");

    QUnit.closeArray(frontTopMeshBox.data, [-1,-1,0,1,1,0], EPSILON, "Front rectangle of top cube: (-1 -1 0) to (1 1 0)");
    QUnit.closeArray(frontBotMeshBox.data,[-1,-1,0,1,1,0], EPSILON, "Front rectangle of bottom cube: (-1 -1 0) to (1 1 0)");
    QUnit.closeArray(topCubeBox.data, [-1,1.5,-1,1,3.5,1], EPSILON, "Top cube: (-1 1.5 -1) to (1 3.5 1)");
    QUnit.closeArray(botCubeBox.data, [-1,-3.5,-1,1,-1.5,1], EPSILON, "Bottom cube: (-1 -3.5 -1) to (1 -1.5 1)");
    QUnit.closeArray(cubeMeshBox.data, [-1,-1,-1,1,1,1], EPSILON, "Unity cube mesh: (-1 -1 -1) to (1 1 1)");
    QUnit.closeArray(cubeGroupBox.data, cubeMeshBox.data, EPSILON, "No transformation: mesh and group equal.");
    QUnit.closeArray(scaled_group.data, [-20,-5,-20,20,5,20], EPSILON, "Scaled group.");
    QUnit.closeArray(translated_group.data, [0,-2,4,2,0,6], EPSILON, "Translated group.");
    var sq2 = 1.4098814725875854;
    QUnit.closeArray(rotated_group.data, [-1, -sq2, -sq2,1, sq2, sq2], EPSILON, "Rotated group.");
    QUnit.closeArray(hierarchy.data, [-20, -16.79395294189453, -18.45308494567871,20, 16.79395294189453, 18.45308494567871], EPSILON, "Hierarchy.");
    QUnit.closeArray(hierarchyScaled.data, [-20, -5, -20,20, 5, 20], EPSILON, "Hierarchy scale only");
    QUnit.closeArray(hierarchy2Scaled.data, [-20, -5, -20,20, 5, 20], EPSILON, "Hierarchy2 scale only");
    QUnit.closeArray(rootBox.data, scaled_group.data, EPSILON, "Overall");
    QUnit.closeArray(splitCubeBox1.data,[0, -1, -1,1, 1, 1], EPSILON, "Split part 1");
    QUnit.closeArray(splitCubeBox2.data, [-1, -1, -1,0, 1, 1], EPSILON, "Split part 2");
});

test("Groups and Meshes, World space", 11, function() {
    var frontTopMeshBox = this.doc.getElementById("m_TopFront").getWorldBoundingBox();
    var frontBotMeshBox = this.doc.getElementById("m_BotFront").getWorldBoundingBox();
    var topCubeBox = this.doc.getElementById("g_TopCube").getWorldBoundingBox();
    var botCubeBox = this.doc.getElementById("g_BotCube").getWorldBoundingBox();
    var cubeMeshBox = this.doc.getElementById("cube_mesh").getWorldBoundingBox();
    var cubeGroupBox = this.doc.getElementById("cube_group").getWorldBoundingBox();
    var hierarchyScaled = this.doc.getElementById("hierarchy-scaled").getWorldBoundingBox();
    var hierarchyMesh = this.doc.getElementById("hierarchy-mesh").getWorldBoundingBox();
    var wholeScene = this.doc.getElementById("myXml3d").getWorldBoundingBox();

    QUnit.closeArray(frontTopMeshBox.data, [-1,1.5,1,1,3.5,1], EPSILON, "Front rectangle of top cube: (-1 1.5 1) to (1 3.5 1)");
    QUnit.closeArray(frontBotMeshBox.data, [-1,-3.5,1,1,-1.5,1], EPSILON, "Front rectangle of bottom cube: (-1 -3.5 1) to (1 -1.5 1)");
    QUnit.closeArray(topCubeBox.data, [-1,1.5,-1,1,3.5,1], EPSILON, "Top cube: (-1 1.5 -1) to (1 3.5 1)");
    QUnit.closeArray(botCubeBox.data, [-1,-3.5,-1,1,-1.5,1], EPSILON, "Bottom cube: (-1 -3.5 -1) to (1 -1.5 1)");
    QUnit.closeArray(cubeMeshBox.data, [-1,-1,-1,1,1,1], EPSILON, "Unity cube mesh: (-1 -1 -1) to (1 1 1)");
    QUnit.closeArray(cubeGroupBox.data, cubeMeshBox.data, EPSILON, "No transformation: mesh and group equal.");
    QUnit.closeArray(hierarchyScaled.data, [-20, -16.79395294189453, -18.45308494567871,20, 16.79395294189453, 18.45308494567871], EPSILON, "Hierarchy 2nd level");
    QUnit.closeArray(hierarchyMesh.data, [-20, -16.79395294189453, -18.45308494567871,20, 16.79395294189453, 18.45308494567871], EPSILON, "Hierarchy mesh");
    QUnit.closeArray(wholeScene.data, [-20, -16.79395294189453, -20,21, 16.79395294189453, 25], EPSILON, "Whole scene");
});

test("Hidden groups", 5, function() {
    var root = this.doc.getElementById("g_Root");
    //root.style.display = 'none';
    var group = this.doc.getElementById("g_PartiallyHidden");
    group.style.display = 'inherit';
    this.win.XML3D.flushDOMChanges();

    var boundingBox = group.getWorldBoundingBox();
    QUnit.closeArray(boundingBox.data, [2,1.5,-1,4,3.5,1], EPSILON, "Hidden child group: (2 1.5 -1) to (4 3.5 1)");
    this.doc.getElementById("invisible_cube").style.display = 'inherit';
    boundingBox = group.getWorldBoundingBox();
    QUnit.closeArray(boundingBox.data, [-4,1.5,-1,4,3.5,1], EPSILON, "Visible child group: (-4 1.5 -1) to (4 3.5 1)");
    this.doc.getElementById("invisible_mesh").style.display = 'none';
    boundingBox = group.getWorldBoundingBox();
    QUnit.closeArray(boundingBox.data, [2,1.5,-1,4,3.5,1], EPSILON, "Hidden child mesh: (2 1.5 -1) to (4 3.5 1)");
});

test("Dynamically added mesh", function() {

    var mesh = this.win.XML3D.createElement("mesh");

    ok(mesh.getLocalBoundingBox().isEmpty(), "Newly created mesh delivers empty bounding box");

    mesh.setAttribute("type", "triangles");
    mesh.setAttribute("src", "#mySimpleMesh");

    this.xml3dElement.appendChild(mesh);

    // renderadapter is initialized but mesh data is still not initialized
    //ok(mesh.getBoundingBox().isEmpty(), "Appended mesh delivers empty bounding box");
    QUnit.closeArray(mesh.getLocalBoundingBox().data, [-1, -1, 0,1,1,0], EPSILON,
        "simple mesh bounding box: (-1 -1 0) to (1 1 0)");

    //Mesh changes are not applied until frame renders
    var h = getHandler(this.xml3dElement);
    h.draw();

    QUnit.closeArray(mesh.getLocalBoundingBox().data, [-1, -1, 0,1,1,0], EPSILON,
            "simple mesh bounding box: (-1 -1 0) to (1 1 0)");
});

test("Dynamically added group", function() {

    var mesh = this.win.XML3D.createElement("mesh");

    ok(mesh.getLocalBoundingBox().isEmpty(), "Newly created mesh delivers empty bounding box");

    mesh.setAttribute("type", "triangles");
    mesh.setAttribute("src", "#mySimpleMesh");

    var group = this.win.XML3D.createElement("group");
    group.appendChild(mesh);
    this.xml3dElement.appendChild(group);

    // renderadapter is initialized but mesh data is still not initialized
    //ok(mesh.getBoundingBox().isEmpty(), "Appended mesh delivers empty bounding box");
    QUnit.closeArray(mesh.getLocalBoundingBox().data, [-1, -1, 0,1,1,0], EPSILON,
        "simple mesh bounding box: (-1 -1 0) to (1 1 0)");

    QUnit.closeArray(group.getLocalBoundingBox().data, [-1, -1, 0,1,1,0], EPSILON,
        "simple group bounding box: (-1 -1 0) to (1 1 0)");

});

//============================================================================
//=== getWorldMatrix ===
//============================================================================

module("getWorldMatrix() Tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.setupMatrices();
            start();
        };

        loadDocument("scenes/basic.html", this.cb);
    },

    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    },

    setupMatrices : function() {

        // t_rotation
        this.matRot = [
                1,  0, 0, 0,
                0,  0, 1, 0,
                0, -1, 0, 0,
                0,  0, 0, 1];

        // t_rotation2
        this.matRot2 = [
                 0, 0, -1, 0,
                 0, 1,  0, 0,
                 1, 0,  0, 0,
                 0, 0,  0, 1];

        // t_rotation3
        this.matRot3 = [
                 0, 1, 0, 0,
                -1, 0, 0, 0,
                 0, 0, 1, 0,
                 0, 0, 0, 1];

        // t_mixed
        this.matMixed = [
                1,  0, 0, 0,
                0,  0, 2, 0,
                0, -3, 0, 0,
                1,  2, 3, 1];
    },

    /**
     * Simple test: existence of method, setting of parent transform and recompute matrix.
     *
     * @param {!Object} node the node under test
     */
    simpleMatrixTest : function(node) {

        var parGrp = node.parentNode;

        ok(node.getWorldMatrix, "getWorldMatrix exists");

        QUnit.closeMatrix(node.getWorldMatrix(), XML3D.math.mat4.create(), EPSILON, "identity");

        parGrp.setAttribute("transform", "#t_mixed");
        QUnit.closeMatrix(node.getWorldMatrix(), this.matMixed, EPSILON, "parent='#t_mixed'");
    }
});

test("group's getWorldMatrix()", function() {

    var child01 = this.doc.getElementById("child01");
    var parGrp = this.doc.getElementById("parentGroup");

    ok(child01.getWorldMatrix, "getWorldMatrix exists");

    // parent's transform: t_rotation
    var mat = child01.getWorldMatrix();
    QUnit.closeMatrix(mat, this.matRot, EPSILON, "parent='#t_rotation'.");

    // parent's transform: t_rotation2
    parGrp.setAttribute("transform", "#t_rotation2");

    mat = child01.getWorldMatrix();
    QUnit.closeMatrix(mat, this.matRot2, EPSILON, "parent='#t_rotation2'.");

    // parent is t_rotation3 and child is t_mixed
    parGrp.setAttribute("transform", "#t_rotation3");
    child01.setAttribute("transform", "#t_mixed");

    mat = child01.getWorldMatrix();
    XML3D.math.mat4.mul(this.matRot3, this.matRot3, this.matMixed);
    QUnit.closeMatrix(mat, this.matRot3, EPSILON, "parent='#t_rotation3' and child='#t_mixed'.");
});

test("mesh's getWorldMatrix()", function() {
    this.simpleMatrixTest(this.doc.getElementById("myMesh01"));
});

test("light's getWorldMatrix()", function() {
    //(Rotation of PointLight might be ignored, resulting in wrong result)
    this.simpleMatrixTest(this.doc.getElementById("myLight"));
});

test("view's getWorldMatrix()", function() {
    this.simpleMatrixTest(this.doc.getElementById("myView"));
});
