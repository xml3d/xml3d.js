module("WebGL Transparency", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/transparency.xhtml" + window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("ProgramObject.hastransparency is set correctly", function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var h = getHandler(xml3dElement);
    var shaderManager = h.renderer.shaderManager;

    var shader = shaderManager.getShaderById("opaque");
    equal(shader.hasTransparency, false, "Opaque shader has no transparency set");

    shader = shaderManager.getShaderById("non-opaque");
    equal(shader.hasTransparency, true, "Non-Opaque shader has transparency set");

    shader = shaderManager.getShaderById("matte");
    equal(shader.hasTransparency, false, "Matte shader is always opaque");
    console.log(shader);
});

test("Pick transparency values", 3, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var h = getHandler(xml3dElement);
    var gl = getContextForXml3DElement(xml3dElement);
    var win = this.doc.defaultView;
    h.draw();

    var actual = win.getPixelValue(gl, 150, 100);
    QUnit.closePixel(actual, [128,179,204,127], 1, "Mixed cyan and yellow");
    console.log(actual);
});
