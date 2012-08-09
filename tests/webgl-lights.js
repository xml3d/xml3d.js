module("WebGL Lights", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering03.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});


//Disabled since light visibility isn't working right now
/*test("All lights visibility off", 4, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    this.doc.getElementById("dirlight").visible = false;
    this.doc.getElementById("pointlight").visible = false;
    
    this.doc.getElementById("diffuseShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,255,0,255], "Green emissive diffuse object");
    
    this.doc.getElementById("diffuseShadedGroup").visible = false;
    this.doc.getElementById("phongShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,0,255], "Black phong object");
});

test("Red point light", 4, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    this.doc.getElementById("dirlight").visible = false;
    this.doc.getElementById("pointlight").visible = true;
    
    this.doc.getElementById("diffuseShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,255,0,255], "Diffuse object with green emissive = yellow");
    
    this.doc.getElementById("diffuseShadedGroup").visible = false;
    this.doc.getElementById("phongShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,0,255], "Phong object is lit red");
});

test("Blue directional light", 4, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    this.doc.getElementById("dirlight").visible = true;
    this.doc.getElementById("pointlight").visible = false;
    
    this.doc.getElementById("diffuseShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,255,255,255], "Diffuse object with green emissive");
    
    this.doc.getElementById("diffuseShadedGroup").visible = false;
    this.doc.getElementById("phongShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,255,255], "Phong object is lit blue");
});
*/
test("Red point light, blue dir light", 4, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    this.doc.getElementById("dirlight").visible = true;
    this.doc.getElementById("pointlight").visible = true;
    
    this.doc.getElementById("diffuseShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,255,255,255], "Diffuse object with green emissive");
    
    this.doc.getElementById("diffuseShadedGroup").visible = false;
    this.doc.getElementById("phongShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,255,255], "Phong object is lit purple");
});