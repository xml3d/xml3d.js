module("WebGL Lights", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.win = document.getElementById("xml3dframe").contentWindow;
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
test("All lights visibility off", 4, function() {
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

test("A red point light", 4, function() {
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

test("Change directional light direction", 5, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    this.doc.getElementById("dirlight").visible = true;
    this.doc.getElementById("pointlight").visible = false;

    this.doc.getElementById("phongShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,255,255], "Initial light direction");

    var test = this.doc.getElementById("t_dirLight");
    test.setAttribute("rotation", "0 1 0 1.571");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,0,255], "Light parallel to the plane");

    test.setAttribute("rotation", "0 1 0 1.5");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,180,255], "Light barely hitting the plane");
});

test("Change lightshader intensity", 4, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    this.doc.getElementById("dirlight").visible = true;
    this.doc.getElementById("pointlight").visible = false;

    this.doc.getElementById("phongShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,255,255], "Initial light intensity");

    var test = this.doc.getElementById("lsdIntensity");
    test.textContent = "10 10 0";
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,255,0,255], "Light intensity changed to yellow");

});

test("Adding lights", 6, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    var lightModels = h.renderer.scene.lights._models;
    ok(lightModels.point.lightModels.length == 1 && lightModels.directional.lightModels.length == 1, "Renderer sees 2 lights");

    var newLight = this.doc.createElementNS(XML3D.ns, "light");
    newLight.setAttribute("shader", "#ls_Point2");
    this.doc.getElementById("pointlight2").appendChild(newLight);

    this.win.XML3D.flushDOMChanges();
    equal(lightModels.point.lightModels.length, 2, "Light was added to the lights array");

    var newSpot = this.doc.createElementNS(XML3D.ns, "light");
    newSpot.setAttribute("shader", "#ls_Spot");
    this.doc.getElementById("spotlight").appendChild(newSpot);

    this.win.XML3D.flushDOMChanges();
    equal(lightModels.spot.lightModels.length, 1, "Spot light was added to the lights array");

    this.doc.getElementById("dirlight").visible = false;
    this.doc.getElementById("pointlight").visible = false;
    this.doc.getElementById("phongShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,255,255,255], "Phong object is lit by the new lights");
});

test("Removing lights", 6, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    var lightModels = h.renderer.scene.lights._models;
    ok(lightModels.point.lightModels.length == 1 && lightModels.directional.lightModels.length == 1, "Renderer sees 2 lights");

    this.doc.getElementById("dirlight").visible = true;
    this.doc.getElementById("pointlight").visible = true;

    this.doc.getElementById("phongShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,255,255], "Phong object is lit by both lights");

    var dirLight = this.doc.getElementById("dirlight");
    dirLight.parentNode.removeChild(dirLight);

    this.win.XML3D.flushDOMChanges();
    equal(lightModels.directional.lightModels.length, 0, "Light was removed from the lights array");

    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,0,255], "Phong object is lit by the single remaining light only");

});

test("Change light shader", 5, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    this.doc.getElementById("pointlight").visible = true;
    this.doc.getElementById("dirlight").visible = false;

    this.doc.getElementById("phongShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,0,255], "Phong object is lit by red point light shader");

    this.doc.getElementById("pointlightLight").shader = "#ls_Point2";

    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,255,255], "Phong object is lit by blue point light shader");

    this.doc.getElementById("pointIntensity").textContent = "0 10 0";
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,255,255], "Change to old lightshader did not affect the object");
});

test("Remove light shader", 4, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);

    this.doc.getElementById("phongShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,0,255,255], "Phong object is lit by both lights");

    var pointLight = this.doc.getElementById("ls_Point");
    pointLight.parentNode.removeChild(pointLight);

    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,255,255], "Red point light has been implcitly removed");

});
