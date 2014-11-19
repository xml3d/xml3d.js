module("WebGL Spotlights", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering05.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

//
function array2floatArray2array(a1) {
  a2 = [];
  Array.set(a2,0,new Float32Array(a1));
  return a2;
}

function equarr(a1, a2, tol) {
  if(a1.length != a2.length) return false;
  for(i=0; i < a1.length; i++)
    if(Math.abs(a1[i]-a2[i]) > tol)return false;
  return true;
}

function getChildNodeByName(node, name) {
  if(node != null)
    for(i = 0; i < node.childNodes.length; i++)
      if(node.childNodes[i].name == name)
        return node.childNodes[i];
  return null;
}

test("Initialization: entries in lights.spot check", 11, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);

    ok(h.renderer.scene.lights.spot!=null, "Test for spotlight data existence");

    sl = h.renderer.scene.lights.spot;
    ok(sl.length==1, "Test light count");

    var sld = { position: [], attenuation: [], direction: [], intensity: [], on: [], softness: [], falloffAngle: [] };
    sl[0].getLightData(sld, 0);

    deepEqual(sld.intensity, array2floatArray2array([10, 10, 10]), "Test light intensity entry");
    deepEqual(sld.attenuation, array2floatArray2array([0, 0, 1]), "Test light attenuation entry");
    ok(sld.on, "Test light 'on' entry");
    deepEqual(sld.softness, array2floatArray2array([0.5]), "Test light softness entry");
    deepEqual(sld.falloffAngle, array2floatArray2array([0.785]), "Test light cutOffAngle entry");
    deepEqual(sld.position, array2floatArray2array([0, 0, 1]), "Test for default position entry");
    deepEqual(sld.direction, array2floatArray2array([0, 0, -1]), "Test for default direction entry");
});

test("All spot lights visibility off", 4, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    this.doc.getElementById("mainlight").visible = false;

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

test("Light spot geometry test", 6, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    this.doc.getElementById("mainlight").visible = true;

    this.doc.getElementById("diffuseShadedGroup").visible = false;
    this.doc.getElementById("phongShadedGroup").visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 100, 100);
    deepEqual(actual, [255,255,255,255], "White phong light spot (at 100, 100)");

    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,255], "Black phong background object (at 40, 40)");

    this.doc.getElementById("diffuseShadedGroup").visible = true;
    this.doc.getElementById("phongShadedGroup").visible = false;
    h.draw();
    actual = win.getPixelValue(gl, 100, 100);
    deepEqual(actual, [255,255,255,255], "White diffuse light spot (at 100, 100)");

    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,255,0,255], "Green diffuse background object (at 40, 40)");

});

test("Change of light shader parameters check against lights.spot", 6, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);

    var ls_Spot = this.doc.getElementById("ls_Spot");
    var sl = h.renderer.scene.lights.spot;
    var sld = { position: [], attenuation: [], direction: [], intensity: [], on: [], softness: [], falloffAngle: [] };


    getChildNodeByName(ls_Spot, "softness").textContent = "0.2";
    win.XML3D._flushDOMChanges();
    sl[0].getLightData(sld, 0);
    deepEqual(sld.softness, array2floatArray2array([0.2]), "Test beamWidth entry change");

    getChildNodeByName(ls_Spot, "falloffAngle").textContent = "0.6";
    win.XML3D._flushDOMChanges();
    sl[0].getLightData(sld, 0);
    deepEqual(sld.falloffAngle, array2floatArray2array([0.6]), "Test cutOffAngle entry change");

    getChildNodeByName(ls_Spot, "intensity").textContent = "1 0 1";
    win.XML3D._flushDOMChanges();
    sl[0].getLightData(sld, 0);
    deepEqual(sld.intensity, array2floatArray2array([1, 0, 1]), "Test intensity entry change");

    getChildNodeByName(ls_Spot, "attenuation").textContent = "1 0 0";
    win.XML3D._flushDOMChanges();
    sl[0].getLightData(sld, 0);
    deepEqual(sld.attenuation, array2floatArray2array([1, 0, 0]), "Test attenuation entry change");
});

test("Change in transformation hierarchy check against lights.spot", 4, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);

    var t_Lamp = this.doc.getElementById("t_Lamp");
    var sl = h.renderer.scene.lights.spot
    var sld = { position: [], attenuation: [], direction: [], intensity: [], on: [], softness: [], falloffAngle: [] };

    t_Lamp.setAttribute("translation", "0 0 3");
    win.XML3D._flushDOMChanges();
    sl[0].getLightData(sld, 0);
    deepEqual(sld.position, array2floatArray2array([0, 0, 3]), "Test position entry change");

    t_Lamp.setAttribute("rotation", "0 1 0 1.57079632679");
    win.XML3D._flushDOMChanges();
    sl[0].getLightData(sld, 0);
    ok(equarr(sld.direction, [-1, 0, 0], 0.0001), "Test direction entry change");

});

