

var EPSILON = 0.00001;

function NotifyingAdapterFactory() {
    this.name = "test";
    this.event = null;
    this.createAdapter = function() {
        return {
            init : function() {},
            notifyChanged : function(e) {
                this.event = e;
                ok(true, "Adapter notified");
            }
        };
    };
};
org.xml3d.createClass(NotifyingAdapterFactory, org.xml3d.data.AdapterFactory);

module("Element notification tests", {
    factory : new NotifyingAdapterFactory()
});

test("Factory test", 2, function() {
    ok(this.factory, "This factory exists.");
    this.factory.createAdapter().notifyChanged();
});

test("Event attribute tests", 7, function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
    var a = this.factory.getAdapter(e);
    ok(a, "Adapter created");
    e.setAttribute("onclick", "alert('Hallo');");
    ok(a.event instanceof MutationEvent, "MutationEvent");
    equal(a.event.attrName, "onclick", "MutationEvent::attrName set");
    equal(a.event.relatedNode, e, "MutationEvent::relatedNode set");
    e.onclick = function() {};
    console.log(a.event);
    equal(a.event.attrName, "onclick", "MutationEvent::attrName");
});

test("Int interface tests", 2, function() {
    e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
    var a = this.factory.getAdapter(e);
    e.setAttribute("width", "123");
    e.width = 300;
});

test("Float interface tests", 2, function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "view");
    var a = this.factory.getAdapter(e);
    e.setAttribute("fieldOfView", "0.5");
    e.fieldOfView = 0.87;
});

test("Boolean interface tests", 2, function() {
    e = document.createElementNS(org.xml3d.xml3dNS, "view");
    var a = this.factory.getAdapter(e);
    e.setAttribute("visible", "false");
    e.visible = true;
});

test("XML3DVec interface tests", 3, function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "transform");
    var a = this.factory.getAdapter(e);
    e.setAttribute("scale", "1 2 3");
    e.scale.x = 4.0;
    e.scale.setVec3Value("4 5 6");
});

test("XML3DRotation interface tests", 5, function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "transform");
    var a = this.factory.getAdapter(e);
    e.setAttribute("rotation", "1 0 0 3.14");
    e.rotation.angle = 4.0;
    e.rotation.axis.x = 1.0;
    e.rotation.axis.setVec3Value("1 0 0");
    e.rotation.setAxisAngleValue("1 4 5 6");
});

test("Enumeration interface tests", 5, function() {
    // Behavior copied from HTMLInputElement::type
    var e = document.createElementNS(org.xml3d.xml3dNS, "texture");
    var a = this.factory.getAdapter(e);
    // Attribute not set
    e.type = "3d";
    e.type = "1D";
    e.setAttribute("type", "3D"); // case insensitive
    e.setAttribute("type", "1d");
    e.setAttribute("type", "asdf"); // invalid
});

