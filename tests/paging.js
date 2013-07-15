module("Paging", {
    setup : function() {
        this.scene = new XML3D.webgl.Scene();
    }
});

test("Init", 4, function() {
    ok(this.scene.rootNode)
    equal(this.scene.pages.length, 1, "Initial page created");
    equal(this.scene.pages[0].length, XML3D.webgl.Pager.PAGE_SIZE, "Page size");
    equal(this.scene.nextOffset, XML3D.webgl.RenderGroup.ENTRY_SIZE, "Initial offset of implicit root node");
});

test("RenderGroup", 6, function() {
    var ENTRY_SIZE = XML3D.webgl.RenderGroup.ENTRY_SIZE;
    var expectedOffset = this.scene.nextOffset;
    var renderGroup = this.scene.createRenderGroup();
    ok(renderGroup);
    equal(this.scene.pages.length, 1, "Page size");
    expectedOffset += ENTRY_SIZE;
    equal(this.scene.nextOffset, expectedOffset, "New offset");

    var childGroup = this.scene.createRenderGroup({parent: renderGroup });
    strictEqual(childGroup.getParent(), renderGroup, "Parent is set");
    notEqual(renderGroup.children.indexOf(childGroup),-1, "In child list");
    expectedOffset += ENTRY_SIZE;
    equal(this.scene.nextOffset, expectedOffset, "New offset");
});

test("RenderView", 2, function() {
    var ENTRY_SIZE = XML3D.webgl.RenderView.ENTRY_SIZE;
    var expectedOffset = this.scene.nextOffset;
    var renderView = this.scene.createRenderView();
    ok(renderView);
    expectedOffset += ENTRY_SIZE;
    equal(this.scene.nextOffset, expectedOffset, "New offset");
});

test("RenderObject", 9, function() {
    var ENTRY_SIZE = XML3D.webgl.RenderObject.ENTRY_SIZE;
    var expectedOffset = this.scene.nextOffset;
    this.scene.createRenderObject();
    equal(this.scene.pages.length, 1, "Page size");
    expectedOffset += ENTRY_SIZE;
    equal(this.scene.nextOffset, expectedOffset, "New offset");
    this.scene.createRenderObject();
    equal(this.scene.pages.length, 1, "Page size");
    expectedOffset += ENTRY_SIZE;
    equal(this.scene.nextOffset, expectedOffset, "New offset");
    for (var i = 0; i < Math.floor(XML3D.webgl.Pager.PAGE_SIZE / ENTRY_SIZE); i++) {
        this.scene.createRenderObject();
    }
    equal(this.scene.pages.length, 2, "New page size");
    equal(this.scene.nextOffset, 2 * ENTRY_SIZE, "New offset");

    var scene = this.scene;
    scene.addChildEvent = function(parent, child) {
        ok(true, "Event on add child");
        strictEqual(parent, scene.rootNode, "Parent is first parameter");
        ok(child, "Child is second parameter");
        start();
    }
    stop();
    this.scene.createRenderObject();
});


test("Delete render objects", 14, function() {
    // Attach to root object
    var ENTRY_SIZE = XML3D.webgl.RenderObject.ENTRY_SIZE;
    var expectedOffset = this.scene.nextOffset;

    var children = [];
    for(var i= 0; i < 5; i++) {
        children[i] = this.scene.createRenderObject();
        expectedOffset += ENTRY_SIZE;
    }
    equal(this.scene.nextOffset, expectedOffset, "New offset");

    equal(this.scene.rootNode.getChildren().length, 5, "5 children added");
    //equal(this.scene.queue.length, 5, "5 render objects in queue");
    children[2].remove();
    equal(this.scene.rootNode.getChildren().length, 4, "1 child removed");
    //equal(this.scene.queue.length, 4, "4 render objects in queue");
    equal(this.scene.nextOffset, expectedOffset, "Offset not changed");

    children[2] = this.scene.createRenderObject();
    equal(this.scene.nextOffset, expectedOffset, "Page entry reused");

    children[5] = this.scene.createRenderObject();
    expectedOffset += ENTRY_SIZE;
    equal(this.scene.nextOffset, expectedOffset, "New page entry created");

    for (var i = 6; i < Math.floor(XML3D.webgl.Pager.PAGE_SIZE / ENTRY_SIZE)+1; i++) {
        children[i] = this.scene.createRenderObject();
    }
    expectedOffset = ENTRY_SIZE;
    equal(this.scene.nextOffset, expectedOffset, "Offset reset");
    strictEqual(children[children.length-1].page, this.scene.pages[1], "Child on second page");

    children[5].remove();
    equal(this.scene.nextOffset, expectedOffset, "Offset not changed");
    children[2] = this.scene.createRenderObject();
    strictEqual(children[2].page, this.scene.pages[0], "New child on first page");

    children.push(this.scene.createRenderObject());
    strictEqual(children[children.length-1].page, this.scene.pages[1], "New child on second page");

    var scene = this.scene;
    this.scene.removeChildEvent = function(parent, child) {
        ok(true, "Event on remove child");
        strictEqual(parent, scene.rootNode, "Parent is first parameter");
        strictEqual(child, children[1], "Child is second parameter");
        start();
    }
    stop();
    children[1].remove();
});

test("Bounding Boxes", 7, function() {
    var group = this.scene.createRenderGroup();
    group.setLocalMatrix(XML3D.math.mat4.create());
    var obj = this.scene.createRenderObject();
    obj.setObjectSpaceBoundingBox([-2, -2, -2], [2, 2, 2]);
    obj.setParent(group);

    var actualBB = new XML3D.webgl.BoundingBox();
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(-2,-2,-2),new XML3DVec3(2,2,2)) , EPSILON, "Group BB matches object BB");

    var trans = XML3D.math.mat4.create();
    XML3D.math.mat4.translate(trans, trans, [4, 0, 0]);
    group.setLocalMatrix(trans);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(2,-2,-2),new XML3DVec3(6,2,2)) , EPSILON, "Group BB was translated correctly");

    var group2 = this.scene.createRenderGroup();
    var trans2 = XML3D.math.mat4.create();
    XML3D.math.mat4.translate(trans2, trans2, [0, 4, 0]);
    group2.setLocalMatrix(trans2);

    var obj2 = this.scene.createRenderObject();
    obj2.setObjectSpaceBoundingBox([-1, -1, -1], [1, 1, 1]);
    obj2.setParent(group2);
    group2.setParent(group);
    group2.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(-1,3,-1),new XML3DVec3(1,5,1)) , EPSILON, "New group's transform was applied correctly");
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(2,-2,-2),new XML3DVec3(6,5,2)) , EPSILON, "Original group's BB was expanded correctly");
    obj2.setLocalVisible(false);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(2,-2,-2),new XML3DVec3(6,2,2)) , EPSILON, "Making new object invisible reverts original group's BB");

    obj2.setLocalVisible(true);
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(2,-2,-2),new XML3DVec3(6,5,2)) , EPSILON, "Object is visible again");
    group.setLocalMatrix(XML3D.math.mat4.create());
    group.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(-2,-2,-2),new XML3DVec3(2,5,2)) , EPSILON, "Original group's transformation removed");
});

test("Annotated Bounding Box", function() {
    var xflowGraph = new Xflow.Graph();
    var dataNode = xflowGraph.createDataNode(false);
    var obj = this.scene.createRenderObject({
        object : {
            data: dataNode
        }
    });
    strictEqual(obj.object.data, dataNode, "Xflow data source is set in RenderObject");
    var actualBB = new XML3D.webgl.BoundingBox();
    this.scene.getBoundingBox(actualBB);
    ok(actualBB.isEmpty(), "No data annotated: BB is empty");
    ok(!obj.boundingBoxAnnotated, "RenderObject marked as not annotated");

    var buffer = new Xflow.BufferEntry(Xflow.DATA_TYPE.FLOAT3, new Float32Array([-2,-2,-2,2,2,2]));
    var xflowInputNode = XML3D.data.xflowGraph.createInputNode();
    xflowInputNode.name = "boundingBox";
    xflowInputNode.data = buffer;
    dataNode.appendChild(xflowInputNode);

    this.scene.rootNode.getWorldSpaceBoundingBox(actualBB);
    QUnit.closeBox(actualBB.getAsXML3DBox(), new XML3DBox(new XML3DVec3(-2,-2,-2),new XML3DVec3(2,2,2)) , EPSILON, "Group BB matches annotated BB");
    ok(obj.boundingBoxAnnotated, "RenderObject marked as annotated");

});