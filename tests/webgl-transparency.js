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

    var shader = shaderManager.getShaderByURL(new XML3D.URI("#opaque").getAbsoluteURI(this.doc.documentURI));
    ok(shader, "Found #opaque shader");
    if(shader) equal(shader.hasTransparency, false, "Opaque shader has no transparency set");

    shader = shaderManager.getShaderByURL(new XML3D.URI("#non-opaque").getAbsoluteURI(this.doc.documentURI));
    ok(shader, "Found #non-opaque shader");
    if(shader) equal(shader.hasTransparency, true, "Non-Opaque shader has transparency set");

    shader = shaderManager.getShaderByURL(new XML3D.URI("#matte").getAbsoluteURI(this.doc.documentURI));
    ok(shader, "Found #matte shader");
    if(shader) equal(shader.hasTransparency, false, "Matte shader is always opaque");

    var transparencyAttribute = this.doc.getElementById("change_transparencyAttribute");

    shader = shaderManager.getShaderByURL(new XML3D.URI("#change").getAbsoluteURI(this.doc.documentURI));
    ok(shader, "Found #change shader");
    if(shader){
        equal(shader.hasTransparency, false, "Initially opaque");
        transparencyAttribute.textContent = "0.5";
        equal(shader.hasTransparency, true, "Changed after setting transparency parameter to 0.5");
    }


});

test("Pick transparency values", 3, function() {
    var xml3dElement = this.doc.getElementById("xml3DElem");
    var h = getHandler(xml3dElement);
    var gl = getContextForXml3DElement(xml3dElement);
    var win = this.doc.defaultView;
    xml3dElement.addEventListener("framedrawn", function(n) {
        var actual = win.getPixelValue(gl, 150, 100);
        QUnit.closePixel(actual, [128,153,102,255], 1, "Mixed cyan and yellow");
        start();
    });
    stop();
    h.redraw();
});
