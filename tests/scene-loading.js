module("Scene Loading", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            start();
        };
        loadDocument("scenes/scene-loading.html", this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Check onload", function() {
    ok(this.doc.XML3D !== undefined, "Access to XML3D object of loaded scene");
    ok(this.doc.onloadCounter !== undefined, "Access to onload counter of loaded scene");
    equal(this.doc.onloadCounter, 3, "Correct number of loaded xml3d elements");
});


test("Check onRequest hook", function() {
    var xml3d = this.doc.XML3D;
    var hookTestDone = false;
    var hook = function(uri, request) {
        if (hookTestDone)
            return;
        ok(true, "Request hook was called");
        ok(uri instanceof xml3d.resource.URI, "URI was provided");
        ok(request.headers !== undefined &&
            request.priority !== undefined &&
            request.abort !== undefined, "Request object contained the expected fields");
        hookTestDone = true;
    };
    this.doc.XML3D.resource.onRequest(hook);

    var abortHook = function(uri, request) {
        if (uri.fragment == "abortThisRequest") {
            request.abort = true;
        }
    };
    this.doc.XML3D.resource.onRequest(abortHook);

    xml3d.resource.fetch("json/offsets.json").then(function(response) {
        ok(response !== undefined, "Request was completed");
    });
    xml3d.resource.fetch("json/offsets.json#abortThisRequest").then(function(doc) {
        ok(false, "Request should have been aborted");
        start();
    }).catch(function(e) {
        ok(e.message == "Request was aborted by an onRequest listener.", "Request was properly aborted");
        start();
    });
    stop();
});

module("Scene Loading", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.win = document.getElementById("xml3dframe").contentWindow;
            start();
        };
        loadDocument("scenes/loading-data.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Check Data Loading", function() {

    var mesh = this.doc.querySelector("mesh"),
        data = this.doc.querySelector("#inlineData"),
        material = this.doc.querySelector("material"),
        img = this.doc.querySelector("#testImg"),
        swapData = this.doc.querySelector("#swapData"),
        swapImg = this.doc.querySelector("#swapImg");

    equal(mesh.complete, true, "Mesh is complete");
    equal(data.complete, true, "Data is complete");
    equal(material.complete, img.complete, "material complete is identical with img.complete");
    var randKey = "?rand=" + Math.random();

    var step = 0;
    var loadTestStep = function(e){
        step++;
        if(step == 1){
            mesh.addEventListener('load', loadTestStep);
            data.addEventListener('load', loadTestStep);
            data.src = "xml/meshes.xml" + randKey + "#simpleMesh";
            equal(data.complete, false, "After data.src change, data.complete is false");
            equal(mesh.complete, false, "After data.src change, mesh.complete is also false");
        }
        if(step == 2){
            equal(e.target, data, "Data dispatched a load event");
            equal(data.complete, true, "data.complete is now true");
        }
        if(step == 3){
            equal(e.target, mesh, "Mesh also dispatched a load event");
            equal(mesh.complete, true, "mesh.complete is now true");
            mesh.src = "xml/otherMeshes.xml" + randKey + "#simpleMesh";
            equal(data.complete, true, "After mesh.src change, data.complete is still true");
            equal(mesh.complete, false, "After mesh.src change, mesh.complete is false");
        }
        if(step == 4){
            equal(e.target, mesh, "Mesh dispatched another load event");
            equal(mesh.complete, true, "mesh.complete is now true");
            material.addEventListener('load', loadTestStep);
            img.src = "textures/magenta.png" + randKey;
            equal(material.complete, false, "After img.src change, material.complete is false");
        }
        if(step == 5) {
            equal(e.target, material, "material dispatched its very first textureload event");
            equal(material.complete, true, "material.complete is now true");
            swapImg.src = "textures/water.jpg" + randKey;
            material.src = "#swapData";
            equal(swapData.complete, false, "After swapImg.src change, swapData.complete is false");
            equal(material.complete, false, "After hooking material with swapData, material.complete is also false");
        }
        if(step == 6){
            equal(e.target, material, "material dispatched another load event");
            equal(material.complete, true, "material.complete is now true");
            start();
        }
    }
    loadTestStep();
    stop();
});

module("Scene Loading", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.win = document.getElementById("xml3dframe").contentWindow;
            start();
        };
        loadDocument("scenes/loading-asset.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});


test("Check Asset Loading", function() {

    var model = this.doc.querySelector("model"),
        asset = this.doc.querySelector("#inlineAsset"),
        img = this.doc.querySelector("#testImg");

    var startAssetTest = function(){
        equal(model.complete, true, "Model is complete");
        equal(asset.complete, true, "Asset is complete");
        var randKey = "?rand=" + Math.random();

        var step = 0;
        var loadTestStep = function(e){
            step++;
            if(step == 1){
                model.addEventListener('load', loadTestStep);
                asset.addEventListener('load', loadTestStep);
                img.src = "textures/magenta.png" + randKey;
                equal(model.complete, false, "After img.src change, model.complete is false");
                equal(asset.complete, false, "After img.src change, asset.complete is also false");
            }
            if(step == 2){
                equal(e.target, asset, "Asset dispatched a load event");
                equal(asset.complete, true, "asset.complete is now true");
            }
            if(step == 3){
                equal(e.target, model, "Model also dispatched a load event");
                equal(model.complete, true, "model.complete is now true");
                model.src = "xml/assets.xml" + randKey + "#asset1";
                equal(model.complete, false, "After model.src change, model.complete is false");
            }
            if(step == 4){
                equal(e.target, model, "Model dispatched a load event");
                equal(model.complete, true, "model.complete is now true");
                start();
            }
        }
        loadTestStep();

    }

    stop();
    if(img.complete){
        startAssetTest();
    }else{
        img.addEventListener('load', startAssetTest);
    }
});


module("Requirejs", {

});

function promiseScriptsLoaded(doc) {
    var deferred = Q.defer();

    var interval = window.setInterval(function() {
        if (doc.defaultView.scriptsLoaded) {
            window.clearInterval(interval);
            deferred.resolve(doc);
        }
    }, 100);

    return deferred.promise;
}

test("Simple XML3D element", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/requirejs.html");

    var test = frameLoaded.then(function (doc) {
        doc.defaultView.simpleXML3D();
        return doc;
    }).then(promiseScriptsLoaded).then(function (doc) {
        var xml3d = doc.getElementById("myxml3d");
        ok(xml3d.complete, "Element was dynamically added and rendered");
    });

    test.fin(QUnit.start).done();

});

test("XML3D element with objects", function() {
    stop();
    var frameLoaded = Q.fcall(promiseIFrameLoaded, "scenes/requirejs.html");

    var test = frameLoaded.then(function (doc) {
        doc.defaultView.xml3dWithObject();
        return doc;
    }).then(promiseScriptsLoaded).then(function(doc) {
        return doc.getElementById("myxml3d");
    }).then(promiseSceneRendered).then( function (xml3d) {
        ok(true, "Element was dynamically added and rendered");

        var actual = XML3DUnit.getPixelValue(getContextForXml3DElement(xml3d), 250, 150);
        QUnit.closePixel(actual, [ 255, 255, 0, 255 ], 1, "Yellow square was rendered");
    });

    test.fin(QUnit.start).done();

});
