module("Data Adapter", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/data-adapter.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    },
    hasKey : function(dataTable, key) {
        for(tmpKey in dataTable)
        {
            if(tmpKey == key)
            {
               return true;
            }
        }
        return false;
    },
    getDataTable : function(elementId) {
        var factory       = new XML3D.data.XML3DDataAdapterFactory(this);
        var node          = this.doc.getElementById(elementId);
        var dataCollector = factory.getAdapter(node);
        return dataCollector.createDataTable();
    }
});

function compareArrays(arr1, arr2)
{
    if(arr1.length != arr2.length)
    {
        return false;
    }
    
    if(arr1.toString() != arr2.toString())
    {
        return false;
    }
    
    for(var i=0; i < arr1.length; i++)
    {   
        if(arr1[i] != arr2[i])
        {
            return false;
        }
    }
    return true;
};

test("Test on flat mesh element", 22, function() {
    var win = this.doc.defaultView;
    var dataTable = this.getDataTable("test1");
    ok(dataTable, "Data table created");
    
    ok(this.hasKey(dataTable, "index"), "Entry 'index' exists");
    ok(this.hasKey(dataTable, "position"), "Entry 'position' exists");
    ok(this.hasKey(dataTable, "normal"), "Entry 'normal' exists");
    ok(!this.hasKey(dataTable, "something"), "Entry 'something' not exists");

    var data = dataTable["index"];
    ok(this.hasKey(data, "tupleSize"), "Entry 'tupleSize' exists");
    ok(this.hasKey(data, "value"), "Entry 'value' exists");
    equal(data['tupleSize'], 1, "Tuple size is 1");
    equal(data.value.length, 3, "Expected data length");
    equal(data.value[1], 2, "Expected data value");
    
    data = dataTable["position"];
    ok(this.hasKey(data, "tupleSize"), "Entry 'tupleSize' exists");
    ok(this.hasKey(data, "value"), "Entry 'value' exists");
    equal(data['tupleSize'], 3, "Tuple size is 3");
    equal(data.value.length, 3, "Expected data length");
    QUnit.close(data.value[1], 2.0, EPSILON, "Expected data value");


    data = dataTable["normal"];
    ok(this.hasKey(data, "tupleSize"), "Entry 'tupleSize' exists");
    ok(this.hasKey(data, "value"), "Entry 'value' exists");
    equal(data['tupleSize'], 3, "Tuple size is 3");
    equal(data.value.length, 3, "Expected data length");
    QUnit.close(data.value[0], 1.1, EPSILON, "Expected data value");
});

test("Test on flat data element", 21, function() {
    var win = this.doc.defaultView;
    var dataTable = this.getDataTable("test2");
    // 1: Found frame
    // 2: Scene loaded
    ok(dataTable, "Found datatable");

    ok(this.hasKey(dataTable, "index"), "Entry 'index' exists.");
    ok(this.hasKey(dataTable, "position"), "Entry 'position' exists.");
    ok(this.hasKey(dataTable, "normal"), "Entry 'normal' exists.");

    var data = dataTable["index"];
    ok(this.hasKey(data, "tupleSize"), "Found index.tupleSize"); // 7
    ok(this.hasKey(data, "value"), "Found index.value");
    equal(data['tupleSize'], 1, "Tuple size is 1");
    equal(data.value.length, 3, "Expected data length");
    equal(data.value[1], 5, "Expected data value");


    data = dataTable["position"];
    ok(this.hasKey(data, "tupleSize"), "Found position.tupleSize");
    ok(this.hasKey(data, "value"), "Found position.value");
    equal(data.value.length, 3, "Expected data length");
    QUnit.close(data.value[2], 6.0, EPSILON, "Expected data value");
    equal(data['tupleSize'], 3, "Tuple size is 3");

    data = dataTable["normal"];
    ok(this.hasKey(data, "tupleSize"), "Found normal.tupleSize");
    ok(this.hasKey(data, "value"), "Found normal.value");
    equal(data.value.length, 3, "Expected data length");
    QUnit.close(data.value[2], 6.0, EPSILON, "Expected data value");
    equal(data['tupleSize'], 3, "Tuple size is 3");
});

test("Test with embedded data element", 21, function() {
    var win = this.doc.defaultView;
    var dataTable = this.getDataTable("test3");
    ok(dataTable, "Found datatable");

    ok(this.hasKey(dataTable, "index"), "Entry 'index' exists.");
    ok(this.hasKey(dataTable, "position"), "Entry 'position' exists.");
    ok(this.hasKey(dataTable, "normal"), "Entry 'normal' exists.");

    var data = dataTable["index"];
    ok(this.hasKey(data, "tupleSize"));
    ok(this.hasKey(data, "value"));
    equal(data['tupleSize'], 1, "Tuple size is 1");
    equal(data.value.length, 3, "Expected data length");
    equal(data.value[1], 5, "Expected data value");

    data = dataTable["position"];
    ok(this.hasKey(data, "tupleSize"));
    ok(this.hasKey(data, "value"));
    QUnit.close(data.value[2], 33.0, EPSILON, "Expected data value");
    equal(data.value.length, 3, "Expected data length");
    equal(data.tupleSize, 3, "Tuple size is 3");

    data = dataTable["normal"];
    ok(this.hasKey(data, "tupleSize"));
    ok(this.hasKey(data, "value"));
    QUnit.close(data.value[1], 5.0, EPSILON, "Expected data value");
    equal(data.value.length, 3, "Expected data length");
    equal(data.tupleSize, 3, "Tuple size is 3");
});

test("Reference via 'src' attribute", 5, function() {
    var dataTable2 = this.getDataTable("test2");
    var dataTable41 = this.getDataTable("test4-1");
    var dataTable42 = this.getDataTable("test4-2");
    ok(dataTable2 && dataTable41 && dataTable42, "All tables exist");
    
    strictEqual(dataTable2, dataTable41, "Table of referencing and referenced are identical");
    strictEqual(dataTable2, dataTable42, "Table of referencing (with ignored children) and referenced are identical");

});

test("Sequence test", 7, function() {
    var dataTable = this.getDataTable("sequence01");
    data = dataTable.position;
    ok(data);
    QUnit.close(data.value[0], 0.0, EPSILON, "Expected data value");
    ok(data.sequence);
    equal(data.sequence.length, 5, "5 entries in sequence.");
    equal(typeof data.sequence[0].key, "number", "'key' is a number.");
    console.dir(data.sequence);
});

test("Test all tuple sizes", 29, function() {
    var dataTable = this.getDataTable("tupleSizeTest");
    ok(dataTable);
    
    ok(this.hasKey(dataTable, "intTest"));
    ok(this.hasKey(dataTable, "int4Test"));
    ok(this.hasKey(dataTable, "boolTest"));
    ok(this.hasKey(dataTable, "textureTest"));
    ok(this.hasKey(dataTable, "floatTest"));
    ok(this.hasKey(dataTable, "float2Test"));
    ok(this.hasKey(dataTable, "float3Test"));
    ok(this.hasKey(dataTable, "float4Test"));
    
    var data = dataTable["intTest"];
    ok(this.hasKey(data, "tupleSize"));
    equal(data["tupleSize"],1,"<int> has tupleSize 1");
    
    var data = dataTable["int4Test"];
    ok(this.hasKey(data, "tupleSize"));
    equal(data["tupleSize"],4,"<int4> has tupleSize 4");

    data = dataTable["boolTest"];
    ok(this.hasKey(data, "tupleSize"));
    equal(data["tupleSize"],1,"<bool> has tupleSize 1");
    
    data = dataTable["textureTest"];
    ok(this.hasKey(data, "tupleSize"));
    equal(data["tupleSize"],1,"<texture> has tupleSize 1");         
    
    data = dataTable["floatTest"];
    ok(this.hasKey(data, "tupleSize"));
    equal(data["tupleSize"],1,"<float> has tupleSize 1");
    
    data = dataTable["float2Test"];
    ok(this.hasKey(data, "tupleSize"));
    equal(data["tupleSize"],2,"<float2> has tupleSize 2");
    
    data = dataTable["float3Test"];
    ok(this.hasKey(data, "tupleSize"));
    equal(data["tupleSize"],3,"<float3> has tupleSize 3");
    
    data = dataTable["float4Test"];
    ok(this.hasKey(data, "tupleSize"));
    equal(data["tupleSize"],4,"<float4> has tupleSize 4");

    data = dataTable["float4x4Test"];
    ok(this.hasKey(data, "tupleSize"));
    equal(data["tupleSize"],16,"<float4x4> has tupleSize 16");
});
