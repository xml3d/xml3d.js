module("WebGL shaders internal", {
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
                ok(false, msg + ":" +  gl.getShaderInfoLog(shd));
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
    }
});

test("Phong fragment shader", function() {
    var phong = XML3D.shaders.getScript("phong");
    ok(phong, "Phong shader exists");
    equal(typeof phong.addDirectives, "function", "Function 'addDirectives' exists");
    var directives = [];
    phong.addDirectives.call(phong, directives, {}, {});
    equal(directives.length, 3, "3 directives from phong shader");
    var fragment1 = this.mergeDirectives(directives, phong.fragment);
    this.compiles(this.gl.FRAGMENT_SHADER, fragment1, "Phong fragment without globals compiles.");
    notEqual(fragment1.indexOf("MAX_POINTLIGHTS 0"), -1, "MAX_POINTLIGHTS set");
    notEqual(fragment1.indexOf("MAX_DIRECTIONALLIGHTS 0"), -1, "MAX_DIRECTIONALLIGHTS set");
    notEqual(fragment1.indexOf("HAS_DIFFUSETEXTURE 0"), -1, "HAS_DIFFUSETEXTURE set");

    directives = [];
    phong.addDirectives.call(phong, directives, { point : { length : 2 } }, {});
    equal(directives.length, 3, "3 directives from phong shader");
    var fragment2 = this.mergeDirectives(directives, phong.fragment);
    this.compiles(this.gl.FRAGMENT_SHADER, fragment2, "Phong fragment with 2 point lights compiles.");
    notEqual(fragment2.indexOf("MAX_POINTLIGHTS 2"), -1, "MAX_POINTLIGHTS set");
    notEqual(fragment2.indexOf("MAX_DIRECTIONALLIGHTS 0"), -1, "MAX_DIRECTIONALLIGHTS set");
    notEqual(fragment2.indexOf("HAS_DIFFUSETEXTURE 0"), -1, "HAS_DIFFUSETEXTURE set");

    directives = [];
    phong.addDirectives.call(phong, directives, { directional : { length : 1 } }, {});
    var fragment3 = this.mergeDirectives(directives, phong.fragment);
    this.compiles(this.gl.FRAGMENT_SHADER, fragment3, "Phong fragment with 1 directional light compiles.");
    notEqual(fragment3.indexOf("MAX_POINTLIGHTS 0"), -1, "MAX_POINTLIGHTS set");
    notEqual(fragment3.indexOf("MAX_DIRECTIONALLIGHTS 1"), -1, "MAX_DIRECTIONALLIGHTS set");
    notEqual(fragment3.indexOf("HAS_DIFFUSETEXTURE 0"), -1, "HAS_DIFFUSETEXTURE set");

    directives = [];
    phong.addDirectives.call(phong, directives, { directional : { length : 1 } }, { diffuseTexture : {} });
    var fragment4 = this.mergeDirectives(directives, phong.fragment);
    this.compiles(this.gl.FRAGMENT_SHADER, fragment4, "Phong fragment with 1 directional light and diffuseTexture compiles.");
    notEqual(fragment4.indexOf("MAX_POINTLIGHTS 0"), -1, "MAX_POINTLIGHTS set");
    notEqual(fragment4.indexOf("MAX_DIRECTIONALLIGHTS 1"), -1, "MAX_DIRECTIONALLIGHTS set");
    notEqual(fragment4.indexOf("HAS_DIFFUSETEXTURE 1"), -1, "HAS_DIFFUSETEXTURE set");

    directives = [];
    phong.addDirectives.call(phong, directives, { directional : { length : 3 }, point: { length : 5} }, { diffuseTexture : {} });
    var fragment5 = this.mergeDirectives(directives, phong.fragment);
    console.log(fragment5);
    this.compiles(this.gl.FRAGMENT_SHADER, fragment5, "Phong fragment with all branches compiles.");
    notEqual(fragment5.indexOf("MAX_POINTLIGHTS 5"), -1, "MAX_POINTLIGHTS set");
    notEqual(fragment5.indexOf("MAX_DIRECTIONALLIGHTS 3"), -1, "MAX_DIRECTIONALLIGHTS set");
    notEqual(fragment5.indexOf("HAS_DIFFUSETEXTURE 1"), -1, "HAS_DIFFUSETEXTURE set");
});

module("WebGL Shaders and Textures", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/webgl-rendering02.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});



test("Simple texture", 3, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    testFunc = null, h = getHandler(x);
    this.doc.getElementById("myGroup").visible = true;

    x.addEventListener("framedrawn", function(n) {
            if(testFunc)
                testFunc(n);
    });

    testFunc = function(n) {
        actual = win.getPixelValue(gl, 40, 40);
        if (actual[0] == 0)
            return;
        deepEqual(actual, [241,241,0,255], "Yellow texture");
        start();
    };
    stop();

});


test("Changing texture", 3, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    testFunc = null, h = getHandler(x);
    this.doc.getElementById("myGroup").visible = true;
    this.doc.getElementById("tex1img").setAttribute("src", "textures/magenta.png");

    x.addEventListener("framedrawn", function(n) {
            if(testFunc)
                testFunc(n);
    });

    testFunc = function(n) {
        actual = win.getPixelValue(gl, 40, 40);
        if (actual[0] == 0)
            return;
        deepEqual(actual, [241,0,241,255], "Magenta texture");
        start();
    };

    stop();

});

test("NPOT texture resizing", 4, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    testFunc = null, h = getHandler(x);

    x.addEventListener("framedrawn", function(n) {
            if(testFunc)
                testFunc(n);
    });

    testFunc = function(n) {
        actual = win.getPixelValue(gl, 40, 40);
        if ((actual[1] + actual[2]) == 0)
            return;
        deepEqual(actual, [0,241,0,255], "Green at 40,40");
        actual = win.getPixelValue(gl, 120, 80);
        deepEqual(actual, [0,0,253,255], "Blue at 120,80");
        start();
    };

    this.doc.getElementById("npotTexGroup").visible = true;
    stop();

});

test("Textured diffuse shader", 3, function() {
    var x = this.doc.getElementById("xml3DElem"),
    actual,
    win = this.doc.defaultView,
    gl = getContextForXml3DElement(x),
    testFunc = null, h = getHandler(x);
    var group = this.doc.getElementById("diffuseTexGroup");
    group.visible = true;

    x.addEventListener("framedrawn", function(n) {
            if(testFunc)
                testFunc(n);
    });

    testFunc = function(n) {
        actual = win.getPixelValue(gl, 40, 40);
        if (actual[0] == 0) //texture hasn't finished loading yet
            return;
        deepEqual(actual, [241,241,0,255], "Yellow diffuse texture");
        start();
    };

    stop();
});

// Scene: webgl-rendering02.xhtml
test("Diffuse shader with vertex colors", 3, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);
    var cgroup = this.doc.getElementById("coloredMeshGroup");

    cgroup.visible = true;
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    QUnit.closePixel(actual, [225,225,60,255], 1, "Corners have colors red, yellow, green, blue");

});

/*test("Custom shader", 4, function() {
    var x = this.doc.getElementById("xml3DElem"), actual, win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);
    var h = getHandler(x);

    var cshader = this.doc.getElementById("customShader");
    var group = this.doc.getElementById("myGroup");
    group.visible = true;
    group.setAttribute("shader", "#customShader");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [255,255,0,255], "Yellow custom shader");

    //The shader has a green diffuseColor parameter that should override the standard blue
    cshader.setAttribute("script", "urn:xml3d:shader:phong");
    h.draw();
    actual = win.getPixelValue(gl, 90, 90);
    deepEqual(actual, [0,255,0,255], "Change shader script to standard phong");

});*/

module("Multiple XML3D nodes", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/multiple-canvas.xhtml"+window.location.search, this.cb);
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
    deepEqual(actual, [0,0,0,0], "Found correct view node");
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
        loadDocument("scenes/webgl-ambient.xhtml"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Diffuse shader", 4, function() {
    var x = this.doc.getElementById("xml3DElem"), win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);

    var testFunc = function() {
        var actual = win.getPixelValue(gl, 88, 140);
        var diffuse = [1,0.2,0.3, 255];
        diffuse = vec3.scale(diffuse, 0.8*255);
        QUnit.closePixel(actual, diffuse, 1, "Simple Diffuse");

        actual = win.getPixelValue(gl, 150, 140);
        diffuse = [0.5*0.5*255,1*0.5*255,0*0.5*255, 255];
        // Timer issue
        //QUnit.closePixel(actual, diffuse, 1, "Diffuse with Texture");

        actual = win.getPixelValue(gl, 220, 140);
        // ambientIntensity * diffuseColor * vertexColor * 255
        diffuse = [0.9*0.4*1.0*255,0.9*0.8*0.5*255,0.9*0.8*0.25*255, 255];
        QUnit.closePixel(actual, diffuse, 1, "Diffuse with vertex colors");
        start();
    };

    stop();
    testFunc();
});

test("Phong shader", 4, function() {
    var x = this.doc.getElementById("xml3DElem"), win = this.doc.defaultView;
    var gl = getContextForXml3DElement(x);

    var testFunc = function() {
        var actual = win.getPixelValue(gl, 88, 50);
        var diffuse = [1,0.2,0.3, 255];
        diffuse = vec3.scale(diffuse, 0.8*255);
        QUnit.closePixel(actual, diffuse, 1, "Simple Diffuse");

        actual = win.getPixelValue(gl, 150, 50);
        diffuse = [0.5*0.5*255,1*0.5*255,0*0.5*255, 255];
        // Timer issue
        // QUnit.closePixel(actual, diffuse, 1, "Diffuse with Texture");

        actual = win.getPixelValue(gl, 220, 50);
        // ambientIntensity * diffuseColor * vertexColor * 255
        diffuse = [0.9*0.4*1.0*255,0.9*0.8*0.5*255,0.9*0.8*0.25*255, 255];
        QUnit.closePixel(actual, diffuse, 1, "Diffuse with vertex colors");
        start();
    };
    stop();
    testFunc();
});


