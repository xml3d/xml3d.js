module("WebGL Spotlights", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering05.html"+window.location.search, this.cb);
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

    var lights = h.renderer.scene.lights;
    var lightModels = h.renderer.scene.lights._models;
    var params = {};

    notEqual(lightModels.spot, undefined, "Test for spotlight data existence");

    ok(lightModels.spot.lightModels.length==1, "Test light count");

    lights.fillGlobalParameters(params, /* force = */ true);

    QUnit.closeArray(params.spotLightIntensity, [10, 10, 10], EPSILON, "Test light intensity entry");
    QUnit.closeArray(params.spotLightAttenuation, [0, 0, 1], EPSILON, "Test light attenuation entry");
    QUnit.closeArray(params.spotLightOn, [1], EPSILON, "Test light 'on' entry");
    QUnit.closeArray(params.spotLightSoftness, [0.5], EPSILON, "Test light softness entry");
    QUnit.closeArray(params.spotLightFalloffAngle, [0.785], EPSILON, "Test light cutOffAngle entry");
    QUnit.closeArray(params.spotLightPosition, [0, 0, 1], EPSILON, "Test for default position entry");
    QUnit.closeArray(params.spotLightDirection, [0, 0, -1], EPSILON, "Test for default direction entry");

});

test("All spot lights visibility off", 4, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);
    this.doc.getElementById("mainlight").style.display = 'none';

    this.doc.getElementById("diffuseShadedGroup").style.display = 'inherit';
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,255,0,255], "Green emissive diffuse object");

    this.doc.getElementById("diffuseShadedGroup").style.display = 'none';
    this.doc.getElementById("phongShadedGroup").style.display = 'inherit';
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
    this.doc.getElementById("mainlight").style.display = 'inherit';

    this.doc.getElementById("diffuseShadedGroup").style.display = 'none';
    this.doc.getElementById("phongShadedGroup").style.display = 'inherit';
    h.draw();
    actual = win.getPixelValue(gl, 100, 100);
    deepEqual(actual, [255,255,255,255], "White phong light spot (at 100, 100)");

    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,0,0,255], "Black phong background object (at 40, 40)");

    this.doc.getElementById("diffuseShadedGroup").style.display = 'inherit';
    this.doc.getElementById("phongShadedGroup").style.display = 'none';
    h.draw();
    actual = win.getPixelValue(gl, 100, 100);
    deepEqual(actual, [255,255,255,255], "White diffuse light spot (at 100, 100)");

    actual = win.getPixelValue(gl, 40, 40);
    deepEqual(actual, [0,255,0,255], "Green diffuse background object (at 40, 40)");

});

test("Change of light material parameters check against lights.spot", 8, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);

    var ls_Spot = this.doc.querySelector("light");
    var lights = h.renderer.scene.lights;
    var params = {};

    notEqual(lights._models.spot, undefined, "Test for spotlight data existence");
    ok(lights._models.spot.lightModels.length==1, "Test light count");


    getChildNodeByName(ls_Spot, "softness").textContent = "0.2";
    win.XML3D.flushDOMChanges();
    lights.fillGlobalParameters(params, /* force = */ true);
    QUnit.closeArray(params.spotLightSoftness, [0.2], EPSILON, "Test softness entry change");


    getChildNodeByName(ls_Spot, "falloffAngle").textContent = "0.6";
    win.XML3D.flushDOMChanges();
    lights.fillGlobalParameters(params, /* force = */ true);
    QUnit.closeArray(params.spotLightFalloffAngle, [0.6], EPSILON, "Test falloffAngle entry change");

    getChildNodeByName(ls_Spot, "intensity").textContent = "1 0 1";
    win.XML3D.flushDOMChanges();
    lights.fillGlobalParameters(params, /* force = */ true);
    QUnit.closeArray(params.spotLightIntensity, [1, 0, 1], EPSILON, "Test intensity entry change");

    getChildNodeByName(ls_Spot, "attenuation").textContent = "1 0 0";
    win.XML3D.flushDOMChanges();
    lights.fillGlobalParameters(params, /* force = */ true);
    QUnit.closeArray(params.spotLightAttenuation, [1, 0, 0], EPSILON, "Test attenuation entry change");
});

test("Change in transformation hierarchy check against lights.spot", 4, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    h = getHandler(x);

    var lights = h.renderer.scene.lights;
    var params = {};

    var t_Lamp = this.doc.getElementById("t_Lamp");

    t_Lamp.setAttribute("translation", "0 0 3");
    win.XML3D.flushDOMChanges();
    lights.fillGlobalParameters(params, /* force = */ true);
    QUnit.closeArray(params.spotLightPosition, [0, 0, 3], EPSILON, "Test position entry change");

    t_Lamp.setAttribute("rotation", "0 1 0 1.57079632679");
    win.XML3D.flushDOMChanges();
    lights.fillGlobalParameters(params, /* force = */ true);
    QUnit.closeArray(params.spotLightDirection, [-1, 0, 0], EPSILON, "Test position entry change");


});

