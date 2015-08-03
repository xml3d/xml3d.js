module("Data Adapter", {});

function getDataTable(doc, elementId) {
    var factory       = new XML3DTestLib.XML3DDataAdapterFactory(this);
    var node          = doc.getElementById(elementId);
    var dataCollector = factory.getAdapter(node);
    return dataCollector.getComputeResult()._dataEntries;
}

function hasKey(dataTable, key) {
    for(tmpKey in dataTable)
    {
        if(tmpKey == key)
        {
            return true;
        }
    }
    return false;
}

test("Test on flat mesh element", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/data-adapter.html");

    var test = frameLoaded.then(function(doc) {
        var win = doc.defaultView;
        var dataTable = getDataTable(doc, "test1");
        ok(dataTable, "Data table created");

        ok(hasKey(dataTable, "index"), "Entry 'index' exists");
        ok(hasKey(dataTable, "position"), "Entry 'position' exists");
        ok(hasKey(dataTable, "normal"), "Entry 'normal' exists");
        ok(!hasKey(dataTable, "something"), "Entry 'something' not exists");

        var data = dataTable["index"];
        equal(data.getTupleSize(), 1, "Tuple size is 1");
        equal(data.getValue().length, 3, "Expected data length");
        equal(data.getValue()[1], 2, "Expected data value");

        data = dataTable["position"];
        equal(data.getTupleSize(), 3, "Tuple size is 3");
        equal(data.getValue().length, 3, "Expected data length");
        QUnit.close(data.getValue()[1], 2.0, EPSILON, "Expected data value");


        data = dataTable["normal"];
        equal(data.getTupleSize(), 3, "Tuple size is 3");
        equal(data.getValue().length, 3, "Expected data length");
        QUnit.close(data.getValue()[0], 1.1, EPSILON, "Expected data value");
    });
    test.fin(QUnit.start).done();

});

test("Test on flat data element", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/data-adapter.html");
    var test = frameLoaded.then(function(doc) {
        var win = doc.defaultView;
        var dataTable = getDataTable(doc, "test2");
        ok(dataTable, "Found datatable");

        ok(hasKey(dataTable, "index"), "Entry 'index' exists.");
        ok(hasKey(dataTable, "position"), "Entry 'position' exists.");
        ok(hasKey(dataTable, "normal"), "Entry 'normal' exists.");

        var data = dataTable["index"];
        equal(data.getTupleSize(), 1, "Tuple size is 1");
        equal(data.getValue().length, 3, "Expected data length");
        equal(data.getValue()[1], 5, "Expected data value");


        data = dataTable["position"];
        equal(data.getValue().length, 3, "Expected data length");
        QUnit.close(data.getValue()[2], 6.0, EPSILON, "Expected data value");
        equal(data.getTupleSize(), 3, "Tuple size is 3");

        data = dataTable["normal"];
        equal(data.getValue().length, 3, "Expected data length");
        QUnit.close(data.getValue()[2], 6.0, EPSILON, "Expected data value");
        equal(data.getTupleSize(), 3, "Tuple size is 3");
    });
    test.fin(QUnit.start).done();
});

test("Test with embedded data element", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/data-adapter.html");
    var test = frameLoaded.then(function(doc) {
        var win = doc.defaultView;
        var dataTable = getDataTable(doc, "test3");
        ok(dataTable, "Found datatable");

        ok(hasKey(dataTable, "index"), "Entry 'index' exists.");
        ok(hasKey(dataTable, "position"), "Entry 'position' exists.");
        ok(hasKey(dataTable, "normal"), "Entry 'normal' exists.");

        var data = dataTable["index"];
        equal(data.getTupleSize(), 1, "Tuple size is 1");
        equal(data.getValue().length, 3, "Expected data length");
        equal(data.getValue()[1], 5, "Expected data value");

        data = dataTable["position"];
        QUnit.close(data.getValue()[2], 33.0, EPSILON, "Expected data value");
        equal(data.getValue().length, 3, "Expected data length");
        equal(data.getTupleSize(), 3, "Tuple size is 3");

        data = dataTable["normal"];
        QUnit.close(data.getValue()[1], 2, EPSILON, "Expected data value");
        equal(data.getValue().length, 3, "Expected data length");
        equal(data.getTupleSize(), 3, "Tuple size is 3");
    });
    test.fin(QUnit.start).done();
});

test("Reference via 'src' attribute", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/data-adapter.html");
    var test = frameLoaded.then(function(doc) {
        var dataTable2 = getDataTable(doc, "test2");
        var dataTable41 = getDataTable(doc, "test4-1");
        var dataTable42 = getDataTable(doc, "test4-2");
        ok(dataTable2 && dataTable41 && dataTable42, "All tables exist");

        QUnit.closeArray(dataTable2.normal.getValue(), dataTable41.normal.getValue(), EPSILON, "Normals of referencer and reference are identical");
        QUnit.closeArray(dataTable2.position.getValue(), dataTable41.position.getValue(), EPSILON, "Positions of referencer and reference are identical");
        QUnit.closeArray(dataTable2.index.getValue(), dataTable41.index.getValue(), EPSILON, "Indices of referencer and reference are identical");

        QUnit.closeArray(dataTable42.normal.getValue(), [4, 5, 6], EPSILON, "Normals were overridden by child data node");
        QUnit.closeArray(dataTable42.position.getValue(), [11.0, 22.0, 33.0], EPSILON, "Positions were overridden by child data node");
        QUnit.closeArray(dataTable42.index.getValue(), [4, 5, 6], EPSILON, "Indices are the same as the referenced node");
    });
    test.fin(QUnit.start).done();
});

test("Test all tuple sizes", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/data-adapter.html");
    var test = frameLoaded.then(function(doc) {
        var dataTable = getDataTable(doc, "tupleSizeTest");
        ok(dataTable);

        ok(hasKey(dataTable, "intTest"));
        ok(hasKey(dataTable, "int4Test"));
        ok(hasKey(dataTable, "boolTest"));
        ok(hasKey(dataTable, "textureTest"));
        ok(hasKey(dataTable, "floatTest"));
        ok(hasKey(dataTable, "float2Test"));
        ok(hasKey(dataTable, "float3Test"));
        ok(hasKey(dataTable, "float4Test"));

        var data = dataTable["intTest"];
        equal(data.getTupleSize(), 1, "<int> has tupleSize 1");

        data = dataTable["int4Test"];
        equal(data.getTupleSize(), 4, "<int4> has tupleSize 4");

        data = dataTable["boolTest"];
        equal(data.getTupleSize(), 1, "<bool> has tupleSize 1");

        data = dataTable["floatTest"];
        equal(data.getTupleSize(), 1, "<float> has tupleSize 1");

        data = dataTable["float2Test"];
        equal(data.getTupleSize(), 2, "<float2> has tupleSize 2");

        data = dataTable["float3Test"];
        equal(data.getTupleSize(), 3, "<float3> has tupleSize 3");

        data = dataTable["float4Test"];
        equal(data.getTupleSize(), 4, "<float4> has tupleSize 4");

        data = dataTable["float4x4Test"];
        equal(data.getTupleSize(), 16, "<float4x4> has tupleSize 16");
    });
    test.fin(QUnit.start).done();
});
