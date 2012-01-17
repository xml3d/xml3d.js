var setupScene = function(url, base) {
    var v = document.getElementById("xml3dframe");
    ok(v);
    v.style.float = "right";
    v.style.width = "500px";
    v.style.height = "300px";
    v.addEventListener("load", function() {ok(true); start();}, true);
    v.src = url;
    base.doc = v.contentDocument;
};

module("Scenegraph tests", {
    setup: function() {window.setupScene("scenes/basic.xhtml", this);}
});

