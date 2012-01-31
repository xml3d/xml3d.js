
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
    var n = doc.createElementNS(org.xml3d.xml3dNS,"view");
    equals(typeof n._configured, 'object', "Object is configured");
    x.appendChild(n);
    equals(typeof n._configured, 'object', "Object is still configured");
});

function TestAdapterFactory() {
    this.name = "test";
    this.createAdapter = function() {
        return {
            init : function() {
                ok(true, "Init Adapter");
            },
            notifyChanged : function(e) {
                ok(true, "Adapter has been notified: " + e);
            }
        };
    };
};

org.xml3d.createClass(TestAdapterFactory, org.xml3d.data.AdapterFactory);

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
    webglFactory : new org.xml3d.webgl.XML3DRenderAdapterFactory()
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

test("DOMNodeInserted on xml3d", 4, function() {
	var x = this.doc.getElementById("myXml3d");
	var g = this.doc.createElementNS(org.xml3d.xml3dNS, "group");
	this.factory.getAdapter(x);
	x.appendChild(g);
});

test("DOMNodeRemoved on xml3d", 6, function() {
    var x = this.doc.getElementById("myXml3d");
    var g = this.doc.getElementById("myGroup");
    this.factory.getAdapter(x);
    this.factory.getAdapter(g);
    x.removeChild(g);
});

test("DOMNodeInserted on arbritary", 4, function() {
    var x = this.doc.getElementById("myGroup");
    var g = this.doc.createElementNS(org.xml3d.xml3dNS, "group");
    this.factory.getAdapter(x);
    x.appendChild(g);
});

test("DOMNodeRemoved on arbritary", 6, function() {
    var x = this.doc.getElementById("myGroup");
    var g = this.doc.getElementById("myMesh01");
    this.factory.getAdapter(x);
    this.factory.getAdapter(g);
    x.removeChild(g);
});
