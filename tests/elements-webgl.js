
module("Element configuration tests", {
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
    }
});

test("IFrame loaded", 3, function() {
   ok(this.doc, "Document set");
});

test("Auto-configuration", 8, function() {
   var x = this.doc.getElementById("myXml3d");
   ok(x, "Object is adressable");
   equal(typeof x._configured, 'object', "Object is configured");
   equal(x.nodeName, "xml3d", "Is XML3D element");
   x = this.doc.getElementById("myGroup");
   ok(x, "Object is adressable");
   equal(typeof x._configured, 'object', "Object is configured");
   equal(x.nodeName, "group", "Is group element");
});

test("Auto-configuration on insertion", 6, function() {

    var xmlString = '<group id="g1" xmlns="http://www.xml3d.org/2009/xml3d"> \
                       <group id="g2"><mesh id="m1"/></group> \
                     </group>';

    var x = this.doc.getElementById("myXml3d");
    var parser = new DOMParser();
    var doc = parser.parseFromString(xmlString, "application/xml");
    x.appendChild(doc.documentElement);

    var g1 = this.doc.getElementById("g1");
    var m1 = this.doc.getElementById("m1");
    ok(g1, "Inserted element g1 adressable via getElementById");
    ok(m1, "Inserted element m1 adressable via getElementById");
    equal(typeof g1._configured, 'object', "Element g1 is configured");
    equal(typeof m1._configured, 'object', "Element m1 is configured (recursively)");


});

test("Configuration of new elements", 4, function() {
    var doc = this.doc;
    var x = doc.getElementById("myXml3d");
    var n = doc.createElementNS(XML3D.xml3dNS,"view");
    equal(typeof n._configured, 'object', "Object is configured");
    x.appendChild(n);
    equal(typeof n._configured, 'object', "Object is still configured");
});

function TestAdapterFactory() {
    this.name = "test";
    var that = this;
    this.createAdapter = function(node) {
        var name = node ? (node.id || "<"+node.nodeName+">") : "unknown";
        return {
            init : function() {
                ok(true, "Init Adapter: " + name);
            },
            notifyChanged : function(e) {
                that.event = e;
                ok(true, "Adapter for "+name+" has been notified: " + e);
            }
        };
    };
};

XML3D.createClass(TestAdapterFactory, XML3D.data.AdapterFactory);

module("Adapter tests", {
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
    factory : new TestAdapterFactory(),
    webglFactory : new XML3D.webgl.XML3DRenderAdapterFactory()
});

test("Adapter registration and initialization test", 6, function() {
    var x = this.doc.getElementById("myXml3d");
    equal(x._configured.adapters["test"], undefined, "No Adapter registered yet.");
    var a = this.factory.getAdapter(x);
    notEqual(x._configured.adapters["test"], undefined, "Adapter registered.");
    ok(a, "Adapter created");
});

test("WebGLFactory test", 5, function() {
    var g = this.doc.getElementById("myGroup");
    ok(g, "Node exits");
    notEqual(g._configured.adapters["XML3DRenderAdapterFactory"], undefined, "Adapter registered automatically.");
    var a = this.webglFactory.getAdapter(g);
    ok(a, "There is a WebGL Group adapter");
});

module("Mutation tests", {
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
    factory : new TestAdapterFactory(),
});

test("DOMNodeInserted on xml3d", 5, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("myXml3d");
    var g = this.doc.createElementNS(XML3D.xml3dNS, "group");
    this.factory.getAdapter(x); // 3: Init adapter
    x.appendChild(g); // 4: Adapter for myXml3d has been notified: Notification (type:0)
    equal(this.factory.event.type, XML3D.events.NODE_INSERTED, "Notification of type NODE_INSERTED"); // 5
});

test("DOMNodeRemoved on xml3d", 7, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("myXml3d");
    var g = this.doc.getElementById("myGroup");
    this.factory.getAdapter(x); // 3: Init adapter
    this.factory.getAdapter(g); // 4: Init adapter
    // 5: Adapter for myXml3d has been notified: Notification (type:2)
    // 6: Adapter for myGroup has been notified: Notification (type:2)
    x.removeChild(g);
    equal(this.factory.event.type, XML3D.events.THIS_REMOVED, "Notification of type THIS_REMOVED"); // 7
});

test("DOMNodeInserted on arbritary", 6, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("myGroup");
    var g = this.doc.createElementNS(XML3D.xml3dNS, "group");
    this.factory.getAdapter(x); // 3: Init adapter
    this.factory.getAdapter(g); // 4: Init adapter
    // 5: Adapter for myGroup has been notified: Notification (type:0)
    x.appendChild(g);
    equal(this.factory.event.type, XML3D.events.NODE_INSERTED, "Notification of type NODE_INSERTED"); // 6
});

test("DOMNodeRemoved on arbritary", 7, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("myGroup");
    var g = this.doc.getElementById("myMesh01");
    this.factory.getAdapter(x); // 3: Init adapter
    this.factory.getAdapter(g); // 4: Init adapter
    // 5: Adapter for myGroup has been notified: Notification (type:2)
    // 6: Adapter for myMesh01 has been notified: Notification (type:2)
    x.removeChild(g);
    equal(this.factory.event.type, XML3D.events.THIS_REMOVED, "Notification of type THIS_REMOVED"); // 7
});

test("DOMNodeRemoved recursively", 9, function() {
    // 1: Found frame
    // 2: Scene loaded
    var p = this.doc.getElementById("parentGroup");
    var c1 = this.doc.getElementById("child01");
    var c2 = this.doc.getElementById("child02");
    this.factory.getAdapter(p); // 3: Init adapter
    this.factory.getAdapter(c1); // 4: Init adapter
    this.factory.getAdapter(c2); // 5: Init adapter
    p.parentNode.removeChild(p);
    // 6: Adapter for parentGroup has been notified: Notification (type:5)
    // 7: Adapter for child01 has been notified: Notification (type:5)
    // 8: Adapter for child01 has been notified: Notification (type:5)
    equal(this.factory.event.type, XML3D.events.THIS_REMOVED, "Notification of type THIS_REMOVED"); // 9
});

test("DOMNodeRemoved with opposite", 10, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("parentGroup");
    var t = this.doc.getElementById("t_rotation");
    var t2 = this.doc.getElementById("t_identity");
    this.factory.getAdapter(x); // 3: Init adapter
    this.factory.getAdapter(t); // 4: Init adapter
    ok(t._configured.opposites, "Opposits exists"); // 5
    equal(t._configured.opposites.length, 1, "t_rotation has one opposite"); // 6
    equal(t2._configured.opposites.length, 2, "t_identity has two opposites"); // 7
    x.parentNode.removeChild(x);
    // 8: Adapter for parentGroup has been notified: Notification (type:5)
    equal(t._configured.opposites.length, 0, "t_rotation has no opposite"); // 9
    equal(t2._configured.opposites.length, 0, "t_identity has no opposite"); // 10
});

test("Dangling Reference notification", 6, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("transformedGroup");
    var transform = this.doc.getElementById("t_mixed");
    this.factory.getAdapter(x); // 3: Init adapter
    this.factory.getAdapter(transform); // 4: Init adapter
    // 5: Adapter for t_mixed has been notified: Notification (type:2)
    // 6: Adapter for transformedGroup has been notified: ReferenceNotification (type:3, value: null)
    transform.parentNode.removeChild(transform);
});
