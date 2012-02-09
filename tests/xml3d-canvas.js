
module("Canvas configuration tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/canvas.xhtml", this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Default canvas size", function() {
    var c = this.doc.getElementById("default");
    equal(c.width, 800);
    equal(c.height, 600);
    equal(c.clientWidth, 800);
    equal(c.clientHeight, 600);
    equal(c.style.width, "");
    equal(c.style.height, "");
});

test("Canvas size with width/height attributes", function() {
    var c = this.doc.getElementById("attributes");
    equal(c.width, 50);
    equal(c.height, 30);
    equal(c.clientWidth, 50);
    equal(c.clientHeight, 30);
    equal(c.style.width, "");
    equal(c.style.height, "");

}); 

test("Canvas size with style attribute", function() {
    var c = this.doc.getElementById("css-style");
    equal(c.width, 800);
    equal(c.height, 600);
    equal(c.clientWidth, 40);
    equal(c.clientHeight, 20);
    equal(c.style.width, "40px");
    equal(c.style.height, "20px");
}); 

test("Canvas size with class attribute", function() {
    var c = this.doc.getElementById("css-class");
    equal(c.width, 800);
    equal(c.height, 600);
    equal(c.clientWidth, 20);
    equal(c.clientHeight, 40);
    equal(c.style.width, "");
    equal(c.style.height, "");
}); 

test("Canvas size attributes vs style", function() {
    var c = this.doc.getElementById("attributes-vs-css");
    equal(c.width, 50); // Interface values come from attribute
    equal(c.height, 30);
    equal(c.clientWidth, 40); // But get overriden by style (beh. from <canvas>)
    equal(c.clientHeight, 20);
    equal(c.style.width, "40px");
    equal(c.style.height, "20px");
}); 

test("Canvas size with css element selector (dynamic)", function() {
    var c = this.doc.getElementById("default");
    this.doc.styleSheets[1].cssRules[1].style.cssText ="background-color: black; width: 15px; height: 15px";  
    equal(c.width, 800);
    equal(c.height, 600);
    equal(c.clientWidth, 15);
    equal(c.clientHeight, 15);
    equal(c.style.width, "");
    equal(c.style.height, "");
});

