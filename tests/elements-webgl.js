
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
   equals(typeof x._configured, 'object', "Object is configured");
   equals(x.nodeName, "xml3d", "Is XML3D element");
   x = this.doc.getElementById("myGroup");
   ok(x, "Object is adressable");
   equals(typeof x._configured, 'object', "Object is configured");
   equals(x.nodeName, "group", "Is group element");
});

test("Configuration of new elements", 4, function() {
    var doc = this.doc;
    var x = doc.getElementById("myXml3d");
    var n = doc.createElementNS(xml3d.xml3dNS,"view");
    equals(typeof n._configured, 'object', "Object is configured");
    x.appendChild(n);
    equals(typeof n._configured, 'object', "Object is still configured");
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

xml3d.createClass(TestAdapterFactory, xml3d.data.AdapterFactory);

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
    webglFactory : new xml3d.webgl.XML3DRenderAdapterFactory()
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
	var g = this.doc.createElementNS(xml3d.xml3dNS, "group");
	this.factory.getAdapter(x); // 3: Init adapter
	x.appendChild(g); // 4: Adapter for myXml3d has been notified: Notification (type:0)
    equal(this.factory.event.type, xml3d.events.NODE_INSERTED, "Notification of type NODE_INSERTED"); // 5    
});

test("DOMNodeRemoved on xml3d", 6, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("myXml3d");
    var g = this.doc.getElementById("myGroup");
    this.factory.getAdapter(x); // 3: Init adapter
    this.factory.getAdapter(g); // 4: Init adapter
    x.removeChild(g); // 5: Adapter for myGroup has been notified: Notification (type:2)
    equal(this.factory.event.type, xml3d.events.NODE_REMOVED, "Notification of type NODE_REMOVED"); // 6
});

test("DOMNodeInserted on arbritary", 7, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("myGroup");
    var g = this.doc.createElementNS(xml3d.xml3dNS, "group");
    this.factory.getAdapter(x); // 3: Init adapter
    this.factory.getAdapter(g); // 4: Init adapter
    // 5: Adapter for myGroup has been notified: Notification (type:0)
    // 6: Adapter for <group> has been notified: Notification (type:0)
    x.appendChild(g);
    equal(this.factory.event.type, xml3d.events.NODE_INSERTED, "Notification of type NODE_INSERTED"); // 7    
});

test("DOMNodeRemoved on arbritary", 6, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("myGroup");
    var g = this.doc.getElementById("myMesh01");
    this.factory.getAdapter(x); // 3: Init adapter
    this.factory.getAdapter(g); // 4: Init adapter
    x.removeChild(g); // 5: Adapter for myMesh01 has been notified: Notification (type:2)
    equal(this.factory.event.type, xml3d.events.NODE_REMOVED, "Notification of type NODE_REMOVED"); // 6
});

test("Dangling Reference notification", 6, function() {
    // 1: Found frame
    // 2: Scene loaded
    var x = this.doc.getElementById("transformedGroup");
    var g = this.doc.getElementById("t_mixed");
    this.factory.getAdapter(x); // 3: Init adapter
    this.factory.getAdapter(g); // 4: Init adapter
    // 5: Adapter for t_mixed has been notified: Notification (type:2)
    // 6: Adapter for transformedGroup has been notified: ReferenceNotification (type:3, value: null)
    g.parentNode.removeChild(g);
});
