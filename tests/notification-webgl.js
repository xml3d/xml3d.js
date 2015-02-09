
function NotifyingAdapterFactory() {
    XML3D.base.NodeAdapterFactory.call(this, "test");
    var that = this;
    this.name = "test";
    this.event = null;
    this.type = "NotifyingAdapterFactory";
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
XML3D.createClass(NotifyingAdapterFactory, XML3D.base.NodeAdapterFactory);

module("Element notification tests", {
    factory : new NotifyingAdapterFactory()
});

test("Factory test", 2, function() {
    ok(this.factory, "This factory exists.");
    this.factory.createAdapter().notifyChanged({});
});

test("Event attribute notification tests", 7, function() {
    var e = document.createElementNS(XML3D.xml3dNS, "xml3d");
    var a = this.factory.getAdapter(e);
    ok(a, "Adapter created"); // 1
    e.setAttribute("onclick", "alert('Hallo');"); // 2. Adapter notified
    XML3D.flushDOMChanges();
    var evt = this.factory.event;
    //console.dir(evt);
    ok(evt, "Event has been thrown"); // 3
    ok(evt instanceof XML3D.events.NotificationWrapper, "Type is NotificationWrapper"); // 4
    ok(evt.mutation, "DOM notification is wrapped"); // 5
    equal(evt.mutation.attributeName, "onclick", "MutationEvent::attrName set"); // 6
    e.onclick = function() {}; // Adapter Notified (Not anymore!)
    XML3D.flushDOMChanges();
    equal(evt.mutation.attributeName, "onclick", "MutationEvent::attrName"); // 8
});

test("Int attribute notifcation tests", 2, function() {
    e = document.createElementNS(XML3D.xml3dNS, "xml3d");
    var a = this.factory.getAdapter(e);
    e.setAttribute("width", "123");
    e.width = 300;
    XML3D.flushDOMChanges();
});

test("Float attribute notification tests", 2, function() {
    var e = document.createElementNS(XML3D.xml3dNS, "view");
    var a = this.factory.getAdapter(e);
    e.setAttribute("fieldOfView", "0.5");
    e.fieldOfView = 0.87;
    XML3D.flushDOMChanges();
});

test("Boolean attribute notification tests", 2, function() {
    e = document.createElementNS(XML3D.xml3dNS, "view");
    var a = this.factory.getAdapter(e);
    e.setAttribute("visible", "false");
    e.visible = true;
    XML3D.flushDOMChanges();
});

test("XML3DVec attribute notification tests", 3, function() {
    var e = document.createElementNS(XML3D.xml3dNS, "transform");
    var a = this.factory.getAdapter(e);
    e.setAttribute("scale", "1 2 3");
    e.scale.x = 4.0;
    e.scale.setVec3Value("4 5 6");
    XML3D.flushDOMChanges();
});

test("XML3DRotation attribute notification tests", 5, function() {
    var e = document.createElementNS(XML3D.xml3dNS, "transform");
    var a = this.factory.getAdapter(e);
    e.setAttribute("rotation", "1 0 0 3.14");
    e.rotation.angle = 4.0;
    e.rotation.axis.y = 1.0;
    e.rotation.axis.setVec3Value("1 0 0");
    e.rotation.setAxisAngleValue("1 4 5 6");
    XML3D.flushDOMChanges();
});

test("Enumeration attribute notification tests", 5, function() {
    // Behavior copied from HTMLInputElement::type
    var e = document.createElementNS(XML3D.xml3dNS, "texture");
    var a = this.factory.getAdapter(e);
    // Attribute not set
    e.type = "3d";
    e.type = "1D";
    e.setAttribute("type", "3D"); // case insensitive
    e.setAttribute("type", "1d");
    e.setAttribute("type", "asdf"); // invalid
    XML3D.flushDOMChanges();
});

module("Composed Element notification tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.win = document.getElementById("xml3dframe").contentWindow;
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering02.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    },
    factory : new NotifyingAdapterFactory()
});

test("Only one element gets notified", 3, function() {

    function addAdapters(e, factory) {
        var c = e.firstElementChild;
        while(c) {
            factory.getAdapter(c);
            addAdapters(c, factory);
            c = c.nextElementSibling;
        }
    }

    var x = this.doc.getElementById("xml3DElem");
    this.factory.getAdapter(x);
    addAdapters(x, this.factory);
    var img = this.doc.getElementById("tex1img");
    img.setAttribute("src", "textures/magenta.png");
    this.win.XML3D.flushDOMChanges();
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
    pos.textContent = pos.textContent.substr(5);
    equal(pos.value.length, 11);
    equal(this.factory.event.type, XML3D.events.VALUE_MODIFIED);

});

test("Text DOMNodeInserted notification", 8, function() {
    // 1: Found frame
    // 2: Scene loaded
    var index = this.doc.getElementById("indices");
    this.factory.getAdapter(index);
    index.appendChild(this.doc.createTextNode(" 0 1 2")); // 3: Adapter notified: Notification (type:1)
    equal(index.value.length, 9, "Length of typed array after text node has been inserted"); // 4
    equal(this.factory.event.type, XML3D.events.VALUE_MODIFIED, "Notification of type VALUE_MODIFIED"); // 5

    var pos = this.doc.getElementById("positions");
    this.factory.getAdapter(pos);
    equal(pos.value.length, 12, "Length of typed array is correct before modification");
    pos.textContent = "1 0 2"; // 6: Adapter notified: Notification (type:1)
    equal(pos.value.length, 3, "Length of typed array after textContent has been set"); // 7
});
