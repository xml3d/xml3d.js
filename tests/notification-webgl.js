
function NotifyingAdapterFactory() {
    var that = this;
    this.name = "test";
    this.event = null;
    this.createAdapter = function() {
        return {
            init : function() {},
            notifyChanged : function(e) {
                that.event = e;
                ok(true, "Adapter notified: " + e);
            }
        };
    };
};
xml3d.createClass(NotifyingAdapterFactory, xml3d.data.AdapterFactory);

module("Element notification tests", {
    factory : new NotifyingAdapterFactory()
});

test("Factory test", 2, function() {
    ok(this.factory, "This factory exists.");
    this.factory.createAdapter().notifyChanged({});
});

test("Event attribute notification tests", 9, function() {
    var e = document.createElementNS(xml3d.xml3dNS, "xml3d");
    var a = this.factory.getAdapter(e);
    ok(a, "Adapter created");
    e.setAttribute("onclick", "alert('Hallo');");
    var evt = this.factory.event;
    console.dir(evt);
    ok(evt, "Event has been thrown");
    ok(evt instanceof xml3d.events.NotificationWrapper, "Type is NotificationWrapper");
    ok(evt.wrapped, "DOM notification is wrapped");
    equal(evt.wrapped.attrName, "onclick", "MutationEvent::attrName set");
    notEqual(evt.wrapped.relatedNode, null, "MutationEvent::relatedNode set");
    e.onclick = function() {};
    equal(evt.wrapped.attrName, "onclick", "MutationEvent::attrName");
});

test("Int attribute notifcation tests", 2, function() {
    e = document.createElementNS(xml3d.xml3dNS, "xml3d");
    var a = this.factory.getAdapter(e);
    e.setAttribute("width", "123");
    e.width = 300;
});

test("Float attribute notification tests", 2, function() {
    var e = document.createElementNS(xml3d.xml3dNS, "view");
    var a = this.factory.getAdapter(e);
    e.setAttribute("fieldOfView", "0.5");
    e.fieldOfView = 0.87;
});

test("Boolean attribute notification tests", 2, function() {
    e = document.createElementNS(xml3d.xml3dNS, "view");
    var a = this.factory.getAdapter(e);
    e.setAttribute("visible", "false");
    e.visible = true;
});

test("XML3DVec attribute notification tests", 3, function() {
    var e = document.createElementNS(xml3d.xml3dNS, "transform");
    var a = this.factory.getAdapter(e);
    e.setAttribute("scale", "1 2 3");
    e.scale.x = 4.0;
    e.scale.setVec3Value("4 5 6");
});

test("XML3DRotation attribute notification tests", 5, function() {
    var e = document.createElementNS(xml3d.xml3dNS, "transform");
    var a = this.factory.getAdapter(e);
    e.setAttribute("rotation", "1 0 0 3.14");
    e.rotation.angle = 4.0;
    e.rotation.axis.y = 1.0;
    e.rotation.axis.setVec3Value("1 0 0");
    e.rotation.setAxisAngleValue("1 4 5 6");
});

test("Enumeration attribute notification tests", 5, function() {
    // Behavior copied from HTMLInputElement::type
    var e = document.createElementNS(xml3d.xml3dNS, "texture");
    var a = this.factory.getAdapter(e);
    // Attribute not set
    e.type = "3d";
    e.type = "1D";
    e.setAttribute("type", "3D"); // case insensitive
    e.setAttribute("type", "1d");
    e.setAttribute("type", "asdf"); // invalid
});

test("Reference attribute notification tests", 5, function() {
    var e = document.createElementNS(xml3d.xml3dNS, "xml3d");
    var a = this.factory.getAdapter(e);
    e.setAttribute("activeView", "#myView");
    ok(this.factory.event, "Event has been thrown");
    equal(this.factory.event.type, xml3d.events.DANGLING_REFERENCE, "Can't resolve before insertion into DOM.");
    equal(this.factory.event.value, null, "Can't resolve before insertion into DOM.");
    e.activeView = "#hallo";
});


module("Typed array notification tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/basic.xhtml", this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    },
    factory : new NotifyingAdapterFactory()
});

test("DOMCharacterDataModified notification", 6, function() {
    // replaceWholeText not implemented in FF
    /*var index = this.doc.getElementById("indices");
    this.factory.getAdapter(index);
    index.firstChild.replaceWholeText("1 2 3");
    equal(index.value.length, 3);*/

    var pos = this.doc.getElementById("positions");
    this.factory.getAdapter(pos);
    equal(pos.value.length, 12);
    pos.firstChild.deleteData (0,5);
    equal(pos.value.length, 11);
    equal(this.factory.event.type, xml3d.events.VALUE_MODIFIED);

});

test("Text DOMNodeInserted notification", 7, function() {
    // 1: Found frame
    // 2: Scene loaded
    var index = this.doc.getElementById("indices");
    this.factory.getAdapter(index);
    index.appendChild(this.doc.createTextNode(" 0 1 2")); // 3: Adapter notified: Notification (type:1)
    equal(index.value.length, 9, "Length of typed array after text node has been inserted"); // 4
    equal(this.factory.event.type, xml3d.events.VALUE_MODIFIED, "Notfication of type VALUE_MODIFIED"); // 5

    var pos = this.doc.getElementById("positions");
    this.factory.getAdapter(pos);
    pos.textContent = "1 0 2"; // 6: Adapter notified: Notification (type:1)
    equal(pos.value.length, 3, "Length of typed array after textContent has been set"); // 7
});
