
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
    // 1: Found frame
    // 2: Scene loaded
    var c = this.doc.getElementById("default");
    equal(c.width, 800); // 3
    equal(c.height, 600); // 4
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

test("Canvas size with class attribute", 20, function() {
    var c = this.doc.getElementById("css-class");
    equal(c.width, 800);
    equal(c.height, 600);
    equal(c.clientWidth, 20);
    equal(c.clientHeight, 40);
    equal(c.clientTop, 1);
    equal(c.clientLeft, 1);
    equal(c.offsetWidth, 22, "Test offsetWidth: + 2* 1px border"); // 1px border
    equal(c.offsetHeight, 42, "Test offsetHeight: + 2* 1px border"); // 1px border
    equal(c.offsetTop, 40, "Test offsetTop");
    equal(c.offsetLeft, 80, "Test offsetLeft");
    var cr = c.getBoundingClientRect();
    equal(cr.bottom, 82, "getBoundingClientRect().bottom");
    equal(cr.height, 42, "getBoundingClientRect().height");
    equal(cr.left, 80, "getBoundingClientRect().left");
    equal(cr.right, 102, "getBoundingClientRect().right");
    equal(cr.top, 40, "getBoundingClientRect().top");
    equal(cr.width, 22, "getBoundingClientRect().width");
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

test("Canvas positioning with style", function() {
    var c = this.doc.getElementById("positioning-css-style");
    equal(c.style.left, "30px"); // Interface values come from attribute
    equal(c.style.top, "50px");

    c = this.doc.getElementById("positioning-css-class");
    if(c._configured) { // WebGL only
        var canvasStyle = this.doc.defaultView.getComputedStyle(c._configured.canvas);
        equal(canvasStyle.getPropertyValue("left"), "80px");
        equal(canvasStyle.getPropertyValue("top"), "40px");
    }
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

test("Element CSS", function() {
    var c = this.doc.getElementById("default");
    ok(this.doc.defaultView.getComputedStyle);
    var canvasStyle = this.doc.defaultView.getComputedStyle(c);
    ok(canvasStyle);
    equal(canvasStyle.getPropertyValue("background-color"), "rgb(255, 0, 0)", "Background color is red.");
    equal(canvasStyle.getPropertyValue("border-top-width"), "1px", "Border size.");
});

// For some reason, Chrome hangs up at this test
test("Element CSS (WebGL)", function() {
    var c = this.doc.getElementById("default");
    if(c._configured) {
        var canvasStyle = this.doc.defaultView.getComputedStyle(c._configured.canvas);
        equal(canvasStyle.getPropertyValue("background-color"), "rgb(255, 0, 0)", "Background color is red.");
        equal(canvasStyle.getPropertyValue("border-top-width"), "1px", "Border size.");
    }
});
