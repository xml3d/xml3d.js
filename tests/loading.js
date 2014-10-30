module("Loading tests", {
    setup : function() {
        stop();
        var that = this;
        this.cb = function(e) {
            ok(true, "Scene loaded");
            that.doc = document.getElementById("xml3dframe").contentDocument;
            that.win = document.getElementById("xml3dframe").contentWindow;
            start();
        };
        loadDocument("scenes/data-loading.html"+window.location.search, this.cb);
    },
    teardown : function() {
        var v = document.getElementById("xml3dframe");
        v.removeEventListener("load", this.cb, true);
    }
});

test("Data Loading", function() {

    var mesh = this.doc.querySelector("mesh"),
        data = this.doc.querySelector("#inlineData"),
        shader = this.doc.querySelector("shader"),
        img = this.doc.querySelector("#testImg"),
        swapData = this.doc.querySelector("#swapData"),
        swapImg = this.doc.querySelector("#swapImg");

    equal(mesh.complete, true, "Mesh is complete");
    equal(mesh.texComplete, true, "Mesh is texture complete");
    equal(data.complete, true, "Data is complete");
    equal(data.texComplete, true, "Data is texture complete");
    equal(shader.complete, true, "Shader is complete");
    equal(shader.texComplete, img.complete, "Shader texComplete is identical with img.complete");

    var randKey = "?rand=" + Math.random();

    var step = 0;
    var loadTestStep = function(e){
        step++;
        if(step == 1){
            mesh.addEventListener('load', loadTestStep);
            data.addEventListener('load', loadTestStep);
            data.src = "xml/meshes.xml" + randKey + "#simpleMesh";
            equal(data.complete, false, "After data.src change, data.complete is false");
            equal(data.texComplete, false, "After data.src change, data.texComplete is false");
            equal(mesh.complete, false, "After data.src change, mesh.complete is also false");
            equal(mesh.texComplete, false, "After data.src change, mesh.texComplete is also false");
        }
        if(step == 2){
            equal(e.target, data, "Data dispatched a load event");
            equal(data.complete, true, "data.complete is now true");
            equal(data.texComplete, true, "data.texComplete is also true");
        }
        if(step == 3){
            equal(e.target, mesh, "Mesh also dispatched a load event");
            equal(mesh.complete, true, "mesh.complete is now true");
            equal(mesh.texComplete, true, "mesh.texComplete is also true");
            mesh.src = "xml/otherMeshes.xml" + randKey + "#simpleMesh";
            equal(data.complete, true, "After mesh.src change, data.complete is still true");
            equal(data.texComplete, true, "After mesh.src change, data.texComplete is still true");
            equal(mesh.complete, false, "After mesh.src change, mesh.complete is false");
            equal(mesh.texComplete, false, "After mesh.src change, mesh.texComplete is false");
        }
        if(step == 4){
            equal(e.target, mesh, "Mesh dispatched another load event");
            equal(mesh.complete, true, "mesh.complete is now true");
            equal(mesh.texComplete, true, "mesh.texComplete is still true... as always");
            shader.addEventListener('textureload', loadTestStep);
            img.src = "textures/magenta.png" + randKey;
            equal(shader.complete, true, "After img.src change, shader.complete is still true");
            equal(shader.texComplete, false, "After img.src change, shader.texComplete is false");
        }
        if(step == 5) {
            equal(e.target, shader, "Shader dispatched its very first textureload event");
            equal(e.type, 'textureload', "Event type is actually 'textureload'");
            equal(shader.complete, true, "shader.complete is still true");
            equal(shader.texComplete, true, "shader.texComplete is now also true");
            swapImg.src = "textures/water.jpg" + randKey;
            shader.src = "#swapData";
            equal(swapData.complete, true, "After swapImg.src change, swapData.complete is still true");
            equal(swapData.texComplete, false, "After swapImg.src change, swapData.texComplete is false");
            equal(shader.complete, true, "After hooking shader with swapData, shader.complete is still true");
            equal(shader.texComplete, false, "After hooking shader with swapData, shader.texComplete is also false");
        }
        if(step == 6){
            equal(e.target, shader, "Shader dispatched another textureload event");
            equal(shader.complete, true, "shader.complete is still true");
            equal(shader.texComplete, true, "shader.texComplete is now also true");
            start();
        }
    }
    loadTestStep();
    stop();


});

