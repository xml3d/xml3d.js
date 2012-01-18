module("Element attributes tests", {});

var EPSILON = 0.00001;

test("Event attribute tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
    var getterText = "alert('get function');";

    // Set via attribute and get via interface
        equals(e.onclick, null, "xml3d::onclick is null initially.");
        e.setAttribute("onclick", getterText);
        equals(e.getAttribute("onclick"), getterText, "Value set.");
        equals(typeof e.onclick, "function", "onclick is of type function");
        notEqual(e.onclick.toString().match(new RegExp("function onclick.*\n.*alert(.*get function.*).*\n.*")), null , "text");
        //console.log(e.onclick.toString().match());
        // Set via interface
        var v = function() {
            console.log("set function");
        };
        e.onclick = v;
        equals(e.getAttribute("onclick"), getterText,
                "Value of attribute remains unchanged after setting event function per interface.");
        equals(e.onclick, v, "Function is set.");

        e.onclick = "hallo";
        equals(e.onclick, null, "Assign invalid type via interface: null.");

        e.onclick = v;
        e.setAttribute("onclick", getterText);
        notEqual(e.onclick, v, "Valid setAttribute changed function.");
        equals(typeof e.onclick, "function", "onclick is of type function after setAttribute");
    });

test("Int interface tests", function() {
    // Behavior copied from HTMLCanvas::width
        // Check this first:
        var e = document.createElement("canvas");
        equals(e.getAttribute("width"), null, "no Attribute set");
        equals(e.width, 300, "canvas.width is 300 by default.");
        e.setAttribute("width", "509.5");
        equals(e.width, 509, "canvas.width ='509.5' // 509;");
        equals(e.getAttribute("width"), "509.5", "getAttribute = '509.5'");
        e.setAttribute("width", 509.5);
        equals(e.width, 509, "canvas.width = 509.5 // 509;");
        equals(e.getAttribute("width"), "509.5", "getAttribute = '509.5'");

        // Now xml3d
        e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
        equals(e.getAttribute("width"), null, "no Attribute set");

        // Set via interface
        equals(e.width, 800, "xml3d.width is 800 by default.");
        e.width = 300;
        equals(e.width, 300, "xml3d.width = 300.");
        equals(e.getAttribute("width"), "300", "getAttribute = '300'.");
        e.width = true;
        equals(e.width, 1, "xml3d.width = 1.");
        equals(e.getAttribute("width"), "1", "getAttribute = '1'.");
        e.width = 500.9;
        equals(e.width, 500, "xml3d.width = 500.9.");
        equals(e.getAttribute("width"), "500", "getAttribute = '500'.");

        // Set via attribute
        e.setAttribute("width", "123");
        equals(e.width, 123, "Value set via setAttribute to 123.");
        equals(e.getAttribute("width"), "123", "Value set via setAttribute to 123. getAttribute = '509.5'");

        e.setAttribute("width", "509.5");
        equals(e.width, 509, "xml3d.width ='509.5' // 509;");
        equals(e.getAttribute("width"), "509.5", "getAttribute = '509.5'");

        e.setAttribute("width", 509.5);
        equals(e.width, 509, "setAttribute(509.5) => xml3d.width == 509;");
        equals(e.getAttribute("width"), "509.5", "setAttribute(509.5) => getAttribute == '509.5'");

        e.setAttribute("width", "asdf");
        equals(e.getAttribute("width"), "asdf", "Invalid value is set to attribute");
        equals(e.width, 800, "Invalid value set via setAttribute. Back to default: 800.");
    });

test("String interface tests", function() {
        e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
        equals(e.getAttribute("id"), null, "no Attribute set");
        // Set via interface
        equals(e.id, "", "No Attribute set.");

        e.id = "myxml3d";
        equals(e.id, "myxml3d", "xml3d.id = 'myxml3d'.");
        equals(e.getAttribute("id"), "myxml3d", "getAttribute = 'myxml3d'.");
        e.id = true;
        equals(e.id, "true", "xml3d.id == 'true'.");
        equals(e.getAttribute("id"), "true", "getAttribute = 'true'.");

        // Set via attribute
        e.setAttribute("id", "123");
        equals(e.id, "123", "Value set via setAttribute to 123.");
    });

test("Reference interface tests", function() {
    e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
    equals(e.getAttribute("activeView"), null, "no Attribute set");
    // Set via interface
    equals(e.activeView, "", "No Attribute set.");

    e.activeView = "myxml3d";
    equals(e.activeView, "myxml3d", "xml3d.activeView = 'myxml3d'.");
    equals(e.getAttribute("activeView"), "myxml3d", "getAttribute = 'myxml3d'.");
    e.activeView = true;
    equals(e.activeView, "true", "xml3d.activeView == 'true'.");
    equals(e.getAttribute("activeView"), "true", "getAttribute = 'true'.");

    // Set via attribute
    e.setAttribute("activeView", "#myView");
    equals(e.activeView, "#myView", "Value set via setAttribute to 123.");
});

test("Float interface tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "view");

    // Set via interface
        equals(e.fieldOfView, 0.785398, "view.fieldOfView is 0.785398 initially.");
        e.fieldOfView = 0.87;
        equals(e.fieldOfView, 0.87, "view.fieldOfView = 0.87.");
        equals(e.getAttribute("fieldOfView"), "0.87", "getAttribute = '0.87'.");
        e.fieldOfView = true;
        equals(e.fieldOfView, 1, "view.fieldOfView = 1.");

        // Set via attribute
        e.setAttribute("fieldOfView", "0.5");
        equals(e.fieldOfView, 0.5, "Value set via setAttribute to 0.5.");
        equals(e.getAttribute("fieldOfView"), "0.5", "Value set via setAttribute to 0.5.");

        e.setAttribute("fieldOfView", 0.6);
        equals(e.fieldOfView, 0.6, "Value set via setAttribute to 0.6.");
        equals(e.getAttribute("fieldOfView"), "0.6", "Value set via setAttribute to 0.6.");

        e.setAttribute("fieldOfView", "asdf");
        equals(e.getAttribute("fieldOfView"), "asdf", "attribute value invalid");
        equals(e.fieldOfView, 0.785398, "Invalid value set via setAttribute. Back to default: 0.785398.");
    });

test("Boolean interface tests", function() {
    // Close to behavior of HTMLInputElement::disabled
        var e = document.createElement("input");
        equals(e.disabled, false, "input.disabled is 'false' by default.");
        // Set via interface
        e.disabled = true;
        equals(e.disabled, true, "input.disabled set to true.");
        e.disabled = 0;
        equals(e.disabled, false, "input.disabled set to 0.");
        e.disabled = "false";
        equals(e.disabled, true, "input.disabled set to non-empty string.");
        e.visible = true;

        equals(e.getAttribute("visible"), null, "Attribute has not been set yet.");

        // now XML3DViewElement::visible
        e = document.createElementNS(org.xml3d.xml3dNS, "view");

        // Set via interface
        equals(e.visible, true, "view.fieldOfView is 'true' initially.");
        e.visible = false;
        equals(e.visible, false, "view.visible set to false;");
        e.visible = true;
        equals(e.visible, true, "view.visible set to true;");
        e.visible = 0;
        equals(e.visible, false, "view.visible set to 0;");
        e.visible = "false"; // Non-empty string evaulates to 'true'
        equals(e.visible, true, "view.visible set to non-empty string.");

        equals(e.getAttribute("visible"), null, "Attribute has not been set yet.");

        // Set via attribute
        e.visible = false;
        e.setAttribute("visible", "true");
        equals(e.visible, true, "Value set via setAttribute to 'true'.");

        e.visible = true;
        equals(e.getAttribute("visible"), "true", "getAttribute = 'true'.");
        e.visible = false;
        equals(e.getAttribute("visible"), "false", "getAttribute = 'false'.");

        e.setAttribute("visible", "asdf");
        equals(e.visible, true, "Invalid value set via setAttribute.");
    });

test("XML3DVec interface tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "transform");
    equals(e.getAttribute("scale"), null, "Attribute has not been set yet.");

    // Set via interface
        QUnit.closeVector(e.scale, new XML3DVec3(1, 1, 1), EPSILON, "transform.scale is '1 1 1' initially.");
        raises(function() {
            e.scale = new XML3DVec3();
        }, "XML3DVec properties are readonly");
        QUnit.closeVector(e.scale, new XML3DVec3(1, 1, 1), EPSILON, "transform.scale not changed after set");

        e.scale.x += 2;
        QUnit.closeVector(e.scale, new XML3DVec3(3, 1, 1), EPSILON, "transform.scale.x set to 3");

        // Attribute is synced
        equals(e.getAttribute("scale"), "3 1 1", "getAttribute = '3 1 1'.");

        // Set via attribute
        e.setAttribute("scale", "1 2 3");
        QUnit.closeVector(e.scale, new XML3DVec3(1, 2, 3), EPSILON, "Value set via setAttribute to '1 2 3'.");

        e.setAttribute("scale", "asdf");
        QUnit.closeVector(e.scale, new XML3DVec3(1, 1, 1), EPSILON,
                "Invalid value set via setAttribute. Back to default: 1 1 1.");
    });

test("XML3DRotation interface tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "transform");

    // Set via interface
        QUnit.closeRotation(e.rotation, new XML3DRotation(new XML3DVec3(0, 0, 1), 0), EPSILON,
                "texture.type is '0 0 1 0' initially.");
        raises(function() {
            e.rotation = new XML3DRotation();
        }, "XML3DRotation properties are readonly");
        QUnit.closeRotation(e.rotation, new XML3DRotation(new XML3DVec3(0, 0, 1), 0), EPSILON,
                "texture.type not changed after set");

        e.rotation.angle = 2;
        QUnit.closeRotation(e.rotation, new XML3DRotation(new XML3DVec3(0, 0, 1), 2), EPSILON,
                "texture.type.angle set to 2");

        // Attribute is synced
        equals(e.getAttribute("rotation"), "0 0 1 2", "getAttribute = '0 0 1 2'.");

        // Set via attribute
        e.setAttribute("rotation", "1 0 0 3.14");
        QUnit.closeRotation(e.rotation, new XML3DRotation(new XML3DVec3(1, 0, 0), 3.14), EPSILON,
                "Value set via setAttribute to '1 0 0 3.14'.");

        e.setAttribute("rotation", "asdf");
        QUnit.closeRotation(e.rotation, new XML3DRotation(new XML3DVec3(0, 0, 1), 0), EPSILON,
                "Invalid value set via setAttribute. Back to default.");
    });

test("Enumeration interface tests", function() {
    // Behavior copied from HTMLInputElement::type
    var e = document.createElementNS(org.xml3d.xml3dNS, "texture");
    // Attribute not set
    equals(e.hasAttribute("type"), false, "hasAttribute = false.");
    equals(e.getAttribute("type"), null, "getAttribute = null.");

    // Set via interface
    equals(e.type, "2d", "texture.type is '2d' initially.");
    e.type = "3d";
    equals(e.type, "3d", "texture.type = '3d';");
    e.type = "1D";
    equals(e.type, "1d", "texture.type = '1D'; // case insensitive");
    // Set invalid, TODO: Right behavior?
    e.type = "asdf";
    equals(e.type, "2d", "texture.type set to invalid. Back to default: '2d'.");

    // Attribute is sync'ed
    e.type = "3d";
    equals(e.getAttribute("type"), "3d", "getAttribute = '3d'.");
    e.type = "asdf"; // Invalid values are set anyway
    equals(e.getAttribute("type"), "asdf", "getAttribute = 'asdf'.");

    // Set via attribute
    e.setAttribute("type", "1d");
    equals(e.type, "1d", "Value set via setAttribute to '1d'.");
    e.setAttribute("type", "3D"); // case insensitive
    equals(e.type, "3d", "Value set via setAttribute to '3D'.");
    e.setAttribute("type", "asdf"); // invalid
    equals(e.getAttribute("type"), "asdf", "getAttribute = 'asdf'.");
    equals(e.type, "2d", "Invalid value set via setAttribute. Back to default: '2d'.");
});

test("Typed Array interface tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "float");
    notEqual(e.value, null, "Value must not be null");
    equal(e.value.toString(), "[object Float32Array]", "<float> has Float32Array");
    equal(e.value.length, 0, "Initial length is zero.");

    e = document.createElementNS(org.xml3d.xml3dNS, "int");
    notEqual(e.value, null, "Value must not be null");
    equal(e.value.toString(), "[object Int32Array]", "<int> has Int32Array");
    equal(e.value.length, 0, "Initial length is zero.");

    e = document.createElementNS(org.xml3d.xml3dNS, "bool");
    notEqual(e.value, null, "Value must not be null");
    equal(e.value.toString(), "[object Uint8Array]", "<bool> has Uint8Array");
    equal(e.value.length, 0, "Initial length is zero.");
});
