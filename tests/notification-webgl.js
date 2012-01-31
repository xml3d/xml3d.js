

var EPSILON = 0.00001;

function NotifyingAdapterFactory() {
    this.name = "test";
    this.event = null;
    this.createAdapter = function() {
        return {
            init : function() {},
            notifyChanged : function(e) {
                this.event = e;
                ok(true, "Adapter notified: " + e.newValue);
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
    this.factory.createAdapter().notifyChanged({});
});

test("Event attribute notification tests", 7, function() {
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

test("Int attribute notifcation tests", 2, function() {
    e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
    var a = this.factory.getAdapter(e);
    e.setAttribute("width", "123");
    e.width = 300;
});

test("Float attribute notification tests", 2, function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "view");
    var a = this.factory.getAdapter(e);
    e.setAttribute("fieldOfView", "0.5");
    e.fieldOfView = 0.87;
});

test("Boolean attribute notification tests", 2, function() {
    e = document.createElementNS(org.xml3d.xml3dNS, "view");
    var a = this.factory.getAdapter(e);
    e.setAttribute("visible", "false");
    e.visible = true;
});

test("XML3DVec attribute notification tests", 3, function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "transform");
    var a = this.factory.getAdapter(e);
    e.setAttribute("scale", "1 2 3");
    e.scale.x = 4.0;
    e.scale.setVec3Value("4 5 6");
});

test("XML3DRotation attribute notification tests", 5, function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "transform");
    var a = this.factory.getAdapter(e);
    e.setAttribute("rotation", "1 0 0 3.14");
    e.rotation.angle = 4.0;
    e.rotation.axis.y = 1.0;
    e.rotation.axis.setVec3Value("1 0 0");
    e.rotation.setAxisAngleValue("1 4 5 6");
});

test("Enumeration attribute notification tests", 5, function() {
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

test("Reference attribute notification tests", 4, function() {
    var e = document.createElementNS(org.xml3d.xml3dNS, "xml3d");
    var a = this.factory.getAdapter(e);
    e.setAttribute("activeView", "#myView");
    equal(a.event.type, "XML3D_DANGLING_REFERENCE", "Can't resolve before insertion into DOM.");
    equal(a.event.value, null, "Can't resolve before insertion into DOM.");
    e.activeView = "#hallo";
});
