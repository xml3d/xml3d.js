module("Element interface tests", {
});

var EPSILON = 0.00001;

test("Event attribute tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
    var getterText =  "alert('get function')";
    
    // Set via attribute and get via interface
    equals(e.onclick, null, "xml3d::onclick is null initially.");
    e.setAttribute("onclick", getterText);
    equals(e.getAttribute("onclick"), getterText, "Value set.");
    equals(typeof e.onclick, "function", "onclick is of type function");
    equals(e.onclick.toString(), "function onclick(event){\n  alert('get function')\n}", "text");
    
    // Set via interface
    var v = function() { console.log("set function"); };
    e.onclick = v;
    equals(e.getAttribute("onclick"), getterText, "Value of attribute remains unchanged after setting event function per interface.");
    equals(e.onclick, v, "Function is set.");
    
    e.setAttribute("onclick", getterText);
    notEqual(e.onclick, v, "Setting of attribute changed function.");
});

test("Int interface tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
    
    // Set via interface
    equals(e.width, 800, "xml3d.width is 800 initially.");
    e.width = 300;
    equals(e.width, 300, "xml3d.width = 300.");
    equals(e.getAttribute("width"), "300", "getAttribute = '300'.");
    e.width = true;
    equals(e.width, 1, "xml3d.width = 1.");
    e.width = 500.9;
    equals(e.width, 500, "xml3d.width = 500.9.");
    

    // Set via attribute
    e.setAttribute("width", "123");
    equals(e.width, 123, "Value set via setAttribute to 123.");

    e.setAttribute("width", "100.9");
    equals(e.width, 100, "Value set via setAttribute to 100.9.");

    e.setAttribute("width", "asdf");
    equals(e.width, 800, "Invalid value set via setAttribute. Back to default: 800.");
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

    e.setAttribute("fieldOfView", "asdf");
    equals(e.fieldOfView, 0.785398, "Invalid value set via setAttribute. Back to default: 0.785398.");
});

test("Boolean interface tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "view");
    
    // Set via interface
    equals(e.visible, true, "view.fieldOfView is 'true' initially.");
    e.visible = false;
    equals(e.visible, false, "view.visible = false;");
    e.visible = true;
    equals(e.visible, true, "view.visible = true;");
    e.visible = 0;
    equals(e.visible, false, "view.visible = true;");
    e.visible = "false"; // Non-empty string evaulates to 'true'
    equals(e.visible, true, "view.visible = 'false';");

    e.visible = true;
    equals(e.getAttribute("visible"), "true", "getAttribute = 'true'.");
    e.visible = true;
    equals(e.getAttribute("visible"), "true", "getAttribute = 'true'.");

    // Set via attribute
    e.visible = false;
    e.setAttribute("visible", "true");
    equals(e.visible, true, "Value set via setAttribute to 'true'.");

    e.setAttribute("visible", "asdf");
    equals(e.visible, 0.785398, "Invalid value set via setAttribute. Back to default: 0.785398.");
});

test("XML3DVec interface tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "transform");
    
    // Set via interface
    QUnit.closeVector(e.scale, new XML3DVec3(1, 1, 1), EPSILON, "transform.scale is '1 1 1' initially.");
    raises(function() {e.scale = new XML3DVec3();}, "XML3DVec properties are readonly");
    QUnit.closeVector(e.scale, new XML3DVec3(1, 1, 1), EPSILON, "transform.scale not changed after set");

    e.scale.x += 2;
    QUnit.closeVector(e.scale, new XML3DVec3(3, 1, 1), EPSILON, "transform.scale.x set to 3");

    // Attribute is synced
    equals(e.getAttribute("scale"), "3 1 1", "getAttribute = '3 1 1'.");

    // Set via attribute
    e.setAttribute("scale", "1 2 3");
    QUnit.closeVector(e.scale, new XML3DVec3(1, 2, 3), EPSILON, "Value set via setAttribute to '1 2 3'.");

    // TODO: What should happen here?
    e.setAttribute("scale", "asdf");
    QUnit.closeVector(e.scale, new XML3DVec3(1, 2, 3), EPSILON, "Invalid value set via setAttribute. Back to default: 0.785398.");
});

test("XML3DRotation interface tests", function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "transform");
    
    // Set via interface
    QUnit.closeRotation(e.rotation, new XML3DRotation(new XML3DVec3(0, 0, 1),0), EPSILON, "texture.type is '0 0 1 0' initially.");
    raises(function() {e.rotation = new XML3DRotation();}, "XML3DRotation properties are readonly");
    QUnit.closeRotation(e.rotation, new XML3DRotation(new XML3DVec3(0, 0, 1),0), EPSILON, "texture.type not changed after set");

    e.rotation.angle = 2;
    QUnit.closeRotation(e.rotation, new XML3DRotation(new XML3DVec3(0, 0, 1),2), EPSILON, "texture.type.angle set to 2");

    // Attribute is synced
    equals(e.getAttribute("rotation"), "0 0 1 2", "getAttribute = '0 0 1 2'.");

    // Set via attribute
    e.setAttribute("rotation", "1 0 0 3.14");
    QUnit.closeRotation(e.rotation, new XML3DRotation(new XML3DVec3(1, 0, 0),3.14), EPSILON, "Value set via setAttribute to '1 0 0 3.14'.");

    // TODO: What should happen here?
    e.setAttribute("rotation", "asdf");
    QUnit.closeRotation(e.rotation, new XML3DRotation(new XML3DVec3(0, 0, 1),2), EPSILON, "Invalid value set via setAttribute. Back to default?.");
});

test("Enumeration interface tests", function() {
    // Behavior copied from HTMLInputElement::type
    
    var e = document.createElementNS(org.xml3d.xml3dNS, "texture");
    
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