module("Element methods tests", {
    setup: function() {
        var v = document.getElementById("xml3dframe");
        ok(v);
        v.style.float = "right";
        v.style.width = "500px";
        v.style.height = "300px";
        v.addEventListener("load", function() {ok(true); start();}, true);
        v.src = "scenes/basic.xhtml";
        this.doc = v.contentDocument;
    }
});

test("IFrame loaded", function() {
   expect(3);
   stop();
   ok(this.doc);
});

test("Auto-configuration", function() {
   var x = this.doc.getElementById("myXml3d");
   ok(x, "Object is adressable");
   equals(typeof x._configured, 'object', "Object is configured");
   equals(x.nodeName, "xml3d", "Is XML3D element");
   x = this.doc.getElementById("myGroup");
   ok(x, "Object is adressable");
   equals(typeof x._configured, 'object', "Object is configured");
   equals(x.nodeName, "group", "Is group element");
   
   
});
