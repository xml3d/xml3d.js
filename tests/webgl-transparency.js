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
    var shaderFactory = h.renderer.scene.shaderFactory;

    console.log(getWebGLAdapter(this.doc.getElementById("opaque")));

    var material = shaderFactory.getTemplateById(getWebGLAdapter(this.doc.getElementById("opaque"))._materialConfiguration.id).shaderClosures[0];
    ok(material, "Found #opaque material");
    if(material) equal(material.hasTransparency(), false, "Opaque material has no transparency set");

    material = shaderFactory.getTemplateById(getWebGLAdapter(this.doc.getElementById("non-opaque"))._materialConfiguration.id).shaderClosures[0];
    ok(material, "Found #non-opaque material");
    if(material) equal(material.hasTransparency(), true, "Non-Opaque material has transparency set");

    material = shaderFactory.getTemplateById(getWebGLAdapter(this.doc.getElementById("matte"))._materialConfiguration.id).shaderClosures[0];
    ok(material, "Found #matte material");
    if(material) equal(material.hasTransparency(), false, "Matte material is always opaque");

    var transparencyAttribute = this.doc.getElementById("change_transparencyAttribute");

    material = shaderFactory.getTemplateById(getWebGLAdapter(this.doc.getElementById("change"))._materialConfiguration.id).shaderClosures[0];

    ok(material, "Found #change material");
    if(material){
        equal(material.hasTransparency(), false, "Initially opaque");
        xml3dElement.addEventListener("framedrawn", function(n) {
            equal(material.hasTransparency(), true, "Changed after setting transparency parameter to 0.5");
            start();
        });
        transparencyAttribute.textContent = "0.5";
        stop();
        h.draw();
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
    h.draw();
});
