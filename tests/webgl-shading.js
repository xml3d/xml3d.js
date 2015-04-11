module("WebGL materials internal", {
    setup : function() {
        var canvas = document.createElement("canvas");
        this.gl = canvas.getContext('experimental-webgl');
        this.compiles = function(type, source, msg) {
            msg = msg || "";
            var gl = this.gl;
            var shd = gl.createShader(type);
            gl.shaderSource(shd, source);
            gl.compileShader(shd);
            if (gl.getShaderParameter(shd, gl.COMPILE_STATUS) == 0) {
                ok(false, msg + ":" + gl.getShaderInfoLog(shd));
            } else {
                ok(true, msg);
            }
        };
        this.mergeDirectives = function(directives, source) {
            var fragment = "";
            Array.forEach(directives, function(v) {
                fragment += "#define " + v + "\n";
            });
            return fragment + "\n" + source;
        }
        this.addFragmentShaderHeader = function(src) {
            return XML3DTestLib.addFragmentShaderHeader(src);
        }
    }
});

test("Phong fragment shader", function() {

    var scene = new XML3DTestLib.Scene();

    var materialParameters = {}

    var phong = XML3D.materials.getScript("phong");
    ok(phong, "Phong material exists");
    equal(typeof phong.addDirectives, "function", "Function 'addDirectives' exists");
    var directives = [];
    phong.addDirectives.call(phong, directives, scene.lights, {});
    equal(directives.length, 10, "10 directives from phong material");

    var fragment1 = this.mergeDirectives(directives, this.addFragmentShaderHeader(phong.fragment));
    this.compiles(this.gl.FRAGMENT_SHADER, fragment1, "Phong fragment without globals compiles.");
    notEqual(fragment1.indexOf("MAX_POINTLIGHTS 0"), -1, "MAX_POINTLIGHTS set");
    notEqual(fragment1.indexOf("MAX_DIRECTIONALLIGHTS 0"), -1, "MAX_DIRECTIONALLIGHTS set");
    notEqual(fragment1.indexOf("MAX_SPOTLIGHTS 0"), -1, "MAX_SPOTLIGHTS set");
    notEqual(fragment1.indexOf("HAS_DIFFUSETEXTURE 0"), -1, "HAS_DIFFUSETEXTURE set");

    directives = [];
    var point1 = scene.createRenderLight({light: { type: "point"}});
    var point2 = scene.createRenderLight({light: { type: "point"}});

    phong.addDirectives.call(phong, directives, scene.lights, materialParameters);
    equal(directives.length, 10, "10 directives from phong material");
    var fragment2 = this.mergeDirectives(directives, this.addFragmentShaderHeader(phong.fragment));
    this.compiles(this.gl.FRAGMENT_SHADER, fragment2, "Phong fragment with 2 point lights compiles.");
    notEqual(fragment2.indexOf("MAX_POINTLIGHTS 2"), -1, "MAX_POINTLIGHTS set");
    notEqual(fragment2.indexOf("MAX_DIRECTIONALLIGHTS 0"), -1, "MAX_DIRECTIONALLIGHTS set");
    notEqual(fragment2.indexOf("MAX_SPOTLIGHTS 0"), -1, "MAX_SPOTLIGHTS set");
    notEqual(fragment2.indexOf("HAS_DIFFUSETEXTURE 0"), -1, "HAS_DIFFUSETEXTURE set");

    directives = [];
    // Remove the two point lights and add a directional light instead
    point1.remove();
    point2.remove();
    var dir1 = scene.createRenderLight({light: { type: "directional"}});

    phong.addDirectives.call(phong, directives, scene.lights, materialParameters);
    var fragment3 = this.mergeDirectives(directives, this.addFragmentShaderHeader(phong.fragment));
    this.compiles(this.gl.FRAGMENT_SHADER, fragment3, "Phong fragment with 1 directional light compiles.");
    notEqual(fragment3.indexOf("MAX_POINTLIGHTS 0"), -1, "MAX_POINTLIGHTS set");
    notEqual(fragment3.indexOf("MAX_DIRECTIONALLIGHTS 1"), -1, "MAX_DIRECTIONALLIGHTS set");
    notEqual(fragment3.indexOf("MAX_SPOTLIGHTS 0"), -1, "MAX_SPOTLIGHTS set");
    notEqual(fragment3.indexOf("HAS_DIFFUSETEXTURE 0"), -1, "HAS_DIFFUSETEXTURE set");

    directives = [];
    phong.addDirectives.call(phong, directives, scene.lights, {
        diffuseTexture : {}
    });
    var fragment4 = this.mergeDirectives(directives, this.addFragmentShaderHeader(phong.fragment));
    this.compiles(this.gl.FRAGMENT_SHADER, fragment4, "Phong fragment with 1 directional light and diffuseTexture compiles.");
    notEqual(fragment4.indexOf("MAX_POINTLIGHTS 0"), -1, "MAX_POINTLIGHTS set");
    notEqual(fragment4.indexOf("MAX_DIRECTIONALLIGHTS 1"), -1, "MAX_DIRECTIONALLIGHTS set");
    notEqual(fragment4.indexOf("MAX_SPOTLIGHTS 0"), -1, "MAX_SPOTLIGHTS set");
    notEqual(fragment4.indexOf("HAS_DIFFUSETEXTURE 1"), -1, "HAS_DIFFUSETEXTURE set");

    directives = [];
    dir1.remove();
    // Create 15 point lights
    var pointLights = Array.apply(null, Array(15)).map(function() { return  scene.createRenderLight({light: { type: "point"}}); });

    phong.addDirectives.call(phong, directives, scene.lights, {
        specularTexture : {}
    });
    var fragment5 = this.mergeDirectives(directives, this.addFragmentShaderHeader(phong.fragment));
    //console.log(fragment5);
    this.compiles(this.gl.FRAGMENT_SHADER, fragment5, "Phong fragment with 15 point lights and a specular texture compiles.");
    notEqual(fragment5.indexOf("MAX_POINTLIGHTS 15"), -1, "MAX_POINTLIGHTS set");
    notEqual(fragment5.indexOf("MAX_DIRECTIONALLIGHTS 0"), -1, "MAX_DIRECTIONALLIGHTS set");
    notEqual(fragment5.indexOf("MAX_SPOTLIGHTS 0"), -1, "MAX_SPOTLIGHTS set");
    notEqual(fragment5.indexOf("HAS_DIFFUSETEXTURE 0"), -1, "HAS_DIFFUSETEXTURE set");
    notEqual(fragment5.indexOf("HAS_SPECULARTEXTURE 1"), -1, "HAS_SPECULARTEXTURE set");
    notEqual(fragment5.indexOf("HAS_EMISSIVETEXTURE 0"), -1, "HAS_EMISSIVETEXTURE set");

    pointLights.forEach(function(light, idx) { if (idx > 4) light.remove(); });
    var dir1 = scene.createRenderLight({light: { type: "directional"}});
    var dir2 = scene.createRenderLight({light: { type: "directional"}});
    var dir3 = scene.createRenderLight({light: { type: "directional"}});

    directives = [];
    phong.addDirectives.call(phong, directives, scene.lights, {
        diffuseTexture : {},
        specularTexture : {},
        emissiveTexture : {}
    });
    var fragment5 = this.mergeDirectives(directives, this.addFragmentShaderHeader(phong.fragment));
    //console.log(fragment5);
    this.compiles(this.gl.FRAGMENT_SHADER, fragment5, "Phong fragment with all branches compiles.");
    notEqual(fragment5.indexOf("MAX_POINTLIGHTS 5"), -1, "MAX_POINTLIGHTS set");
    notEqual(fragment5.indexOf("MAX_DIRECTIONALLIGHTS 3"), -1, "MAX_DIRECTIONALLIGHTS set");
    notEqual(fragment5.indexOf("MAX_SPOTLIGHTS 0"), -1, "MAX_SPOTLIGHTS set");
    notEqual(fragment5.indexOf("HAS_DIFFUSETEXTURE 1"), -1, "HAS_DIFFUSETEXTURE set");
    notEqual(fragment5.indexOf("HAS_SPECULARTEXTURE 1"), -1, "HAS_SPECULARTEXTURE set");
    notEqual(fragment5.indexOf("HAS_EMISSIVETEXTURE 1"), -1, "HAS_EMISSIVETEXTURE set");
});

module("WebGL materials and Textures", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering02.xhtml" + window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Simple texture", 3, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView, gl = getContextForXml3DElement(x), testFunc = null, h = getHandler(x);
    this.doc.getElementById("myGroup").visible = true;

    x.addEventListener("framedrawn", function(n) {
        if (testFunc)
            testFunc(n);
    });

    var tested = 0;
    testFunc = function(n) {
        actual = win.getPixelValue(gl, 40, 40);
        if (actual[0] == 0)
            return;
        tested++;
        if(tested == 2){
            console.log("Tested twice!");
        }
        deepEqual(actual, [ 241, 241, 0, 255 ], "Yellow texture");
        start();
    };
    stop();

});

test("Changing texture", 3, function() {
    var x = this.doc.getElementById("xml3DElem"), win = this.doc.defaultView, gl = getContextForXml3DElement(x), h = getHandler(x);
    this.doc.getElementById("myGroup").visible = true;
    h.draw(); // Draw now and make a redraw unnecessary
    var run = false;
    x.addEventListener("framedrawn", function(n) {
        if (!run) {
            run = true;
            setTimeout(function() {
                var actual = win.getPixelValue(gl, 40, 40);
                deepEqual(actual, [ 241, 0, 241, 255 ], "Magenta texture");
                start();
            }, 500);
        }

    });
    stop();
    this.doc.getElementById("tex1img").setAttribute("src", "textures/magenta.png");
});

test("NPOT texture resizing", 4, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView, gl = getContextForXml3DElement(x), h = getHandler(x);

    x.addEventListener("framedrawn", function(n) {
        actual = win.getPixelValue(gl, 40, 40);
        deepEqual(actual, [ 0, 241, 0, 255 ], "Green at 40,40");
        actual = win.getPixelValue(gl, 120, 80);
        deepEqual(actual, [ 0, 0, 253, 255 ], "Blue at 120,80");
        start();
    });

    this.doc.getElementById("npotTexGroup").visible = true;
    stop();
});

test("Textured diffuse material", 3, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView, gl = getContextForXml3DElement(x), testFunc = null, h = getHandler(x);
    var group = this.doc.getElementById("diffuseTexGroup");
    h.draw();
    x.addEventListener("framedrawn", function(n) {
        actual = win.getPixelValue(gl, 40, 40);
        if (actual[0] == 0) // texture hasn't finished loading yet
            return;
        deepEqual(actual, [ 241, 241, 0, 255 ], "Yellow diffuse texture");
        start();
    });
    stop();
    group.visible = true;
});

// Scene: webgl-rendering02.xhtml
test("Diffuse material with vertex colors", 3, function() {
    var x = this.doc.getElementById("xml3DElem"), win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);
    var cgroup = this.doc.getElementById("coloredMeshGroup");
    //h.draw();
    var tested = 0;
    x.addEventListener("framedrawn", function(n) {
        var actual = win.getPixelValue(gl, 90, 90);
        tested++;
        if(tested == 2){
            console.log("Tested twice!");
        }

        QUnit.closePixel(actual, [ 225, 225, 60, 255 ], 1, "Corners have colors red, yellow, green, blue");
        start();
    });
    stop();
    cgroup.visible = true;
});

test("Simple custom material", 4, function() {
    var x = this.doc.getElementById("xml3DElem"), win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);
    var cgroup = this.doc.getElementById("custommaterialGroup");
    cgroup.setAttribute("visible", "true");
    h.draw();

    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,255,0,255], "Custom material with default green color");

    cgroup.setAttribute("material", "#custommaterial2");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,0,255,255], "Custom material with given blue color");

});


module("Multiple XML3D nodes", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/multiple-canvas.xhtml" + window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Default view with no activeView set", 3, function() {
    var x = this.doc.getElementById("xml3DElem2"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);

    actual = win.getPixelValue(gl, 275, 100);
    deepEqual(actual, [ 0, 0, 0, 0 ], "Found correct view node");
});

module("WebGL: Ambient term", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-ambient.xhtml" + window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Diffuse material", 4, function() {
    var x = this.doc.getElementById("xml3DElem"), win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);

    var testFunc = function() {
        var actual = win.getPixelValue(gl, 88, 140);
        var diffuse = [ 1, 0.2, 0.3, 255 ];
        diffuse = XML3D.math.vec3.scale(diffuse, diffuse, 0.8 * 255);
        QUnit.closePixel(actual, diffuse, 1, "Simple Diffuse");

        actual = win.getPixelValue(gl, 150, 140);
        diffuse = [ 0.5 * 0.5 * 255, 1 * 0.5 * 255, 0 * 0.5 * 255, 255 ];
        // Timer issue
        // QUnit.closePixel(actual, diffuse, 1, "Diffuse with Texture");

        actual = win.getPixelValue(gl, 220, 140);
        // ambientIntensity * diffuseColor * vertexColor * 255
        diffuse = [ 0.9 * 0.4 * 1.0 * 255, 0.9 * 0.8 * 0.5 * 255, 0.9 * 0.8 * 0.25 * 255, 255 ];
        QUnit.closePixel(actual, diffuse, 1, "Diffuse with vertex colors");
        start();
    };

    stop();
    testFunc();
});

test("Phong material", 4, function() {
    var x = this.doc.getElementById("xml3DElem"), win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);

    var testFunc = function() {
        var actual = win.getPixelValue(gl, 88, 50);
        var diffuse = [ 1, 0.2, 0.3, 255 ];
        diffuse = XML3D.math.vec3.scale(diffuse, diffuse, 0.8 * 255);
        QUnit.closePixel(actual, diffuse, 1, "Simple Diffuse");

        actual = win.getPixelValue(gl, 150, 50);
        diffuse = [ 0.5 * 0.5 * 255, 1 * 0.5 * 255, 0 * 0.5 * 255, 255 ];
        // Timer issue
        // QUnit.closePixel(actual, diffuse, 1, "Diffuse with Texture");

        actual = win.getPixelValue(gl, 220, 50);
        // ambientIntensity * diffuseColor * vertexColor * 255
        diffuse = [ 0.9 * 0.4 * 1.0 * 255, 0.9 * 0.8 * 0.5 * 255, 0.9 * 0.8 * 0.25 * 255, 255 ];
        QUnit.closePixel(actual, diffuse, 1, "Diffuse with vertex colors");
        start();
    };
    stop();
    testFunc();
});

module("WebGL materials and Textures 2", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering04.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});



test("Switching to previously unused material", 3, function() {
    var x = this.doc.getElementById("xml3DElem"),
        gl = getContextForXml3DElement(x),
        testFunc = null, h = getHandler(x);

    this.doc.getElementById("myGroup").material = "#phong2";

    x.addEventListener("framedrawn", function(n) {
        if(testFunc)
            testFunc(n);
    });

    testFunc = function(n) {
        var actual = XML3DUnit.getPixelValue(gl, 40, 40);
        if (actual[4] == 0)
            return;
        QUnit.closeArray(actual, [76,222,255,255], PIXEL_EPSILON, "Shading is correct");
        start();
    };
    stop();

});
