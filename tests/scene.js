module("RenderScene", {
    setup: function () {
        this.scene = new XML3D.webgl.Scene();
        this.xflowGraph = new Xflow.Graph();

    }
});

test("Light attributes", 10, function () {

    var dataNode = this.xflowGraph.createDataNode(false);

    var light = this.scene.createRenderLight({
        light: {
            data: dataNode
        }
    });

    equal(light.localIntensity, 1.0, "Local intensity default");
    var actualVector = new XML3DVec3();
    actualVector.set(light.intensity);
    QUnit.closeVector(actualVector, new XML3DVec3(1, 1, 1), EPSILON, "Intensity default");

    equal(this.scene.lights.directional.length, 1, "Light without type is in directional container (default)");
    light.setLightType("spot");
    equal(light.light.type, "spot", "Changed type to 'spot'");

    equal(this.scene.lights.directional.length, 0, "Light has left directional light container");
    equal(this.scene.lights.spot.length, 1, "Light is in spot light container");
    //strictEqual(this.scene.lights.directional[0], light, "Valid directional light is in 'scene.lights.directional'");

    light.setLightType("unknown");
    equal(light.light.type, "unknown", "Changed type to 'unknwon'");
    equal(this.scene.lights.spot.length, 0, "Light has left spot light container");

    light.setLightType("");
    equal(light.light.type, "directional", "Reset light type (leads to default: directional");
    equal(this.scene.lights.directional.length, 1, "Light without type is in directional container (default)");
});

test("Light callbacks", 9, function () {

    var dataNode = this.xflowGraph.createDataNode(false);

    var light = this.scene.createRenderLight({
        light: {
            data: dataNode
        }
    });

    this.scene.addEventListener(XML3D.webgl.Scene.EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, function (event) {
        ok(event.light, "Got a structure changed callback");
        start();
    });

    stop(3);
    light.setLightType("spot");  // SC 1+2: Change type of light (creates two because remove/add)

    var group = this.scene.createRenderGroup();
    light = this.scene.createRenderLight({ // SC 3: Add a new light to the scene
        parent: group,
        light: {
            data: dataNode,
            type: "point"
        }
    });

    this.scene.addEventListener(XML3D.webgl.Scene.EVENT_TYPE.LIGHT_VALUE_CHANGED, function (event) {
        ok(true, "Got a value changed callback");
        start();
    });

    stop(6);
    light.setLocalIntensity(0.5);
    group.setLocalVisible(false);
    group.setLocalVisible(true);
    light.setVisible(false);
    light.setVisible(true);
    group.setLocalMatrix(XML3D.math.mat4.create());

    // REMOVE

});


test("Bounding Boxes", 7, function () {
    var group = this.scene.createRenderGroup();
    group.setLocalMatrix(XML3D.math.mat4.create());
    var obj = this.scene.createRenderMesh();
    obj.setObjectSpaceBoundingBox([-2, -2, -2, 2, 2, 2]);
    obj.setParent(group);

    var actualBB = XML3D.math.bbox.create();
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB, new Float32Array([-2, -2, -2, 2, 2, 2]), EPSILON, "Group BB matches object BB");

    var trans = XML3D.math.mat4.create();
    XML3D.math.mat4.translate(trans, trans, [4, 0, 0]);
    group.setLocalMatrix(trans);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB, new Float32Array([2, -2, -2,6, 2, 2]), EPSILON, "Group BB was translated correctly");

    var group2 = this.scene.createRenderGroup();
    var trans2 = XML3D.math.mat4.create();
    XML3D.math.mat4.translate(trans2, trans2, [0, 4, 0]);
    group2.setLocalMatrix(trans2);

    var obj2 = this.scene.createRenderMesh();
    obj2.setObjectSpaceBoundingBox([-1, -1, -1, 1, 1, 1]);
    obj2.setParent(group2);
    group2.setParent(group);
    group2.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB, new Float32Array([-1, 3, -1,1, 5, 1]), EPSILON, "New group's transform was applied correctly");
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB, new Float32Array([2, -2, -2,6, 5, 2]), EPSILON, "Original group's BB was expanded correctly");
    obj2.setLocalVisible(false);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB, new Float32Array([2, -2, -2,6, 2, 2]), EPSILON, "Making new object invisible reverts original group's BB");

    obj2.setLocalVisible(true);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB, new Float32Array([2, -2, -2,6, 5, 2]), EPSILON, "Object is visible again");
    group.setLocalMatrix(XML3D.math.mat4.create());
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB, new Float32Array([-2, -2, -2,2, 5, 2]), EPSILON, "Original group's transformation removed");
});

test("View", function() {
    var view = this.scene.createRenderView();
    ok(view);

    this.scene.setActiveView(view);

    deepEqual(view.getClippingPlanes(), { near: 1, far: 10 }, "Default values");

    var obj = this.scene.createRenderMesh();
    obj.setObjectSpaceBoundingBox([-1, -1, -1, 1, 1, 1]);
    deepEqual(view.getClippingPlanes(), { near: 0.02, far: 1.01 }, "Unit box");

    var obj = this.scene.createRenderMesh();
    obj.setObjectSpaceBoundingBox([-2, -2, -2, 2, 2, 2]);
    deepEqual(view.getClippingPlanes(), { near: 0.04, far: 2.02 }, "Default values");

    view.updateOrientation(new XML3DRotation(new XML3DVec3(0,1,0), Math.PI / 2.0).toMatrix()._data);
    var planes = view.getClippingPlanes();
    QUnit.close(planes.near, 0.04, EPSILON, "Rotated 180: near");
    QUnit.close(planes.far, 2.02, EPSILON, "Rotated 180: far");

    view.updateOrientation(new XML3DRotation(new XML3DVec3(0,0.707,0.707), Math.PI / 3.0).toMatrix()._data);

    planes = view.getClippingPlanes();
    QUnit.close(planes.near, 0.0645 , EPSILON, "Rotated arbitrary: near");
    QUnit.close(planes.far, 3.257, EPSILON, "Rotated arbitrary: far");

    var group2 = this.scene.createRenderGroup();
    var trans2 = XML3D.math.mat4.create();
    XML3D.math.mat4.translate(trans2, trans2, [0, 4, 0]);
    group2.setLocalMatrix(trans2);

    obj.remove();

    obj = this.scene.createRenderMesh({parent: group2});
    obj.setObjectSpaceBoundingBox([-2, -2, -2, 2, 2, 2]);

    view.updateOrientation(XML3D.math.mat4.create());
    deepEqual(view.getClippingPlanes(), { near: 0.07, far: 2.035 }, "Translated group");

    XML3D.math.mat4.scale(trans2, trans2, [20,20,20]);
    group2.setLocalMatrix(trans2);

    deepEqual(view.getClippingPlanes(), { near: 0.8, far: 40.4 }, "Scaled group");

});


test("Annotated Bounding Box", function () {
    var dataNode = this.xflowGraph.createDataNode(false);
    var obj = this.scene.createRenderMesh({
        object: {
            data: dataNode
        }
    });
    strictEqual(obj.object.data, dataNode, "Xflow data source is set in RenderObject");
    var actualBB = XML3D.math.bbox.create();
    this.scene.getBoundingBox(actualBB);
    ok(XML3D.math.bbox.isEmpty(actualBB), "No data annotated: BB is empty");
    ok(!obj.boundingBoxAnnotated, "RenderObject marked as not annotated");

    var values = new Float32Array([-2, -2, -2, 2, 2, 2])
    var buffer = new Xflow.BufferEntry(Xflow.DATA_TYPE.FLOAT3, values);
    var xflowInputNode = XML3D.data.xflowGraph.createInputNode();
    xflowInputNode.name = "boundingBox";
    xflowInputNode.data = buffer;
    dataNode.appendChild(xflowInputNode);

    this.scene.rootNode.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB, values, EPSILON, "Group BB matches annotated BB");
    ok(obj.boundingBoxAnnotated, "RenderObject marked as annotated");

});
