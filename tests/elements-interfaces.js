module("Element attributes tests", {});

test("Event attribute tests", function() {
    var e = document.createElementNS(XML3D.xml3dNS, "xml3d");
    var getterText = "alert('get function');";

    // Set via attribute and get via interface
        equal(e.onclick, null, "xml3d::onclick is null initially.");
        e.setAttribute("onclick", getterText);
        equal(e.getAttribute("onclick"), getterText, "Value set.");
        equal(typeof e.onclick, "function", "onclick is of type function");
        notEqual(e.onclick.toString().match(new RegExp("function onclick.*\n.*alert(.*get function.*).*\n.*")), null , "text");
        //console.log(e.onclick.toString().match());
        // Set via interface
        var v = function() {
            console.log("set function");
        };
        e.onclick = v;
        equal(e.getAttribute("onclick"), getterText,
                "Value of attribute remains unchanged after setting event function per interface.");
        equal(e.onclick, v, "Function is set.");

        e.onclick = "hallo";
        equal(e.onclick, null, "Assign invalid type via interface: null.");

        e.onclick = v;
        e.setAttribute("onclick", "alert('override');");
        notEqual(e.onclick, v, "Valid setAttribute changed function.");
        equal(typeof e.onclick, "function", "onclick is of type function after setAttribute");

    e.setAttribute("onframedrawn", getterText);
    equal(e.getAttribute("onframedrawn"), getterText, "Framedrawn was set");
    e.setAttribute("onframedrawn", "alert('test')");
    equal(typeof e.onframedrawn, "function", "onframedrawn was set to a function through setAttribute");
    e.onframedrawn = null;
    equal(e.onframedrawn, null, "onframedrawn was set back to null");
    });

test("Int interface tests", function() {
    // Behavior copied from HTMLCanvas::width
        // Check this first:
        var e = document.createElement("canvas");
        equal(e.getAttribute("width"), null, "no Attribute set");
        equal(e.width, 300, "canvas.width is 300 by default.");
        e.setAttribute("width", "509.5");
        equal(e.width, 509, "canvas.width ='509.5' // 509;");
        e.setAttribute("width", 509.5);
        equal(e.width, 509, "canvas.width = 509.5 // 509;");
        e.setAttribute("width", "asdf");
        equal(e.width, 300, "canvas.width set back to default, if invalid value.");

        // Now xml3d
        e = document.createElementNS(XML3D.xml3dNS, "xml3d");
        equal(e.getAttribute("width"), null, "no Attribute set");

        // Set via interface
        equal(e.width, 800, "xml3d.width is 800 by default.");
        e.width = 300;
        equal(e.width, 300, "xml3d.width = 300.");
        e.width = true;
        equal(e.width, 1, "xml3d.width = 1.");
        e.width = 500.9;
        equal(e.width, 500, "xml3d.width = 500.9.");

        // Set via attribute
        e.setAttribute("width", "123");
        equal(e.width, 123, "Value set via setAttribute to 123.");
        equal(e.getAttribute("width"), "123", "Value set via setAttribute to 123. getAttribute = '123'");

        e.setAttribute("width", "509.5");
        equal(e.width, 509, "xml3d.width ='509.5' // 509;");
        equal(e.getAttribute("width"), "509.5", "getAttribute = '509.5'");

        e.setAttribute("width", 509.5);
        equal(e.width, 509, "setAttribute(509.5) => xml3d.width == 509;");

        e.setAttribute("width", "asdf");
        equal(e.getAttribute("width"), "asdf", "Invalid value is set to attribute");
        equal(e.width, 800, "Invalid value set via setAttribute. Back to default: 800.");
    });

test("String interface tests", function() {
        e = document.createElementNS(XML3D.xml3dNS, "xml3d");
        equal(e.getAttribute("id"), null, "no Attribute set");
        // Set via interface
        equal(e.id, "", "No Attribute set.");

        e.id = "myxml3d";
        equal(e.id, "myxml3d", "xml3d.id = 'myxml3d'.");
        equal(e.getAttribute("id"), "myxml3d", "getAttribute = 'myxml3d'.");
        e.id = true;
        equal(e.id, "true", "xml3d.id == 'true'.");
        equal(e.getAttribute("id"), "true", "getAttribute = 'true'.");

        // Set via attribute
        e.setAttribute("id", "123");
        equal(e.id, "123", "Value set via setAttribute to 123.");
    });

test("Reference interface tests", function() {
    e = document.createElementNS(XML3D.xml3dNS, "xml3d");
    equal(e.getAttribute("view"), null, "no Attribute set");
    // Set via interface

    e.view = "myxml3d";
    equal(e.view, "myxml3d", "xml3d.view = 'myxml3d'.");
    equal(e.getAttribute("view"), "myxml3d", "getAttribute = 'myxml3d'.");
    e.view = true;
    equal(e.view, "true", "xml3d.view == 'true'.");
    equal(e.getAttribute("view"), "true", "getAttribute = 'true'.");

    // Set via attribute
    e.setAttribute("view", "#myView");
    equal(e.view, "#myView", "Value set via setAttribute to 123.");
});

test("Float interface tests (XHTML: Case sensitive)", function() {
    var e = document.createElementNS(XML3D.xml3dNS, "float");

    // Set via interface
        QUnit.close(e.key, 0.0, EPSILON, "float.key is 0.0 initially.");
        e.key = 0.4;
        QUnit.close(e.key, 0.4, EPSILON, "float.key = 0.4.");
        equal(e.getAttribute("key"), "0.4", "getAttribute = '0.4'.");
        e.key = true;
        QUnit.close(e.key, 1, EPSILON, "float.key = 1.");

        // Set via attribute
        e.setAttribute("key", "0.5");
        QUnit.close(e.key, 0.5, EPSILON, "Value set via setAttribute to 0.5.");
        equal(e.getAttribute("key"), "0.5", "Value set via setAttribute to 0.5.");

        e.setAttribute("key", 0.6);
        QUnit.close(e.key, 0.6, EPSILON, "Value set via setAttribute to 0.6.");
        equal(e.getAttribute("key"), "0.6", "Value set via setAttribute to 0.6.");

        e.setAttribute("key", "asdf");
        equal(e.getAttribute("key"), "asdf", "attribute value invalid");
        QUnit.close(e.key, 0.0, EPSILON, "Invalid value set via setAttribute. Back to default: 0.0.");
    });

test("Float interface tests (HTML: Case insensitive)", function() {
        var e = document.createElement("float");

        // Set via interface
        QUnit.close(e.key, 0.0, EPSILON, "float.key is 0.0 initially.");
        e.key = 0.87;
        QUnit.close(e.key, 0.87, EPSILON, "float.key = 0.87.");
        equal(e.getAttribute("key"), "0.87", "getAttribute = '0.87'.");
        e.key = true;
        QUnit.close(e.key, 1, EPSILON, "float.key = 1.");

        // Set via attribute
        e.setAttribute("key", "0.5");
        QUnit.close(e.key, 0.5, EPSILON, "Value set via setAttribute to 0.5.");
        equal(e.getAttribute("key"), "0.5", "Value set via setAttribute to 0.5.");

        e.setAttribute("key", 0.6);
        QUnit.close(e.key, 0.6, EPSILON, "Value set via setAttribute to 0.6.");
        equal(e.getAttribute("key"), "0.6", "Value set via setAttribute to 0.6.");

        e.setAttribute("key", "asdf");
        equal(e.getAttribute("key"), "asdf", "attribute value invalid");
        QUnit.close(e.key, 0.0, EPSILON, "Invalid value set via setAttribute. Back to default: 0.0.");
    });


test("Boolean interface tests", function() {
    // Close to behavior of HTMLInputElement::disabled
        var e = document.createElement("input");
        equal(e.disabled, false, "input.disabled is 'false' by default.");
        // Set via interface
        e.disabled = true;
        equal(e.disabled, true, "input.disabled set to true.");
        e.disabled = 0;
        equal(e.disabled, false, "input.disabled set to 0.");
        e.disabled = "false";
        equal(e.disabled, true, "input.disabled set to non-empty string.");
        e.visible = true;

        equal(e.getAttribute("visible"), null, "Attribute has not been set yet.");

        // now XML3DGroupElement::visible
        // We do not completely emulate the weird behavior of boolean values in HTML
        // HTML boolean attributes have a real strange behavior, mainly for backward compatibility.
        // HTML/SGML allows something like <input disabled> which maps to following in XHTML:
        // <input disabled="true"/> => disabled as expected
        // <input disabled="false"/> => also disabled
        // The semantic is: If the disabled attribute is set, it's disabled otherwise not
        // This makes only sense for booleans, where the default is false.
        // Thus we use the "standard" behavior as for example an integer value
        e = document.createElement("float");

        // Set via interface
        equal(e.param, false, "float.param is 'true' initially.");
        e.param = true;
        equal(e.param, true, "float.param set to false;");
        e.param = false;
        equal(e.param, false, "float.param set to true;");
        e.param = 0;
        equal(e.param, false, "float.param set to 0;");
        e.param = "false"; // Non-empty string evaulates to 'true'
        equal(e.param, true, "float.param set to non-empty string.");

        equal(e.getAttribute("param"), "true", "Attribute evaluates to 'true'.");

        // Set via attribute
        e.param = false;
        e.setAttribute("param", "true");
        equal(e.param, true, "Value set via setAttribute to 'true'.");

        e.param = true;
        equal(e.getAttribute("param"), "true", "getAttribute = 'true'.");
        e.param = false;
        equal(e.getAttribute("param"), "false", "getAttribute = 'false'.");

        e.setAttribute("param", "asdf");
        equal(e.param, true, "Invalid value set via setAttribute.");
    });

test("Vec3 interface tests", function() {
    var e = document.createElementNS(XML3D.xml3dNS, "transform");
    equal(e.getAttribute("scale"), null, "Attribute has not been set yet.");

    // Set via interface
        QUnit.closeArray(e.scale.data, [1,1,1], EPSILON, "transform.scale is '1 1 1' initially.");

        e.scale = new XML3D.Vec3(1,0,0);
        QUnit.closeArray(e.scale.data, [1,0,0], EPSILON, "transform.scale changed after set");

        // Attribute is synced
        equal(e.getAttribute("scale"), "1 0 0", "getAttribute = '1 0 0'.");

        // Set via attribute
        e.setAttribute("scale", "1 2 3");
        QUnit.closeArray(e.scale.data, [1,2,3], EPSILON, "Value set via setAttribute to '1 2 3'.");

        e.setAttribute("scale", "asdf");
        QUnit.closeArray(e.scale.data, [1,1,1], EPSILON, "Invalid value set via setAttribute. Back to default: 1 1 1.");
    });

test("Vec4 interface tests", function() {
    var e = document.createElementNS(XML3D.xml3dNS, "transform");

    // Set via interface
        QUnit.closeArray(e.rotation.data, [0,0,1,0], EPSILON, "rotation is '0 0 1 0' initially.");

        e.rotation = [0,1,0,0];
        QUnit.closeArray(e.rotation.data, [0,1,0,0], EPSILON, "rotation changed after set");

        // Attribute is synced
        equal(e.getAttribute("rotation"), "0 1 0 0", "getAttribute = '0 1 0 0'.");

        // Set via attribute
        e.setAttribute("rotation", "1 0 0 3.14");
        QUnit.closeArray(e.rotation.data,[1,0,0,3.14], EPSILON, "Value set via setAttribute to '1 0 0 3.14'.");

        e.setAttribute("rotation", "asdf");
        QUnit.closeArray(e.rotation.data, [0,0,1,0], EPSILON, "Invalid value set via setAttribute. Back to default.");
    });

test("Enumeration interface tests", function() {
    // Behavior copied from HTMLInputElement::type
    var e = document.createElementNS(XML3D.xml3dNS, "texture");
    // Attribute not set
    equal(e.hasAttribute("type"), false, "hasAttribute = false.");
    equal(e.getAttribute("type"), null, "getAttribute = null.");

    // Set via interface
    equal(e.type, "2d", "texture.type is '2d' initially.");
    e.type = "3d";
    equal(e.type, "3d", "texture.type = '3d';");
    e.type = "1D";
    equal(e.type, "1d", "texture.type = '1D'; // case insensitive");
    // Set invalid, TODO: Right behavior?
    e.type = "asdf";
    equal(e.type, "2d", "texture.type set to invalid. Back to default: '2d'.");

    // Attribute is sync'ed
    e.type = "3d";
    equal(e.getAttribute("type"), "3d", "getAttribute = '3d'.");
    e.type = "asdf"; // Invalid values are set anyway
    equal(e.getAttribute("type"), "asdf", "getAttribute = 'asdf'.");

    // Set via attribute
    e.setAttribute("type", "1d");
    equal(e.type, "1d", "Value set via setAttribute to '1d'.");
    e.setAttribute("type", "3D"); // case insensitive
    equal(e.type, "3d", "Value set via setAttribute to '3D'.");
    e.setAttribute("type", "asdf"); // invalid
    equal(e.getAttribute("type"), "asdf", "getAttribute = 'asdf'.");
    equal(e.type, "2d", "Invalid value set via setAttribute. Back to default: '2d'.");
});

test("Typed Array interface tests", function() {
    var e = document.createElementNS(XML3D.xml3dNS, "float");
    notEqual(e.value, null, "Value must not be null");
    console.dir(e.value);
    ok(e.value instanceof Float32Array, "<float> has Float32Array");
    equal(e.value.length, 0, "Initial length is zero.");

    e = document.createElementNS(XML3D.xml3dNS, "int");
    notEqual(e.value, null, "Value must not be null");
    ok(e.value instanceof Int32Array,  "<int> has Int32Array");
    equal(e.value.length, 0, "Initial length is zero.");

    e = document.createElementNS(XML3D.xml3dNS, "bool");
    notEqual(e.value, null, "Value must not be null");
    ok(e.value instanceof Uint8Array,"<bool> has Uint8Array");
    equal(e.value.length, 0, "Initial length is zero.");
});


module("Element initialization tests", {
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
test("Interface initialization", function() {
    var t = this.doc.getElementById("t_mixed");
    var v = this.doc.getElementById("myView");
    var x = this.doc.getElementById("myXml3d");
    var m = this.doc.getElementById("myMesh01");
    var g = this.doc.getElementById("myGroup");

    QUnit.closeArray(t.translation.data, [1,2,3], EPSILON, "XML3D.Vec3 (transform::translation) initialized.");
    QUnit.closeArray(t.rotation.data, [1,0,0,1.5708], EPSILON, "XML3D.Vec4 (transform::rotation) initialized.");
    equal(x.width, 1000, "Int (xml3d::width) initialized.");
    equal(m.type, "lines", "Enumeration (mesh::type) initialized.");
    equal(g.onclick, null, "Event attribute (group::onclick) non-initialized.");
    equal(typeof m.onclick, "function", "Event attribute (mesh::onclick) initialized.");
});

test("Typed array initialization", 5, function() {
    var value = this.doc.getElementById("indices").value;
    equal(value.length, 6 , "6 values in array");
    value = this.doc.getElementById("positions").value;
    equal(value.length, 12 , "12 indices in array");
    value = this.doc.getElementById("texcoords").value;
    equal(value.length, 8 , "8 indices in array");
});
