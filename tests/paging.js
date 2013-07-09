module("Paging", {
    setup : function() {
        console.log("setup")
        this.scene = new XML3D.webgl.Scene();
    }
});

test("Init", 4, function() {
    ok(this.scene.rootNode)
    equal(this.scene.pages.length, 1, "Initial page created");
    equal(this.scene.pages[0].length, XML3D.webgl.Scene.PAGE_SIZE, "Page size");
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
    for (var i = 0; i < Math.floor(XML3D.webgl.Scene.PAGE_SIZE / ENTRY_SIZE); i++) {
        this.scene.createRenderObject();
    }
    equal(this.scene.pages.length, 2, "New page size");
    equal(this.scene.nextOffset, 2 * ENTRY_SIZE, "New offset");

});
