module("Paging", {
    setup: function () {
        this.scene = new XML3D.webgl.Scene();
        this.scene.createDrawable = function() {
            return null; // Prevents shader creation
        };
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

test("RenderObject", 6, function() {
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

});


test("Delete render objects", 11, function() {
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


});

