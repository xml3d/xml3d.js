module("RenderScene", {
    setup: function () {
        this.scene = new XML3DTestLib.Scene();
        this.scene.createDrawable = function() {
            return null;
        };
        this.scene.requestRedraw = function() {
        };

    }
});

var SceneConstants = XML3DTestLib.SceneConstants;
var DataNode = XML3DTestLib.DataNode;
var ComputeRequest = XML3DTestLib.ComputeRequest;

test("Light attributes", 9, function () {

    var dataNode = new DataNode(false);
    var lightModels = this.scene.lights._models;

    var light = this.scene.createRenderLight({
        configuration: {
            model: "urn:xml3d:light:directional",
            data: dataNode
        }
    });

    var result = new ComputeRequest(light.model.dataNode, ["intensity"]).getResult();
    var actualVector = XML3D.math.vec3.create();
    actualVector.set(result.getOutputData("intensity").getValue());
    QUnit.closeVector(actualVector, XML3D.math.vec3.fromValues(1, 1, 1), EPSILON, "Intensity default");

    equal(lightModels.directional.lightModels.length, 1, "Light without type is in directional container (default)");
    light.setLightType("urn:xml3d:light:spot");
    equal(light.model.id, "spot", "Changed type to 'spot'");

    equal(lightModels.directional.lightModels.length, 0, "Light has left directional light container");
    equal(lightModels.spot.lightModels.length, 1, "Light is in spot light container");
    //strictEqual(this.scene.lights.directional[0], light, "Valid directional light is in 'scene.lights.directional'");

    light.setLightType("unknown");
    equal(light.model.id, "directional", "Changed type to 'unknown' results in directional light");
    equal(lightModels.spot.lightModels.length, 0, "Light has left spot light container");

    light.setLightType("");
    equal(light.model.id, "directional", "Reset light type (leads to default: directional");
    equal(lightModels.directional.lightModels.length, 1, "Light without type is in directional container (default)");
});

test("Light callbacks", 6, function () {

    var dataNode = new DataNode(false);

    var light = this.scene.createRenderLight({
        light: {
            data: dataNode
        }
    });

    this.scene.addListener(SceneConstants.EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, function (light) {
        ok(light === light, "Got a structure changed callback");
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

    this.scene.addListener(SceneConstants.EVENT_TYPE.LIGHT_VALUE_CHANGED, function (light) {
        ok(true, "Got a value changed callback");
        start();
    });

    stop(3);
    light.setLocalVisible(false);
    light.setLocalVisible(true);
    group.setLocalMatrix(new XML3D.Mat4());

    // REMOVE

});

test("Light removal: Issue #71", function () {
    var dataNode = new DataNode(false);
    var group = this.scene.createRenderGroup();
    this.scene.createRenderLight({ // SC 3: Add a new light to the scene
        parent: group,
        configuration: {
            dataNode: dataNode,
            model: "urn:xml3d:light:point"
        }
    });

    group = this.scene.createRenderGroup();
    var light = this.scene.createRenderLight({ // SC 3: Add a new light to the scene
        parent: group,
        configuration: {
            dataNode: dataNode,
            model: "urn:xml3d:light:point"
        }
    });
    this.scene.createRenderGroup({parent: group});
    this.scene.createRenderGroup({parent: group});
    equal(group.children.length, 3, "Three children in group.");
    equal(this.scene.lights._models.point.lightModels.length, 2, "Two point lights.");
    light.remove();
    equal(group.children.length, 2, "Two children in group.");
    equal(this.scene.lights._models.point.lightModels.length, 1, "One point light.");
    light.remove();
    equal(group.children.length, 2, "Two children in group.");
    equal(this.scene.lights._models.point.lightModels.length, 1, "One point light.");

});

test("Bounding Boxes", 7, function () {
    var group = this.scene.createRenderGroup();
    group.setLocalMatrix(new XML3D.Mat4());
    var obj = this.scene.createRenderObject();
    obj.setLocalMatrix(new XML3D.Mat4());
    obj.setObjectSpaceBoundingBox(new XML3D.Box(new Float32Array([-2, -2, -2, 2, 2, 2])));
    obj.setParent(group);

    var actualBB = new XML3D.Box();
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB.data, new Float32Array([-2, -2, -2, 2, 2, 2]), EPSILON, "Group BB matches object BB");

    var trans = new XML3D.Mat4();
    trans.translate([4, 0, 0]);
    group.setLocalMatrix(trans);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB.data, new Float32Array([2, -2, -2,6, 2, 2]), EPSILON, "Group BB was translated correctly");

    var group2 = this.scene.createRenderGroup();
    var trans2 = new XML3D.Mat4()
    trans2.translate([0, 4, 0]);
    group2.setLocalMatrix(trans2);

    var obj2 = this.scene.createRenderObject();
    obj2.setLocalMatrix(new XML3D.Mat4());
    obj2.setObjectSpaceBoundingBox(new XML3D.Box(new Float32Array([-1, -1, -1, 1, 1, 1])));
    obj2.setParent(group2);
    group2.setParent(group);
    group2.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB.data, new Float32Array([3, 3, -1, 5, 5, 1]), EPSILON, "New group's transform was applied correctly");
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB.data, new Float32Array([2, -2, -2, 6, 5, 2]), EPSILON, "Original group's BB was expanded correctly");
    obj2.setLocalVisible(false);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB.data, new Float32Array([2, -2, -2,6, 2, 2]), EPSILON, "Making new object invisible reverts original group's BB");

    obj2.setLocalVisible(true);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB.data, new Float32Array([2, -2, -2,6, 5, 2]), EPSILON, "Object is visible again");
    group.setLocalMatrix(new XML3D.Mat4());
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB.data, new Float32Array([-2, -2, -2,2, 5, 2]), EPSILON, "Original group's transformation removed");
});

test("Clipping Planes", function() {
    var view = this.scene.createRenderView();
    ok(view);
    var CLIPING_NEAR_MINIMUM = 0.01;

    this.scene.setActiveView(view);

    deepEqual(view.getClippingPlanes(), { near: 1, far: 10 }, "Default values");

    var obj = this.scene.createRenderObject();
    obj.setLocalMatrix(new XML3D.Mat4());
    obj.setObjectSpaceBoundingBox(new XML3D.Box(new Float32Array([-1, -1, -1, 1, 1, 1])));
    deepEqual(view.getClippingPlanes(), { near: 0.05, far: 1.05 }, "Unit box");
    obj.remove();

    var obj = this.scene.createRenderObject();
    obj.setLocalMatrix(new XML3D.Mat4());
    obj.setObjectSpaceBoundingBox(new XML3D.Box(new Float32Array([-2, -2, -2, 2, 2, 2])));
    deepEqual(view.getClippingPlanes(), { near: 0.05, far: 2.05 }, "Larger values");

    var mat = new XML3D.Mat4().rotate(Math.PI/2.0, [0,1,0]);
    view.updateOrientation(mat);
    var planes = view.getClippingPlanes();
    QUnit.close(planes.near, 0.05, EPSILON, "Rotated 180: near");
    QUnit.close(planes.far, 2.05, EPSILON, "Rotated 180: far");

    mat.identity().rotate(Math.PI/3.0, [0,0.707,0.707]);
    view.updateOrientation(mat);

    planes = view.getClippingPlanes();
    QUnit.close(planes.near, 0.05 , EPSILON, "Rotated arbitrary: near");
    QUnit.close(planes.far, 3.274, EPSILON, "Rotated arbitrary: far");

    var group2 = this.scene.createRenderGroup();
    var trans2 = new XML3D.Mat4();
    trans2.translate([0, 4, 0]);
    group2.setLocalMatrix(trans2);

    obj.remove();

    obj = this.scene.createRenderObject({parent: group2});
    obj.setLocalMatrix(new XML3D.Mat4());
    obj.setObjectSpaceBoundingBox(new XML3D.Box(new Float32Array([-2, -2, -2, 2, 2, 2])));

    view.updateOrientation(new XML3D.Mat4());
    deepEqual(view.getClippingPlanes(), { near: 0.05, far: 2.05 }, "Translated group");

    trans2.scale([20,20,20]);
    group2.setLocalMatrix(trans2);

    deepEqual(view.getClippingPlanes(), { near: 0.4, far: 40.4 }, "Scaled group");

    var trans = 80;
    trans2.identity();
    trans2.translate([0, 0, -trans]);
    group2.setLocalMatrix(trans2);

    deepEqual(view.getClippingPlanes(), { near: trans - 2.05, far: trans+2.05 }, "Translated to exceed minimum of near");


});

test("View projection matrix", function() {
    var view = this.scene.createRenderView();
    ok(view);

    var projectionMatrixActual = new XML3D.Mat4();
    var projectionMatrixExpected = new XML3D.Mat4();

    this.scene.setActiveView(view);

    view.getProjectionMatrix(projectionMatrixActual, 0.5 );
    var cp = view.getClippingPlanes();
    projectionMatrixExpected.perspective(45 / 180 * Math.PI, 0.5, cp.near, cp.far);
    QUnit.closeArray(projectionMatrixActual, projectionMatrixExpected, EPSILON, "Projection, aspect ration 0.5");

    view.getProjectionMatrix(projectionMatrixActual, 0.6 );
    var cp = view.getClippingPlanes();
    projectionMatrixExpected.identity().perspective(45 / 180 * Math.PI, 0.6, cp.near, cp.far);
    QUnit.closeArray(projectionMatrixActual, projectionMatrixExpected, EPSILON, "Projection, aspect ration 0.6");

});

/**
 * This test doesn't work anymore, because bounding boxes are now entirely handled by drawables.
 */
 /*
test("Annotated Bounding Box", function () {
    var dataNode = this.xflowGraph.createDataNode(false);
    var obj = this.scene.createRenderObject({
        object: {
            data: dataNode
        }
    });
    strictEqual(obj.object.data, dataNode, "Xflow data source is set in RenderObject");
    var actualBB = XML3D.math.bbox.create();
    this.scene.getBoundingBox(actualBB);
    ok(XML3D.math.bbox.isEmpty(actualBB), "No data annotated: BB is empty");

    var values = new Float32Array([-2, -2, -2, 2, 2, 2])
    var buffer = new Xflow.BufferEntry(Xflow.DATA_TYPE.FLOAT3, values);
    var xflowInputNode = XML3D.data.xflowGraph.createInputNode();
    xflowInputNode.name = "boundingBox";
    xflowInputNode.data = buffer;
    dataNode.appendChild(xflowInputNode);

    this.scene.rootNode.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeArray(actualBB, values, EPSILON, "Group BB matches annotated BB");
});
*/
